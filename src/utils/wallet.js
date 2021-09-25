import { ethers } from 'ethers'

export const CHAIN_ID = 256
export const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`
export const CHAIN_PARAMS = [{
    chainId: CHAIN_ID_HEX,
    chainName: 'Huobi ECO Chain Testnet',
    nativeCurrency: {
        name: 'HT',
        symbol: 'HT',
        decimals: 18
    },
    rpcUrls: ['https://http-testnet.hecochain.com/'],
    blockExplorerUrls: ['https://testnet.hecoinfo.com/']
}]

export const WALLET_ERRORS = {
    4001: 'You have manually rejected this transaction.'
}

export const WALLET_TIPS = {
    txSend: 'The transaction has been sent, please wait for the result...'
}

export const findEvent = (data, event) => {
    return data.find ? data.find(i => i.event === event) : undefined
}

/** 
 * @param {Error} err 
 * @returns {string | Error}
 **/
export const errInfo = (err) => {
    return WALLET_ERRORS[err?.code] || err.message
}


export const tryHandleGetWalletWatcher = async (vueThis) => {
    if (window?.ethereum?.selectedAddress) {
        await handleGetWalletWatcher(vueThis)
        return true
    }
    return false
}

export const handleGetWalletWatcher = async (vueThis) => {
    const { wallet, err } = await tryNewWalletWatcher((...data) => {
        if (!data) return

        if (findEvent(data, 'disconnect')) {
            return vueThis.wallet.disconnect()
        }

        let i = findEvent(data, 'accountsChanged')
        if (i) {
            if (i.data.length === 0) {
                return vueThis.wallet.disconnect()
            } else {
                return vueThis.wallet.add(i.data[0])
            }
        }

        i = findEvent(data, 'chainChanged')
        if (i) {
            return vueThis.wallet.setChainId(Number(i.data))
        }
    })
    if (err) {
        vueThis.$message.error(errInfo(err))
        return
    }
    vueThis.$wallet = wallet
    const { signerAddress } = await wallet.getSigner()
    vueThis.wallet.setChainId(wallet.chainIdNumber)
    vueThis.wallet.add(signerAddress)
}

export const handleAddToken = async (type, options) => {
    try {
        const isSuccess = await window?.ethereum?.request({
            method: 'wallet_watchAsset',
            params: { type, options },
        });

        if (isSuccess) {
            console.log('Thanks for your interest:', type);
        } else {
            console.error('Your loss!');
        }
    } catch (error) {
        console.log(error);
    }
}


/** 
 * @param {((...args: any[]) => any) | undefined} cb 
 * @returns {Promise<{wallet?: WalletWatcher, err?: Error}>}
 **/
export const tryNewWalletWatcher = async (cb) => {
    try {
        return { wallet: await new WalletWatcher().init({ cb }), err: undefined }
    } catch (err) {
        return { wallet: undefined, err }
    }
}

export const trySwitchChain = async () => {
    await window?.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_ID_HEX }],
    })
}

export const handleSwitchChain = async () => {
    try {
        await trySwitchChain()
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await window?.ethereum?.request({ method: 'wallet_addEthereumChain', params: CHAIN_PARAMS })
                await trySwitchChain()
            } catch (addError) {
                // handle "add" error
                console.error('Could not add chain:', addError)
            }
        } else {
            if (switchError.code === -32002) /* Already exists */ return
            console.error('Unknown switchError:', switchError)
        }
        // handle other "switch" errors
    }
}

export class WalletWatcher {
    /** @type {import('ethers').providers.Web3Provider} **/
    provider
    /** @type {((...args: any[]) => any) | undefined} cb **/
    cb
    /** @type {import('ethers').providers.JsonRpcSigner | undefined} **/
    signer
    /** @type {string | undefined} **/
    signerAddress

    /* Create not initialized WalletWatcher */
    constructor() { }

    /** 
     * Initialized WalletWatcher async
     * @param {{provider?: import('ethers').providers.Web3Provider | undefined, cb?: (...args: any[]) => any}}
     * @return {Promise<WalletWatcher>} 
     **/
    async init({ provider, cb }) {
        this.provider = provider?._isProvider ? provider : await this.getProvider()
        await this.initSigner()
        if (this.chainIdNumber !== CHAIN_ID) {
            await handleSwitchChain()
        }
        this.setWatcher(cb)
        this.watchAll()
        return this
    }

    /** 
     * @param {import('ethers').Contract} contract
     * @param {string} address
     * @param {string} method
     * @return {Promise<Number>} 
     **/
    contractBalance(contract, address, method = 'balanceOf') {
        return contract[method](address)
    }

    async getSigner() {
        await this.initSigner()
        const { signer, signerAddress } = this
        return { signer, signerAddress }
    }

    async initSigner() {
        this.signer = this.provider.getSigner()
        this.signerAddress = await this.signer.getAddress()
    }

    async enable() {
        return await window?.ethereum?.request({ method: 'eth_requestAccounts' })
    }

    /** @return {Promise<import('ethers').providers.Web3Provider>} **/
    async getProvider() {
        await this.enable()
        return window?.ethereum ?
            new ethers.providers.Web3Provider(window.ethereum) :
            new ethers.providers.getDefaultProvider()
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    setWatcher(cb) {
        cb && (this.cb = cb)
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchAll(cb) {
        this.watchEvents.forEach(
            ev => this.regist(ev, cb)
        )
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchConnect(cb) {
        this.regist('connect', cb)
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchDisconnect(cb) {
        this.regist('disconnect', cb)
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchMessage(cb) {
        this.regist('message', cb)
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchAccountChanged(cb) {
        this.regist('accountsChanged', cb)
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchChainChanged(cb) {
        this.regist('chainChanged', cb)
    }

    /** 
     * @param {string} event
     * @param {((...args: any[]) => any) | undefined} cb 
     * **/
    regist(event, cb) {
        window?.ethereum.on(event, (data) => { (cb || this.cb)({ event, data }) })
    }

    get watchEvents() {
        return ['connect', 'disconnect', 'message', 'chainChanged', 'accountsChanged']
    }

    get chainIdNumber() {
        return Number(this.provider?.provider?.chainId)
    }

    get chainIdHexString() {
        return this.provider?.provider?.chainId
    }
}
