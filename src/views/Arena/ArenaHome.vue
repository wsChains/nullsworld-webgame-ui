<template>
  <div class="w-full flex-1">
    <Notice />
    <div class="item-list-card mt-6">
      <div class="item-list-card-body">
        <div class="options-bar filter-bar px-12 py-10">
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
              <span>{{ filter?.text }}</span>
            </div>
            <a-dropdown :trigger="['click']" placement="bottomCenter">
              <div class="dropdown-filter" @click.prevent style="text-shadow: none">
                <span class="dropdown-text">{{ selectedFilterText2 }}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style="height: 16px; margin-left: 5px"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <template #overlay>
                <custom-dropdown>
                  <li v-for="f in filtersL2" :key="f" @click="selectFilterL2(f)">
                    <div>{{ f.text }}</div>
                  </li>
                </custom-dropdown>
              </template>
            </a-dropdown>
          </div>
          <div class="flex items-center">
            <color-button
              @click="$message.warn('Quick Combat are currently not aviliable.')"
              buttonStyle="red"
            >Quick Combat</color-button>
            <color-button
              @click="$root.openGlobalModal('selectNullsArena')"
              buttonStyle="blue"
            >Create Arena</color-button>
          </div>
        </div>
        <div class="flex items-center justify-between px-12 py-10 mt-5">
          <div class="flex items-center mr-2">
            <div class="arena-count">
              Total
              <span class="font-bold">{{ total }}</span> Arenas
            </div>
            <input
              v-model="searchInput"
              type="text"
              class="search-input focus:outline-none focus:shadow-outline"
              placeholder="Enter Arena id to search"
            />
            <color-button @click="handleSearch">Search</color-button>
          </div>
          <div style="background-color: #aeceff4d; padding: 8px 16px; border-radius: 16px;">
            <custom-checkbox v-model:checked="paramStore.autoSelectNulls">Auto nulls selection</custom-checkbox>
            <custom-checkbox v-model:checked="hideInCombat">Hide already in combat</custom-checkbox>
          </div>
        </div>
        <a-spin tip="Loading..." :spinning="fetching" delay="50">
          <div class="arena-list px-12 mt-5">
            <empty v-show="arenaList?.length < 1" />
            <ArenaItem
              v-for="a in arenaList"
              :key="a"
              :data="a"
              @onWin="onWin"
              :hideInCombat="hideInCombat"
              :ended="isEnded"
            />
          </div>
        </a-spin>
        <div class="paging-bar px-10 pb-10 pt-4">
          <a-pagination
            @change="fetchRingList"
            show-quick-jumper
            v-model:current="currentPage"
            :total="total"
            show-less-items
          />
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { Ring } from '@/backends'
import { formatNumber, removeDecimal, calcArenaImage, calcColor } from '@/utils/common'
import Notice from '@/components/Common/NoticeBar.vue'
import empty from '@/components/Common/EmptyStatus.vue'

import CustomCheckbox from '@/components/Common/CustomCheckbox.vue'
import ArenaItem from '@/components/Items/ArenaItem.vue'

export default {
  components: {
    empty, Notice, CustomCheckbox, ArenaItem
  },
  data() {
    return {
      arenaId: undefined,
      arenaTokenAddress: undefined,
      showModal: false,
      formatNumber, removeDecimal, calcArenaImage, calcColor,
      currentPage: 1,
      total: 0,
      pageSize: 9,
      hideInCombat: false,
      searchInput: undefined,
      fetching: true,
      selectedFilter: 1,
      filters: [
        {
          text: 'Challengable',
          value: 1
        },
        {
          text: 'Ended',
          value: 3
        }
      ],
      selectedFiltersL2: 2,
      filtersL2: [
        {
          text: 'Top Prize pool',
          key: 0
        },
        {
          text: 'Minimum Prize pool',
          key: 1
        },
        {
          text: 'Latest Arena',
          key: 2
        },
        {
          text: 'Top multiplier',
          key: 3
        }
      ],

      arenaList: [],
    }
  },
  async created() {
    this.fetchRingList()
  },
  watch: {
    selectedFilter() {
      this.currentPage = 1
      this.fetchRingList()
    },
    selectedFiltersL2() {
      this.currentPage = 1
      this.fetchRingList()
    }
  },
  methods: {
    async fetchRingList() {
      this.fetching = true
      const { data } = await Ring.findPage({
        status: this.selectedFilter,
        sort: this.selectedFiltersL2,
        current: this.currentPage,
        pageSize: this.pageSize,
        number: this.searchInput
      })
      this.fetching = false

      if (data.code != 200) return this.$message.error(data.message)
      this.total = data.data.count
      this.arenaList = data.data.rows
    },
    isActiveFilter(filter) {
      return this.selectedFilter === filter?.value
    },
    selectFilter(filter) {
      this.selectedFilter = filter?.value
    },
    selectFilterL2(filter) {
      this.selectedFiltersL2 = filter?.key
    },
    handleSearch() {
      this.currentPage = 1
      this.fetchRingList()
    },
    handleCombat(a) {
      this.arenaId = a.item_id
      this.arenaTokenAddress = a.token
      this.showModal = true
    },
    onWin(arenaId) {
      for (let i in this.arenaList) {
        const arena = this.arenaList[i]
        if (arena.item_id === arenaId) {
          this.arenaList.splice(i, 1)
          break
        }
      }
    }
  },/* <span class="onsale-section"><span class="onsale">Save 10%</span></span> */
  computed: {
    selectedFilterText2() {
      return this.filtersL2?.filter && this.filtersL2.filter((f) => f.key === this.selectedFiltersL2)[0]?.text
    },
    walletAddress() {
      return this.wallet?.address
    },
    isEnded() {
      return this.selectedFilter === 3
    }
  }
}
</script>

<style scoped>
.color-button {
  margin: 0 10px;
}

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

.menu-item-active {
  background-color: #ffffff00;
  background-image: linear-gradient(
    120deg,
    #ffffff1a 13%,
    #eaeafde6 52%,
    #abc9fe99 100%
  );
  color: #00367f;
}

.dropdown-filter {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 22px;
  font-size: 16px;
  font-weight: 400;
  color: #00367f;
  line-height: 26px;
  user-select: none;
  transition: 0.2s ease;
  border-radius: 8px;
  border: 2px solid #00367f;
  margin-right: 35px;
  cursor: pointer;
}

.dropdown-text {
  padding: 0 5px;
  width: 126px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.dropdown-filter:hover {
  background-color: #aeceff4d;
}

.dropdown-filter:active {
  transform: scale(0.9);
  background-color: #aeceff4d;
}

button {
  display: flex;
  justify-content: center;
  align-items: center;
}

.search-input {
  text-align: center;
  padding: 5px 12px;
  font-size: 16px;
  border-radius: 8px;
  border: 2px solid #00367f;
  background: transparent;
  width: 310px;
  margin-right: 20px;
}

.arena-list {
  display: flex;
  flex-wrap: wrap;
}

.paging-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.arena-count {
  font-size: 18px;
  margin-right: 24px;
  background-color: #aeceff4d;
  border-radius: 16px;
  padding: 8px 16px;
  font-style: italic;
}

.options-bar {
  border-bottom: 3px dashed #aeceff4d;
}
</style>