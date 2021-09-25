
<template>
  <div class="w-full flex-1">
    <div class="item-list-card mt-6">
      <div class="item-list-card-body">
        <div class="back-bar">
          <button @click="goback" class="image-button"></button>
        </div>
        <div class="content-layout">
          <div class="layout">
            <div>
              <NullsPreview :nullsId="pet?.pet_id" :nullsType="pet?.type" />
            </div>
            <div class="layout-right">
              <div class="synopsis-layout">
                <div class="synopsis-title">Nulls's Stories</div>
                <div class="synopsis-content">This nulls has no story yet...</div>
                <div
                  class="price"
                >{{ formatNumber(removeDecimal(pet?.price, pet?.current_precision || 6)) }} {{ pet?.current }}</div>
                <div class="synopsis-buy">
                  <color-button
                    v-if="pet?.sell_account?.toLowerCase() !== wallet.address?.toLowerCase()"
                    @click="handleBuy"
                    buttonStyle="orange"
                    :disabled="approving || purchasing"
                  >Buy</color-button>
                  <color-button
                    v-else="pet?.sell_account?.toLowerCase() === wallet.address?.toLowerCase()"
                    @click="handleCancelSale"
                    buttonStyle="yellow"
                    :disabled="canceling"
                  >{{ canceling ? 'Canceling...' : 'Cancel Sale' }}</color-button>
                </div>
              </div>

              <!-- <div class="record-list">
                <div class="record-title">Nulls' journey</div>
                <a-spin tip="Loading..." :spinning="fetching">
                  <empty v-show="ringRecord?.length < 1" height="300px" />
                  <div>
                    <div class="record-form" v-for="r in ringRecord" :key="r.id">
                      <div :class="[combatColor(r), 'info-status']">{{ combatStatus(r) }}</div>
                      <div class="record-form-layout">
                        <div class="title">Arena</div>
                        <div :class="[calcColor(r.item_id), 'ring-id']">#{{ r.item_id }}</div>
                      </div>
                      <div class="record-form-layout">
                        <div class="title">Result</div>
                        <div
                          :class="[calcImWin(r) ? 'color-green' : 'color-red', 'bonus font-bold']"
                        >
                          {{ calcImWin(r) ? '+' : '-' }}{{ removeDecimal(calcMyBonus(r), r.token_precision) }}
                          {{ r.token_name }}
                        </div>
                      </div>
                      <div class="record-form-layout">
                        <div class="title">Date</div>
                        <a-tooltip>
                          <template #title>
                            <div>
                              <span class="font-bold">UTC+0:</span>
                              {{ formatDate(r.create_time, { fmt: 'YYYY-MM-DD HH:mm:ss:SSSS', local: false }) }}
                            </div>
                            <div>
                              <span class="font-bold">Timestamp:</span>
                              {{ r.create_time }}
                            </div>
                          </template>
                          <div class="info-time">{{ formatDate(r.create_time) }}</div>
                        </a-tooltip>
                      </div>
                      <a-tooltip>
                        <template #title>
                          Transcation Hash:
                          <a
                            :href="txExplorer(r.tx_hash)"
                            target="_blank"
                            style="font-weight: bold;"
                          >{{ r.tx_hash }}</a>
                        </template>
                        <a :href="txExplorer(r.tx_hash)" target="_blank">
                          <button class="info-item-button pop-button">
                            <img src="/button1.png" />
                          </button>
                        </a>
                      </a-tooltip>
                    </div>
                  </div>
                </a-spin>
              </div>-->

              <div class="record-list">
                <div class="record-title">Transfer records</div>
                <a-spin tip="Loading..." :spinning="fetching">
                  <empty v-show="sellRecord?.length < 1" height="300px" />
                  <div>
                    <div
                      @click="openLink(tx)"
                      class="record-form"
                      v-for="tx in sellRecord"
                      :key="tx.id"
                    >
                      <div class="record-form-layout">
                        <div class="title">Buyer</div>
                        <div class="record-form-value-top">
                          <a
                            :href="accountExplorer(tx.buy_user_address)"
                            target="_blank"
                          >{{ cutEthAddress(tx.buy_user_address) }}</a>
                        </div>
                      </div>
                      <div class="record-form-layout">
                        <div class="title">Seller</div>
                        <div class="record-form-value-top">
                          <a
                            :href="accountExplorer(tx.sell_user_address)"
                            target="_blank"
                          >{{ cutEthAddress(tx.sell_user_address) }}</a>
                        </div>
                      </div>
                      <div class="record-form-layout">
                        <div class="title">Price</div>
                        <div
                          class="record-form-value-top"
                        >{{ removeDecimal(tx.price, tx.current_precision) }} {{ tx.current }}</div>
                      </div>
                      <div class="record-form-layout">
                        <div class="title">Date</div>
                        <div class="record-form-value-top">{{ formatDate(tx.create_time) }}</div>
                      </div>
                      <img class="record-arrows animation-bottom" src="/details-arrows.png" />
                    </div>
                  </div>
                </a-spin>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { calcColor, calcNullsImage, removeDecimal, formatDate, txExplorer, accountExplorer, cutEthAddress, formatNumber } from '@/utils/common'
