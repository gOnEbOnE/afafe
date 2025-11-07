<script setup lang="ts">
import { RouterView } from 'vue-router'
import VNavbar from './components/layout/VNavbar.vue'
import { Toaster } from 'vue-sonner'
</script>

<template>
  <div>
    <!-- ✅ Add Toaster component -->
    <Toaster />

    <VNavbar />
    <main class="min-h-screen bg-gray-50">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
main {
  transition: background-color 0.3s ease;
}
</style>
