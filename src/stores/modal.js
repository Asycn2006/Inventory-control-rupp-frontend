import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false)
  const title = ref('')
  const message = ref('')
  const type = ref('info') // 'info' | 'success' | 'warning' | 'error'
  const confirmText = ref('OK')
  const cancelText = ref('Cancel')
  const showCancel = ref(false)
  const confirmVariant = ref('primary') // 'primary' | 'danger' | 'warning' | 'success'

  let resolvePromise = null

  const open = ({
    title: t = 'Notification',
    message: m = '',
    type: tp = 'info',
    confirmText: ct = 'OK',
    cancelText: cat = 'Cancel',
    showCancel: sc = false,
    confirmVariant: cv = 'primary'
  }) => {
    title.value = t
    message.value = m
    type.value = tp
    confirmText.value = ct
    cancelText.value = cat
    showCancel.value = sc
    confirmVariant.value = cv
    isOpen.value = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const alert = ({ title = 'Alert', message = '', type = 'info', confirmText = 'OK' }) => {
    return open({
      title,
      message,
      type,
      confirmText,
      showCancel: false,
      confirmVariant: type === 'error' ? 'danger' : (type === 'warning' ? 'warning' : 'primary')
    })
  }

  const showError = (titleOrMsg, maybeMsg) => {
    const t = maybeMsg ? titleOrMsg : 'Error'
    const m = maybeMsg || titleOrMsg
    return alert({ title: t, message: m, type: 'error', confirmText: 'Understood' })
  }

  const showSuccess = (titleOrMsg, maybeMsg) => {
    const t = maybeMsg ? titleOrMsg : 'Success'
    const m = maybeMsg || titleOrMsg
    return alert({ title: t, message: m, type: 'success', confirmText: 'OK' })
  }

  const showWarning = (titleOrMsg, maybeMsg) => {
    const t = maybeMsg ? titleOrMsg : 'Attention'
    const m = maybeMsg || titleOrMsg
    return alert({ title: t, message: m, type: 'warning', confirmText: 'Acknowledge' })
  }

  const confirm = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning',
    confirmVariant = 'danger'
  }) => {
    return open({
      title,
      message,
      type,
      confirmText,
      cancelText,
      showCancel: true,
      confirmVariant
    })
  }

  const handleConfirm = () => {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
  }

  const handleCancel = () => {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  return {
    isOpen,
    title,
    message,
    type,
    confirmText,
    cancelText,
    showCancel,
    confirmVariant,
    open,
    alert,
    showError,
    showSuccess,
    showWarning,
    confirm,
    handleConfirm,
    handleCancel
  }
})

