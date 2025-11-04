<script setup lang="ts">
import { RouterView } from 'vue-router'
import VNavbar from './components/layout/VNavbar.vue'
</script>

<template>
  <VNavbar />
  <main class="min-h-screen bg-gray-50">
    <RouterView />
  </main>
</template>

<style scoped>
main {
  transition: background-color 0.3s ease;
}
</style>
