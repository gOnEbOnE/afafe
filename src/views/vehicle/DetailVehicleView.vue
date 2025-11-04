<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVehicleStore } from '@/stores/vehicle/vehicle.store'

const route = useRoute()
const router = useRouter()
const vehicleStore = useVehicleStore()

const vehicleId = route.params.id as string

onMounted(async () => {
  await vehicleStore.getVehicleById(vehicleId)
})

const handleUpdate = () => {
  router.push({ name: 'update-vehicle', params: { id: vehicleId } })
}

const handleDelete = async () => {
  if (confirm('Apakah Anda yakin ingin menghapus kendaraan ini?')) {
    const success = await vehicleStore.deleteVehicle(vehicleId)
    if (success) {
      router.push({ name: 'vehicles' })
    }
  }
}

const handleBack = () => {
  router.back()
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
      return 'bg-green-100 text-green-800'
    case 'rented':
      return 'bg-blue-100 text-blue-800'
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header with Title and Action Buttons -->
      <div class="flex justify-between items-start mb-8">
        <h1 class="text-4xl font-bold text-gray-900">Vehicle Details</h1>
        <div class="flex gap-3">
          <button
            @click="handleUpdate"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            Update Vehicle Details
          </button>
          <button
            @click="handleDelete"
            class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
          >
            Delete Vehicle
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="vehicleStore.loading" class="text-center py-12">
        <div class="inline-block">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <p class="mt-4 text-gray-600">Loading vehicle details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="vehicleStore.error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
        <p class="font-semibold">Error:</p>
        <p>{{ vehicleStore.error }}</p>
      </div>

      <!-- Vehicle Details -->
      <div v-else-if="vehicleStore.currentVehicle" class="bg-white shadow-lg rounded-lg p-8 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Left Column -->
          <div class="space-y-6">
            <!-- Vehicle ID -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle ID</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.id }}</p>
            </div>

            <!-- Vehicle Type -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle Type</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.type }}</p>
            </div>

            <!-- Vehicle Model -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle Model</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.model }}</p>
            </div>

            <!-- Location -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Location</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.location }}</p>
            </div>

            <!-- Capacity -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Capacity</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.capacity }} orang</p>
            </div>

            <!-- Fuel Type -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Fuel Type</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.fuelType }}</p>
            </div>

            <!-- Status -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Status</p>
              <div class="mt-1">
                <span :class="['px-3 py-1 rounded-full text-sm font-medium', getStatusColor(vehicleStore.currentVehicle.status)]">
                  {{ vehicleStore.currentVehicle.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- Vendor Name -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vendor Name</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.rentalVendor?.name || 'N/A' }}</p>
            </div>

            <!-- Vehicle Brand -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle Brand</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.brand }}</p>
            </div>

            <!-- Vehicle Production Year -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle Production Year</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.year }}</p>
            </div>

            <!-- License Plate -->
            <div>
              <p class="text-sm text-gray-500 font-medium">License Plate</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.licensePlate }}</p>
            </div>

            <!-- Transmission -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Transmission</p>
              <p class="text-lg font-semibold text-gray-900">{{ vehicleStore.currentVehicle.transmission }}</p>
            </div>

            <!-- Price per Day -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Price per Day</p>
              <p class="text-lg font-semibold text-green-600">{{ formatPrice(vehicleStore.currentVehicle.price) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <button
        @click="handleBack"
        class="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
      >
        Back
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions */
button {
  transition: all 0.3s ease;
}
</style>