import { Trading } from '@/backends'
import empty from '@/components/Common/EmptyStatus.vue'
import NullsPreview from '@/components/Items/NullsPreview.vue'
import { h } from 'vue'
import { CheckCircleTwoTone } from '@ant-design/icons-vue'
import { NullsWorldMarket } from '@/contracts'
import { BigNumber } from 'ethers'
import { WALLET_ERRORS, WALLET_TIPS } from '@/utils/wallet'


const recordAddrs = (record) => {
  return {
    cAddr: record.challenger_address.toLowerCase(),
    gAddr: record.ring_address.toLowerCase()
  }
}




export default {
  components: {
    empty, NullsPreview, CheckCircleTwoTone
  },
  props: {
    sellId: {
      default: 1
    }
  },
  data() {
    return {
      calcColor, calcNullsImage, removeDecimal, formatDate, txExplorer, accountExplorer, cutEthAddress, formatNumber,
      fetching: false,
      approving: false,
      purchasing: false,
      pet: {},
      sellRecord: [],
      ringRecord: [],
      tokenContract: undefined,
      marketContract: undefined,
      canceling: false
    }
  },
  async created() {
    this.fetchData()

    // Create contracts
    this.marketContract = this.wallet.createContract(NullsWorldMarket)

  },
  computed: {
    isGuardians() {
      return this.pet?.type === 255
    }
  },
  methods: {
    async fetchData() {
      this.fetching = true
      const { data } = await Trading.petDetail({ id: this.sellId })
      this.fetching = false
      if (data.code != 200) return this.$message.error(data.message)
      this.pet = data.data.petSell
      this.sellRecord = data.data.transaction
      /* this.ringRecord = data.data.ringRecord */
    },
    goback() {
      this.$router.back(-1)
    },
    combatColor(record) {
      const { cAddr, gAddr } = recordAddrs(record)
      if (cAddr === gAddr && this.wallet.address === cAddr) return 'color-orange'
      return cAddr === this.wallet.address ? 'color-green' : 'color-red'
    },
    combatStatus(record) {
      const { cAddr, gAddr } = recordAddrs(record)
      if (cAddr === gAddr && this.wallet.address === cAddr) return 'Self Challenge'
      return cAddr === this.wallet.address ? 'Challenge' : 'Guarding'
    },
    calcImWin(record) {
      const { cAddr, gAddr } = recordAddrs(record)
      if (cAddr === gAddr && this.wallet.address === cAddr) return record.isWin !== 1
      if (gAddr === this.wallet.address) return record.isWin === 1
      return record.isWin !== 1
    },
    calcMyBonus(record) {
      const cAddr = record.challenger_address.toLowerCase()
      const imWin = this.calcImWin(record)
      if (cAddr === this.wallet.address) return imWin ? record.value : record.tickets
      return record.value
    },
    handleGoCombat() {
      this.$router.push({ name: 'Arena' })
    },
    handleCreateArena() {
      if (this.pet?.type === 255) {
        this.paramStore.arenaNullsId = this.pet?.pet_id
        this.paramStore.arenaNullsType = this.pet?.type
        this.$root.openGlobalModal('createArena')
        return
      }
    },
    handleSold() {
      this.paramStore.soldNullsId = this.pet?.pet_id
      this.paramStore.soldNullsType = this.pet?.type
      this.$root.openGlobalModal('soldOnMarket')
    },
    async handleCancelSale() {
      this.canceling = true
      let hideUnSell = this.$message.loading({ content: 'Cancel selling...', key: 'cancel_cell', duration: 0 })
      try {
        const unsellPetTx = await this.marketContract['unSellPet'](this.pet?.pet_id)
        await unsellPetTx.wait().then(receipt => {
          if (receipt.status === 1) {
            console.log(`================unsellPetTx=================`)
            this.canceling = false
            this.$notification.open({
              message: 'Successful cancel',
              description: `Successfully cancel Nulls #${this.pet.pet_id}`,
              icon: h(CheckCircleTwoTone, { twoToneColor: '#52c41a' }),
            })
            this.$router.back(-1)
          }
          hideUnSell()
        })
      } catch (err) {
        hideUnSell()
        console.error(err)
        this.$message.error(WALLET_ERRORS[err.code] || err.data?.message || err.message)
        this.canceling = false
      }
    },
    async handleBuy() {
      const item = this.pet
      if (!item) return
      if (this.approving) return
      // Init contract
      const tokenContract = this.wallet.createERC20(item.current_contract)
      // Check allowance
      const ALLOWANCE = BigNumber.from(1_000_000_000)
      const allowance = await tokenContract['allowance'](this.wallet.address, NullsWorldMarket.address)


      // Approve if need
      if (allowance < ALLOWANCE) {
        this.approving = true
        let hiedeApprovingHint = this.$message.loading({ content: 'Approving required, waiting for your approval', key: 'approving', duration: 0 })
        const approveAmount = addDecimal(ALLOWANCE, item.current_precision || 6).toString()
        try {
          const approveTx = await tokenContract['approve'](NullsWorldMarket.address, approveAmount)
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
        const purchaseTx = await this.marketContract['buyPet'](item.pet_id)
        hidePurchasingHint = this.$message.loading({ content: WALLET_TIPS.txSend, key: 'purchasing', duration: 0 })
        await purchaseTx.wait().then(receipt => {
          console.log(receipt)
          if (receipt.status === 1) {
            console.log(`===============purchaseTx==================`)
            this.purchasing = false
            hidePurchasingHint()
            this.$notification.open({
              message: 'Successful purchase',
              description: `Successfully purchased Nulls #${item.pet_id}`,
              icon: h(CheckCircleTwoTone, { twoToneColor: '#52c41a' }),
            })
            this.$router.back(-1)
          }
        })
      } catch (err) {
        hidePurchasingHint()
        console.error(err)
        this.$message.error(WALLET_ERRORS[err.code] || err.data?.message || err.message)
        this.purchasing = false
      }
    },
    openLink(tx) {
      window.open(txExplorer(tx.tx_hash), "_blank")
    }
  }
}
</script>

<style scoped>
.item-list-card {
  height: 100%;
  width: 100%;
}

.item-list-card-body {
  display: flex;
  flex-direction: column;
  min-height: calc(100% - 56px);
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
}

.layout {
  display: flex;
  justify-content: space-between;
}

@media screen and (max-width: 1260px) {
  .layout-fix {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    align-items: center;
  }
  .layout-top {
    margin-top: 40px;
  }
}

.image-button {
  width: 45px;
  height: 45px;
  padding: 0 20px;
  background-repeat: round;
  background-size: 100%, auto;
  transition: 0.2s ease;
  background-image: url("/retreat.png");
}

.image-button:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}

