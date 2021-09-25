<template>
  <div>
    <Notice />
    <div class="w-full flex-1">
      <div class="item-list-card mt-6">
        <div class="item-list-card-body">
          <div class="filter-bar px-12 py-10">
            <div class="flex items-center">
              <div
                @click="selectFilter(filter)"
                :class="[
                  isActiveFilter(filter) ? 'filter-item-active' : '',
                  'filter-item mr-10'
                ]"
                v-for="filter in filters"
                :key="filter"
              >
                <img src="/meat2.png" v-show="isActiveFilter(filter)" />
                <span>{{ filter.text }}</span>
              </div>
            </div>
          </div>

          <a-spin tip="Loading..." :spinning="fetching" delay="50">
            <div class="deal-content">
              <empty v-show="trades?.length < 1" />
              <div
                :class="[item.type === 255 ? 'guardians-border' : '', 'item-frame']"
                v-for="item in trades"
                :key="item"
              >
                <div>
                  <span :class="`nulls-id  ${calcColor(item.pet_id)}`">#{{ item.pet_id }}</span>
                </div>
                <div class="text-lg size-title">{{ item.name }}</div>
                <div class="item-content-img">
                  <img :src="`/nulls${calcNullsImage(item.pet_id)}.png`" />
                </div>
                <div class="item-price">
                  <div
                    :class="[item.type === 255 ? 'guardians' : '', 'nulls-name']"
                  >{{ item.type === 255 ? 'Guardians' : 'Nulls' }}</div>
                  <div class="flex flex-col items-center mt-2">
                    <div
                      class="price-currency"
                      style="padding-right: 10px"
                    >{{ formatNumber(removeDecimal(item.price, 6)) }} {{ item.current }}</div>
                    <div class="price-us">≈${{ formatNumber(removeDecimal(item.price, 6)) }}</div>
                  </div>
                </div>
                <div class="item-bottom-arrange">
                  <color-button
                    buttonStyle="blue"
                    @click="$router.push({ name: 'MarketNullsInfo', params: { sellId: item.id } })"
                  >Detail</color-button>
                  <color-button buttonStyle="orange" @click="handleBuy(item)">Buy</color-button>
                </div>
              </div>
            </div>
          </a-spin>

          <div class="flex justify-end px-8 py-8">
            <a-pagination
              @change="fetchTradList"
              show-quick-jumper
              v-model:current="page"
              :total="total"
              show-less-items
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Notice from '@/components/Common/NoticeBar.vue'

import { Trading } from '@/backends'
import { removeDecimal, calcNullsImage, calcColor, addDecimal, formatNumber } from '@/utils/common'
import { NullsWorldMarket } from '@/contracts'
import { BigNumber } from 'ethers'
import empty from '@/components/Common/EmptyStatus.vue'
import { h } from 'vue'
import { CheckCircleTwoTone } from '@ant-design/icons-vue'
import { WALLET_ERRORS, WALLET_TIPS } from '@/utils/wallet'


