import { ref, markRaw } from 'vue'
import { defineStore } from 'pinia'
import { Contract } from 'ethers'

import { ERC20 } from '@/contracts'

import { cutEthAddress } from '@/utils/common'
import { WalletWatcher } from '@/utils/wallet/watcher'
import { Metamask, WalletConnect } from '@/utils/wallet/connectors'
import { findEvent } from '@/utils/wallet/utils'
import { CHAIN_ID } from '@/utils/wallet/constants'


export const useWallet = (app) => {
    return defineStore('wallet', {
        state: () => ({
            /** @type {{ string: { address: string } }} */
            accountList: {},
            /** @type {string | null} */
            address: null,
            chainId: null,
            /** @type { import('@/utils/wallet/watcher').WalletWatcher | null } **/
            $: markRaw({}),
            signer: markRaw({}),
            connectedWallet: null
        }),
        getters: {
            currentAccount(state) {
                return state.accountList[state.address]
            },
            cuttedAddress(state) {
                return cutEthAddress(state.address)
            },
            connected(state) {
                return !!state.address
            },
            isCorrectNetwork(state) {
                return state.chainId === CHAIN_ID
            }
        },
        actions: {
            /** @param {string} address **/
            add(address) {
                address = address.toLocaleLowerCase()
                this.accountList[address] = address
                this.address = address
            },
            clearStore() {
                this.accountList[this.address] = undefined
                this.address = null
                this.chainId = null
                this.$ = markRaw({})
                this.signer = markRaw({})
                this.connectedWallet = null
            },
            async tryDisconnect() {
                if (this.$?.connector?.disconnect) {
                    await this.$?.connector?.disconnect()
                    this.clearStore()
                    this.init()
                }
            },
            setChainId(chainId) {
                console.log('[Wallet Store] setChainId')
                this.chainId = Number(chainId)
            },
            setSigner(signer) {
                console.log('[Wallet Store] setSigner')
                this.signer = markRaw(signer)
            },
            createContract(contract) {
                if (!this.signer) return
                return new Contract(contract.address, contract.abi, this.signer)
            },
            createERC20(tokenAddress) {
                if (!this.signer) return
                return new Contract(tokenAddress, ERC20.abi, this.signer)
            },
            async init({ connector } = {}) {
                if (!connector) {
                    if (window?.ethereum?.selectedAddress) {
                        connector = new Metamask()
                    } else {
                        if (localStorage.getItem('walletconnect')) {
                            connector = new WalletConnect()
                        }
                    }
                }
                if (!connector) return

                if (!await this.handleWalletConnect(connector)) return
                this.setChainId(await this.$.chainIdNumber())
                if (this.connectedWallet === 'MetaMask') await this.switchNetwork()

                return await this.updateSigner()
            },
            async updateSigner() {
                console.info('[Wallet Store] updateWalletData start.')
                const { signer, signerAddress } = await this.$.getSigner()
                this.add(signerAddress)
                this.setSigner(signer)
                console.info('[Wallet Store] updateWalletData done.')
                return true
            },
            walletWatchCallback(...ev) {
                if (!ev) return
                console.log('[Wallet Store] Event: ', ev)
                const disconnect = findEvent(ev, 'disconnect')
                const accountsChanged = findEvent(ev, 'accountsChanged')
                const chainChanged = findEvent(ev, 'chainChanged')

                if (disconnect) this.clearStore()
                if (accountsChanged?.data?.length === 0) this.clearStore()
                else if (accountsChanged?.data?.length) this.add(accountsChanged.data[0])
                if (chainChanged) this.setChainId(chainChanged.data)
            },
            async handleWalletConnect(connector) {
                try {
                    console.info('[Wallet Store] Wallet connect start.')
                    this.$ = markRaw(await new WalletWatcher(connector).connect({ cb: this.walletWatchCallback }))
                    this.connectedWallet = ref(this.$?.connector?.label)
                } catch (connectErr) {
                    console.error('[Wallet Store] connectErr: ', connectErr)
                    app.config.globalProperties.$message.error(connectErr.message)
                    return false
                }
                console.info('[Wallet Store] Wallet connect done.')
                return true
            },
            async switchNetwork() {
                try {
                    console.info('[Wallet Store] Chain switch start.')
                    if (this.$.chainIdNumber() !== CHAIN_ID) await this.$.switchNetwork()
                } catch (switchErr) {
                    console.error('[Wallet Store] switchErr: ', switchErr)
                    app.config.globalProperties.$message.error(switchErr.message)
                }
                console.info('[Wallet Store] Chain switch end.')
            }
        }
    })()
}