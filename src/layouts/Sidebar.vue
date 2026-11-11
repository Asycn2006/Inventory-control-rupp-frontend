<script setup>
import { useAuthStore } from '@/stores/auth'
import { LogOut, LayoutDashboard, Package, Users, ShoppingCart, Settings, Shield, Crown, Truck } from 'lucide-vue-next'

const authStore = useAuthStore()
const handleLogout = () => authStore.logout()
</script>

<template>
  <aside class="sidebar glass-card">
    <!-- Brand Header -->
    <div class="sidebar-header">
      <div class="logo-box">
        <Package size="22" color="white" />
      </div>
      <div class="brand-text">
        <h2 class="text-gradient">InvenSys</h2>
        <span class="version-tag">ERP Pro</span>
      </div>
    </div>

    <!-- Navigation Links -->
    <nav class="sidebar-nav">
      <!-- ADMIN VIEW: Focused strictly on Suppliers and Staff/User Accounts -->
      <template v-if="authStore.isAdmin">
        <div class="nav-section-title">Administration</div>

        <router-link to="/users" class="nav-item">
          <Users size="19" class="nav-icon" />
          <span>Staff & User Accounts</span>
        </router-link>

        <router-link to="/settings" class="nav-item">
          <Truck size="19" class="nav-icon" />
          <span>Suppliers Management</span>
        </router-link>
      </template>

      <!-- OWNER VIEW: Full Business & Inventory Operations -->
      <template v-else-if="authStore.isOwner">
        <div class="nav-section-title">Operations</div>

        <router-link to="/dashboard" class="nav-item">
          <LayoutDashboard size="19" class="nav-icon" />
          <span>Dashboard</span>
        </router-link>

        <router-link to="/products" class="nav-item">
          <Package size="19" class="nav-icon" />
          <span>Products & Stock</span>
        </router-link>

        <router-link to="/orders" class="nav-item">
          <ShoppingCart size="19" class="nav-icon" />
          <span>Orders Management</span>
        </router-link>

        <div class="nav-section-title mt-4">Management</div>

        <router-link to="/settings" class="nav-item">
          <Settings size="19" class="nav-icon" />
          <span>System Master Data</span>
        </router-link>

        <router-link to="/users" class="nav-item">
          <Users size="19" class="nav-icon" />
          <span>Staff & User Accounts</span>
        </router-link>
      </template>

      <!-- SUPPLIER VIEW: External Vendor Portal -->
      <template v-else-if="authStore.isSupplier">
        <div class="nav-section-title">Vendor Portal</div>

        <router-link to="/dashboard" class="nav-item">
          <LayoutDashboard size="19" class="nav-icon" />
          <span>Overview</span>
        </router-link>

        <router-link to="/products" class="nav-item">
          <Package size="19" class="nav-icon" />
          <span>My Supplied Products</span>
        </router-link>

        <router-link to="/orders" class="nav-item">
          <ShoppingCart size="19" class="nav-icon" />
          <span>Vendor Orders</span>
        </router-link>

        <router-link to="/settings" class="nav-item">
          <Settings size="19" class="nav-icon" />
          <span>My Profile</span>
        </router-link>
      </template>
    </nav>

    <!-- User Profile & Logout -->
    <div class="sidebar-footer">
      <div class="user-card" v-if="authStore.user">
        <div class="avatar-ring" :class="{ 'owner-ring': authStore.isOwner }">
          <div class="avatar">{{ authStore.user?.full_name?.charAt(0) || 'U' }}</div>
        </div>
        <div class="user-info">
          <span class="user-name" :title="authStore.user?.full_name">{{ authStore.user?.full_name }}</span>
          <span class="role-badge" :class="`role-${authStore.isOwner ? 'owner' : authStore.user?.role}`">
            <Crown v-if="authStore.isOwner" size="11" />
            <Shield v-else size="10" /> 
            {{ authStore.isOwner ? 'OWNER' : authStore.user?.role?.replace('_', ' ') }}
          </span>
        </div>
      </div>

      <button @click="handleLogout" class="btn btn-outline w-100 logout-btn">
        <LogOut size="16" />
        <span>Sign Out</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 270px;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  flex-shrink: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.85);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.5rem 0.5rem 1.5rem 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 1.25rem;
}

.logo-box {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.sidebar-header h2 {
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0;
  line-height: 1.1;
}

.version-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  overflow-y: auto;
}

.nav-section-title {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.5rem 0.85rem 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 0.95rem;
  border-radius: 10px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: var(--transition);
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  transform: translateX(2px);
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(139, 92, 246, 0.15));
  color: #a5b4fc;
  font-weight: 600;
  border: 1px solid rgba(99, 102, 241, 0.25);
  box-shadow: 0 2px 10px rgba(79, 70, 229, 0.15);
}

.nav-icon {
  color: var(--text-muted);
  transition: color 0.2s;
  flex-shrink: 0;
}

.nav-item:hover .nav-icon {
  color: var(--text-primary);
}

.nav-item.router-link-active .nav-icon {
  color: #818cf8;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 0.85rem;
}

.avatar-ring {
  padding: 2px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 50%;
  flex-shrink: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1e1b4b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #c7d2fe;
  font-size: 0.85rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
  width: fit-content;
  color: var(--text-muted);
}

.role-super_admin { color: #c4b5fd; }
.role-admin { color: #93c5fd; }
.role-supplier { color: #fde68a; }
.role-staff { color: #cbd5e1; }
.role-owner {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.35);
  padding: 0.1rem 0.45rem;
  border-radius: 6px;
}
.owner-ring {
  background: linear-gradient(135deg, #f59e0b, #ec4899) !important;
}

.logout-btn {
  height: 38px;
  font-size: 0.85rem;
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.04);
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}
</style>
