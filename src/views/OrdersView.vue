<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import { 
  Plus, Eye, CheckCircle, Search, AlertCircle, ShoppingBag, 
  Trash2, ShoppingCart, TrendingUp, Truck, Printer, X
} from 'lucide-vue-next'

const authStore = useAuthStore()
const modalStore = useModalStore()

// Active order view: 'purchase' or 'sales'
const orderTab = ref('purchase')
const orders = ref([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')

// Dropdowns
const suppliers = ref([])
const customers = ref([])
const warehouses = ref([])
const products = ref([])

// Create Order Modal state
const showCreateModal = ref(false)
const createLoading = ref(false)
const createError = ref('')

// Forms
const poForm = ref({
  supplier_id: '',
  warehouse_id: '',
  order_date: new Date().toISOString().split('T')[0],
  expected_date: '',
  notes: '',
  items: []
})

const soForm = ref({
  customer_id: '',
  warehouse_id: '',
  order_date: new Date().toISOString().split('T')[0],
  delivery_date: '',
  discount: 0,
  notes: '',
  items: []
})

// Details Modal
const showDetailsModal = ref(false)
const selectedOrder = ref(null)
const detailsLoading = ref(false)

// ── Fetchers ──────────────────────────────────────────
const fetchOrders = async () => {
  loading.value = true
  try {
    const endpoint = orderTab.value === 'purchase' ? '/purchase-orders' : '/sales-orders'
    const res = await api.get(endpoint, {
      params: {
        search: searchQuery.value || null,
        status: statusFilter.value || null
      }
    })
    orders.value = res.data.data.items || res.data.data.rows || (Array.isArray(res.data.data) ? res.data.data : [])
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

const fetchMetadata = async () => {
  if (authStore.isSupplier) return
  try {
    const [supRes, custRes, whRes, prodRes] = await Promise.all([
      api.get('/suppliers/all'),
      api.get('/customers/all'),
      api.get('/warehouses/all'),
      api.get('/products/all')
    ])
    if (supRes.data.success) suppliers.value = supRes.data.data || []
    if (custRes.data.success) customers.value = custRes.data.data || []
    if (whRes.data.success) warehouses.value = whRes.data.data || []
    if (prodRes.data.success) products.value = prodRes.data.data || []
  } catch (err) {
    console.error('Failed to fetch metadata', err)
  }
}

const switchOrderTab = (tab) => {
  orderTab.value = tab
  searchQuery.value = ''
  statusFilter.value = ''
  fetchOrders()
}

// ── Create Modal Handlers ─────────────────────────────
const openCreateModal = () => {
  createError.value = ''
  if (orderTab.value === 'purchase') {
    poForm.value = {
      supplier_id: suppliers.value[0]?.id || '',
      warehouse_id: warehouses.value[0]?.id || '',
      order_date: new Date().toISOString().split('T')[0],
      expected_date: '',
      notes: '',
      items: [
        { product_id: products.value[0]?.id || '', quantity_ordered: 1, unit_cost: Number(products.value[0]?.cost_price) || 0 }
      ]
    }
  } else {
    soForm.value = {
      customer_id: customers.value[0]?.id || '',
      warehouse_id: warehouses.value[0]?.id || '',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      discount: 0,
      notes: '',
      items: [
        { product_id: products.value[0]?.id || '', quantity: 1, unit_price: Number(products.value[0]?.selling_price) || 0 }
      ]
    }
  }
  showCreateModal.value = true
}

const addItemRow = () => {
  if (orderTab.value === 'purchase') {
    poForm.value.items.push({
      product_id: products.value[0]?.id || '',
      quantity_ordered: 1,
      unit_cost: Number(products.value[0]?.cost_price) || 0
    })
  } else {
    soForm.value.items.push({
      product_id: products.value[0]?.id || '',
      quantity: 1,
      unit_price: Number(products.value[0]?.selling_price) || 0
    })
  }
}

const removeItemRow = (idx) => {
  const currentItems = orderTab.value === 'purchase' ? poForm.value.items : soForm.value.items
  if (currentItems.length > 1) {
    currentItems.splice(idx, 1)
  }
}

const onProductSelect = (idx) => {
  if (orderTab.value === 'purchase') {
    const p = products.value.find(item => item.id === Number(poForm.value.items[idx].product_id))
    if (p) poForm.value.items[idx].unit_cost = Number(p.cost_price) || 0
  } else {
    const p = products.value.find(item => item.id === Number(soForm.value.items[idx].product_id))
    if (p) soForm.value.items[idx].unit_price = Number(p.selling_price) || 0
  }
}

const computedSubtotal = computed(() => {
  if (orderTab.value === 'purchase') {
    return poForm.value.items.reduce((sum, item) => {
      return sum + (Number(item.quantity_ordered) || 0) * (Number(item.unit_cost) || 0)
    }, 0)
  } else {
    return soForm.value.items.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
    }, 0)
  }
})

const computedOrderTotal = computed(() => {
  if (orderTab.value === 'purchase') {
    return computedSubtotal.value
  } else {
    const subtotal = computedSubtotal.value
    const discount = Number(soForm.value.discount) || 0
    return Math.max(0, subtotal - (subtotal * discount / 100))
  }
})

const handleCreateOrder = async () => {
  createLoading.value = true
  createError.value = ''
  try {
    if (orderTab.value === 'purchase') {
      const payload = {
        supplier_id: Number(poForm.value.supplier_id),
        warehouse_id: Number(poForm.value.warehouse_id),
        order_date: poForm.value.order_date,
        expected_date: poForm.value.expected_date || null,
        notes: poForm.value.notes?.trim() || null,
        items: poForm.value.items.map(item => ({
          product_id: Number(item.product_id),
          quantity_ordered: Number(item.quantity_ordered),
          unit_cost: Number(item.unit_cost)
        }))
      }
      await api.post('/purchase-orders', payload)
    } else {
      const payload = {
        customer_id: Number(soForm.value.customer_id),
        warehouse_id: Number(soForm.value.warehouse_id),
        order_date: soForm.value.order_date,
        delivery_date: soForm.value.delivery_date || null,
        discount: Number(soForm.value.discount) || 0,
        notes: soForm.value.notes?.trim() || null,
        items: soForm.value.items.map(item => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price)
        }))
      }
      await api.post('/sales-orders', payload)
    }

    showCreateModal.value = false
    await fetchOrders()
    modalStore.showSuccess(
      orderTab.value === 'purchase' ? 'Purchase Order Created' : 'Sales Order Created',
      'The order has been successfully saved in the system.'
    )
  } catch (err) {
    createError.value = err.response?.data?.message || 'Failed to submit order.'
  } finally {
    createLoading.value = false
  }
}

