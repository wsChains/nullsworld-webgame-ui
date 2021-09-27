import { ethers, providers } from 'ethers'
import WalletConnectProvider from '@walletconnect/web3-provider'


export class BaseConnector {
    label = ''
    img = ''
    isValid = () => true
    link = ''
    connecting = false

    async getProvider() {
        console.error('[getProvider()] WalletConnector Not implemented')
    }

    async enable() {
        console.error('[enable()] WalletConnector Not implemented')
    }

    async request() {
        console.error('[request()] WalletConnector Not implemented')
    }

    get eventRegister() {
        console.error('[eventRegister()] WalletConnector Not implemented')
    }

    /** 
     * @param {string} event
     * @param {((...args: any[]) => any) | undefined} cb 
     * **/
    regist(event, cb) {
        this.eventRegister.on(event, (data) => { cb({ event, data }) })
    }
}


export class Metamask extends BaseConnector {
    label = 'MetaMask'
    img = 'metamask.png'
    isValid = () => !!window?.ethereum
    link = 'https://metamask.io/'

    async getProvider() {
        await this.enable()
        return window?.ethereum ?
            new ethers.providers.Web3Provider(window.ethereum) :
            new ethers.providers.getDefaultProvider()
    }

    get eventRegister() {
        return window?.ethereum
    }

    async request(...args) {
        return await window?.ethereum?.request(...args)
    }

    async enable() {
        return await this.request({ method: 'eth_requestAccounts' })
    }

}

export class WalletConnect extends BaseConnector {
    label = 'WalletConnect'
    img = 'walletconnect.png'
    link = 'https://walletconnect.org/'
    infuraId = '37b7a0addffc49d6b91c6cd28d48b1c3'
    bridge = 'https://bridge.walletconnect.org'
    /** @type {WalletConnectProvider} **/
    connectProvider
    /** @type {providers.Web3Provider} **/
    provider

    async getProvider() {
        return this.provider = new providers.Web3Provider(await this.enable())
    }

    get eventRegister() {
        return this.provider
    }

    async request(...args) {
        return await this.connectProvider.request(...args)
    }

    enable() {
        return new Promise(async (resolve, reject) => {
            const connectProvider = new WalletConnectProvider({
                infuraId: this.infuraId,
                bridge: this.bridge,
                qrcode: true,
            })
            try {
                await connectProvider.enable()
                this.connectProvider = connectProvider
                resolve(connectProvider)
            } catch (err) {
                reject(err)
            }
        })
    }

}


export const walletConnectors = [
    new Metamask(),
    new WalletConnect()
]
