<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { 
  FolderTree, Warehouse, Truck, Users, Plus, Edit2, Trash2, 
  AlertCircle, Search, Mail, Phone, MapPin, X, Building2, Tag, CreditCard
} from 'lucide-vue-next'

const authStore = useAuthStore()
const modalStore = useModalStore()

const activeTab = ref(authStore.isAdmin ? 'suppliers' : (authStore.isSupplier ? 'suppliers' : 'categories'))
const loading = ref(false)
const searchQuery = ref('')

// Data lists
const categories = ref([])
const warehouses = ref([])
const suppliers = ref([])
const customers = ref([])

// Form Modal State
const showModal = ref(false)
const modalTitle = ref('')
const modalType = ref('') // 'categories' | 'warehouses' | 'suppliers' | 'customers'
const isEditing = ref(false)
const editingId = ref(null)
const formError = ref('')
const formLoading = ref(false)

// Delete Modal State
const showDeleteModal = ref(false)
const deletingItem = ref(null)
const deleteLoading = ref(false)

// Forms
const categoryForm = ref({ name: '', description: '', color: '#3b82f6', icon: 'tag' })
const warehouseForm = ref({ name: '', code: '', address: '', city: '', country: '', phone: '' })
const supplierForm = ref({ name: '', code: '', contact_name: '', email: '', phone: '', address: '', city: '', tax_id: '', payment_terms: 30 })
const customerForm = ref({ name: '', code: '', contact_name: '', email: '', phone: '', address: '', city: '', tax_id: '', credit_limit: 1000 })

// ── Fetchers ──────────────────────────────────────────
const fetchCategories = async () => {
  try {
    const { data } = await api.get('/categories')
    categories.value = data.data?.items || data.data?.rows || (Array.isArray(data.data) ? data.data : [])
  } catch (err) {
    console.error('Failed to fetch categories:', err)
  }
}

const fetchWarehouses = async () => {
  try {
    const { data } = await api.get('/warehouses')
    warehouses.value = data.data?.items || data.data?.rows || (Array.isArray(data.data) ? data.data : [])
  } catch (err) {
    console.error('Failed to fetch warehouses:', err)
  }
}

const fetchSuppliers = async () => {
  try {
    const { data } = await api.get('/suppliers')
    suppliers.value = data.data?.items || data.data?.rows || (Array.isArray(data.data) ? data.data : [])
  } catch (err) {
    console.error('Failed to fetch suppliers:', err)
  }
}

const fetchCustomers = async () => {
  if (authStore.isSupplier) return
  try {
    const { data } = await api.get('/customers')
    customers.value = data.data?.items || data.data?.rows || (Array.isArray(data.data) ? data.data : [])
  } catch (err) {
    console.error('Failed to fetch customers:', err)
  }
}

const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.allSettled([
      fetchCategories(),
      fetchWarehouses(),
      fetchSuppliers(),
      !authStore.isSupplier ? fetchCustomers() : Promise.resolve()
    ])
  } finally {
    loading.value = false
  }
}

const switchTab = (tab) => {
  activeTab.value = tab
  searchQuery.value = ''
}

const clearSearch = () => {
  searchQuery.value = ''
}

onMounted(() => {
  loadAllData()
})

// ── Filtered Computeds ─────────────────────────────────
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter(c => 
    c.name?.toLowerCase().includes(q) || 
    c.description?.toLowerCase().includes(q)
  )
})

const filteredWarehouses = computed(() => {
  if (!searchQuery.value) return warehouses.value
  const q = searchQuery.value.toLowerCase()
  return warehouses.value.filter(w => 
    w.name?.toLowerCase().includes(q) || 
    w.code?.toLowerCase().includes(q) || 
    w.city?.toLowerCase().includes(q) ||
    w.country?.toLowerCase().includes(q)
  )
})

