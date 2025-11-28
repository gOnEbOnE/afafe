<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth/auth.store'; // Pastikan path import store benar

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  console.log("🔄 Memproses Login SSO...");
  console.log("📍 Current Path:", route.path);
  console.log("📍 Query Params:", route.query);

  // Ambil OTT atau Code dari URL parameter
  let ottCode = route.query.code || route.query.ott;

  // Jika tidak ada di query, coba parse dari path (untuk format /login-success/auth?ott=xxx)
  if (!ottCode && route.path.includes('/auth')) {
    const fullUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    ottCode = urlParams.get('ott') || urlParams.get('code');
    console.log("📍 Parsed from URL:", ottCode);
  }

  if (ottCode) {
    console.log("🔑 OTT Code found:", ottCode);
    
    // Panggil action exchangeToken di store (yang sudah kita update sebelumnya)
    const success = await authStore.exchangeToken(ottCode as string);

    if (success) {
      console.log("✅ Login Berhasil, Redirecting...");
      router.push('/'); // Redirect ke Dashboard/Home
    } else {
      console.error("❌ Gagal menukar token");
      alert("Login Gagal! Silakan coba lagi.");
      router.push('/'); // Redirect ke Home (atau halaman login)
    }
  } else {
    console.warn("⚠️ Tidak ada code/ott di URL");
    alert("Parameter login tidak ditemukan.");
    router.push('/');
  }
});
</script>

<template>
  <div class="login-success-container">
    <div class="loading-content">
      <div class="spinner"></div>
      <h2>Sedang memproses login...</h2>
      <p>Mohon tunggu sebentar.</p>
    </div>
  </div>
</template>

<style scoped>
.login-success-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8f9fa;
  text-align: center;
}

.loading-content h2 {
  margin-top: 1rem;
  color: #333;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
