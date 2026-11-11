<script setup>
import { inject, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Bell, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const lowStockAlerts = inject('lowStockAlerts', ref([]))
const showAlertsDropdown = ref(false)

const alertCount = computed(() => lowStockAlerts.value?.length || 0)

const toggleAlerts = () => {
  showAlertsDropdown.value = !showAlertsDropdown.value
}

const goToProducts = () => {
  showAlertsDropdown.value = false
  router.push('/products')
}
</script>

<template>
  <header class="top-header glass-card">
    <div class="header-left">
      <h2 class="page-title">{{ $route.name }}</h2>
    </div>

    <div class="header-actions">
      <!-- Low Stock Alerts Notification Bell -->
      <div class="notifications-wrapper">
        <button 
          class="icon-button notification-btn" 
          :class="{ 'has-alerts': alertCount > 0 }"
          @click="toggleAlerts"
          title="Stock Alerts"
        >
          <Bell size="20" />
          <span v-if="alertCount > 0" class="badge-count">{{ alertCount > 99 ? '99+' : alertCount }}</span>
        </button>

        <!-- Alerts Popover Dropdown -->
        <div v-if="showAlertsDropdown" class="alerts-dropdown glass-card animate-fade-in">
          <div class="dropdown-header">
            <div class="flex items-center gap-2">
              <AlertTriangle size="16" class="text-warning" />
              <h4>Low Stock Alerts</h4>
            </div>
            <span class="alerts-count-tag">{{ alertCount }} items</span>
          </div>

          <div class="dropdown-body">
            <div v-if="alertCount === 0" class="empty-alerts">
              <ShieldCheck size="24" class="text-success mb-2" />
              <p>All stock levels are optimal.</p>
            </div>
            <div v-else class="alerts-list">
              <div 
                v-for="p in lowStockAlerts.slice(0, 6)" 
                :key="p.id" 
                class="alert-item"
                @click="goToProducts"
              >
                <div class="alert-info">
                  <div class="alert-name">{{ p.name }}</div>
                  <div class="alert-sub">
                    <span class="sku">SKU: {{ p.sku }}</span>
                    <span class="stock text-danger">Stock: {{ p.total_stock }} / Min: {{ p.min_stock_level }}</span>
                  </div>
                </div>
                <ChevronRight size="14" class="text-muted" />
              </div>
            </div>
          </div>

          <div v-if="alertCount > 0" class="dropdown-footer">
            <button class="btn-link" @click="goToProducts">
              View all in Products catalog &rarr;
            </button>
          </div>
        </div>
      </div>

      <!-- User Profile Badge -->
      <div class="user-badge" v-if="authStore.user">
        <div class="user-avatar">
          {{ authStore.user.full_name?.charAt(0) || 'U' }}
        </div>
        <div class="user-meta">
          <span class="user-name">{{ authStore.user.full_name }}</span>
          <span class="user-role">{{ authStore.user.role?.replace('_', ' ') }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 50;
}
.page-title {
  text-transform: capitalize;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

/* Notifications Bell */
.notifications-wrapper {
  position: relative;
}
.icon-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}
.icon-button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.2);
}
.icon-button.has-alerts {
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.4);
}
.badge-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  height: 18px;
  min-width: 18px;
  padding: 0 4px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5);
}

/* Alerts Dropdown */
.alerts-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  width: 320px;
  background: rgba(20, 24, 39, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16px);
  overflow: hidden;
  z-index: 100;
}
.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-color);
}
.dropdown-header h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
}
.alerts-count-tag {
  font-size: 0.75rem;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.dropdown-body {
  max-height: 280px;
  overflow-y: auto;
}
.empty-alerts {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.15s;
}
.alert-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
.alert-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.alert-sub {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
}
.alert-sub .sku {
  color: var(--text-muted);
}
.dropdown-footer {
  padding: 0.65rem 1rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
}
.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-link:hover {
  text-decoration: underline;
}

/* User Badge */
.user-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 20px;
}
.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
}
.user-meta {
  display: flex;
  flex-direction: column;
}
.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.1;
}
.user-role {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: capitalize;
}
</style>
