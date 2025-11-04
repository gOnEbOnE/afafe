<script setup lang="ts">
import { onMounted } from 'vue';
import { useStatisticsStore } from '@/stores/statistics/statistics.store';
import { RouterLink } from 'vue-router';

const statisticsStore = useStatisticsStore();

onMounted(() => {
  statisticsStore.fetchStatistics();
});
</script>

<template>
  <main class="flex items-center justify-center w-full min-h-screen bg-gray-50 py-12">
    <div class="w-full max-w-4xl px-4">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-2">
          Welcome to <span class="text-green-600">Vehicle Rentals</span>
        </h1>
        <p class="text-gray-600">
          Find and book your ideal vehicle easily. Quick, reliable, and ready for your next adventure!
        </p>
      </div>

      <!-- Platform Statistics Section -->
      <div class="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 class="text-2xl font-bold text-center mb-8">Platform Statistics</h2>

        <!-- Loading State -->
        <div v-if="statisticsStore.loading" class="flex justify-center items-center py-8">
          <div class="text-gray-600">Loading statistics...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="statisticsStore.error" class="flex justify-center items-center py-8">
          <div class="text-red-600">{{ statisticsStore.error }}</div>
        </div>

        <!-- Statistics Cards -->
        <div v-else class="grid grid-cols-3 gap-6 mb-8">
          <!-- Registered Vehicles -->
          <div class="bg-gray-50 rounded-lg p-6 text-center">
            <div class="text-4xl mb-2">🚗</div>
            <p class="text-gray-600 text-sm mb-2">Registered Vehicles</p>
            <p class="text-3xl font-bold text-green-600">
              {{ statisticsStore.statistics.vehicleCount }}
            </p>
          </div>

          <!-- Registered Vendors -->
          <div class="bg-gray-50 rounded-lg p-6 text-center">
            <div class="text-4xl mb-2">👤</div>
            <p class="text-gray-600 text-sm mb-2">Registered Vendors</p>
            <p class="text-3xl font-bold text-purple-600">
              {{ statisticsStore.statistics.vendorCount }}
            </p>
          </div>

          <!-- Bookings Made -->
          <div class="bg-gray-50 rounded-lg p-6 text-center">
            <div class="text-4xl mb-2">📅</div>
            <p class="text-gray-600 text-sm mb-2">Bookings Made</p>
            <p class="text-3xl font-bold text-blue-600">
              {{ statisticsStore.statistics.bookingCount }}
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center gap-4">
          <RouterLink to="/vehicles">
            <button class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition">
              See Vehicles
            </button>
          </RouterLink>
          <RouterLink to="/bookings">
            <button class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition">
              Book Rentals
            </button>
          </RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Add custom styles if needed */
</style>
