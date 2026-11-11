<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Lock, Mail, Loader2, Package, Eye, EyeOff, ShieldCheck, Crown, Truck } from 'lucide-vue-next'

const authStore = useAuthStore()
const login = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  if (!login.value || !password.value) {
    errorMsg.value = 'Please enter your username/email and password'
    return
  }
  
  const success = await authStore.login({ login: login.value, password: password.value })
  if (!success) {
    errorMsg.value = authStore.error || 'Invalid credentials'
  }
}

const fillAccount = (u, p) => {
  login.value = u
  password.value = p
  errorMsg.value = ''
}
</script>

<template>
  <div class="login-container">
    <div class="login-wrapper animate-fade-in">
      
      <!-- Premium Glass Card -->
      <div class="glass-card login-card">
        <div class="header text-center">
          <div class="logo-icon mx-auto mb-4">
            <Package size="34" color="white" />
          </div>
          <h1 class="text-gradient">Welcome Back</h1>
          <p class="subtitle">Inventory System Control ERP</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div v-if="errorMsg" class="error-alert">
            {{ errorMsg }}
          </div>

          <div class="input-group">
            <label>Email or Username</label>
            <div class="input-wrapper">
              <Mail class="input-icon" size="18" />
              <input 
                type="text" 
                v-model="login" 
                placeholder="admin@inventory.com or username"
                :disabled="authStore.loading"
                autofocus
              />
            </div>
          </div>

          <div class="input-group">
            <div class="flex justify-between items-center mb-1">
              <label style="margin-bottom: 0;">Password</label>
            </div>
            <div class="input-wrapper">
              <Lock class="input-icon" size="18" />
              <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="password" 
                placeholder="••••••••••••"
                :disabled="authStore.loading"
              />
              <button 
                type="button" 
                class="password-toggle" 
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <EyeOff v-if="showPassword" size="18" />
                <Eye v-else size="18" />
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-100 mt-4 submit-btn" 
            :disabled="authStore.loading"
          >
            <Loader2 v-if="authStore.loading" class="spin" size="18" />
            <span v-else>Sign In to Workspace</span>
          </button>
        </form>

        <!-- Quick Fill Helpers for Testing / Evaluation -->
        <div class="quick-fill-section">
          <span class="quick-title">Quick Demo Logins</span>
          <div class="quick-buttons">
            <button type="button" class="quick-pill owner-pill" @click="fillAccount('staff1@inventory.com', 'password123')">
              <Crown size="13" /> Owner
            </button>
            <button type="button" class="quick-pill" @click="fillAccount('admin@inventory.com', 'password123')">
              <ShieldCheck size="13" /> Admin (Suppliers & Staff)
            </button>
            <button type="button" class="quick-pill" @click="fillAccount('supplier1@inventory.com', 'password123')">
              <Truck size="13" /> Supplier
            </button>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.login-wrapper {
  width: 100%;
  max-width: 440px;
}

.login-card {
  padding: 2.75rem 2.25rem 2rem;
  background: rgba(17, 24, 39, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.header {
  margin-bottom: 2rem;
  text-align: center;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4);
  margin-left: auto;
  margin-right: auto;
}

.header h1 {
  font-size: 1.75rem;
  margin-bottom: 0.35rem;
  font-weight: 800;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-muted);
  pointer-events: none;
}

.input-wrapper input {
  padding-left: 2.75rem;
  padding-right: 2.75rem;
  height: 48px;
  background-color: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.input-wrapper input:focus {
  background-color: #172033;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: color 0.15s;
}

.password-toggle:hover {
  color: var(--text-primary);
}

.submit-btn {
  height: 48px;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
}

.quick-fill-section {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.quick-title {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.65rem;
}

.quick-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.quick-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.quick-pill:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #c7d2fe;
}

.owner-pill {
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.08);
}

.owner-pill:hover {
  background: rgba(245, 158, 11, 0.2) !important;
  color: #fde68a !important;
  border-color: rgba(245, 158, 11, 0.5) !important;
}
</style>