const filteredSuppliers = computed(() => {
  if (!searchQuery.value) return suppliers.value
  const q = searchQuery.value.toLowerCase()
  return suppliers.value.filter(s => 
    s.name?.toLowerCase().includes(q) || 
    s.code?.toLowerCase().includes(q) || 
    s.contact_name?.toLowerCase().includes(q) || 
    s.email?.toLowerCase().includes(q) ||
    s.city?.toLowerCase().includes(q)
  )
})

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  const q = searchQuery.value.toLowerCase()
  return customers.value.filter(c => 
    c.name?.toLowerCase().includes(q) || 
    c.code?.toLowerCase().includes(q) || 
    c.contact_name?.toLowerCase().includes(q) || 
    c.email?.toLowerCase().includes(q) ||
    c.city?.toLowerCase().includes(q)
  )
})

const currentItemSingular = computed(() => {
  switch (activeTab.value) {
    case 'categories': return 'Category'
    case 'warehouses': return 'Warehouse'
    case 'suppliers': return 'Supplier'
    case 'customers': return 'Customer'
    default: return 'Item'
  }
})

// ── CRUD Handlers ─────────────────────────────────────
const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  formError.value = ''
  modalType.value = activeTab.value

  if (activeTab.value === 'categories') {
    modalTitle.value = 'Add New Category'
    categoryForm.value = { name: '', description: '', color: '#3b82f6', icon: 'tag' }
  } else if (activeTab.value === 'warehouses') {
    modalTitle.value = 'Add New Warehouse'
    warehouseForm.value = { name: '', code: '', address: '', city: '', country: '', phone: '' }
  } else if (activeTab.value === 'suppliers') {
    modalTitle.value = 'Add New Supplier'
    supplierForm.value = { name: '', code: '', contact_name: '', email: '', phone: '', address: '', city: '', tax_id: '', payment_terms: 30 }
  } else if (activeTab.value === 'customers') {
    modalTitle.value = 'Add New Customer'
    customerForm.value = { name: '', code: '', contact_name: '', email: '', phone: '', address: '', city: '', tax_id: '', credit_limit: 1000 }
  }

  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  editingId.value = item.id
  formError.value = ''
  modalType.value = activeTab.value

  if (activeTab.value === 'categories') {
    modalTitle.value = 'Edit Category'
    categoryForm.value = { 
      name: item.name, 
      description: item.description || '', 
      color: item.color || '#3b82f6', 
      icon: item.icon || 'tag' 
    }
  } else if (activeTab.value === 'warehouses') {
    modalTitle.value = 'Edit Warehouse'
    warehouseForm.value = { 
      name: item.name, 
      code: item.code, 
      address: item.address || '', 
      city: item.city || '', 
      country: item.country || '', 
      phone: item.phone || '' 
    }
  } else if (activeTab.value === 'suppliers') {
    modalTitle.value = 'Edit Supplier'
    supplierForm.value = { 
      name: item.name, 
      code: item.code, 
      contact_name: item.contact_name || '', 
      email: item.email || '', 
      phone: item.phone || '', 
      address: item.address || '', 
      city: item.city || '', 
      tax_id: item.tax_id || '', 
      payment_terms: item.payment_terms || 30 
    }
  } else if (activeTab.value === 'customers') {
    modalTitle.value = 'Edit Customer'
    customerForm.value = { 
      name: item.name, 
      code: item.code, 
      contact_name: item.contact_name || '', 
      email: item.email || '', 
      phone: item.phone || '', 
      address: item.address || '', 
      city: item.city || '', 
      tax_id: item.tax_id || '', 
      credit_limit: item.credit_limit || 1000 
    }
  }

  showModal.value = true
}

