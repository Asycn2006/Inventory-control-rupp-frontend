<script setup>
import { onMounted, onUnmounted, ref, provide } from 'vue'
import { RouterView } from 'vue-router'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
import { connectSocket, disconnectSocket } from '@/api/socket'

const lowStockAlerts = ref([])
provide('lowStockAlerts', lowStockAlerts)

onMounted(() => {
  const socket = connectSocket();
  if (socket) {
    socket.on('low_stock_alert', (data) => {
      console.log('Low stock alert received:', data);
      lowStockAlerts.value = data.products || [];
    });
  }
})

onUnmounted(() => {
  disconnectSocket();
})
</script><template>
  <div class="app-layout">
    <Sidebar />
    <main class="main-content">
      <Navbar />
      <div class="content-area animate-fade-in">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  padding: 1rem;
  gap: 1rem;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}
.content-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
}
/* Custom Scrollbar */
.content-area::-webkit-scrollbar { width: 6px; }
.content-area::-webkit-scrollbar-track { background: transparent; }
.content-area::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
.content-area::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
</style>
