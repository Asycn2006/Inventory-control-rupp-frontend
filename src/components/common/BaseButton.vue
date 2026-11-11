<script setup>
import { defineProps, defineEmits } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary, secondary, danger, outline
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])

const handleClick = (e) => {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<template>
  <button 
    :type="type"
    class="base-btn"
    :class="[
      `btn-${variant}`,
      { 'btn-block': block, 'btn-disabled': disabled || loading }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <Loader2 v-if="loading" class="spin icon-mr" size="18" />
    <slot></slot>
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  gap: 0.5rem;
}

.btn-primary { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
.btn-primary:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); filter: brightness(1.1); }

.btn-danger { background: linear-gradient(135deg, var(--danger), #fb923c); color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
.btn-danger:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4); filter: brightness(1.1); }

.btn-outline { background: transparent; color: var(--text-primary); border: 1px solid var(--border-color); }
.btn-outline:not(:disabled):hover { background: var(--bg-hover); border-color: var(--text-secondary); }

.btn-block { width: 100%; }
.btn-disabled { opacity: 0.6; cursor: not-allowed; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
