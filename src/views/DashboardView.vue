<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import { 
  Package, TrendingUp, AlertTriangle, Users, Box, ShoppingCart, 
  ArrowUpRight, Plus, ArrowLeftRight, CheckCircle2, Clock, Calendar, RotateCw
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const kpis = ref({})
const topProducts = ref([])
const recentTransactions = ref([])
const error = ref(null)

const supplierOrders = ref([])

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const fetchSupplierData = async () => {
  try {
    const { data } = await api.get('/purchase-orders')
    supplierOrders.value = data.data.items || data.data.rows || (Array.isArray(data.data) ? data.data : [])
    error.value = null
  } catch(err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Failed to load supplier orders.'
  } finally {
    loading.value = false
  }
}

const fetchDashboard = async () => {
  loading.value = true
  error.value = null
  if (authStore.isSupplier) {
    return fetchSupplierData()
  }
  try {
    const { data } = await api.get('/analytics/dashboard')
    if (data.success) {
      kpis.value = data.data.kpis || {}
      topProducts.value = data.data.top_products || data.data.topProducts || []
      recentTransactions.value = data.data.recent_transactions || []
      error.value = null
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load dashboard data.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}
</script>

<template>
  <div class="dashboard-page">
    
    <!-- Welcome Header & Quick Actions -->
    <div class="welcome-banner mb-6">
      <div class="banner-text">
        <h2>Hello, {{ authStore.user?.full_name || 'User' }} 👋</h2>
        <p class="subtitle flex items-center gap-2">
          <Calendar size="15" /> {{ currentDate }} &bull; 
          <span>{{ authStore.isSupplier ? 'Vendor Portal & Dispatch Overview' : 'Live Inventory & Sales Analytics' }}</span>
        </p>
      </div>

      <div class="quick-actions" v-if="!authStore.isSupplier">
        <button class="action-btn" @click="router.push('/products')">
          <Plus size="15" /> Add Product
        </button>
        <button class="action-btn" @click="router.push('/orders')">
          <ShoppingCart size="15" /> Create Order
        </button>
        <button class="action-btn outline" @click="router.push('/products')">
          <ArrowLeftRight size="15" /> Adjust Stock
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state glass-card py-6">
      <div class="spinner"></div>
      <p class="mt-4 text-center text-muted">Retrieving real-time metrics...</p>
    </div>

    <!-- Error Alert with Retry Action -->
    <div v-else-if="error" class="error-alert">
      <div class="flex items-center gap-2">
        <AlertTriangle size="18" />
        <span>{{ error }}</span>
      </div>
      <BaseButton size="sm" variant="outline" class="retry-btn" @click="fetchDashboard">
        <RotateCw size="14" /> Retry
      </BaseButton>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content animate-fade-in">
      
      <!-- ══════════════════════════════════════════════ -->
      <!-- SUPPLIER DASHBOARD VIEW                        -->
      <!-- ══════════════════════════════════════════════ -->
      <div v-if="authStore.isSupplier">
        <div class="kpi-grid">
          <div class="kpi-card glass-card">
            <div class="kpi-icon primary">
              <ShoppingCart size="24" />
            </div>
            <div class="kpi-info">
              <span class="label">Total Orders Assigned</span>
              <h3 class="value">{{ supplierOrders.length }}</h3>
            </div>
          </div>

          <div class="kpi-card glass-card">
            <div class="kpi-icon warning">
              <Clock size="24" />
            </div>
            <div class="kpi-info">
              <span class="label">Pending Acknowledgement</span>
              <h3 class="value text-warning">{{ supplierOrders.filter(o => o.status === 'ordered').length }}</h3>
            </div>
          </div>

          <div class="kpi-card glass-card">
            <div class="kpi-icon accent">
              <CheckCircle2 size="24" />
            </div>
            <div class="kpi-info">
              <span class="label">Received / Fulfilled</span>
              <h3 class="value text-success">{{ supplierOrders.filter(o => o.status === 'received').length }}</h3>
            </div>
          </div>

          <div class="kpi-card glass-card">
            <div class="kpi-icon secondary">
              <Box size="24" />
            </div>
            <div class="kpi-info">
              <span class="label">Total Order Value</span>
              <h3 class="value font-semibold">
                {{ formatCurrency(supplierOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)) }}
              </h3>
            </div>
          </div>
        </div>
        
        <!-- Supplier Orders Summary -->
        <div class="glass-card mt-6">
          <div class="card-header flex justify-between items-center">
            <h3>Recent Purchase Orders</h3>
            <button class="btn btn-outline btn-sm" @click="router.push('/orders')">
              Manage in Orders Tab &rarr;
            </button>
          </div>
          <div class="table-responsive">
            <table v-if="supplierOrders.length > 0" class="custom-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Order Date</th>
                  <th>Warehouse</th>
                  <th class="text-right">Total Amount</th>
                  <th class="text-center">Status</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="po in supplierOrders.slice(0, 5)" :key="po.id">
                  <td class="font-medium text-secondary">{{ po.po_number }}</td>
                  <td>{{ new Date(po.order_date).toLocaleDateString() }}</td>
                  <td>{{ po.warehouse_name || 'Main Warehouse' }}</td>
                  <td class="text-right font-semibold text-primary">
                    {{ formatCurrency(po.total_amount) }}
                  </td>
                  <td class="text-center">
                    <span class="badge" :class="`badge-${po.status}`">
                      {{ po.status }}
                    </span>
                  </td>
                  <td class="text-right">
                    <button class="btn btn-outline btn-sm" @click="router.push('/orders')">
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <Package size="36" class="text-muted mb-2" />
              <p>No purchase orders assigned to your company yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════ -->
      <!-- ADMIN / SUPER ADMIN DASHBOARD VIEW             -->
      <!-- ══════════════════════════════════════════════ -->
      <div v-else>
        <!-- KPI Metrics Grid -->
        <div class="kpi-grid">
          <!-- Sales -->
          <div class="kpi-card glass-card">
            <div class="kpi-icon primary">
              <TrendingUp size="24" />
            </div>
            <div class="kpi-info">
              <span class="label">Today's Revenue</span>
              <h3 class="value">{{ formatCurrency(kpis.today_sales) }}</h3>
              <span class="subtext text-muted">Month: {{ formatCurrency(kpis.month_sales) }}</span>
            </div>
          </div>

          <!-- Total Stock Value -->
          <div class="kpi-card glass-card">
            <div class="kpi-icon secondary">
              <Box size="24" />
            </div>
            <div class="kpi-info">
              <span class="label">Total Stock Valuation</span>
              <h3 class="value">{{ formatCurrency(kpis.stock_value) }}</h3>
              <span class="subtext text-muted">Across all warehouses</span>
            </div>
          </div>

          <!-- Stock Alerts -->
          <div class="kpi-card glass-card" :class="{ 'card-alert-glow': (kpis.low_stock > 0 || kpis.out_of_stock > 0) }">
            <div class="kpi-icon danger">
              <AlertTriangle size="24" />
            </div>
            <div class="kpi-info">
              <span class="label">Stock Alerts</span>
              <h3 class="value text-danger">
                {{ kpis.low_stock || 0 }} <span class="sub-counter">Low</span> / {{ kpis.out_of_stock || 0 }} <span class="sub-counter">Out</span>
              </h3>
              <span class="subtext text-muted" @click="router.push('/products')" style="cursor: pointer;">
                Inspect inventory &rarr;
              </span>
            </div>
          </div>

          <!-- Active Orders -->
          <div class="kpi-card glass-card">
            <div class="kpi-icon accent">
              <ShoppingCart size="24" />
            </div>
            <div class="kpi-info">
              <span class="label">Pending Fulfillment</span>
              <h3 class="value">
                {{ kpis.pending_sos || 0 }} <span class="sub-counter">SO</span> / {{ kpis.pending_pos || 0 }} <span class="sub-counter">PO</span>
              </h3>
              <span class="subtext text-muted">Sales Orders / Purchase Orders</span>
            </div>
          </div>
        </div>

        <!-- Middle 2-Column Section -->
        <div class="grid-2-col mt-6">
          
          <!-- Top Selling Products -->
          <div class="glass-card table-card">
            <div class="card-header flex justify-between items-center">
              <h3>Top Selling Products</h3>
              <span class="badge badge-primary">Best Performers</span>
            </div>
            <div class="table-responsive">
              <table v-if="topProducts.length > 0" class="custom-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Product</th>
                    <th class="text-right">Units Sold</th>
                    <th class="text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, idx) in topProducts" :key="p.id">
                    <td>
                      <span class="rank-badge" :class="`rank-${idx + 1}`">
                        #{{ idx + 1 }}
                      </span>
                    </td>
                    <td>
                      <div class="font-semibold text-primary">{{ p.name }}</div>
                      <div class="text-xs text-muted">SKU: {{ p.sku }}</div>
                    </td>
                    <td class="text-right font-medium">{{ p.total_sold }} {{ p.unit || 'pcs' }}</td>
                    <td class="text-right font-semibold text-success">
                      {{ formatCurrency(p.total_revenue) }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <Package size="36" class="text-muted mb-2" />
                <p>No sales orders processed yet.</p>
              </div>
            </div>
          </div>
          
          <!-- System Master Data Overview -->
          <div class="glass-card list-card">
            <div class="card-header">
              <h3>System Overview</h3>
            </div>
            <ul class="stats-list">
              <li @click="router.push('/products')" class="clickable-stat">
                <div class="stat-left">
                  <div class="stat-icon-box bg-indigo">
                    <Package size="18" />
                  </div>
                  <div>
                    <div class="stat-label">Total Products</div>
                    <div class="stat-sub">Catalog items</div>
                  </div>
                </div>
                <span class="stat-value">{{ kpis.total_products || 0 }}</span>
              </li>

              <li @click="router.push('/settings')" class="clickable-stat">
                <div class="stat-left">
                  <div class="stat-icon-box bg-emerald">
                    <Users size="18" />
                  </div>
                  <div>
                    <div class="stat-label">Customer Accounts</div>
                    <div class="stat-sub">Active client accounts</div>
                  </div>
                </div>
                <span class="stat-value">{{ kpis.total_customers || 0 }}</span>
              </li>

              <li @click="router.push('/settings')" class="clickable-stat">
                <div class="stat-left">
                  <div class="stat-icon-box bg-amber">
                    <Users size="18" />
                  </div>
                  <div>
                    <div class="stat-label">Suppliers</div>
                    <div class="stat-sub">Active vendor partners</div>
                  </div>
                </div>
                <span class="stat-value">{{ kpis.total_suppliers || 0 }}</span>
              </li>

              <li @click="router.push('/settings')" class="clickable-stat">
                <div class="stat-left">
                  <div class="stat-icon-box bg-cyan">
                    <Box size="18" />
                  </div>
                  <div>
                    <div class="stat-label">Warehouses</div>
                    <div class="stat-sub">Storage hubs</div>
                  </div>
                </div>
                <span class="stat-value">{{ kpis.total_warehouses || 0 }}</span>
              </li>
            </ul>
          </div>

        </div>

        <!-- Recent Inventory Activity / Transactions -->
        <div class="glass-card mt-6">
          <div class="card-header flex justify-between items-center">
            <div>
              <h3>Recent Stock Transactions</h3>
              <p class="subtitle text-xs" style="margin-top: 2px;">Real-time stock movements and warehouse transfers</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="router.push('/products')">
              Open Products Directory &rarr;
            </button>
          </div>
          <div class="table-responsive">
            <table v-if="recentTransactions.length > 0" class="custom-table">
              <thead>
                <tr>
                  <th>Txn Number</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th class="text-right">Quantity</th>
                  <th>Handled By</th>
                  <th class="text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in recentTransactions" :key="t.transaction_no">
                  <td class="font-medium text-secondary code-font">{{ t.transaction_no }}</td>
                  <td>
                    <span class="badge" :class="{
                      'badge-success': t.type === 'stock_in',
                      'badge-danger': t.type === 'stock_out',
                      'badge-info': t.type === 'transfer',
                      'badge-warning': t.type === 'adjustment'
                    }">
                      {{ t.type.replace('_', ' ').toUpperCase() }}
                    </span>
                  </td>
                  <td>
                    <div class="font-semibold">{{ t.product_name }}</div>
                    <div class="text-xs text-muted">SKU: {{ t.sku }}</div>
                  </td>
                  <td>{{ t.warehouse_name }}</td>
                  <td class="text-right font-bold" :class="t.quantity > 0 ? 'text-success' : 'text-danger'">
                    {{ t.quantity > 0 ? '+' : '' }}{{ t.quantity }}
                  </td>
                  <td class="text-muted text-sm">{{ t.user_name || 'System' }}</td>
                  <td class="text-right text-muted text-sm">{{ new Date(t.created_at).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <Package size="36" class="text-muted mb-2" />
              <p>No inventory movements recorded yet.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding-bottom: 2rem;
}

.error-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.retry-btn {
  white-space: nowrap;
}

.welcome-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.welcome-banner h2 {
  font-size: 1.6rem;
  margin-bottom: 0.25rem;
}

.subtitle {
  font-size: 0.875rem;
}

.quick-actions {
  display: flex;
  gap: 0.65rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(139, 92, 246, 0.2));
  color: #c7d2fe;
  border: 1px solid rgba(99, 102, 241, 0.3);
  transition: var(--transition);
}

.action-btn:hover {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.4), rgba(139, 92, 246, 0.35));
  color: white;
  transform: translateY(-1px);
}

