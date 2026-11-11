<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { 
  Plus, Search, Edit2, Trash2, Package, AlertCircle, 
  ArrowLeftRight, AlertTriangle, CheckCircle, X, TrendingUp
} from 'lucide-vue-next'

const authStore = useAuthStore()
const modalStore = useModalStore()

const products = ref([])
const loading = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('')
const stockFilter = ref('all') // 'all', 'low', 'in_stock', 'out_of_stock'

const categories = ref([])
const suppliers = ref([])
const warehouses = ref([])

// Product Modal state
const showModal = ref(false)
const isEditing = ref(false)
const editingProductId = ref(null)
const formError = ref('')
const formLoading = ref(false)

const showDeleteModal = ref(false)
const deletingProduct = ref(null)
const deleteLoading = ref(false)

const form = ref({
  sku: '',
  name: '',
  title: '',
  description: '',
  category_id: '',
  stock_in: 0,
  supplier_id: '',
  unit: 'pcs',
  cost_price: 0,
  selling_price: 0,
  min_stock_level: 5,
  max_stock_level: 100,
  barcode: ''
})

// Stock Action Modal state
const showStockModal = ref(false)
const stockMode = ref('adjustment') // 'adjustment' | 'transfer'
const stockLoading = ref(false)
const stockError = ref('')
const stockForm = ref({
  product_id: '',
  warehouse_id: '',
  from_warehouse_id: '',
  to_warehouse_id: '',
  type: 'stock_in',
  quantity: 1,
  notes: ''
})

// Computed profit margin preview in Create/Edit modal
const computedMargin = computed(() => {
  const cost = Number(form.value.cost_price) || 0
  const sell = Number(form.value.selling_price) || 0
  if (cost === 0 && sell === 0) return null
  const profit = sell - cost
  const pct = cost > 0 ? ((profit / cost) * 100).toFixed(1) : (sell > 0 ? '100' : '0')
  return { profit, pct, isNegative: profit < 0 }
})

// Client filtered list
const filteredProducts = computed(() => {
  let list = products.value

  if (stockFilter.value === 'low') {
    list = list.filter(p => (p.total_stock || 0) <= (p.min_stock_level || 0) && (p.total_stock || 0) > 0)
  } else if (stockFilter.value === 'out_of_stock') {
    list = list.filter(p => (p.total_stock || 0) <= 0)
  } else if (stockFilter.value === 'in_stock') {
    list = list.filter(p => (p.total_stock || 0) > (p.min_stock_level || 0))
  }

  return list
})

// Fetch products
const fetchProducts = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/products', {
      params: { search: searchQuery.value, category_id: categoryFilter.value || null }
    })
    if (data.success) {
      products.value = data.data.items || data.data.rows || (Array.isArray(data.data) ? data.data : [])
    }
  } catch (err) {
    console.error('Failed to fetch products', err)
  } finally {
    loading.value = false
  }
}

// Fetch categories
const fetchCategories = async () => {
  try {
    const { data } = await api.get('/categories/all')
    if (data.success) categories.value = data.data || []
  } catch (err) {
    console.error('Failed to fetch categories', err)
  }
}

// Fetch suppliers
const fetchSuppliers = async () => {
  if (authStore.isSupplier) return
  try {
    const { data } = await api.get('/suppliers/all')
    if (data.success) suppliers.value = data.data || []
  } catch (err) {
    console.error('Failed to fetch suppliers', err)
  }
}

// Fetch warehouses
const fetchWarehouses = async () => {
  if (authStore.isSupplier) return
  try {
    const { data } = await api.get('/warehouses/all')
    if (data.success) warehouses.value = data.data || []
  } catch (err) {
    console.error('Failed to fetch warehouses', err)
  }
}

onMounted(() => {
  fetchCategories()
  fetchSuppliers()
  fetchWarehouses()
  fetchProducts()
})

const handleSearch = () => {
  fetchProducts()
}

const clearSearch = () => {
  searchQuery.value = ''
  fetchProducts()
}

const openCreateModal = () => {
  isEditing.value = false
  editingProductId.value = null
  formError.value = ''
  form.value = {
    sku: '',
    name: '',
    title: '',
    description: '',
    category_id: categories.value[0]?.id || '',
    stock_in: 0,
    supplier_id: suppliers.value[0]?.id || null,
    unit: 'pcs',
    cost_price: 0,
    selling_price: 0,
    min_stock_level: 5,
    max_stock_level: 100,
    barcode: ''
  }
  showModal.value = true
}

