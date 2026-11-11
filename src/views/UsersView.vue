<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { 
  Plus, Edit2, ShieldAlert, X, ShieldCheck, KeyRound, 
  Trash2, Search, Users, Eye, EyeOff, AlertCircle, Crown
} from 'lucide-vue-next'
import api from '@/api/axios'

const authStore = useAuthStore()
const modalStore = useModalStore()

const users = ref([])
const loading = ref(false)
const suppliers = ref([])
const searchQuery = ref('')
const roleFilter = ref('all')

const showModal = ref(false)
const isEditing = ref(false)
const editingUserId = ref(null)
const formError = ref('')
const formLoading = ref(false)

const showResetModal = ref(false)
const resetUserId = ref(null)
const resetUserName = ref('')
const newPassword = ref('')
const showResetPassword = ref(false)
const resetError = ref('')
const resetSuccess = ref('')

const showDeactivateModal = ref(false)
const deactivatingUser = ref(null)
const deactivateLoading = ref(false)

const formData = ref({
  full_name: '',
  email: '',
  username: '',
  password: '',
  role: 'supplier',
  supplier_id: null
})

// ── Fetch Data ──────────────────────────────────────────
const fetchUsers = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/users')
    if (data.success) {
      users.value = data.data.items || data.data.rows || []
    }
  } catch (err) {
    console.error('Failed to fetch users', err)
  } finally {
    loading.value = false
  }
}

const fetchSuppliers = async () => {
  try {
    const { data } = await api.get('/suppliers/all')
    if (data.success) suppliers.value = data.data || []
  } catch (err) {
    console.error('Failed to fetch suppliers', err)
  }
}

// Client filtering
const filteredUsers = computed(() => {
  let list = users.value
  if (roleFilter.value !== 'all') {
    if (roleFilter.value === 'owner') {
      list = list.filter(u => u.role === 'owner' || u.role === 'staff')
    } else {
      list = list.filter(u => u.role === roleFilter.value)
    }
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(u => 
      u.full_name?.toLowerCase().includes(q) || 
      u.username?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q)
    )
  }
  return list
})

onMounted(() => {
  if (authStore.isAdmin || authStore.isOwner) {
    fetchUsers()
    fetchSuppliers()
  }
})

// ── Create / Edit ────────────────────────────────────────
const openCreateModal = () => {
  isEditing.value = false
  editingUserId.value = null
  formError.value = ''
  formData.value = { 
    full_name: '', 
    email: '', 
    username: '', 
    password: '', 
    role: 'owner', 
    supplier_id: suppliers.value[0]?.id || null 
  }
  showModal.value = true
}

const openEditModal = (user) => {
  isEditing.value = true
  editingUserId.value = user.id
  formError.value = ''
  formData.value = {
    full_name: user.full_name,
    email: user.email,
    username: user.username,
    password: '',
    role: user.role,
    supplier_id: user.supplier_id
  }
  showModal.value = true
}

const handleSave = async () => {
  formLoading.value = true
  formError.value = ''
  try {
    if (isEditing.value) {
      const payload = {
        full_name: formData.value.full_name?.trim(),
        email: formData.value.email?.trim(),
        role: formData.value.role
      }
      if (formData.value.role === 'supplier') {
        payload.supplier_id = formData.value.supplier_id ? Number(formData.value.supplier_id) : null
      }
      await api.put(`/users/${editingUserId.value}`, payload)
    } else {
      const payload = {
        full_name: formData.value.full_name?.trim(),
        username: formData.value.username?.trim(),
        email: formData.value.email?.trim(),
        password: formData.value.password,
        role: formData.value.role
      }
      if (formData.value.role === 'supplier') {
        payload.supplier_id = formData.value.supplier_id ? Number(formData.value.supplier_id) : null
      }
      await api.post('/users', payload)
    }
    showModal.value = false
    fetchUsers()
    modalStore.showSuccess(
      isEditing.value ? 'User Account Updated' : 'User Account Created',
      `Account "${formData.value.username}" was saved successfully.`
    )
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to save user account.'
  } finally {
    formLoading.value = false
  }
}