.action-btn.outline {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.action-btn.outline:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.kpi-card {
  display: flex;
  align-items: center;
  padding: 1.35rem;
  gap: 1.15rem;
  position: relative;
  overflow: hidden;
}

.kpi-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.15);
}

.kpi-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.kpi-icon.primary { background: linear-gradient(135deg, #4f46e5, #06b6d4); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); }
.kpi-icon.secondary { background: linear-gradient(135deg, #8b5cf6, #ec4899); box-shadow: 0 6px 16px rgba(139, 92, 246, 0.3); }
.kpi-icon.danger { background: linear-gradient(135deg, #ef4444, #f97316); box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3); }
.kpi-icon.accent { background: linear-gradient(135deg, #0ea5e9, #10b981); box-shadow: 0 6px 16px rgba(14, 165, 233, 0.3); }
.kpi-icon.warning { background: linear-gradient(135deg, #f59e0b, #eab308); box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3); }

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-info .label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.2rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-info .value {
  font-size: 1.45rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.sub-counter {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
}

.subtext {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.card-alert-glow {
  border-color: rgba(239, 68, 68, 0.3);
}

/* Two Column Layout */
.grid-2-col {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr;
  gap: 1.25rem;
}

@media (max-width: 1024px) {
  .grid-2-col {
    grid-template-columns: 1fr;
  }
}

.card-header {
  padding: 1.15rem 1.4rem;
  border-bottom: 1px solid var(--border-color);
}

.card-header h3 {
  font-size: 1.05rem;
  margin: 0;
}

/* Rank Badges */
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 800;
}

.rank-1 { background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); }
.rank-2 { background: rgba(148, 163, 184, 0.2); color: #e2e8f0; border: 1px solid rgba(148, 163, 184, 0.4); }
.rank-3 { background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.4); }

/* Stats List */
.stats-list {
  list-style: none;
  padding: 0.5rem;
}

.clickable-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: var(--transition);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.clickable-stat:hover {
  background: rgba(255, 255, 255, 0.04);
}

.clickable-stat:last-child {
  border-bottom: none;
}

.stat-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.stat-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.bg-indigo { background: rgba(79, 70, 229, 0.2); color: #818cf8; }
.bg-emerald { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.bg-amber { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.bg-cyan { background: rgba(6, 182, 212, 0.2); color: #22d3ee; }

.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-sub {
  font-size: 0.725rem;
  color: var(--text-muted);
}

.stat-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
}
</style>