const openEditModal = (p) => {
  isEditing.value = true
  editingProductId.value = p.id
  formError.value = ''
  form.value = {
    sku: p.sku || '',
    name: p.name || '',
    title: p.description || '',
    description: p.description || '',
    category_id: p.category_id || '',
    stock_in: p.total_stock || 0,
    supplier_id: p.supplier_id || null,
    unit: p.unit || 'pcs',
    cost_price: Number(p.cost_price) || 0,
    selling_price: Number(p.selling_price) || 0,
    min_stock_level: p.min_stock_level ?? 5,
    max_stock_level: p.max_stock_level ?? 100,
    barcode: p.barcode || ''
  }
  showModal.value = true
}

const handleSave = async () => {
  formLoading.value = true
  formError.value = ''
  try {
    const cleanPrefix = (form.value.name || 'PRD').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'PRD'
    const generatedSku = form.value.sku?.trim() || `${cleanPrefix}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`

    const payload = {
      sku: generatedSku.toUpperCase(),
      name: form.value.name?.trim(),
      description: form.value.title?.trim() || form.value.description?.trim() || null,
      category_id: Number(form.value.category_id),
      supplier_id: form.value.supplier_id ? Number(form.value.supplier_id) : null,
      unit: form.value.unit?.trim() || 'pcs',
      cost_price: Number(form.value.cost_price) || 0,
      selling_price: Number(form.value.selling_price) || 0,
      min_stock_level: Number(form.value.min_stock_level) || 0,
      max_stock_level: Number(form.value.max_stock_level) || 100,
      barcode: form.value.barcode?.trim() || null
    }

    if (isEditing.value) {
      await api.put(`/products/${editingProductId.value}`, payload)
    } else {
      const res = await api.post('/products', payload)
      const newId = res.data?.data?.id
      
      const initialStock = Number(form.value.stock_in) || 0
      if (newId && initialStock > 0) {
        try {
          const defaultWarehouseId = warehouses.value[0]?.id || 1
          await api.post('/stock-transactions/adjustment', {
            product_id: newId,
            warehouse_id: defaultWarehouseId,
            type: 'stock_in',
            quantity: initialStock,
            notes: 'Initial stock in on product creation'
          })
        } catch (stockErr) {
          console.warn('Initial stock in failed:', stockErr)
        }
      }
    }

    showModal.value = false
    await fetchProducts()
    modalStore.showSuccess(
      isEditing.value ? 'Product Updated' : 'Product Created',
      `Product "${form.value.name}" has been saved.`
    )
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to save product.'
  } finally {
    formLoading.value = false
  }
}

const confirmDelete = (p) => {
  deletingProduct.value = p
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!deletingProduct.value) return
  deleteLoading.value = true
  const productName = deletingProduct.value.name
  try {
    await api.delete(`/products/${deletingProduct.value.id}`)
    showDeleteModal.value = false
    deletingProduct.value = null
    await fetchProducts()
    modalStore.showSuccess('Product Deleted', `"${productName}" has been removed from the catalog.`)
  } catch (err) {
    showDeleteModal.value = false
    modalStore.showError('Delete Failed', err.response?.data?.message || 'Failed to delete product. It may have existing transaction records.')
  } finally {
    deleteLoading.value = false
  }
}

// ── Stock Adjustments & Transfers ─────────────────────
const openStockModal = (preselectedProduct = null) => {
  stockError.value = ''
  stockMode.value = 'adjustment'
  stockForm.value = {
    product_id: preselectedProduct ? preselectedProduct.id : (products.value[0]?.id || ''),
    warehouse_id: warehouses.value[0]?.id || '',
    from_warehouse_id: warehouses.value[0]?.id || '',
    to_warehouse_id: warehouses.value[1]?.id || warehouses.value[0]?.id || '',
    type: 'stock_in',
    quantity: 1,
    notes: ''
  }
  showStockModal.value = true
}