// ── Deactivate ──────────────────────────────────
const confirmDeactivate = (user) => {
  deactivatingUser.value = user
  showDeactivateModal.value = true
}

const handleDeactivate = async () => {
  if (!deactivatingUser.value) return
  deactivateLoading.value = true
  const targetName = deactivatingUser.value.username || 'User'
  try {
    await api.delete(`/users/${deactivatingUser.value.id}`)
    showDeactivateModal.value = false
    deactivatingUser.value = null
    fetchUsers()
    modalStore.showSuccess('User Deactivated', `User account "${targetName}" has been deactivated.`)
  } catch (err) {
    showDeactivateModal.value = false
    modalStore.showError('Deactivation Failed', err.response?.data?.message || 'Failed to deactivate user account.')
  } finally {
    deactivateLoading.value = false
  }
}

// ── Reset Password ───────────────────────────────────────
const openResetModal = (user) => {
  resetUserId.value = user.id
  resetUserName.value = user.full_name || user.username
  newPassword.value = ''
  resetError.value = ''
  resetSuccess.value = ''
  showResetModal.value = true
}

const handleResetPassword = async () => {
  resetError.value = ''
  resetSuccess.value = ''
  try {
    await api.put(`/users/${resetUserId.value}/reset-password`, { new_password: newPassword.value })
    showResetModal.value = false
    modalStore.showSuccess('Password Updated', `Password for "${resetUserName.value}" has been updated successfully.`)
  } catch (err) {
    resetError.value = err.response?.data?.message || 'Failed to reset password.'
  }
}

// ── Helpers ──────────────────────────────────────────────
const canManageUser = (targetUser) => {
  if (targetUser.id === authStore.user?.id) return true
  if (authStore.isAdmin || authStore.isOwner) return true
  return false
}

const getRoleBadgeClass = (role) => {
  if (role === 'owner' || role === 'staff') return 'badge-owner'
  if (role === 'super_admin') return 'badge-super-admin'
  if (role === 'admin') return 'badge-admin'
  if (role === 'supplier') return 'badge-supplier'
  return 'badge-owner'
}

const getRoleName = (role) => {
  if (role === 'owner' || role === 'staff') return 'Owner'
  if (role === 'super_admin') return 'Super Admin'
  if (role === 'admin') return 'Administrator'
  if (role === 'supplier') return 'Supplier'
  return 'Owner'
}

const availableRoles = computed(() => {
  return [
    { value: 'owner', label: '👑 Owner (Business Owner - Full Operations)' },
    { value: 'admin', label: '🛡️ Admin (Manage Staff & Suppliers)' },
    { value: 'supplier', label: '🚚 Supplier (Vendor Portal Access)' }
  ]
})
</script>

