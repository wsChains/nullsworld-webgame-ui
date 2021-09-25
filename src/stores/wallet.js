import { toRaw } from 'vue'
import { defineStore } from 'pinia'
import { Contract } from 'ethers'


import { cutEthAddress } from '@/utils/common'
import { CHAIN_ID, tryNewWalletWatcher, errInfo, findEvent } from '@/utils/wallet'
import { ERC20 } from '@/contracts'



export const useWallet = (app) => {
    return defineStore('wallet', {
        state: () => ({
            /** @type {{ string: { address: string } }} */
            accountList: {},
            /** @type {string | null} */
            address: null,
            wallet: 'MetaMask',
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
            async init(forceConnect = false) {
                if (!forceConnect && !window?.ethereum?.selectedAddress) return false

                const { wallet, err } = await tryNewWalletWatcher((...ev) => {
                    if (!ev) return

                    const disconnect = findEvent(ev, 'disconnect')
                    const accountsChanged = findEvent(ev, 'accountsChanged')
                    const chainChanged = findEvent(ev, 'chainChanged')

                    if (disconnect) this.disconnect()
                    if (accountsChanged?.data?.length === 0) this.disconnect()
                    else if (accountsChanged?.data?.length) this.add(accountsChanged.data[0])
                    if (chainChanged) this.setChainId(chainChanged.data)
                })
                if (err) return app.$message.error(errInfo(err))

                this.$ = wallet
                const { signer, signerAddress } = await wallet.getSigner()
                this.setChainId(wallet.chainIdNumber)
                this.add(signerAddress)
                this.setSigner(signer)
                return true
            }
        }
    })()
}