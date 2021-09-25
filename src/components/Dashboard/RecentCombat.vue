

<template>
  <div class="w-full flex-1" style="margin-right: 40px">
    <div class="item-list-card">
      <div class="item-list-card-header">
        <div class="item-list-card-header-tabs">
          <button class="item-list-card-header-button item-list-card-header-button-active">
            <span class="item-list-card-header-button-text">Recent Combat</span>
          </button>
        </div>
        <div v-if="showMoreButton" class="item-list-card-header-right">
          <button
            @click="navigateTo('RecentCombat')"
            class="item-list-card-detail-button pop-button"
          >
            <img src="/detail.png" />
          </button>
        </div>
      </div>
      <a-spin tip="Loading..." :spinning="fetching">
        <div class="item-list-card-body">
          <empty v-show="ringRecords?.length < 1" />
          <div
            class="info-item justify-between items-center"
            v-for="record in ringRecords"
            :key="record"
          >
            <div class="flex items-center">
              <a-image class="ring-image" :src="`/gamebg${calcArenaImage(record.item_id)}.jpg`" />
              <div>
                <div :class="`info-block-num ${calcColor(record.item_id)}`">#{{ record.item_id }}</div>
                <a-tooltip>
                  <template #title>
                    <div>
                      <span class="font-bold">UTC+0:</span>
                      {{ formatDate(record.create_time, { fmt: 'YYYY-MM-DD HH:mm:ss:SSSS', local: false }) }}
                    </div>
                    <div>
                      <span class="font-bold">Timestamp:</span>
                      {{ record.create_time }}
                    </div>
                  </template>
                  <div class="info-time">{{ formatDate(record.create_time, { fromNow: true }) }}</div>
                </a-tooltip>
              </div>
            </div>
            <div>
              <div class="info-title">Arena</div>
              <a-tooltip>
                <template #title>
                  Arena address:
                  <div class="font-bold">{{ record.ring_address }}</div>
                </template>
                <div class="info-text">
                  <a
                    :href="accountExplorer(record.ring_address)"
                    target="_blank"
                  >{{ ethAddress(record.ring_address) }}</a>
                </div>
              </a-tooltip>
            </div>
            <div>
              <div class="info-title">Challenger</div>
              <a-tooltip>
                <template #title>
                  Challenger address:
                  <div class="font-bold">{{ record.challenger_address }}</div>
                </template>
                <div class="info-text">
                  <a
                    :href="accountExplorer(record.challenger_address)"
                    target="_blank"
                  >{{ ethAddress(record.challenger_address) }}</a>
                </div>
              </a-tooltip>
            </div>
            <div>
              <div class="info-title">Bonus</div>
              <a-tooltip>
                <template #title>
                  {{ record.token_name }} Contract:
                  <div class="font-bold">{{ record.token }}</div>
                </template>
                <div :class="[record.isWin == 0 ? 'color-red' : 'color-green', 'info-text']">
                  <a
                    :href="accountExplorer(record.token)"
                    target="_blank"
                    style="font-weight: bold;"
                  >{{ record.isWin == 0 ? '-' : '+' }}{{ removeDecimal(record.value, record.token_precision) }} {{ record.token_name }}</a>
                </div>
              </a-tooltip>
            </div>
            <div>
              <a-tooltip>
                <template #title>
                  Transcation Hash:
                  <div class="font-bold">{{ record.tx_hash }}</div>
                </template>
                <button class="info-item-button pop-button">
                  <a :href="txExplorer(record.tx_hash)" target="_blank" style="font-weight: bold;">
                    <img src="/button1.png" />
                  </a>
                </button>
              </a-tooltip>
            </div>
          </div>
          <div v-if="pagination" class="pagination-bar">
            <a-pagination
              @change="fetchRingRecord"
              show-quick-jumper
              v-model:current="page"
              :total="recordsTotal"
              show-less-items
            />
          </div>
        </div>
      </a-spin>
    </div>
  </div>
</template>


<script>
import { Dashboard } from '@/backends'
import { formatDate, cutEthAddress, removeDecimal, txExplorer, accountExplorer, calcArenaImage, calcColor } from '@/utils/common'

import empty from '@/components/Common/EmptyStatus.vue'

export default {
  components: {
    empty
  },
  data() {
    return {
      formatDate, cutEthAddress, removeDecimal, txExplorer, accountExplorer, calcArenaImage, calcColor,
      ringRecords: [],
      page: 1,
      recordsTotal: 0,
      fetching: true,
    }
  },
  props: {
    pagination: {
      default: false
    },
    displayFullAddress: {
      default: false
    },
    pageSize: {
      default: 10
    },
    showMoreButton: {
      default: false
    }
  },
  async created() {
    this.fetchRingRecord()
  },
  computed: {
    infoTextWidth() {
      return this.displayFullAddress ? 'auto' : '98px'
    }
  },
  methods: {
    ethAddress(address) {
      return this.displayFullAddress ? address : cutEthAddress(address, 4)
    },
    async fetchRingRecord() {
      this.fetching = true
      const { data } = await Dashboard.ringRecord({
        current: this.page,
        pageSize: this.pageSize
      })
      if (data.code !== 200) return this.$message.error(data.message)

      this.recordsTotal = data.data.count
      this.ringRecords = data.data.rows
      this.fetching = false
    },
    navigateTo(name) {
      name && this.$router.push({ name })
    }
  }
}
</script>

<style scoped>
.info-text {
  width: v-bind(infoTextWidth);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;
}

.color-green {
  color: #01ba96;
}

.color-red {
  color: #ff6262;
}

:deep(.ant-image) {
  width: 80px;
  margin-right: 12px;
  transition: 0.2s ease;
}

:deep(.ant-image:hover) {
  transform: scale(1.1);
}

:deep(.ant-image-img) {
  border-radius: 6px;
}

.info-item:not(:nth-child(11)) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

:deep(.ant-spin-blur) {
  border-radius: 0 16px 16px 16px;
}

.item-list-card-body {
  min-height: calc(60vh);
}
</style>