<template>
  <div class="page-container">
    
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div>
        <h2>Staff & User Accounts</h2>
        <p class="subtitle">Administer Owner, Staff, and Supplier credentials and access permissions</p>
      </div>
      <BaseButton v-if="authStore.isAdmin || authStore.isOwner" variant="primary" @click="openCreateModal">
        <Plus size="18" /> Add User Account
      </BaseButton>
    </div>
    
    <!-- Unauthorized Banner -->
    <div v-if="!authStore.isAdmin && !authStore.isOwner" class="glass-card p-6 alert-danger">
      <div class="flex items-center gap-2">
        <ShieldAlert size="24" />
        <div>
          <strong>Access Restricted:</strong> You do not possess administrative permissions to view or edit user accounts.
        </div>
      </div>
    </div>

    <div v-else class="glass-card list-wrapper">
      
      <!-- RBAC Notice Bar -->
      <div class="rbac-notice">
        <div class="flex items-center gap-2">
          <ShieldCheck size="18" class="text-primary" />
          <span class="text-sm font-semibold">Active Profile: {{ getRoleName(authStore.user?.role) }}</span>
        </div>
        <span class="text-xs text-muted" v-if="authStore.isSuperAdmin">
          ✨ You hold Super Admin authority &bull; Full control over Admins, Staff, and Suppliers.
        </span>
        <span class="text-xs text-muted" v-else>
          🔒 Admin scope &bull; Authorized to manage and invite Supplier vendor profiles.
        </span>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-box input-wrapper">
          <Search class="input-icon" size="18" />
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search users by name, username, or email..." 
          />
        </div>

        <select class="filter-select" v-model="roleFilter">
          <option value="all">All Account Roles</option>
          <option value="owner">👑 Owners</option>
          <option value="admin">🛡️ Admins</option>
          <option value="supplier">🚚 Suppliers</option>
        </select>

        <span class="results-count text-muted text-sm ml-auto">
          Total: <strong>{{ filteredUsers.length }}</strong> users
        </span>
      </div>

      <!-- Users Table -->
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Linked Supplier</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center text-muted py-6">
                <div class="spinner mb-2"></div>
                <p>Loading accounts...</p>
              </td>
            </tr>
            <tr v-else-if="filteredUsers.length === 0">
              <td colspan="6" class="text-center text-muted py-6">
                <Users size="36" class="mb-2 text-muted" />
                <p>No user accounts found matching your search.</p>
              </td>
            </tr>
            <tr v-else v-for="user in filteredUsers" :key="user.id">
              <!-- User Info with Avatar -->
              <td>
                <div class="user-row-cell">
                  <div class="user-avatar-box" :class="`avatar-${user.role}`">
                    {{ user.full_name?.charAt(0) || user.username?.charAt(0) || 'U' }}
                  </div>
                  <div>
                    <div class="font-semibold text-primary">
                      {{ user.full_name }}
                      <span v-if="user.id === authStore.user?.id" class="self-tag">(You)</span>
                    </div>
                    <div class="text-xs text-muted code-font">@{{ user.username }}</div>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td class="text-secondary">{{ user.email }}</td>

              <!-- Role Badge -->
              <td>
                <span class="badge" :class="getRoleBadgeClass(user.role)">
                  {{ getRoleName(user.role) }}
                </span>
              </td>

              <!-- Linked Supplier (if applicable) -->
              <td>
                <span v-if="user.supplier_id" class="badge badge-supplier">
                  Supplier #{{ user.supplier_id }}
                </span>
                <span v-else class="text-muted text-xs">&mdash;</span>
              </td>

              <!-- Status -->
              <td>
                <span class="badge" :class="user.is_active ? 'badge-success' : 'badge-danger'">
                  <span class="status-dot" :class="user.is_active ? 'active' : 'inactive'"></span>
                  {{ user.is_active ? 'Active' : 'Deactivated' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="text-right action-cells">
                <template v-if="canManageUser(user)">
                  <button class="icon-btn edit" title="Edit User Information" @click="openEditModal(user)">
                    <Edit2 size="15" />
                  </button>
                  <button class="icon-btn" title="Reset User Password" @click="openResetModal(user)">
                    <KeyRound size="15" />
                  </button>
                  <button 
                    v-if="user.id !== authStore.user?.id" 
                    class="icon-btn delete" 
                    title="Deactivate Account" 
                    @click="confirmDeactivate(user)"
                  >
                    <Trash2 size="15" />
                  </button>
                </template>
                <span v-else class="text-xs text-muted italic restricted-tag">
                  Protected
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit User Modal -->
    <BaseModal v-model="showModal" :title="isEditing ? `Edit User Account: ${formData.full_name}` : 'Create New User Account'" maxWidth="540px">
      <div v-if="formError" class="modal-error">
        <AlertCircle size="18" />
        <span>{{ formError }}</span>
      </div>

      <div class="form-grid single-col">
        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" v-model="formData.full_name" placeholder="e.g. Jane Doe" required />
        </div>

        <div class="form-group" v-if="!isEditing">
          <label>Username (Unique identifier) *</label>
          <input type="text" v-model="formData.username" placeholder="e.g. janedoe" required />
        </div>

        <div class="form-group">
          <label>Email Address *</label>
          <input type="email" v-model="formData.email" placeholder="jane@company.com" required />
        </div>

        <div class="form-group" v-if="!isEditing">
          <label>Initial Password *</label>
          <input type="password" v-model="formData.password" placeholder="At least 8 chars, 1 uppercase, 1 number" required />
          <p class="form-hint">Requirement: 8+ characters, at least 1 uppercase letter, 1 number.</p>
        </div>

        <div class="form-group">
          <label>System Role *</label>
          <select v-model="formData.role">
            <option v-for="r in availableRoles" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>

        <div class="form-group" v-if="formData.role === 'supplier'">
          <label>Linked Supplier Company *</label>
          <select v-model="formData.supplier_id">
            <option :value="null" disabled>-- Choose Supplier Entity --</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }} ({{ s.code }})</option>
          </select>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" @click="showModal = false">Cancel</BaseButton>
        <BaseButton variant="primary" :loading="formLoading" @click="handleSave">
          {{ isEditing ? 'Update User' : 'Create Account' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Reset Password Modal -->
    <BaseModal v-model="showResetModal" :title="`Reset Password: ${resetUserName}`" maxWidth="460px">
      <div v-if="resetError" class="modal-error">
        <AlertCircle size="18" />
        <span>{{ resetError }}</span>
      </div>

      <div v-if="resetSuccess" class="success-alert">
        <ShieldCheck size="18" />
        <span>{{ resetSuccess }}</span>
      </div>

      <div class="form-group mb-4">
        <label>New Password *</label>
        <div class="input-wrapper">
          <input 
            :type="showResetPassword ? 'text' : 'password'" 
            v-model="newPassword" 
            placeholder="Min 8 chars, 1 uppercase, 1 number" 
          />
          <button 
            type="button" 
            class="password-toggle" 
            @click="showResetPassword = !showResetPassword"
            tabindex="-1"
          >
            <EyeOff v-if="showResetPassword" size="18" />
            <Eye v-else size="18" />
          </button>
        </div>
        <p class="form-hint mt-2">Security: 8+ characters, at least 1 uppercase letter and 1 numeric digit.</p>
      </div>

      <template #footer>
        <BaseButton variant="outline" @click="showResetModal = false">Cancel</BaseButton>
        <BaseButton variant="primary" @click="handleResetPassword">
          Update Password
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Deactivate Confirmation Modal -->
    <BaseModal v-model="showDeactivateModal" title="Confirm Account Deactivation" maxWidth="440px">
      <div class="p-2">
        <p class="modal-text">
          Are you sure you want to deactivate account <strong>{{ deactivatingUser?.full_name }}</strong> (@{{ deactivatingUser?.username }})?
        </p>
        <p class="text-xs text-muted mt-2">
          Deactivated accounts cannot authenticate or access system operations until reactivated by an administrator.
        </p>
      </div>
      <template #footer>
        <BaseButton variant="outline" @click="showDeactivateModal = false">Cancel</BaseButton>
        <BaseButton variant="danger" :loading="deactivateLoading" @click="handleDeactivate">
          Deactivate User
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

.rbac-notice {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: rgba(99, 102, 241, 0.08);
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.user-row-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: white;
  flex-shrink: 0;
}

.avatar-super_admin { background: linear-gradient(135deg, #8b5cf6, #ec4899); }
.avatar-admin { background: linear-gradient(135deg, #3b82f6, #06b6d4); }
.avatar-staff { background: linear-gradient(135deg, #64748b, #475569); }
.avatar-supplier { background: linear-gradient(135deg, #f59e0b, #ea580c); }

.self-tag {
  font-size: 0.725rem;
  color: #818cf8;
  font-weight: 600;
  margin-left: 4px;
}

.restricted-tag {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.form-grid.single-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.35rem;
}

.password-toggle:hover {
  color: var(--text-primary);
}

.ml-auto {
  margin-left: auto;
}
</style>