.image-button:active {
  transform: scale(0.95);
  filter: brightness(0.9);
}

.back-bar {
  padding: 25px 40px;
}

.content-layout {
  padding: 0 80px 80px 80px;
}

.layout-right {
  width: 758px;
}

.info-block-num {
  padding: 2px 15px;
}

.frame-border {
  width: 305px;
  height: 330px;
  border-radius: 16px;
  border: 4px dashed #ff742733;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fff4c333;
}

.frame-border img {
  height: 155px;
}

.title {
  font-size: 18px;
  font-weight: 400;
}

.synopsis-layout {
  width: 100%;
  border-radius: 8px;
  border: 2px solid #00367f;
  display: flex;
  flex-direction: column;
  padding: 19px 41px 29px 29px;
  background-color: #ffffff99;
}

.synopsis-title {
  font-size: 22px;
  font-weight: bold;
  color: #00367f;
  padding-bottom: 10px;
  border-bottom: 2px solid #00367f;
}

.synopsis-content {
  min-height: 110px;
  font-weight: 400;
  color: #303030;
  font-size: 16px;
  margin-top: 20px;
  padding-bottom: 20px;
  /* padding: 10px; */
  overflow: hidden;
}

.synopsis-buy {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.synopsis-buy .color-button {
  font-size: 16px;
}

.synopsis-buy .color-button:not(:first-child) {
  margin-left: 30px;
}

.record-list {
  margin-top: 40px;
  width: 100%;
  border-radius: 8px;
  border: 2px solid #00367f;
  background-color: #ffffff99;
}

.record-title {
  font-size: 20px;
  font-weight: bold;
  color: #00367f;
  line-height: 25px;
  padding: 17px 0 17px 29px;
}

.record-form {
  /* height: 1px; */
  /* background: #E5E5E5; */
  height: 110px;
  border-bottom: 1px solid #e5e5e5;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 29px;
  cursor: pointer;
  transition: 0.2s ease;
}

.record-form:last-child {
  border-radius: 0 0 6px 6px;
}

.record-form:hover {
  background: #aeceff4d;
}

.record-form-layout {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 53px;
}

.record-form-value-top {
  padding-top: 10px;
  font-size: 16px;
}
.record-arrows {
  width: 9px;
  height: 17px;
  cursor: pointer;
}

.animation-bottom {
  transition: 0.2s cubic-bezier(0.19, 1, 0.22, 1);
}
.animation-bottom:hover {
  transform: scale(1.2);
  filter: brightness(1.1);
}
.animation-bottom:active {
  transform: scale(1.1) translateY(2px);
  filter: brightness(0.9);
}

.title {
  font-size: 16px;
  color: #666666;
}

.ring-id {
  text-align: center;
  border-radius: 16px;
  padding: 2px;
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
}

.info-status {
  display: inline-block;
  border-radius: 10px;
  border: 2px solid;
  padding: 4px 10px;
}

.color-green {
  color: #01ba96;
  border-color: #01ba96;
}

.color-red {
  color: #ff6262;
  border-color: #ff6262;
}

.color-orange {
  color: #ff7c43;
  border-color: #ff7c43;
}

.price {
  color: #ff7c43;
  font-weight: bold;
  font-size: 28px;
  text-align: center;
  padding: 20px 0;
}
</style>