export default {
  components: {
    Notice, empty, CheckCircleTwoTone
  },
  data() {
    return {
      removeDecimal, calcNullsImage, calcColor, addDecimal,
      formatNumber,
      marketContract: undefined,
      approving: false,
      purchasing: false,
      fetching: true,
      usdtDecimals: 6,
      selectedFilter: 0,
      filters: [
        {
          text: 'All',
          value: 0
        },
        {
          text: 'Guardians',
          value: 1
        },
        {
          text: 'Challenger',
          value: 2
        }
      ],
      total: 1,
      page: 1,
      trades: [],
      tokenContracts: {}
    }
  },
  async created() {
    this.fetchTradList()

    // Create contracts
    this.marketContract = this.wallet.createContract(NullsWorldMarket)

  },
  methods: {
    getTokenContracts(address) {
      if (this.tokenContracts[address]) return this.tokenContracts[address]
      const c = this.wallet.createERC20(address)
      this.tokenContracts[address] = c
      return c
    },
    async fetchTradList() {
      this.fetching = true
      const { data } = await Trading.marketPage({
        current: this.current,
        pageSize: this.pageSize,
        type: this.selectedFilter
      })

      this.fetching = false
      if (data.code != 200) return this.$message.error(data.message)

      this.total = data.data?.count
      this.trades = data.data?.row
    },
    randColor() {
      const items = ['rare-blue', 'rare-purple', 'rare-red', 'rare-orange']
      return items[Math.floor(Math.random() * items.length)]
    },
    isActiveFilter(filter) {
      return this.selectedFilter === filter.value
    },
    selectFilter(filter) {
      this.selectedFilter = filter.value
      this.fetchTradList()
    },
    async handleBuy(item) {
      if (!item) return
      if (this.approving) return

      // Init contract
      const tokenContract = this.getTokenContracts(item.current_contract)

      // Check allowance
      const ALLOWANCE = BigNumber.from(1_000_000_000)
      const allowance = await tokenContract['allowance'](this.wallet.address, NullsWorldMarket.address)

      // Approve if need
      if (allowance < ALLOWANCE) {
        this.approving = true
        let hiedeApprovingHint = this.$message.loading({ content: 'Approving required, waiting for your approval', key: 'approving', duration: 0 })
        const approveAmount = addDecimal(ALLOWANCE, item.current_precision || this.usdtDecimals).toString()
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
            this.fetchTradList()
          }
        })
      } catch (err) {
        hidePurchasingHint()
        console.error(err)
        this.$message.error(WALLET_ERRORS[err.code] || err.data?.message || err.message)
        this.purchasing = false
      }
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

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-item {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #111111;
  user-select: none;
  cursor: pointer;
  transition: 0.2s ease;
  padding: 10px;
  border-radius: 8px;
}

.filter-item:hover {
  color: #00367f;
  font-weight: bold;
  background-color: #aeceff4d;
}

.filter-item-active {
  color: #00367f;
  font-weight: bold;
  background-color: #aeceff4d;
}

.deal-content {
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px;
}

.item-content-img {
  display: flex;
  justify-content: center;
  height: 133px;
  margin: 15px 0;
  transition: 0.2s ease;
}

.size-title {
  margin-top: 8px;
  padding: 0 4px;
  color: #111111;
}

.item-price {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin-top: 10px;
}

.price-currency {
  font-size: 18px;
  font-weight: bold;
  color: #ff7427;
}

.price-us {
  font-weight: 400;
  font-size: 12px;
  color: #666666;
}

.item-bottom-arrange {
  display: flex;
  justify-content: space-between;
  padding-top: 20px;
}

.item-frame {
  width: 295px;
  height: 376px;
  border-radius: 10px;
  background-color: #fff4c333;
  border: 2px solid #ff742733;
  user-select: none;
  cursor: pointer;
  transition: 0.2s ease;
  position: relative;
  margin: 0 10px 30px 10px;
  padding: 30px;
}

.item-frame:hover {
  background-color: #fff4c34d;
}

.item-frame:active {
  filter: brightness(0.9);
  /* transform: scale(0.9); */
}

.item-frame:last-child:nth-child(4n - 1) {
  margin-right: calc(295 + 4rem);
}

.filter-item {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #111111;
  user-select: none;
  cursor: pointer;
  transition: 0.2s ease;
  padding: 10px;
  border-radius: 8px;
}

.filter-item img {
  height: 33px;
  padding-right: 0.5rem;
}

.filter-item:hover {
  color: #00367f;
  font-weight: bold;
  background-color: #aeceff4d;
}

.filter-item-active {
  color: #00367f;
  font-weight: bold;
  background-color: #aeceff4d;
}

.guardians {
  background-image: -webkit-linear-gradient(
    left,
    #ff2e2e,
    #e6d205 25%,
    #003cff 50%,
    #e6d205 75%,
    #ff5252
  );
  -webkit-text-fill-color: transparent;

  -webkit-background-clip: text;
  -webkit-background-size: 200% 100%;
  -webkit-animation: maskedAnimation 4s infinite linear;

  background-clip: text;
  background-size: 200% 100%;
  animation: maskedAnimation 4s infinite linear;
}

@keyframes maskedAnimation {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.nulls-name {
  font-weight: bold;
  font-size: 18px;
}

.guardians-border {
  border: 3px solid #ff8585;
}

.nulls-id {
  border-radius: 12px;
  padding: 4px 8px;
  color: #ffffff;
  font-weight: bold;
}
</style>