const handleSave = async () => {
  formLoading.value = true
  formError.value = ''
  try {
    let endpoint = `/${modalType.value}`
    let payload = {}

    if (modalType.value === 'categories') {
      if (!categoryForm.value.name?.trim()) {
        formError.value = 'Category name is required.'
        formLoading.value = false
        return
      }
      payload = { ...categoryForm.value }
    } else if (modalType.value === 'warehouses') {
      if (!warehouseForm.value.name?.trim() || !warehouseForm.value.code?.trim()) {
        formError.value = 'Warehouse name and code are required.'
        formLoading.value = false
        return
      }
      payload = { ...warehouseForm.value }
      if (!payload.phone) delete payload.phone
      if (!payload.address) delete payload.address
      if (!payload.city) delete payload.city
      if (!payload.country) delete payload.country
    } else if (modalType.value === 'suppliers') {
      if (!supplierForm.value.name?.trim() || !supplierForm.value.code?.trim()) {
        formError.value = 'Supplier name and code are required.'
        formLoading.value = false
        return
      }
      payload = { ...supplierForm.value }
      payload.payment_terms = Number(payload.payment_terms) || 0
      if (!payload.email) delete payload.email
      if (!payload.phone) delete payload.phone
    } else if (modalType.value === 'customers') {
      if (!customerForm.value.name?.trim() || !customerForm.value.code?.trim()) {
        formError.value = 'Customer name and code are required.'
        formLoading.value = false
        return
      }
      payload = { ...customerForm.value }
      payload.credit_limit = Number(payload.credit_limit) || 0
      if (!payload.email) delete payload.email
      if (!payload.phone) delete payload.phone
    }

    if (isEditing.value) {
      await api.put(`${endpoint}/${editingId.value}`, payload)
    } else {
      await api.post(endpoint, payload)
    }

    showModal.value = false
    await loadAllData()
    modalStore.showSuccess(
      isEditing.value ? `${currentItemSingular.value} Updated` : `${currentItemSingular.value} Created`,
      `"${payload.name}" was saved successfully.`
    )
  } catch (err) {
    formError.value = err.response?.data?.message || 'Operation failed. Please review your input.'
  } finally {
    formLoading.value = false
  }
}

