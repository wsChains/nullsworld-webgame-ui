<template>
  <div class="arena-container">
    <div class="arena-title">
      Coming to Arena
      <span :class="[calcColor(arena?.item_id), 'arena-id']">#{{ arena?.item_id }}</span>
    </div>
    <div class="arena-introduce">Select a nulls for the challenge</div>
    <NeedWalletConnect
      @onWalletConnect="init"
      @onAddressChange="init"
      @onWalletDisconnect="onDisconnect"
    >
      <a-spin tip="Loading..." :spinning="fetching || approving || combating">
        <div class="my-nulls-content py-12">
          <NoNulls v-if="!wallet.connected || noNulls" />
          <div
            v-else
            v-for="n in displayNulls"
            :class="[n.pet_id === myPetId ? 'nulls-selected' : '', 'nulls']"
            @click="selectNulls(n)"
          >
            <div>
              <img style="height: 120px;" :src="`/nulls${calcNullsImage(n.pet_id)}.png`" />
            </div>
            <div class="pt-6 font-bold">
              <span style="font-size: 16px;">Nulls</span>
              <span :class="[calcColor(n.pet_id), 'nulls-id']">#{{ n.pet_id }}</span>
            </div>
          </div>
        </div>
      </a-spin>
      <div class="button-box flex justify-center mt-12">
        <color-button
          style="min-width: 260px;"
          @click="handleCombat"
          :disabled="combating || !myPetId || noNulls || !wallet.connected"
        >
          {{
            noNulls ? 'No Challenger Nulls' :
              !wallet.connected ? 'Wallet Not Connected' :
                !myPetId ? 'Please choose a Challenger' :
                  `Fight with Nulls #${myPetId}`
          }}
        </color-button>
        <color-button
          class="ml-4"
          buttonStyle="blue"
          @click="getRandNulls"
          :disabled="combating || noNulls || !wallet.connected"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </color-button>
      </div>
    </NeedWalletConnect>
  </div>
</template>

<script>
import { MyNulls, Ring } from '@/backends'
import { calcNullsImage, calcColor, addDecimal, guid, randChoiceNum } from '@/utils/common'
import Nulls from '@/components/Items/NullsItem.vue'
import NoNulls from '@/components/Items/NoNulls.vue'
import { h } from 'vue'
import { CheckCircleTwoTone, SyncOutlined, CloseCircleTwoTone } from '@ant-design/icons-vue'
import { BigNumber } from 'ethers'
import { RingManager } from '@/contracts'
import { WALLET_ERRORS, WALLET_TIPS } from '@/utils/wallet/constants'



