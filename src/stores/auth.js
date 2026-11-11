import { defineStore } from 'pinia'
import api from '@/api/axios'
import router from '@/router'
import { disconnectSocket } from '@/api/socket'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    isSuperAdmin: (state) => state.user?.role === 'super_admin',
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.role === 'super_admin',
    isOwner: (state) => state.user?.role === 'owner' || state.user?.role === 'staff',
    isStaff: (state) => state.user?.role === 'staff' || state.user?.role === 'owner',
    isSupplier: (state) => state.user?.role === 'supplier',
    userRole: (state) => (state.user?.role === 'staff' || state.user?.role === 'owner') ? 'owner' : state.user?.role
  },
  
  actions: {
    setTokens(accessToken, refreshToken) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    },
    
    async login(credentials) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/auth/login', credentials)
        
        if (data.success) {
          this.user = data.data.user
          this.setTokens(data.data.accessToken, data.data.refreshToken)
          localStorage.setItem('user', JSON.stringify(this.user))
          router.push('/dashboard')
          return true
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed'
        return false
      } finally {
        this.loading = false
      }
    },
    
    async logout() {
      try {
        if (this.refreshToken) {
          await api.post('/auth/logout', { refreshToken: this.refreshToken })
        }
      } catch (e) {
        console.error('Logout API failed', e)
      } finally {
        disconnectSocket()
        this.user = null
        this.accessToken = null
        this.refreshToken = null
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        router.push('/login')
      }
    }
  }
})
