<template>
  <div class="flex">
    <div class="flex items-center">
      <NullsPreview :nullsId="paramStore.arenaNullsId" :nullsType="paramStore.arenaNullsType" />
    </div>
    <a-spin tip="Loading..." :spinning="approving || creating">
      <div class="arena-container">
        <div class="arena-title">Create arena</div>
        <div class="arena-introduce">Create an arena and meet the challenge</div>
        <div class="py-12">
          <div class="py-2 font-bold" style="font-size: 16px;">Token select</div>
          <a-dropdown :trigger="['click']" placement="bottomCenter">
            <div class="token-select">
              <div class="token-select-left">
                <img class="token-icon" :src="`/tokens/${tokenSymbol.toLowerCase()}.svg`" />
                <div class="token-select-content">
                  <div class="token-symbol">{{ tokenSymbol }}</div>
                  <div
                    class="token-select-balance"
                  >Balance: {{ formatNumber(tokenBalance) }} {{ tokenSymbol }}</div>
                </div>
              </div>
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <template #overlay>
              <div class="select-token-dropdown">
                <li v-for="(t, idx) in tokens" :key="t.address" @click="selectToken(idx)">
                  <div class="flex">
                    <img class="token-icon" :src="`/tokens/${t.symbol.toLowerCase()}.svg`" />
                    <div>
                      <div class="font-bold">{{ t.symbol }}</div>
                      <div style="font-size: 12px;">{{ t.address }}</div>
                    </div>
                  </div>
                </li>
              </div>
            </template>
          </a-dropdown>
        </div>
        <div class="form-column">
          <div>Nulls ID</div>
          <div class="px-4 font-bold">
            <span v-if="invalidNulls" class="px-2">No Nulls</span>
            <span
              v-else
              :class="[calcColor(paramStore.arenaNullsId), 'nulls-id']"
            >#{{ paramStore.arenaNullsId }}</span>
          </div>
        </div>
        <div class="form-column">
          <div>Multiplier</div>
          <a-radio-group v-model:value="multiplier">
            <a-radio v-for="m in multiplers" :key="m" :value="m">x{{ m }}</a-radio>
          </a-radio-group>
        </div>
        <div class="form-column">
          <div>Tickets</div>
          <div class="px-4 font-bold" style="color: #ff761a;">
            <span class="px-2">{{ sigleBet }}</span>
            <span>{{ tokenSymbol }}</span>
          </div>
        </div>
        <div class="form-column">
          <div>Total</div>
          <div class="px-4 font-bold" style="color: #ff761a;">
            <span class="px-2">{{ totalBet }}</span>
            <span>{{ tokenSymbol }}</span>
          </div>
        </div>
        <div class="flex justify-center mt-12">
          <color-button
            @click="handleCreateArena"
            :disabled="invalidNulls || !wallet.connected || insufficientBalance || approving || creating"
          >
            <LoadingOutlined v-show="approving || creating" class="px-2 font-bold" spin />
            {{
              invalidNulls ? 'No Nulls' :
                !wallet.connected ? 'Wallet Not Connected' :
                  insufficientBalance ? `Insufficient ${tokenSymbol}` :
                    approving ? 'Approving...' :
                      creating ? 'Creating...' :
                        `Create Arena Now!`
            }}
          </color-button>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script>
import { NullsEggToken, NullsEggManager, NullsRankManager } from '@/contracts'
import { BigNumber, utils } from 'ethers'
import { addDecimal, formatNumber, removeDecimal, calcColor } from '@/utils/common'
import { MyEggs, Ring } from '@/backends'
import { h } from 'vue'

import NullsPreview from '@/components/Items/NullsPreview.vue'
import { CheckCircleTwoTone, LoadingOutlined } from '@ant-design/icons-vue'
import { WALLET_ERRORS, WALLET_TIPS } from '@/utils/wallet/constants'

const ITEM_KEY = 'nulls.online-play'