export default {
  components: {
    Nulls, NoNulls, SyncOutlined
  },
  props: {
    arena: {
      default: undefined
    }
  },
  data() {
    return {
      addDecimal,
      calcNullsImage,
      calcColor,
      nulls: [],
      myPetId: undefined,
      approving: false,
      combating: false,
      fetching: true,
      updateDataInterval: -1,
      displayNulls: []
    }
  },
  async created() {
    await this.init()
  },
  unmounted() {
    clearInterval(this.updateDataInterval)
  },
  computed: {
    noNulls() {
      return this.nulls?.length < 1
    }
  },
  methods: {
    onDisconnect() {
      clearInterval(this.updateDataInterval)
    },
    async init() {
      if (!this.wallet.connected) return
      clearInterval(this.updateDataInterval)

      this.ringManagerContract = this.wallet.createContract(RingManager)
      this.tokenContract = this.wallet.createERC20(this.arena?.token)


      this.updateMyNulls()
      this.updateDataInterval = setInterval(() => {
        this.updateMyNulls(true)
      }, 10000)
    },
    selectNulls(n) {
      this.myPetId = n.pet_id
    },
    randColor() {
      const items = ['blue', 'purple', 'red', 'orange']
      return items[Math.floor(Math.random() * items.length)]
    },
    updateMyNulls(isAutoUpdate = false) {
      if (!isAutoUpdate) this.fetching = true

      MyNulls.findNullsPK({ address: this.wallet.address }).then(({ data }) => {
        this.fetching = false
        if (data.code === 200) {
          this.nulls = data.data
          this.getRandNulls()
          if (!isAutoUpdate && this.paramStore.autoSelectNulls) this.handleCombat()
        }
      })
    },
    /* handleStartCombat() {
      this.myPetId = this.myPetId
      this.$root.closeGlobalModal()
      this.$router.push({ name: 'ArenaCombat', params: { arena.item_id: this.paramStore.arena.item_id, myPetId: this.myPetId } })
    }, */
    getRandNulls() {
      this.displayNulls = [...new Set(randChoiceNum(this.nulls, 3).filter(i => i))]
      this.myPetId = this.displayNulls[Math.floor(Math.random() * this.displayNulls.length)]?.pet_id
    },
    async handleCombat() {
      if (!this.myPetId) return this.$message.error('Please choose your nulls before the combat.')

      const TIPS_KEY = `arena-${this.arena.item_id}-${guid()}`
      const title = (t) => `Arena #${this.arena.item_id}: ${t}`

      // Check allowance
      const ALLOWANCE = BigNumber.from(1_000_000_000_000)
      const allowance = await this.tokenContract['allowance'](this.wallet.address, RingManager.address)

      // Approve if need
      if (allowance < ALLOWANCE) {
        this.approving = true
        this.$notification.open({
          message: title('Approving Required ❗'),
          description: 'Your authorization is required to send the transaction, please go to your wallet to confirm...',
          duration: 0,
          key: TIPS_KEY
        })
        const approveAmount = addDecimal(ALLOWANCE, this.arena.token_precision).toString()
        try {
          const approveTx = await this.tokenContract['approve'](RingManager.address, approveAmount)
          this.$notification.open({
            message: title('Waiting for Approving...'),
            description: WALLET_TIPS.txSend,
            duration: 0,
            key: TIPS_KEY
          })
          await approveTx.wait().then(receipt => {
            console.log(receipt)
            if (receipt.status === 1) {
              console.log(`================approveTx=================`)
              this.$notification.open({
                message: title('Successful approve ✔️'),
                description: WALLET_TIPS.txSend,
                duration: 0,
                key: TIPS_KEY
              })
              this.approving = false
            }
          })
        } catch (err) {
          console.error(err)
          this.$notification.open({
            message: title('Challenge failed ❌'),
            description: 'please try again.',
            duration: 2,
            key: TIPS_KEY
          })
          this.approving = false
        }
      }

      // Send pk transcation
      this.combating = true
      this.$emit('combatStart')
      this.$notification.open({
        message: title('Preparing Transaction ✨'),
        description: 'Getting latest block number...',
        duration: 0,
        key: TIPS_KEY
      })

      const latestBlock = await this.wallet.signer.provider.getBlock()
      if (!latestBlock) {
        this.combating = false
        this.$notification.open({
          message: title('Challenge failed ❌'),
          description: 'Could not get latest block, please try again.',
          duration: 2,
          key: TIPS_KEY
        })
        return
      }

      try {
        const deadline = latestBlock.timestamp + 1800
        const uuid = guid()
        this.$notification.open({
          message: title('Request to start the combat... 🔮'),
          description: 'The battle is about to start, please go to the wallet to confirm. 📑',
          duration: 0,
          key: TIPS_KEY
        })
        const pkTx = await this.ringManagerContract.pk(this.arena.item_id, this.myPetId, deadline, uuid)
        this.$emit('transcationSended')
        this.$notification.open({
          message: title('Waiting for combat requests. 📑'),
          description: 'Combat request has been sent, waiting for combat to be accepted.',
          duration: 0,
          key: TIPS_KEY
        })
        await pkTx.wait().then(receipt => {
          console.log(receipt)
          if (receipt.status === 1) {
            this.$notification.open({
              message: title('The Combat has begun! 🔥🔥🔥'),
              description: `The combat has begun, please wait for the result. 💪`,
              duration: 0,
              key: TIPS_KEY,
            })
            console.log(`================pkTx=================`)
            this.r = setInterval(async () => {
              const { data } = await Ring.requestCombatResult({ uuid })
              if (!data.data) return

              this.$emit('combatEnd')
              if (data.data.isWin === 0) {
                this.$notification.open({
                  message: title('You got the victory! 🏳️‍🌈🏳️‍🌈🏳️‍🌈'),
                  description: `Congratulations on your victory! 💪`,
                  duration: 7,
                  key: TIPS_KEY,
                })
                this.$emit('onWin')
                clearInterval(this.r)
                this.combating = false
              } else {
                this.$notification.open({
                  message: title('You lost the battle. 🏳️🏳️🏳️'),
                  description: `Please don't be discouraged and keep up the good work! 💪`,
                  duration: 7,
                  key: TIPS_KEY,
                })
                clearInterval(this.r)
                this.combating = false
              }
            }, 2000);
          }
        })
      } catch (err) {
        clearInterval(this.r)
        this.$notification.open({
          message: title('Challenge failed ❌'),
          description: 'Challenge failed, please try again.',
          duration: 2,
          key: TIPS_KEY
        })
        this.combating = false
        this.$emit('combatEnd')
      }
    }
  }
}
</script>


<style scoped>
.color-button {
  height: 46px;
  font-size: 18px;
}

.my-nulls-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  width: 700px;
  height: 400px;
  overflow: auto;
}

.arena-container {
  min-width: 400px;
  padding: 20px 40px;
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
  vertical-align: middle;
}

.nulls {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: #fff4c31a;
  border: 2px solid #ff742733;
  padding: 20px;
  flex-direction: column;
  cursor: pointer;
  transition: 0.2s ease;
  margin: 15px;
  height: 220px;
  width: 170px;
}

.nulls:hover {
  transform: scale(0.95);
  filter: brightness(0.95);
}

.nulls:hover {
  transform: scale(1.1);
  filter: brightness(1.1);
}

.nulls-selected {
  background-color: #fff4c3;
  border: 2px solid #ff7427;
}

.arena-id {
  padding: 4px 8px;
  color: #ffffff;
  border-radius: 8px;
  font-size: 14px;
}

.nulls-id {
  padding: 2px 4px;
  color: #ffffff;
  border-radius: 8px;
  font-size: 12px;
  margin-left: 4px;
}
</style>