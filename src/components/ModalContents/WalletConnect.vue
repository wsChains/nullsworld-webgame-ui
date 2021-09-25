<template>
    <div class="wallet-w">
        <div
            class="wallet-title"
        >{{ wallet.connected ? wallet.isCorrectNetwork ? `Connected with ${wallet.wallet} ✔️` : `Wrong Network ❓` : 'Connect Wallet' }}</div>
        <div
            v-if="!wallet.connected"
            class="wallet-introduce"
        >By connecting a wallet, you agree to Nulls-World ’s Terms of Service and acknowledge that you have read and understand the Nulls-World disclaimer.</div>
        <div v-else class="flex justify-center">
            <a :href="accountExplorer(wallet.address)" target="_blank">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View on Explorer
            </a>
            <a>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy address
            </a>
        </div>
        <div v-if="wallet.connected && !wallet.isCorrectNetwork" class="flex justify-center items-center mt-4">
            <color-button style="font-size: 20px;" @click="switchNetwork">Switch Network</color-button>
        </div>
        <div class="wallet-top">
            <div
                :class="[
                    item.connecting ? 'wallet-connecting' : '',
                    selectedDefault == key ? 'wallet-frame-opt' : '',
                    wallet.connected ? 'wallet-connected' : '', 'wallet-frame'
                ]"
                v-for="(item, key) in list"
                :key="key"
                @click="selectWallet(key, item)"
            >
                <div class="flex items-center">
                    <LoadingOutlined v-show="item.connecting" class="px-2" spin />
                    {{ walletLabel(item) }}
                </div>
                <img class="img-h" :src="`/${item.img}`" />
            </div>
        </div>
    </div>
</template>

<script>
import { cutEthAddress, accountExplorer } from '@/utils/common'
import { CHAIN_ID_HEX } from '@/utils/wallet'


import { LoadingOutlined } from '@ant-design/icons-vue';

const defaultValidator = () => !!window?.ethereum

class WalletItem {
    constructor(label, img, validator, link) {
        this.label = label
        this.img = img
        this.isValid = validator || true
        this.link = link
        this.connecting = false
    }
}


export default {
    components: {
        LoadingOutlined
    },
    data() {
        return {
            cutEthAddress,
            accountExplorer,
            selectedDefault: '0',
            width: '287px',
            list: [
                new WalletItem('MetaMask', 'metamask.png', defaultValidator, 'https://metamask.io/')
            ],
            showMask: false,
        }
    },
    methods: {
        walletLabel(item) {
            if (item.connecting) return 'Connecting...'

            return item.isValid() ?
                this.wallet.connected ? `Account (${cutEthAddress(this.wallet.address, 8)})` : item.label
                : `Please Install ${item.label}`
        },
        setConnecting(bool, item) {
            if (item) item.connecting = bool
            this.$root.setConnecting(bool)
        },
        async selectWallet(key, item) {
            if (item.connecting) return

            if (!item.isValid() && item.link) {
                window.open(item.link, "_blank")
                return
            }

            this.setConnecting(true, item)
            await this.wallet.init(true)
            this.setConnecting(false, item)

            this.selectedDefault = key

            if (this.wallet?.connected) this.$root.showWalletConnect = false
        },
        openInterface() {
            this.showMask = true
        },
        close() {
            this.showMask = false
        },
        switchNetwork() {
            window?.ethereum?.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CHAIN_ID_HEX }],
            }).catch(err => {
                this.$message.error(err.message)
            })
        }
    }
}
</script>


<style scoped>
a {
    padding: 20px;
    align-items: center;
    display: flex;
}

a svg {
    margin-right: 5px;
}

.wallet-w {
    width: 600px;
    margin: 38px 103px 38px 87px;
}

.wallet-title {
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: #111111;
    line-height: 40px;
}

.wallet-top {
    margin-top: 43px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.wallet-frame {
    height: 68px;
    padding: 0 30px;
    border-radius: 10px;
    border: 1px solid #e3d0c3;
    display: flex;
    font-size: 18px;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    margin: 10px 10px;
    transition: 0.2s ease;
    user-select: none;
}

.img-h {
    height: 26px;
}

.wallet-connecting {
    pointer-events: none;
    font-weight: bold;
    background-color: #ffebbf !important;
    border-color: #ffb951 !important;
}

.wallet-connected {
    font-weight: bold;
    pointer-events: none;
}

.wallet-frame:hover {
    background-color: #fff2ea;
}

.wallet-frame:active {
    border-color: #ff7427;
    transform: scale(0.95);
}

.wallet-frame:active .img-h {
    filter: brightness(0.9);
}

.wallet-frame-opt {
    background-color: #fff2ea;
    border: 2px solid #ff7427;
}

.wallet-introduce {
    font-size: 16px;
    padding: 15px 30px;
    text-align: center;
}
</style>