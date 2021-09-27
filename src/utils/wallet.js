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
export const tryNewWalletWatcher = async (connector, cb) => {
    try {
        return { wallet: await new WalletWatcher(connector).connect({ connector, cb }), err: undefined }
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
    /** @type {import('@/utils/walletConnectors').BaseConnector} **/
    connector

    /* Create not initialized WalletWatcher */
    constructor(connector) {
        this.connector = connector
    }

    async init() {

    }

    /** 
     * Initialized WalletWatcher async
     * @param {{provider?: import('ethers').providers.Web3Provider | undefined, cb?: (...args: any[]) => any}}
     * @return {Promise<WalletWatcher>} 
     **/
    async connect({ provider, cb }) {
        this.provider = provider?._isProvider ? provider : await this.connector.getProvider()
        await this.initSigner()
        if (this.chainIdNumber !== CHAIN_ID) {
            await handleSwitchChain()
        }
        this.watchAll(cb)
        return this
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

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchAll(cb) {
        this.watchEvents.forEach(
            ev => this.connector.regist(ev, cb)
        )
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchConnect(cb) {
        this.connector.regist('connect', cb)
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchDisconnect(cb) {
        this.connector.regist('disconnect', cb)
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchMessage(cb) {
        this.connector.regist('message', cb)
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchAccountChanged(cb) {
        this.connector.regist('accountsChanged', cb)
    }

    /** @param {((...args: any[]) => any) | undefined} cb **/
    watchChainChanged(cb) {
        this.connector.regist('chainChanged', cb)
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
