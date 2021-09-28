<template>
    <div class="flex">
        <div class="flex items-center">
            <NullsPreview :nullsId="item?.pet_id" :nullsType="item?.type" />
        </div>
        <NeedWalletConnect
            @onWalletConnect="init"
            @onAddressChange="init"
            @onWalletDisconnect="onDisconnect"
        >
            <a-spin tip="Loading..." :spinning="approving || purchasing">
                <div class="arena-container">
                    <div class="arena-title">Purchase Nulls</div>
                    <div class="arena-introduce">Please confirm purchase details</div>
                    <div class="py-12">
                        <div class="py-2 font-bold" style="font-size: 16px;">Target Token</div>
                        <div class="token-select">
                            <div class="token-select-left">
                                <img
                                    class="token-icon"
                                    :src="`/tokens/${tokenSymbol?.toLowerCase()}.svg`"
                                />
                                <div class="token-select-content">
                                    <div class="token-symbol">{{ tokenSymbol }}</div>
                                    <div
                                        class="token-select-balance"
                                    >Your Balance: {{ formatNumber(removeDecimal(tokenBalance, currentDecimal)) }} {{ tokenSymbol }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-column">
                        <div>Nulls ID</div>
                        <div class="px-4 font-bold">
                            <span :class="[calcColor(item?.pet_id), 'nulls-id']">#{{ item?.pet_id }}</span>
                        </div>
                    </div>
                    <div class="form-column">
                        <div>Price</div>
                        <div class="px-4 font-bold" style="color: #ff761a;">
                            <span
                                class="px-2"
                            >{{ formatNumber(removeDecimal(item?.price, currentDecimal)) }}</span>
                            <span>{{ tokenSymbol }}</span>
                        </div>
                    </div>
                    <div class="form-column">
                        <div>Your Balance</div>
                        <div class="px-4 font-bold" style="color: #ff761a;">
                            <span
                                class="px-2"
                            >{{ formatNumber(removeDecimal(tokenBalance, currentDecimal)) }}</span>
                            <span>{{ tokenSymbol }}</span>
                        </div>
                    </div>
                    <div class="flex justify-center mt-12">
                        <color-button
                            @click="handleBuy"
                            :disabled="!wallet.connected || balanceNotEnough || approving || purchasing"
                        >
                            <LoadingOutlined
                                v-show="approving || purchasing"
                                class="px-2 font-bold"
                                spin
                            />
                            {{
                                !wallet.connected ? 'Wallet Not Connected' :
                                    balanceNotEnough ? `Insufficient ${tokenSymbol}` :
                                        approving ? 'Approving...' :
                                            purchasing ? 'purchasing...' :
                                                `Purchase Now!`
                            }}
                        </color-button>
                    </div>
                </div>
            </a-spin>
        </NeedWalletConnect>
    </div>
</template>

<script>
import { NullsWorldMarket } from '@/contracts'
import { BigNumber } from 'ethers'
import { h } from 'vue'
import { CheckCircleTwoTone, LoadingOutlined } from '@ant-design/icons-vue'

import NullsPreview from '@/components/Items/NullsPreview.vue'
import NeedWalletConnect from '@/components/Common/NeedWalletConnect.vue'

import { formatNumber, calcColor, removeDecimal } from '@/utils/common'
import { WALLET_ERRORS, WALLET_TIPS } from '@/utils/wallet/constants'


export default {
    components: {
        NullsPreview, LoadingOutlined, NeedWalletConnect
    },
    props: {
        item: {
            default: undefined
        }
    },
    data() {
        return {
            formatNumber, calcColor, removeDecimal,
            marketContract: undefined,
            approving: false,
            purchasing: false,
            tokenBalance: 0,
            updateBalanceInterval: -1,
            currentDecimal: 6
        }
    },
    async created() {
        await this.init()
    },
    unmounted() {
        clearInterval(this.updateBalanceInterval)
    },
    computed: {
        balanceNotEnough() {
            return this.tokenBalance < this.item?.price
        },
        tokenSymbol() {
            return this.item?.current
        }
    },
    methods: {
        onDisconnect() {
            clearInterval(this.updateBalanceInterval)
        },
        async init() {
            if (!this.wallet.connected) return
            clearInterval(this.updateBalanceInterval)

            // Create contracts
            this.tokenContract = this.wallet.createERC20(this.item?.current_contract)
            this.marketContract = this.wallet.createContract(NullsWorldMarket)


            this.updateEggBalance().then(() => {
                this.updateBalanceInterval = setInterval(this.updateEggBalance, 10_000);
            })
        },
        async updateEggBalance() {
            this.tokenBalance = Number(await this.tokenContract['balanceOf'](this.wallet.address))
        },
        async handleBuy() {
            if (!this.item) return
            if (this.approving || this.purchasing) return

            this.$emit('onPurchaseStart')

            // Check allowance
            const ALLOWANCE = BigNumber.from(1_000_000_000)
            const allowance = await this.tokenContract['allowance'](this.wallet.address, NullsWorldMarket.address)

            // Approve if need
            if (allowance < ALLOWANCE) {
                this.approving = true
                let hiedeApprovingHint = this.$message.loading({ content: 'Approving required, waiting for your approval', key: 'approving', duration: 0 })
                const approveAmount = addDecimal(ALLOWANCE, this.currentDecimal).toString()
                try {
                    const approveTx = await this.tokenContract['approve'](NullsWorldMarket.address, approveAmount)
                    hiedeApprovingHint = this.$message.loading({ content: WALLET_TIPS.txSend, key: 'approving', duration: 0 })
                    await approveTx.wait().then(receipt => {
                        console.log(receipt)
                        if (receipt.status === 1) {
                            console.log(`================approveTx=================`)
                            this.$message.success('Successful approve!')
                            hiedeApprovingHint()
                            this.approving = false
                        }
                    })
                } catch (err) {
                    hiedeApprovingHint()
                    this.$emit('onPurchaseDone')
                    console.error(err)
                    this.$message.error(WALLET_ERRORS[err.code] || err.data?.message || err.message)
                    this.approving = false
                    return
                }
            }

            // Purchase eggs
            let hidePurchasingHint = this.$message.loading({ content: 'Awaiting approval of transaction', key: 'purchasing', duration: 0 })
            this.purchasing = true
            try {
                const purchaseTx = await this.marketContract['buyPet'](this.item.pet_id)
                hidePurchasingHint = this.$message.loading({ content: WALLET_TIPS.txSend, key: 'purchasing', duration: 0 })
                await purchaseTx.wait().then(receipt => {
                    console.log(receipt)
                    if (receipt.status === 1) {
                        console.log(`===============purchaseTx==================`)
                        this.purchasing = false
                        this.$emit('onPurchaseDone', 1)
                        hidePurchasingHint()
                        this.$notification.open({
                            message: 'Successful purchase',
                            description: `Successfully purchased Nulls #${this.item.pet_id}`,
                            icon: h(CheckCircleTwoTone, { twoToneColor: '#52c41a' }),
                        })
                    }
                })
            } catch (err) {
                hidePurchasingHint()
                console.error(err)
                this.$emit('onPurchaseDone')
                this.$message.error(WALLET_ERRORS[err.code] || err.data?.message || err.message)
                this.purchasing = false
            }
        }
    }
}
</script>

<style scoped>
.token-select {
    min-width: 440px;
    user-select: none;
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 14px 16px;
    border-radius: 6px;
    border: 2px solid #ff981a;
    transition: 0.2s ease;
}

.token-select-content {
    padding: 0 8px;
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: center;
    font-size: 16px;
}

.token-select-balance {
    font-size: 14px;
}

.token-symbol {
    font-weight: bold;
}

.token-icon {
    margin-right: 15px;
    height: 42px;
    width: 42px;
    padding: 0 4px;
}

.token-select:hover {
    background-color: #ff981a4d;
}

.token-select-left {
    display: flex;
    flex: 1;
}

.arena-container {
    padding: 20px 40px;
}

.form-column {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    padding: 4px 0;
}

.form-column div:first-child {
    font-weight: bold;
}

.arena-title {
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: #111111;
    line-height: 40px;
}

.arena-introduce {
    font-size: 16px;
    padding: 15px;
    text-align: center;
}

.color-button {
    height: 46px;
    font-size: 18px;
}

.nulls-id {
    padding: 4px 8px;
    color: #ffffff;
    border-radius: 12px;
    font-size: 14px;
}
</style>