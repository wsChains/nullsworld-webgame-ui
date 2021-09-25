<template>
  <top-navbar />
  <main-content />
  <footer-bar />
  <custom-modal v-model="showModal" :click-to-close="clickToClose">
    <Help v-if="contentSwitcher('help')" />
    <BuyEggs key="GlobalModal-BuyEggs" v-else-if="contentSwitcher('buyEggs')" />
    <OpenEggs key="GlobalModal-OpenEggs" v-else-if="contentSwitcher('hatchEggs')" />
    <CreateArena key="GlobalModal-CreateArena" v-else-if="contentSwitcher('createArena')" />
    <SelectNullsArena
      key="GlobalModal-SelectNullsArena"
      v-else-if="contentSwitcher('selectNullsArena')"
    />
    <!-- <SelectNullsCombat v-else-if="contentSwitcher('selectNullsCombat')" /> -->
    <SoldOnMarket key="GlobalModal-SoldOnMarket" v-else-if="contentSwitcher('soldOnMarket')" />
  </custom-modal>
  <custom-modal v-model="showWalletConnect">
    <WalletConnect />
  </custom-modal>
  <back-top>
    <div class="ant-back-top-inner">↑</div>
  </back-top>
</template>

<script>
import { BackTop } from 'ant-design-vue'

// Layouts
import TopNavbar from './layouts/TopNavbar.vue'
import MainContent from './layouts/MainContent.vue'
import FooterBar from './layouts/FooterBar.vue'

// Modal components
import CustomModal from '@/components/Common/CustomModal.vue'


// Modal contents
import BuyEggs from '@/components/ModalContents/BuyEggs.vue'
import Help from '@/components/ModalContents/Help.vue'
import WalletConnect from '@/components/ModalContents/WalletConnect.vue'
import OpenEggs from '@/components/ModalContents/OpenEggs.vue'
import CreateArena from '@/components/ModalContents/CreateArena.vue'
import SelectNullsArena from '@/components/ModalContents/SelectNullsArena.vue'
import SelectNullsCombat from '@/components/ModalContents/SelectNullsCombat.vue'
import SoldOnMarket from '@/components/ModalContents/SoldOnMarket.vue'



export default {
  components: {
    TopNavbar,
    MainContent,
    FooterBar,
    CustomModal,
    BuyEggs,
    Help,
    WalletConnect,
    OpenEggs,
    CreateArena,
    SelectNullsArena,
    SelectNullsCombat,
    BackTop,
    SoldOnMarket
  },
  data() {
    return {
      showModal: false,
      modalContent: undefined,
      connecting: false,
      hideMessage: undefined,
      clickToClose: true,
      showWalletConnect: false,
      closingTimeout: -1
    }
  },
  watch: {
    connecting(newVal, oldVal) {
      if (newVal === oldVal) return
      if (newVal === true) this.hideMessage = this.$message.loading('Wallet is being connected, please note the authorization...', 0)
      else if (newVal === false && this.hideMessage) {
        this.hideMessage()
        this.hideMessage = false
      }
    }
  },
  async created() {
    this.wallet.init().catch(() => { })
    this.removeLoadingPage()
  },
  methods: {
    removeLoadingPage() {
      const loading = document.getElementById('nulls-world-loading')
      if (loading) {
        let classes = loading.getAttribute('class')
        loading.setAttribute('class', classes + ' fade-out')
        setTimeout(() => {
          loading.remove()
        }, 400)
      }
    },
    contentSwitcher(contentKey) {
      return this.modalContent === contentKey
    },
    openGlobalModal(contentKey) {
      if (contentKey === 'walletConnect') return this.showWalletConnect = true
      clearTimeout(this.closingTimeout)
      this.modalContent = contentKey
      this.showModal = true
    },
    closeGlobalModal() {
      clearTimeout(this.closingTimeout)
      this.closingTimeout = setTimeout(() => {
        this.modalContent = undefined
      }, 300)
      this.showModal = false
    },
    setConnecting(bool) {
      this.connecting = bool
    },
    setClickToClose(bool) {
      this.clickToClose = bool
    }
  }
}

</script>