const handleStockAction = async () => {
  stockLoading.value = true
  stockError.value = ''
  try {
    if (stockMode.value === 'adjustment') {
      const payload = {
        product_id: Number(stockForm.value.product_id),
        warehouse_id: Number(stockForm.value.warehouse_id),
        type: stockForm.value.type,
        quantity: Number(stockForm.value.quantity),
        notes: stockForm.value.notes?.trim() || null
      }
      await api.post('/stock-transactions/adjustment', payload)
    } else {
      if (Number(stockForm.value.from_warehouse_id) === Number(stockForm.value.to_warehouse_id)) {
        throw new Error('Source and destination warehouse must be different.')
      }
      const payload = {
        product_id: Number(stockForm.value.product_id),
        from_warehouse_id: Number(stockForm.value.from_warehouse_id),
        to_warehouse_id: Number(stockForm.value.to_warehouse_id),
        quantity: Number(stockForm.value.quantity),
        notes: stockForm.value.notes?.trim() || null
      }
      await api.post('/stock-transactions/transfer', payload)
    }

    showStockModal.value = false
    await fetchProducts()
    modalStore.showSuccess(
      stockMode.value === 'adjustment' ? 'Stock Adjustment Saved' : 'Stock Transfer Completed',
      stockMode.value === 'adjustment'
        ? `Successfully registered ${stockForm.value.type.replace('_', ' ')} of ${stockForm.value.quantity} unit(s).`
        : `Successfully transferred ${stockForm.value.quantity} unit(s) between warehouses.`
    )
  } catch (err) {
    stockError.value = err.response?.data?.message || err.message || 'Stock transaction failed.'
  } finally {
    stockLoading.value = false
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}
</script>

<template>
  <div class="page-container">
    
    <!-- Page Header with Summary and Actions -->
    <div class="page-header mb-6">
      <div class="header-left">
        <h2>{{ authStore.isSupplier ? 'My Supplied Catalog' : 'Products & Inventory Catalog' }}</h2>
        <p class="subtitle">
          {{ authStore.isSupplier ? 'Products manufactured or supplied by your vendor account' : 'Manage SKUs, unit costs, pricing tiers, and warehouse stock levels' }}
        </p>
      </div>
      <div v-if="!authStore.isSupplier" class="flex gap-2">
        <BaseButton variant="outline" @click="openStockModal()">
          <ArrowLeftRight size="16" /> Stock Actions
        </BaseButton>
        <BaseButton variant="primary" @click="openCreateModal">
          <Plus size="18" /> Add Product
        </BaseButton>
      </div>
    </div>

    <!-- Main Content Glass Card -->
    <div class="glass-card list-wrapper">
      
      <!-- Toolbar Filters -->
      <div class="toolbar">
        <div class="search-box input-wrapper">
          <Search class="input-icon" size="18" />
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search products by title, SKU, or description..." 
            @input="handleSearch"
          />
          <button v-if="searchQuery" class="clear-search-btn" @click="clearSearch">
            <X size="14" />
          </button>
        </div>
        
        <select class="filter-select" v-model="categoryFilter" @change="handleSearch">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>

        <select class="filter-select" v-model="stockFilter">
          <option value="all">All Stock Statuses</option>
          <option value="low">⚠️ Low Stock Alerts</option>
          <option value="in_stock">✅ In Stock</option>
          <option value="out_of_stock">❌ Out of Stock</option>
        </select>

        <span class="results-count text-muted text-sm ml-auto">
          Showing <strong>{{ filteredProducts.length }}</strong> products
        </span>
      </div>

      <!-- Products Table -->
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Details</th>
              <th>Category</th>
              <th v-if="!authStore.isSupplier">Supplier</th>
              <th class="text-right">Price / Cost</th>
              <th class="text-right">Stock Level</th>
              <th class="text-center">Status</th>
              <th v-if="!authStore.isSupplier" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="authStore.isSupplier ? 6 : 8" class="text-center text-muted py-6">
                <div class="spinner mb-2"></div>
                <p>Loading products catalog...</p>
              </td>
            </tr>
            <tr v-else-if="filteredProducts.length === 0">
              <td :colspan="authStore.isSupplier ? 6 : 8" class="text-center text-muted py-6">
                <Package size="36" class="mb-2 text-muted" />
                <p>No products match your current search and filters.</p>
              </td>
            </tr>
            <tr v-else v-for="p in filteredProducts" :key="p.id">
              <!-- SKU -->
              <td>
                <span class="sku-tag code-font">{{ p.sku }}</span>
              </td>

              <!-- Product Details -->
              <td>
                <div class="font-semibold text-primary">{{ p.name }}</div>
                <div v-if="p.description" class="text-xs text-muted product-desc">{{ p.description }}</div>
              </td>

              <!-- Category -->
              <td>
                <span class="badge badge-staff">
                  <span v-if="p.category_color" class="cat-dot" :style="{ backgroundColor: p.category_color }"></span>
                  {{ p.category_name || 'General' }}
                </span>
              </td>

              <!-- Supplier -->
              <td v-if="!authStore.isSupplier" class="text-sm">
                <span v-if="p.supplier_name" class="font-medium text-secondary">{{ p.supplier_name }}</span>
                <span v-else class="text-muted italic">Internal</span>
              </td>

              <!-- Price & Margin -->
              <td class="text-right">
                <div class="font-bold text-success">{{ formatCurrency(p.selling_price) }}</div>
                <div v-if="!authStore.isSupplier && p.cost_price" class="text-xs text-muted">
                  Cost: {{ formatCurrency(p.cost_price) }}
                </div>
              </td>

              <!-- Stock Level Pill -->
              <td class="text-right">
                <div 
                  class="stock-pill" 
                  :class="{
                    'stock-out': (p.total_stock || 0) <= 0,
                    'stock-low': (p.total_stock || 0) > 0 && (p.total_stock || 0) <= (p.min_stock_level || 0),
                    'stock-ok': (p.total_stock || 0) > (p.min_stock_level || 0)
                  }"
                >
                  <AlertTriangle v-if="(p.total_stock || 0) <= (p.min_stock_level || 0)" size="12" />
                  <span>{{ p.total_stock || 0 }} {{ p.unit || 'pcs' }}</span>
                </div>
                <div class="text-xs text-muted mt-1">Min: {{ p.min_stock_level }}</div>
              </td>

              <!-- Active Status -->
              <td class="text-center">
                <span class="badge" :class="p.is_active ? 'badge-success' : 'badge-draft'">
                  <span class="status-dot" :class="p.is_active ? 'active' : 'inactive'"></span>
                  {{ p.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td v-if="!authStore.isSupplier" class="text-right action-cells">
                <button class="icon-btn transfer" title="Adjust or Transfer Stock" @click="openStockModal(p)">
                  <ArrowLeftRight size="15" />
                </button>
                <button class="icon-btn edit" title="Edit Product Details" @click="openEditModal(p)">
                  <Edit2 size="15" />
                </button>
                <button class="icon-btn delete" title="Deactivate Product" @click="confirmDelete(p)">
                  <Trash2 size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Product Modal -->
    <BaseModal 
      v-model="showModal" 
      :title="isEditing ? `Edit Product: ${form.name || form.sku}` : 'Add New Product'" 
      maxWidth="540px"
    >
      <div v-if="formError" class="modal-error">
        <AlertCircle size="18" />
        <span>{{ formError }}</span>
      </div>

      <div class="form-grid">
        <!-- Product Name -->
        <div class="form-group">
          <label>Product Name *</label>
          <input type="text" v-model="form.name" placeholder="e.g. Laptop HP" required />
        </div>

        <!-- Product Title -->
        <div class="form-group">
          <label>Product Title *</label>
          <input type="text" v-model="form.title" placeholder="e.g. ThinkPad T14 Gen 4" required />
        </div>

        <!-- Product Category -->
        <div class="form-group">
          <label>Product Category *</label>
          <select v-model="form.category_id" required>
            <option disabled value="">Select Category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <!-- Stock In -->
        <div class="form-group">
          <label>Stock In *</label>
          <input type="number" min="0" v-model="form.stock_in" placeholder="0" />
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" @click="showModal = false">Cancel</BaseButton>
        <BaseButton variant="primary" :loading="formLoading" @click="handleSave">
          {{ isEditing ? 'Update Product' : 'Create Product' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Stock Adjustments & Transfers Modal -->
    <BaseModal v-model="showStockModal" title="Inventory Movement Actions" maxWidth="600px">
      <div v-if="stockError" class="modal-error">
        <AlertCircle size="18" />
        <span>{{ stockError }}</span>
      </div>

      <!-- Segmented Mode Control -->
      <div class="segmented-control mb-4">
        <button 
          type="button" 
          class="segment-btn" 
          :class="{ active: stockMode === 'adjustment' }" 
          @click="stockMode = 'adjustment'"
        >
          Adjustment / Stock In-Out
        </button>
        <button 
          type="button" 
          class="segment-btn" 
          :class="{ active: stockMode === 'transfer' }" 
          @click="stockMode = 'transfer'"
        >
          Warehouse Transfer
        </button>
      </div>

      <div class="form-grid">
        <div class="form-group full-width">
          <label>Target Product *</label>
          <select v-model="stockForm.product_id" required>
            <option v-for="p in products" :key="p.id" :value="p.id">
              {{ p.sku }} &bull; {{ p.name }} (Current: {{ p.total_stock || 0 }})
            </option>
          </select>
        </div>

        <!-- Adjustment fields -->
        <template v-if="stockMode === 'adjustment'">
          <div class="form-group">
            <label>Movement Type *</label>
            <select v-model="stockForm.type">
              <option value="stock_in">➕ Stock In (Receive items)</option>
              <option value="stock_out">➖ Stock Out (Deduct / Dispose)</option>
              <option value="adjustment">🔄 Manual Correction</option>
            </select>
          </div>

          <div class="form-group">
            <label>Warehouse *</label>
            <select v-model="stockForm.warehouse_id" required>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }} ({{ w.code }})</option>
            </select>
          </div>

          <div class="form-group">
            <label>Quantity *</label>
            <input type="number" min="1" v-model="stockForm.quantity" required />
          </div>

          <div class="form-group full-width">
            <label>Reference Notes</label>
            <input type="text" v-model="stockForm.notes" placeholder="Reason for inventory movement..." />
          </div>
        </template>

        <!-- Transfer fields -->
        <template v-else>
          <div class="form-group">
            <label>Source Warehouse (Origin) *</label>
            <select v-model="stockForm.from_warehouse_id" required>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }} ({{ w.code }})</option>
            </select>
          </div>

          <div class="form-group">
            <label>Destination Warehouse *</label>
            <select v-model="stockForm.to_warehouse_id" required>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }} ({{ w.code }})</option>
            </select>
          </div>

          <div class="form-group">
            <label>Quantity to Transfer *</label>
            <input type="number" min="1" v-model="stockForm.quantity" required />
          </div>

          <div class="form-group full-width">
            <label>Transfer Notes</label>
            <input type="text" v-model="stockForm.notes" placeholder="Transfer tracking or route notes..." />
          </div>
        </template>
      </div>

      <template #footer>
        <BaseButton variant="outline" @click="showStockModal = false">Cancel</BaseButton>
        <BaseButton variant="primary" :loading="stockLoading" @click="handleStockAction">
          {{ stockMode === 'adjustment' ? 'Execute Adjustment' : 'Execute Transfer' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <BaseModal v-model="showDeleteModal" title="Confirm Product Deactivation" maxWidth="450px">
      <div class="p-2">
        <p class="modal-text">
          Are you sure you want to deactivate product <strong>{{ deletingProduct?.name }}</strong> (SKU: {{ deletingProduct?.sku }})?
        </p>
        <p class="text-xs text-muted mt-2">
          Note: Products with existing stock cannot be deactivated until stock is transferred or written off.
        </p>
      </div>
      <template #footer>
        <BaseButton variant="outline" @click="showDeleteModal = false">Cancel</BaseButton>
        <BaseButton variant="danger" :loading="deleteLoading" @click="handleDelete">
          Deactivate Product
        </BaseButton>
      </template>
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

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.clear-search-btn:hover {
  color: var(--text-primary);
}

.ml-auto {
  margin-left: auto;
}

.sku-tag {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.product-desc {
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
}

.stock-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 12px;
  font-size: 0.825rem;
  font-weight: 700;
}

.stock-ok {
  background: rgba(16, 185, 129, 0.15);
  color: #86efac;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.stock-low {
  background: rgba(245, 158, 11, 0.18);
  color: #fde68a;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.stock-out {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
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

.margin-preview-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Segmented Control */
.segmented-control {
  display: flex;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
}

.segment-btn {
  flex: 1;
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.segment-btn:hover {
  color: var(--text-primary);
}

.segment-btn.active {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.35), rgba(139, 92, 246, 0.25));
  color: white;
  border: 1px solid rgba(99, 102, 241, 0.4);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}
</style>