const viewOrderDetails = async (orderId) => {
  detailsLoading.value = true
  showDetailsModal.value = true
  try {
    const endpoint = orderTab.value === 'purchase' ? `/purchase-orders/${orderId}` : `/sales-orders/${orderId}`
    const res = await api.get(endpoint)
    if (res.data.success) {
      selectedOrder.value = res.data.data
    }
  } catch (err) {
    console.error('Failed to load order details', err)
    modalStore.showError('Error Loading Details', err.response?.data?.message || 'Failed to retrieve order details.')
  } finally {
    detailsLoading.value = false
  }
}

const updateStatus = async (id, newStatus) => {
  if (newStatus === 'cancelled') {
    const confirmed = await modalStore.confirm({
      title: 'Cancel Order',
      message: `Are you sure you want to cancel this order? This action cannot be reversed.`,
      confirmText: 'Yes, Cancel Order',
      confirmVariant: 'danger'
    })
    if (!confirmed) return
  }

  try {
    const endpoint = orderTab.value === 'purchase' ? `/purchase-orders/${id}/status` : `/sales-orders/${id}/status`
    await api.put(endpoint, { status: newStatus })
    await fetchOrders()
    if (selectedOrder.value && selectedOrder.value.id === id) {
      selectedOrder.value.status = newStatus
    }
    modalStore.showSuccess('Status Updated', `Order status was successfully changed to ${newStatus.toUpperCase()}.`)
  } catch (error) {
    modalStore.showError('Update Failed', error.response?.data?.message || 'Error updating status.')
  }
}

