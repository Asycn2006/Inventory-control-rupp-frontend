<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import GlobalModal from '@/components/common/GlobalModal.vue'
import { useModalStore } from '@/stores/modal'

const modalStore = useModalStore()

// Guarantee that no native browser alert or confirm is ever used
onMounted(() => {
  window.alert = (message) => {
    modalStore.alert({
      title: 'Notification',
      message: String(message || ''),
      type: 'info'
    })
  }
})
</script>

<template>
  <RouterView />
  <GlobalModal />
</template>
