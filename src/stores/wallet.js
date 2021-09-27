import { toRaw } from 'vue'
import { defineStore } from 'pinia'
import { Contract } from 'ethers'


import { cutEthAddress } from '@/utils/common'
import { CHAIN_ID, CHAIN_ID_HEX, tryNewWalletWatcher, errInfo, findEvent } from '@/utils/wallet'
import { ERC20 } from '@/contracts'


export const useWallet = (app) => {
    return defineStore('wallet', {
        state: () => ({
            /** @type {{ string: { address: string } }} */
            accountList: {},
            /** @type {string | null} */
            address: null,
            chainId: null,
            /** @type { import('@/utils/wallet').WalletWatcher | null } **/
            $: null,
            _signer: null
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
            },
            signer(state) {
                return toRaw(state._signer)
            },
            noWallet() {
                return !!window?.ethereum
            },
            connectedWallet(state) {
                return state.$?.connector?.label
            }
        },
        actions: {
            /** @param {string} address **/
            add(address) {
                address = address.toLocaleLowerCase()
                this.accountList[address] = { address }
                this.address = address
            },
            disconnect() {
                this.address = undefined
            },
            setChainId(chainId) {
                this.chainId = Number(chainId)
            },
            setSigner(signer) {
                this._signer = signer
            },
            createContract(contract) {
                if (!this.signer) return
                return new Contract(contract.address, contract.abi, this.signer)
            },
            createERC20(tokenAddress) {
                if (!this.signer) return
                return new Contract(tokenAddress, ERC20.abi, this.signer)
            },
            async init({ connector, forceConnect } = {}) {
                if (!forceConnect && !window?.ethereum?.selectedAddress) return false
                const callback = (...ev) => {
                    if (!ev) return
                    const disconnect = findEvent(ev, 'disconnect')
                    const accountsChanged = findEvent(ev, 'accountsChanged')
                    const chainChanged = findEvent(ev, 'chainChanged')

                    if (disconnect) this.disconnect()
                    if (accountsChanged?.data?.length === 0) this.disconnect()
                    else if (accountsChanged?.data?.length) this.add(accountsChanged.data[0])
                    if (chainChanged) this.setChainId(chainChanged.data)
                }
                const { wallet, err } = await tryNewWalletWatcher(connector, callback)
                if (err) {
                    app.config.globalProperties.$message.error(errInfo(err))
                    return false
                }

                this.$ = wallet
                const { signer, signerAddress } = await wallet.getSigner()
                this.setChainId(wallet.chainIdNumber)
                this.add(signerAddress)
                this.setSigner(signer)
                return true
            },
            async switchNetwork() {
               this.$.connector.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: CHAIN_ID_HEX }],
                }).catch(err => {
                    app.config.globalProperties.$message.error(err.message)
                })
            }
        }
    })()
}