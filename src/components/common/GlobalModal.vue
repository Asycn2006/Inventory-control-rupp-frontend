<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useModalStore } from '@/stores/modal'
import { 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-vue-next'
import BaseButton from '@/components/common/BaseButton.vue'

const modal = useModalStore()

const iconComponent = computed(() => {
  switch (modal.type) {
    case 'error':
      return AlertCircle
    case 'success':
      return CheckCircle2
    case 'warning':
      return AlertTriangle
    default:
      return Info
  }
})

const iconClass = computed(() => {
  return `modal-icon--${modal.type}`
})

const handleKeydown = (e) => {
  if (!modal.isOpen) return
  if (e.key === 'Escape') {
    modal.handleCancel()
  } else if (e.key === 'Enter' && !modal.showCancel) {
    modal.handleConfirm()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="global-modal">
      <div 
        v-if="modal.isOpen" 
        class="global-modal-overlay" 
        @click.self="modal.showCancel ? modal.handleCancel() : modal.handleConfirm()"
      >
        <div class="global-modal-card glass-card">
          <!-- Close button -->
          <button 
            class="modal-close-btn" 
            aria-label="Close dialog"
            @click="modal.showCancel ? modal.handleCancel() : modal.handleConfirm()"
          >
            <X :size="18" />
          </button>

          <!-- Icon Header -->
          <div class="modal-status-badge" :class="iconClass">
            <component :is="iconComponent" :size="32" />
          </div>

          <!-- Content -->
          <div class="modal-content">
            <h3 class="modal-title">{{ modal.title }}</h3>
            <p class="modal-message">{{ modal.message }}</p>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <BaseButton 
              v-if="modal.showCancel" 
              variant="outline" 
              class="action-btn"
              @click="modal.handleCancel"
            >
              {{ modal.cancelText }}
            </BaseButton>
            <BaseButton 
              :variant="modal.confirmVariant" 
              class="action-btn"
              @click="modal.handleConfirm"
            >
              {{ modal.confirmText }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.global-modal-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(8, 12, 22, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.global-modal-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: #111827;
  background: linear-gradient(145deg, #131b2e 0%, #0d121f 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 2rem 1.75rem 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.modal-status-badge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  position: relative;
}

.modal-icon--error {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.25);
}

.modal-icon--success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
}

.modal-icon--warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.25);
}

.modal-icon--info {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.25);
}

.modal-content {
  width: 100%;
  margin-bottom: 1.75rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: -0.015em;
}

.modal-message {
  font-size: 0.925rem;
  color: var(--text-secondary);
  line-height: 1.55;
  white-space: pre-line;
  word-break: break-word;
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
}

.action-btn {
  flex: 1;
  min-width: 110px;
}

/* Transitions */
.global-modal-enter-active,
.global-modal-leave-active {
  transition: opacity 0.25s ease;
}

.global-modal-enter-from,
.global-modal-leave-to {
  opacity: 0;
}

.global-modal-enter-from .global-modal-card {
  transform: scale(0.92) translateY(10px);
}

.global-modal-leave-to .global-modal-card {
  transform: scale(0.95) translateY(-10px);
}

@keyframes modalPop {
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>