const confirmDelete = (item) => {
  deletingItem.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!deletingItem.value) return
  deleteLoading.value = true
  const itemName = deletingItem.value.name || 'Item'
  try {
    await api.delete(`/${activeTab.value}/${deletingItem.value.id}`)
    showDeleteModal.value = false
    deletingItem.value = null
    await loadAllData()
    modalStore.showSuccess('Deleted', `"${itemName}" was successfully removed.`)
  } catch (err) {
    showDeleteModal.value = false
    modalStore.showError(
      'Cannot Delete Item', 
      err.response?.data?.message || 'This item could not be deleted because it is linked to existing transactions or records.'
    )
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div>
        <h2>{{ authStore.isAdmin ? 'Suppliers Directory & Vendor Management' : 'System Settings & Master Data' }}</h2>
        <p class="subtitle">
          {{ authStore.isAdmin 
            ? 'Administer verified supplier contacts, corporate tax credentials, and commercial payment terms' 
            : 'Configure categories, warehouses, vendor suppliers, and customer directories' 
          }}
        </p>
      </div>
      <BaseButton v-if="!authStore.isSupplier" variant="primary" @click="openCreateModal">
        <Plus size="18" /> Add {{ currentItemSingular }}
      </BaseButton>
    </div>

    <!-- Navigation Segmented Tabs (Shown for Owner; Admin is focused directly on Suppliers) -->
    <div class="tabs-bar mb-4" v-if="!authStore.isAdmin && !authStore.isSupplier">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'categories' }" 
        @click="switchTab('categories')"
      >
        <FolderTree size="17" />
        <span>Categories</span>
        <span class="tab-count">{{ categories.length }}</span>
      </button>

      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'warehouses' }" 
        @click="switchTab('warehouses')"
      >
        <Warehouse size="17" />
        <span>Warehouses</span>
        <span class="tab-count">{{ warehouses.length }}</span>
      </button>

      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'suppliers' }" 
        @click="switchTab('suppliers')"
      >
        <Truck size="17" />
        <span>Suppliers</span>
        <span class="tab-count">{{ suppliers.length }}</span>
      </button>

      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'customers' }" 
        @click="switchTab('customers')"
      >
        <Users size="17" />
        <span>Customers</span>
        <span class="tab-count">{{ customers.length }}</span>
      </button>
    </div>

    <!-- Main List Glass Card -->
    <div class="glass-card list-wrapper">
      
      <!-- Toolbar Filters -->
      <div class="toolbar">
        <div class="search-box input-wrapper">
          <Search class="input-icon" size="18" />
          <input 
            type="text" 
            v-model="searchQuery" 
            :placeholder="`Search ${activeTab} by name, code, contact...`" 
          />
          <button v-if="searchQuery" class="clear-search-btn" @click="clearSearch" aria-label="Clear search">
            <X size="14" />
          </button>
        </div>

        <div class="results-count text-muted text-sm ml-auto">
          Showing <strong>
            {{ 
              activeTab === 'categories' ? filteredCategories.length :
              activeTab === 'warehouses' ? filteredWarehouses.length :
              activeTab === 'suppliers' ? filteredSuppliers.length :
              filteredCustomers.length
            }}
          </strong> {{ activeTab }}
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8 text-muted">
        <div class="spinner mb-2"></div>
        <p>Loading master records...</p>
      </div>

      <!-- Categories Table -->
      <div v-else-if="activeTab === 'categories'" class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 80px;">Color</th>
              <th>Category Name</th>
              <th>Description</th>
              <th class="text-right" style="width: 120px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredCategories.length === 0">
              <td colspan="4" class="empty-cell">
                <div class="empty-state-box">
                  <FolderTree size="36" class="text-muted mb-2" />
                  <p class="font-medium text-secondary">No categories found</p>
                  <p class="text-xs text-muted">Create a category to group products effectively.</p>
                  <BaseButton v-if="!searchQuery" variant="primary" size="sm" class="mt-3" @click="openCreateModal">
                    <Plus size="14" /> Add Category
                  </BaseButton>
                </div>
              </td>
            </tr>
            <tr v-for="cat in filteredCategories" :key="cat.id">
              <td>
                <div class="color-badge-wrapper">
                  <span class="color-dot" :style="{ backgroundColor: cat.color || '#3b82f6' }"></span>
                </div>
              </td>
              <td>
                <div class="font-semibold text-primary">{{ cat.name }}</div>
              </td>
              <td>
                <div class="text-secondary text-sm">{{ cat.description || '—' }}</div>
              </td>
              <td class="text-right action-cells">
                <button class="icon-btn edit" title="Edit Category" @click="openEditModal(cat)">
                  <Edit2 size="15" />
                </button>
                <button class="icon-btn delete" title="Delete Category" @click="confirmDelete(cat)">
                  <Trash2 size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Warehouses Table -->
      <div v-else-if="activeTab === 'warehouses'" class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 140px;">Code</th>
              <th>Warehouse Name</th>
              <th>Location</th>
              <th>Phone</th>
              <th class="text-right" style="width: 120px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredWarehouses.length === 0">
              <td colspan="5" class="empty-cell">
                <div class="empty-state-box">
                  <Warehouse size="36" class="text-muted mb-2" />
                  <p class="font-medium text-secondary">No warehouses found</p>
                  <p class="text-xs text-muted">Add storage locations to manage inventory distribution.</p>
                  <BaseButton v-if="!searchQuery" variant="primary" size="sm" class="mt-3" @click="openCreateModal">
                    <Plus size="14" /> Add Warehouse
                  </BaseButton>
                </div>
              </td>
            </tr>
            <tr v-for="wh in filteredWarehouses" :key="wh.id">
              <td>
                <span class="code-pill">{{ wh.code }}</span>
              </td>
              <td>
                <div class="font-semibold text-primary">{{ wh.name }}</div>
                <div v-if="wh.address" class="text-xs text-muted">{{ wh.address }}</div>
              </td>
              <td>
                <div class="flex items-center gap-1 text-sm text-secondary">
                  <MapPin size="13" class="text-muted" />
                  <span>{{ wh.city || 'Unspecified' }}{{ wh.country ? `, ${wh.country}` : '' }}</span>
                </div>
              </td>
              <td>
                <div v-if="wh.phone" class="flex items-center gap-1 text-sm text-secondary">
                  <Phone size="13" class="text-muted" />
                  <span>{{ wh.phone }}</span>
                </div>
                <span v-else class="text-muted text-xs">—</span>
              </td>
              <td class="text-right action-cells">
                <button class="icon-btn edit" title="Edit Warehouse" @click="openEditModal(wh)">
                  <Edit2 size="15" />
                </button>
                <button class="icon-btn delete" title="Delete Warehouse" @click="confirmDelete(wh)">
                  <Trash2 size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Suppliers Table -->
      <div v-else-if="activeTab === 'suppliers'" class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 130px;">Code</th>
              <th>Supplier Name</th>
              <th>Contact Person</th>
              <th>Contact Details</th>
              <th>Location</th>
              <th v-if="!authStore.isSupplier" class="text-right" style="width: 120px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredSuppliers.length === 0">
              <td :colspan="authStore.isSupplier ? 5 : 6" class="empty-cell">
                <div class="empty-state-box">
                  <Truck size="36" class="text-muted mb-2" />
                  <p class="font-medium text-secondary">No suppliers found</p>
                  <p class="text-xs text-muted">Register vendor accounts to create purchase orders.</p>
                  <BaseButton v-if="!authStore.isSupplier && !searchQuery" variant="primary" size="sm" class="mt-3" @click="openCreateModal">
                    <Plus size="14" /> Add Supplier
                  </BaseButton>
                </div>
              </td>
            </tr>
            <tr v-for="sup in filteredSuppliers" :key="sup.id">
              <td>
                <span class="code-pill">{{ sup.code }}</span>
              </td>
              <td>
                <div class="font-semibold text-primary">{{ sup.name }}</div>
                <div v-if="sup.payment_terms" class="text-xs text-muted">Terms: {{ sup.payment_terms }} days</div>
              </td>
              <td>
                <span class="text-sm font-medium">{{ sup.contact_name || '—' }}</span>
              </td>
              <td>
                <div class="flex flex-col gap-0.5">
                  <div v-if="sup.email" class="flex items-center gap-1 text-xs text-secondary">
                    <Mail size="12" class="text-muted" />
                    <span>{{ sup.email }}</span>
                  </div>
                  <div v-if="sup.phone" class="flex items-center gap-1 text-xs text-muted">
                    <Phone size="12" class="text-muted" />
                    <span>{{ sup.phone }}</span>
                  </div>
                  <span v-if="!sup.email && !sup.phone" class="text-muted text-xs">—</span>
                </div>
              </td>
              <td>
                <div class="text-sm text-secondary">{{ sup.city || '—' }}</div>
              </td>
              <td v-if="!authStore.isSupplier" class="text-right action-cells">
                <button class="icon-btn edit" title="Edit Supplier" @click="openEditModal(sup)">
                  <Edit2 size="15" />
                </button>
                <button class="icon-btn delete" title="Delete Supplier" @click="confirmDelete(sup)">
                  <Trash2 size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Customers Table -->
      <div v-else-if="activeTab === 'customers'" class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 130px;">Code</th>
              <th>Customer Name</th>
              <th>Contact Person</th>
              <th>Contact Details</th>
              <th class="text-right">Credit Limit</th>
              <th class="text-right" style="width: 120px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="6" class="empty-cell">
                <div class="empty-state-box">
                  <Users size="36" class="text-muted mb-2" />
                  <p class="font-medium text-secondary">No customers found</p>
                  <p class="text-xs text-muted">Add customer records to issue sales invoices and orders.</p>
                  <BaseButton v-if="!searchQuery" variant="primary" size="sm" class="mt-3" @click="openCreateModal">
                    <Plus size="14" /> Add Customer
                  </BaseButton>
                </div>
              </td>
            </tr>
            <tr v-for="cust in filteredCustomers" :key="cust.id">
              <td>
                <span class="code-pill">{{ cust.code }}</span>
              </td>
              <td>
                <div class="font-semibold text-primary">{{ cust.name }}</div>
              </td>
              <td>
                <span class="text-sm font-medium">{{ cust.contact_name || '—' }}</span>
              </td>
              <td>
                <div class="flex flex-col gap-0.5">
                  <div v-if="cust.email" class="flex items-center gap-1 text-xs text-secondary">
                    <Mail size="12" class="text-muted" />
                    <span>{{ cust.email }}</span>
                  </div>
                  <div v-if="cust.phone" class="flex items-center gap-1 text-xs text-muted">
                    <Phone size="12" class="text-muted" />
                    <span>{{ cust.phone }}</span>
                  </div>
                  <span v-if="!cust.email && !cust.phone" class="text-muted text-xs">—</span>
                </div>
              </td>
              <td class="text-right">
                <span class="credit-limit-badge">
                  ${{ Number(cust.credit_limit || 0).toLocaleString() }}
                </span>
              </td>
              <td class="text-right action-cells">
                <button class="icon-btn edit" title="Edit Customer" @click="openEditModal(cust)">
                  <Edit2 size="15" />
                </button>
                <button class="icon-btn delete" title="Delete Customer" @click="confirmDelete(cust)">
                  <Trash2 size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Master Data Create/Edit Modal -->
    <BaseModal v-model="showModal" :title="modalTitle" maxWidth="560px">
      <div v-if="formError" class="modal-error mb-4">
        <AlertCircle size="18" />
        <span>{{ formError }}</span>
      </div>

      <!-- Category Form -->
      <div v-if="modalType === 'categories'" class="form-grid">
        <div class="form-group full-width">
          <label>Category Name <span class="required">*</span></label>
          <input type="text" v-model="categoryForm.name" placeholder="e.g. Computers & Laptops" required />
        </div>
        <div class="form-group full-width">
          <label>Description</label>
          <input type="text" v-model="categoryForm.description" placeholder="Brief summary of items in this category" />
        </div>
        <div class="form-group">
          <label>Category Color Tag</label>
          <div class="color-picker-input">
            <input type="color" v-model="categoryForm.color" />
            <span class="code-font text-xs">{{ categoryForm.color }}</span>
          </div>
        </div>
      </div>

      <!-- Warehouse Form -->
      <div v-if="modalType === 'warehouses'" class="form-grid">
        <div class="form-group">
          <label>Warehouse Name <span class="required">*</span></label>
          <input type="text" v-model="warehouseForm.name" placeholder="e.g. Phnom Penh Central" required />
        </div>
        <div class="form-group">
          <label>Warehouse Code <span class="required">*</span></label>
          <input type="text" v-model="warehouseForm.code" placeholder="e.g. WH-PP-01" required />
        </div>
        <div class="form-group full-width">
          <label>Street Address</label>
          <input type="text" v-model="warehouseForm.address" placeholder="Physical location address" />
        </div>
        <div class="form-group">
          <label>City</label>
          <input type="text" v-model="warehouseForm.city" placeholder="e.g. Phnom Penh" />
        </div>
        <div class="form-group">
          <label>Country</label>
          <input type="text" v-model="warehouseForm.country" placeholder="e.g. Cambodia" />
        </div>
        <div class="form-group full-width">
          <label>Contact Phone</label>
          <input type="text" v-model="warehouseForm.phone" placeholder="e.g. +855 23 888 999" />
        </div>
      </div>

      <!-- Supplier Form -->
      <div v-if="modalType === 'suppliers'" class="form-grid">
        <div class="form-group">
          <label>Supplier / Company Name <span class="required">*</span></label>
          <input type="text" v-model="supplierForm.name" placeholder="e.g. Acer Global Logistics" required />
        </div>
        <div class="form-group">
          <label>Supplier Code <span class="required">*</span></label>
          <input type="text" v-model="supplierForm.code" placeholder="e.g. SUP-ACER" required />
        </div>
        <div class="form-group">
          <label>Contact Person</label>
          <input type="text" v-model="supplierForm.contact_name" placeholder="Full name of representative" />
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" v-model="supplierForm.email" placeholder="sales@supplier.com" />
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" v-model="supplierForm.phone" placeholder="+855 12 345 678" />
        </div>
        <div class="form-group">
          <label>City</label>
          <input type="text" v-model="supplierForm.city" placeholder="e.g. Phnom Penh" />
        </div>
        <div class="form-group">
          <label>Tax ID / Registration</label>
          <input type="text" v-model="supplierForm.tax_id" placeholder="e.g. K001-900234" />
        </div>
        <div class="form-group">
          <label>Payment Terms (Days)</label>
          <input type="number" min="0" v-model="supplierForm.payment_terms" placeholder="30" />
        </div>
      </div>

      <!-- Customer Form -->
      <div v-if="modalType === 'customers'" class="form-grid">
        <div class="form-group">
          <label>Customer / Enterprise Name <span class="required">*</span></label>
          <input type="text" v-model="customerForm.name" placeholder="e.g. Royal Academy Corp" required />
        </div>
        <div class="form-group">
          <label>Customer Code <span class="required">*</span></label>
          <input type="text" v-model="customerForm.code" placeholder="e.g. CUST-ROYAL" required />
        </div>
        <div class="form-group">
          <label>Contact Person</label>
          <input type="text" v-model="customerForm.contact_name" placeholder="Account manager or buyer" />
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" v-model="customerForm.email" placeholder="contact@royal.com" />
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" v-model="customerForm.phone" placeholder="+855 23 111 222" />
        </div>
        <div class="form-group">
          <label>Credit Limit ($)</label>
          <input type="number" min="0" v-model="customerForm.credit_limit" placeholder="5000" />
        </div>
        <div class="form-group full-width">
          <label>Shipping / Billing Address</label>
          <input type="text" v-model="customerForm.address" placeholder="Physical street delivery address" />
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" @click="showModal = false">Cancel</BaseButton>
        <BaseButton variant="primary" :loading="formLoading" @click="handleSave">
          {{ isEditing ? 'Save Changes' : 'Create Record' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <BaseModal v-model="showDeleteModal" title="Confirm Deletion" maxWidth="440px">
      <div class="delete-confirmation-dialog">
        <div class="delete-icon-box">
          <Trash2 size="28" />
        </div>
        <h4 class="delete-title">Delete {{ currentItemSingular }}?</h4>
        <p class="delete-description">
          Are you sure you want to permanently delete <strong>{{ deletingItem?.name }}</strong>?
          This action will be prevented if there are associated products or orders.
        </p>
      </div>
      <template #footer>
        <BaseButton variant="outline" @click="showDeleteModal = false">Cancel</BaseButton>
        <BaseButton variant="danger" :loading="deleteLoading" @click="handleDelete">
          Yes, Delete Record
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.page-container {
  padding: 0.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.page-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.py-8 { padding-top: 4rem; padding-bottom: 4rem; }
.ml-auto { margin-left: auto; }

/* Tabs Bar */
.tabs-bar {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  overflow-x: auto;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1.25rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.tab-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tab-btn.active {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border-color: rgba(99, 102, 241, 0.3);
  font-weight: 600;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 0.75rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
}

.tab-btn.active .tab-count {
  background: rgba(99, 102, 241, 0.25);
  color: #c7d2fe;
}

/* Toolbar */
.toolbar {
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  min-width: 320px;
  max-width: 480px;
  flex: 1;
}

.input-wrapper {
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-muted);
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 0.65rem 2.25rem 0.65rem 2.5rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: var(--transition);
}

.search-box input:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 2px var(--primary-glow);
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.clear-search-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

/* Table System */
.table-responsive {
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.custom-table th,
.custom-table td {
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.custom-table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  font-weight: 600;
  background: rgba(0, 0, 0, 0.2);
  text-align: left;
}

.custom-table tbody tr:hover {
  background-color: var(--bg-hover);
}

.empty-cell {
  padding: 3.5rem 1.5rem !important;
  text-align: center;
}

.empty-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Code Pills and Badges */
.code-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.25);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.credit-limit-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: #34d399;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.color-badge-wrapper {
  display: flex;
  align-items: center;
}

.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  display: inline-block;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Action Buttons */
.action-cells {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}

.icon-btn.edit:hover {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border-color: rgba(99, 102, 241, 0.35);
}

.icon-btn.delete:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.35);
}

/* Forms */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.1rem;
}

.full-width {
  grid-column: span 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.required {
  color: #f87171;
}

.form-group input,
.form-group select {
  padding: 0.65rem 0.85rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: var(--transition);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 2px var(--primary-glow);
}

.color-picker-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-picker-input input[type="color"] {
  width: 44px;
  height: 38px;
  padding: 2px;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.modal-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

/* Delete confirmation box */
.delete-confirmation-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.5rem 0;
}

.delete-icon-box {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.delete-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.delete-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Spinner */
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-light);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.text-right { text-align: right; }
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); }
.text-secondary { color: var(--text-secondary); }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
</style>
