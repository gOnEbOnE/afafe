<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref } from 'vue'

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <nav class="bg-white shadow-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo/Brand -->
        <RouterLink to="/" class="flex items-center gap-2">
          <span class="text-xl font-bold text-green-600">Vehicle Rental App</span>
        </RouterLink>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-8">
          <RouterLink
            to="/vehicles"
            class="text-gray-700 hover:text-green-600 font-medium transition"
            active-class="text-green-600 border-b-2 border-green-600"
          >
            Vehicles
          </RouterLink>
          <RouterLink
            to="/bookings"
            class="text-gray-700 hover:text-green-600 font-medium transition"
            active-class="text-green-600 border-b-2 border-green-600"
          >
            Bookings
          </RouterLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMenu"
          class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-green-600 focus:outline-none"
        >
          <svg
            class="h-6 w-6"
            :class="{ 'hidden': isMenuOpen, 'block': !isMenuOpen }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg
            class="h-6 w-6"
            :class="{ 'block': isMenuOpen, 'hidden': !isMenuOpen }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile Navigation -->
      <div v-if="isMenuOpen" class="md:hidden pb-4">
        <RouterLink
          to="/vehicles"
          class="block px-3 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100 font-medium transition"
          @click="isMenuOpen = false"
        >
          Vehicles
        </RouterLink>
        <RouterLink
          to="/bookings"
          class="block px-3 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100 font-medium transition"
          @click="isMenuOpen = false"
        >
          Bookings
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav {
  transition: all 0.3s ease;
}
</style>
