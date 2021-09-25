<template>
  <div class="announce-bar">
    <img src="/notice.png" />
    <div class="item-notice-content">
      <ul class="list">
        <li
          v-for="(item, index) in ulist"
          :key="item.id"
          :class="!index && play ? 'toUp' : ''"
        >{{ item.msg }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { formatNumber } from '@/utils/common'

export default {
  mounted() {
    setInterval(this.startPlay, 5000)
  },
  data() {
    return {
      formatNumber,
      ulist: [
        { msg: `Player 0645... .04b68 won ${formatNumber(1234)} USDT in arena #12345` },
        { msg: `Player 1234... .v04g1 won ${formatNumber(233)} USDT in arena #43210` },
        { msg: `Player 0xbz... .gg445 won ${formatNumber(666)} USDT in arena #44221` },
        { msg: `Player 6543... .ds234 won ${formatNumber(888)} USDT in arena #12111` }
      ],
      play: false
    }
  },
  methods: {
    startPlay() {
      let that = this
      that.play = true
      setTimeout(() => {
        that.ulist.push(that.ulist[0])
        that.ulist.shift()
        that.play = false
      }, 5000)
    }
  }
}
</script>
<style scoped>
.item-notice-content {
  overflow: hidden;
  width: 400px;
  background: #fef8de;
  display: flex;
  align-items: center;
}

.announce-bar {
  height: 40px;
  position: relative;
}

.announce-bar img {
  position: absolute;
  z-index: 2;
  height: 33px;
  width: 33px;
}

.announce-bar div {
  padding: 2px 12px;
  z-index: 1;
  position: absolute;
  top: 4px;
  left: 30px;
  background: #fef8dee6;
  border-radius: 0px 10px 10px 0px;
}

.toUp {
  margin-left: -433px;
  transition: all 5s;
}

ul {
  display: flex;
}

li {
  width: 433px;
  text-align: left;
  white-space: nowrap;
}

.list {
  list-style: none;
  text-align: center;
  padding: 0;
  margin: 0;
  align-items: center;
}
</style>