export default {
  components: {
    NullsPreview, LoadingOutlined
  },
  data() {
    return {
      addDecimal, formatNumber, removeDecimal, calcColor,
      creating: false,
      approving: false,

      tokenBalance: 0,
      eggContract: undefined,
      eggManagerContract: undefined,
      ringManagerContract: undefined,
      updateBalanceInterval: undefined,
      multiplier: 5,

      multiplers: [5, 10],
      contractTokenDecimal: undefined,
      sigleBet: 10,

      selectedTokenIndex: 0,
      tokens: [
        {
          symbol: 'USDT',
          address: '0x04F535663110A392A6504839BEeD34E019FdB4E0',
          decimal: 6
        },
        {
          symbol: 'T-NET',
          address: '0x6aA7CF4F83c6a88cABD93b40D47E7144311882B8',
          decimal: 6
        }
      ]
    }
  },
  async created() {
    // Create contracts
    this.eggContract = this.wallet.createContract(NullsEggToken)
    this.eggManagerContract = this.wallet.createContract(NullsEggManager)
    this.ringManagerContract = this.wallet.createContract(NullsRankManager)


    this.subscribeToken()
  },
  computed: {
    invalidNulls() {
      return this.paramStore.arenaNullsId < 0
    },
    insufficientBalance() {
      return !this.tokenBalance || (this.totalBet > this.tokenBalance)
    },
    totalBet() {
      return this.sigleBet * this.multiplier
    },
    currentToken() {
      return this.tokens[this.selectedTokenIndex]
    },
    tokenSymbol() {
      return this.currentToken.symbol
    },
    tokenAddress() {
      return this.currentToken.address
    },
    tokenDecimals() {
      return this.contractTokenDecimal || this.currentToken.decimal
    }
  },
  methods: {
    async updateBalance() {
      this.tokenBalance = removeDecimal(await this.tokenContract['balanceOf'](this.wallet.address), this.tokenDecimals)
    },
    select(key) {
      this.selected = key
    },
    subscribeToken() {
      this.tokenContract = this.wallet.createERC20(this.tokenAddress)

      // Get decimals
      this.tokenContract['decimals']().then(d => {
        this.contractTokenDecimal = d
      })

      clearInterval(this.updateBalanceInterval)
      this.updateBalance().then(() => {
        this.updateBalanceInterval = setInterval(this.updateBalance, 10_000);
      })
    },
    async readyOpenEggs() {
      const latestBlock = await this.wallet.signer.provider.getBlock()
      const { code, data } = (await MyEggs.getItemId()).data
      if (code !== 200) {
        return { err: 'Could not get itemId, please try again.' }
      }
      return { itemId: data.item_id, deadline: latestBlock.timestamp + 1800, err: undefined }
    },
    async handleCreateArena() {
      if (!this.tokenBalance || this.paramStore.arenaNullsId < 0) return

      // Check allowance
      const ALLOWANCE = BigNumber.from(1_000_000_000_000)
      const allowance = await this.tokenContract['allowance'](this.wallet.address, NullsRankManager.address)

      // Approve if need
      if (allowance < ALLOWANCE) {
        this.approving = true
        let hiedeApprovingHint = this.$message.loading({ content: 'Approving required, waiting for your approval', key: 'approving', duration: 0 })
        const approveAmount = addDecimal(ALLOWANCE, this.usdtDecimals).toString()
        try {
          const approveTx = await this.tokenContract['approve'](NullsRankManager.address, approveAmount)
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
        }
      }

      // Handle create arena
      let txHash
      this.creating = true
      let creatingArena = this.$message.loading({ content: 'Constructing data and requesting game servers...', key: 'creating', duration: 0 })
      try {
        const nonce = Number(await this.ringManagerContract['nonces'](this.wallet.address))
        console.log(nonce)
        const bytesData = new utils.AbiCoder().encode(['string', 'uint', 'address', 'uint8', 'uint256', ' uint256'],
          [ITEM_KEY, this.paramStore.arenaNullsId, this.tokenAddress, this.multiplier, nonce, Number(this.wallet.chainId)])
        const signature = await this.wallet.signer.signMessage(utils.arrayify(utils.keccak256(bytesData)))
        const { r, s, v } = utils.splitSignature(signature)
        /* utils.verifyMessage(utils.keccak256(bytesData), signature) */
        const { data } = await Ring.createRing({
          owner_address: this.wallet.address,
          pet_id: this.paramStore.arenaNullsId,
          token: this.tokenAddress,
          multiple: this.multiplier,
          r,
          s,
          v
        })
        if (data.code != 200) {
          this.creating = false
          creatingArena()
          console.error(data)
          this.$message.error(data.message)
          return
        }
        txHash = data.data.tx_hash
      } catch (err) {
        this.creating = false
        creatingArena()
        console.error(err)
        this.$message.error(err.message)
        return
      }

      creatingArena = this.$message.loading(
        {
          content:
            `Transactions #${txHash} have been sent to the blockchain. Awaiting block confirmation...`,
          key: 'creating',
          duration: 0
        })

      this.wallet.$.provider.waitForTransaction(txHash).then(receipt => {
        if (receipt.status === 1) {
          console.log(`===============TX DONE==================`)
          this.creating = false
          creatingArena()
          this.updateBalance()
          this.$notification.open({
            message: 'Successful Created Arena',
            description: `Transcations #${txHash} success! Create Arena with Nulls #${this.paramStore.arenaNullsId}`,
            icon: h(CheckCircleTwoTone, { twoToneColor: '#52c41a' }),
          })
          this.$root.closeGlobalModal()
        }
      })
    },
    selectToken(idx) {
      this.selectedTokenIndex = idx
      this.subscribeToken()
    }
  }
}
</script>


<style scoped>
:deep(.ant-radio-inner),
:deep(.ant-radio-input) {
  height: 24px;
  width: 24px;
}

:deep(.ant-radio-inner::after) {
  height: 16px;
  width: 16px;
  border-radius: 50%;
}

.ant-radio-wrapper,
.ant-radio,
.ant-radio-group {
  font-size: inherit;
  line-height: inherit;
}

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

.select-token-dropdown {
  border: 2px solid #ff981a;
  user-select: none;
  border-radius: 6px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
}

.select-token-dropdown :deep(li) {
  padding: 15px;
  transition: 0.2s ease;
  cursor: pointer;
}

.select-token-dropdown :deep(li:first-child) {
  border-radius: 8px 8px 0 0;
}

.select-token-dropdown :deep(li:last-child) {
  border-radius: 0 0 8px 8px;
}

.select-token-dropdown :deep(li:hover) {
  background-color: #efefef;
}

.select-token-dropdown :deep(li:active) {
  filter: brightness(0.9);
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