const getAvailableTransitions = (order) => {
  if (!order) return []
  if (orderTab.value === 'purchase') {
    if (order.status === 'draft') return [{ value: 'ordered', label: 'Mark Ordered' }, { value: 'cancelled', label: 'Cancel' }]
    if (order.status === 'ordered') return [{ value: 'received', label: 'Mark Received' }, { value: 'partial', label: 'Mark Partial' }, { value: 'cancelled', label: 'Cancel' }]
    if (order.status === 'partial') return [{ value: 'received', label: 'Mark Received' }, { value: 'cancelled', label: 'Cancel' }]
    return []
  } else {
    if (order.status === 'draft') return [{ value: 'confirmed', label: 'Confirm' }, { value: 'cancelled', label: 'Cancel' }]
    if (order.status === 'confirmed') return [{ value: 'shipped', label: 'Ship' }, { value: 'cancelled', label: 'Cancel' }]
    if (order.status === 'shipped') return [{ value: 'delivered', label: 'Deliver' }, { value: 'cancelled', label: 'Cancel' }]
    return []
  }
}

const getStatusBadgeClass = (status) => {
  const map = {
    draft: 'badge-draft',
    ordered: 'badge-ordered',
    confirmed: 'badge-confirmed',
    shipped: 'badge-info',
    partial: 'badge-partial',
    delivered: 'badge-success',
    received: 'badge-success',
    cancelled: 'badge-danger'
  }
  return map[status] || 'badge-staff'
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

onMounted(() => {
  fetchOrders()
  fetchMetadata()
})
</script>

<template>
  <div class="page-container">
    
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div>
        <h2>{{ authStore.isSupplier ? 'My Purchase Orders' : 'Order Management & Fulfillment' }}</h2>
        <p class="subtitle">
          {{ authStore.isSupplier ? 'Review purchase orders assigned to your supplier company and acknowledge fulfillment' : 'Oversee vendor purchase orders, inventory arrivals, and customer sales order dispatches' }}
        </p>
      </div>
      <BaseButton v-if="!authStore.isSupplier" variant="primary" @click="openCreateModal">
        <Plus size="18" /> {{ orderTab === 'purchase' ? 'Create Purchase Order' : 'Create Sales Order' }}
      </BaseButton>
    </div>

    <!-- Order Tabs (Purchase vs Sales) -->
    <div v-if="!authStore.isSupplier" class="tabs-bar mb-4">
      <button 
        class="tab-btn" 
        :class="{ active: orderTab === 'purchase' }" 
        @click="switchOrderTab('purchase')"
      >
        <ShoppingCart size="18" /> Supplier Purchase Orders
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: orderTab === 'sales' }" 
        @click="switchOrderTab('sales')"
      >
        <TrendingUp size="18" /> Customer Sales Orders
      </button>
    </div>

    <!-- Main Orders Card -->
    <div class="glass-card list-wrapper">
      
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-box input-wrapper">
          <Search class="input-icon" size="18" />
          <input 
            type="text" 
            v-model="searchQuery" 
            :placeholder="orderTab === 'purchase' ? 'Search PO number, supplier name...' : 'Search SO number, customer name...'" 
            @input="fetchOrders"
          />
        </div>

        <select class="filter-select" v-model="statusFilter" @change="fetchOrders">
          <option value="">All Statuses</option>
          <template v-if="orderTab === 'purchase'">
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="partial">Partial</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </template>
          <template v-else>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </template>
        </select>

        <span class="results-count text-muted text-sm ml-auto">
          Total: <strong>{{ orders.length }}</strong> orders
        </span>
      </div>

      <!-- Orders Table -->
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Order Date</th>
              <th v-if="orderTab === 'purchase' && !authStore.isSupplier">Supplier</th>
              <th v-if="orderTab === 'sales'">Customer</th>
              <th>Warehouse</th>
              <th class="text-right">Total Amount</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="orderTab === 'purchase' && authStore.isSupplier ? 6 : 8" class="text-center text-muted py-6">
                <div class="spinner mb-2"></div>
                <p>Loading order data...</p>
              </td>
            </tr>
            <tr v-else-if="orders.length === 0">
              <td :colspan="orderTab === 'purchase' && authStore.isSupplier ? 6 : 8" class="text-center text-muted py-6">
                <ShoppingBag size="36" class="mb-2 text-muted" />
                <p>No orders found matching your criteria.</p>
              </td>
            </tr>
            <tr v-else v-for="order in orders" :key="order.id">
              <!-- Order ID -->
              <td>
                <span class="order-id-tag code-font">
                  {{ orderTab === 'purchase' ? order.po_number : order.so_number }}
                </span>
              </td>

              <!-- Date -->
              <td>{{ new Date(order.order_date).toLocaleDateString() }}</td>

              <!-- Supplier -->
              <td v-if="orderTab === 'purchase' && !authStore.isSupplier">
                <span class="font-semibold text-secondary">{{ order.supplier_name }}</span>
                <div v-if="order.supplier_code" class="text-xs text-muted">{{ order.supplier_code }}</div>
              </td>

              <!-- Customer -->
              <td v-if="orderTab === 'sales'">
                <span class="font-semibold text-secondary">{{ order.customer_name }}</span>
                <div v-if="order.customer_code" class="text-xs text-muted">{{ order.customer_code }}</div>
              </td>

              <!-- Warehouse -->
              <td>
                <span class="badge badge-staff">
                  {{ order.warehouse_name || 'Main Warehouse' }}
                </span>
              </td>

              <!-- Total Amount -->
              <td class="text-right font-bold text-success">
                {{ formatCurrency(order.total_amount) }}
              </td>

              <!-- Status -->
              <td class="text-center">
                <span class="badge" :class="getStatusBadgeClass(order.status)">
                  {{ order.status }}
                </span>
              </td>

              <!-- Actions -->
              <td class="text-right action-cells">
                <button class="icon-btn" title="View Order Breakdown" @click="viewOrderDetails(order.id)">
                  <Eye size="15" />
                </button>

                <!-- Supplier PO Action -->
                <BaseButton 
                  v-if="authStore.isSupplier && order.status === 'ordered'" 
                  variant="primary" 
                  size="sm" 
                  @click="updateStatus(order.id, 'received')"
                >
                  <CheckCircle size="14" /> Acknowledge
                </BaseButton>

                <!-- Admin Status Transitions -->
                <select 
                  v-if="!authStore.isSupplier && getAvailableTransitions(order).length > 0" 
                  class="status-dropdown" 
                  :value="order.status" 
                  @change="updateStatus(order.id, $event.target.value)"
                >
                  <option disabled :value="order.status">Status: {{ order.status }}</option>
                  <option v-for="t in getAvailableTransitions(order)" :key="t.value" :value="t.value">
                    &rarr; {{ t.label }}
                  </option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Order Modal -->
    <BaseModal 
      v-model="showCreateModal" 
      :title="orderTab === 'purchase' ? 'Create Supplier Purchase Order' : 'Create Customer Sales Order'" 
      maxWidth="840px"
    >
      <div v-if="createError" class="modal-error">
        <AlertCircle size="18" />
        <span>{{ createError }}</span>
      </div>

      <!-- Purchase Order Header Fields -->
      <div v-if="orderTab === 'purchase'" class="form-grid mb-4">
        <div class="form-group">
          <label>Supplier Vendor *</label>
          <select v-model="poForm.supplier_id" required>
            <option disabled value="">Select Supplier</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }} ({{ s.code }})</option>
          </select>
        </div>

        <div class="form-group">
          <label>Destination Warehouse *</label>
          <select v-model="poForm.warehouse_id" required>
            <option disabled value="">Select Warehouse</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }} ({{ w.code }})</option>
          </select>
        </div>

        <div class="form-group">
          <label>Order Date *</label>
          <input type="date" v-model="poForm.order_date" required />
        </div>

        <div class="form-group">
          <label>Expected Arrival Date</label>
          <input type="date" v-model="poForm.expected_date" />
        </div>

        <div class="form-group full-width">
          <label>Shipment Notes & Terms</label>
          <input type="text" v-model="poForm.notes" placeholder="Order instructions or shipment notes" />
        </div>
      </div>

      <!-- Sales Order Header Fields -->
      <div v-else class="form-grid mb-4">
        <div class="form-group">
          <label>Customer Client *</label>
          <select v-model="soForm.customer_id" required>
            <option disabled value="">Select Customer</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.code }})</option>
          </select>
        </div>

        <div class="form-group">
          <label>Fulfillment Warehouse *</label>
          <select v-model="soForm.warehouse_id" required>
            <option disabled value="">Select Warehouse</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }} ({{ w.code }})</option>
          </select>
        </div>

        <div class="form-group">
          <label>Order Date *</label>
          <input type="date" v-model="soForm.order_date" required />
        </div>

        <div class="form-group">
          <label>Estimated Delivery Date</label>
          <input type="date" v-model="soForm.delivery_date" />
        </div>

        <div class="form-group">
          <label>Discount Rate (%)</label>
          <input type="number" min="0" max="100" v-model="soForm.discount" />
        </div>

        <div class="form-group">
          <label>Delivery Instructions</label>
          <input type="text" v-model="soForm.notes" placeholder="Delivery contact or address details" />
        </div>
      </div>

      <!-- Line items Table -->
      <div class="line-items-section mt-4">
        <div class="flex justify-between items-center mb-2">
          <h4>Order Line Items</h4>
          <button type="button" class="btn btn-outline btn-sm" @click="addItemRow">
            <Plus size="14" /> Add Another Item
          </button>
        </div>

        <div class="line-items-card">
          <table class="line-table">
            <thead>
              <tr>
                <th>Product</th>
                <th width="120">Quantity</th>
                <th width="140">{{ orderTab === 'purchase' ? 'Unit Cost ($)' : 'Unit Price ($)' }}</th>
                <th width="130" class="text-right">Line Total</th>
                <th width="40"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in (orderTab === 'purchase' ? poForm.items : soForm.items)" :key="idx">
                <td>
                  <select v-model="item.product_id" @change="onProductSelect(idx)">
                    <option v-for="p in products" :key="p.id" :value="p.id">
                      {{ p.sku }} &bull; {{ p.name }}
                    </option>
                  </select>
                </td>
                <td>
                  <input type="number" min="1" v-model="item[orderTab === 'purchase' ? 'quantity_ordered' : 'quantity']" />
                </td>
                <td>
                  <input type="number" step="0.01" min="0" v-model="item[orderTab === 'purchase' ? 'unit_cost' : 'unit_price']" />
                </td>
                <td class="text-right font-bold text-success">
                  {{ formatCurrency(
                    (Number(item[orderTab === 'purchase' ? 'quantity_ordered' : 'quantity']) || 0) * 
                    (Number(item[orderTab === 'purchase' ? 'unit_cost' : 'unit_price']) || 0)
                  ) }}
                </td>
                <td class="text-center">
                  <button 
                    type="button" 
                    class="icon-btn delete" 
                    @click="removeItemRow(idx)" 
                    :disabled="(orderTab === 'purchase' ? poForm.items : soForm.items).length <= 1"
                  >
                    <Trash2 size="15" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Financial Calculation Breakdown -->
          <div class="order-summary-box">
            <div class="summary-line" v-if="orderTab === 'sales' && soForm.discount > 0">
              <span>Gross Subtotal:</span>
              <span>{{ formatCurrency(computedSubtotal) }}</span>
            </div>
            <div class="summary-line text-warning" v-if="orderTab === 'sales' && soForm.discount > 0">
              <span>Discount ({{ soForm.discount }}%):</span>
              <span>-{{ formatCurrency(computedSubtotal * Number(soForm.discount) / 100) }}</span>
            </div>
            <div class="summary-line total-line">
              <span>Net Order Value:</span>
              <strong class="text-success">{{ formatCurrency(computedOrderTotal) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" @click="showCreateModal = false">Cancel</BaseButton>
        <BaseButton variant="primary" :loading="createLoading" @click="handleCreateOrder">
          Submit & Place Order
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Order Details Modal (Invoice Breakdown) -->
    <BaseModal 
      v-model="showDetailsModal" 
      :title="`Order Sheet: ${orderTab === 'purchase' ? selectedOrder?.po_number : selectedOrder?.so_number || ''}`" 
      maxWidth="740px"
    >
      <div v-if="detailsLoading" class="text-center py-6 text-muted">
        <div class="spinner mb-2"></div>
        <p>Loading order invoice...</p>
      </div>
      <div v-else-if="selectedOrder" class="details-invoice">
        
        <!-- Metadata Header -->
        <div class="invoice-meta-grid">
          <div>
            <span class="meta-label">Reference Number:</span>
            <span class="meta-val font-bold code-font text-primary">{{ orderTab === 'purchase' ? selectedOrder.po_number : selectedOrder.so_number }}</span>
          </div>

          <div v-if="orderTab === 'purchase'">
            <span class="meta-label">Supplier Vendor:</span>
            <span class="meta-val font-semibold">{{ selectedOrder.supplier_name }}</span>
          </div>
          <div v-else>
            <span class="meta-label">Customer Client:</span>
            <span class="meta-val font-semibold">{{ selectedOrder.customer_name }}</span>
          </div>

          <div>
            <span class="meta-label">Fulfillment Warehouse:</span>
            <span class="meta-val">{{ selectedOrder.warehouse_name }}</span>
          </div>

          <div>
            <span class="meta-label">Order Date:</span>
            <span class="meta-val">{{ new Date(selectedOrder.order_date).toLocaleDateString() }}</span>
          </div>

          <div>
            <span class="meta-label">Lifecycle Status:</span>
            <span class="badge ml-2" :class="getStatusBadgeClass(selectedOrder.status)">
              {{ selectedOrder.status }}
            </span>
          </div>
        </div>

        <!-- Line items -->
        <h4 class="mt-6 mb-2">Product Line Items</h4>
        <div class="line-items-card">
          <table class="line-table">
            <thead>
              <tr>
                <th>Product Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">{{ orderTab === 'purchase' ? 'Unit Cost' : 'Unit Price' }}</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in selectedOrder.items || []" :key="it.id">
                <td>
                  <div class="font-semibold">{{ it.product_name }}</div>
                  <div class="text-xs text-muted code-font">SKU: {{ it.sku }}</div>
                </td>
                <td class="text-right font-medium">{{ it.quantity_ordered || it.quantity }}</td>
                <td class="text-right text-muted">{{ formatCurrency(it.unit_cost || it.unit_price) }}</td>
                <td class="text-right font-bold text-success">
                  {{ formatCurrency((it.quantity_ordered || it.quantity) * (it.unit_cost || it.unit_price)) }}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="order-summary-box">
            <div class="summary-line total-line">
              <span>Total Grand Amount:</span>
              <strong class="text-success" style="font-size: 1.25rem;">
                {{ formatCurrency(selectedOrder.total_amount) }}
              </strong>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div v-if="authStore.isSupplier && selectedOrder.status === 'ordered'" class="mt-6 flex justify-end">
          <BaseButton variant="primary" @click="updateStatus(selectedOrder.id, 'received')">
            <CheckCircle size="16" /> Acknowledge Shipment & Mark Received
          </BaseButton>
        </div>

        <div v-else-if="!authStore.isSupplier && getAvailableTransitions(selectedOrder).length > 0" class="mt-6 flex justify-end gap-2">
          <BaseButton 
            v-for="t in getAvailableTransitions(selectedOrder)" 
            :key="t.value" 
            :variant="t.value === 'cancelled' ? 'outline' : 'primary'"
            size="sm"
            @click="updateStatus(selectedOrder.id, t.value)"
          >
            {{ t.label }}
          </BaseButton>
        </div>

      </div>
    </BaseModal>

  </div>
</template>

<style scoped>
.page-container {
  padding-bottom: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.order-id-tag {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
}

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition);
}

.tab-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tab-btn.active {
  background: rgba(79, 70, 229, 0.18);
  color: #a5b4fc;
  border-color: rgba(99, 102, 241, 0.35);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.full-width {
  grid-column: span 2;
}

/* Line items Card */
.line-items-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.line-table {
  width: 100%;
  border-collapse: collapse;
}

.line-table th {
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
  text-align: left;
}

.line-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: middle;
}

.line-table input, .line-table select {
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
}

.order-summary-box {
  padding: 1rem 1.25rem;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.summary-line {
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
}

.total-line {
  font-size: 1.1rem;
  font-weight: 700;
  padding-top: 0.35rem;
  border-top: 1px solid var(--border-color);
}

/* Details Invoice */
.invoice-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.meta-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 2px;
  font-weight: 600;
}

.meta-val {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.ml-auto {
  margin-left: auto;
}
</style>
