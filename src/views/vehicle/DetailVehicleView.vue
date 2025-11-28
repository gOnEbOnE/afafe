<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVehicleStore } from '@/stores/vehicle/vehicle.store'
import { useAuthStore } from '@/stores/auth/auth.store'
import VDeleteVehicleButton from '@/components/vehicle/VDeleteVehicleButton.vue'

const route = useRoute()
const router = useRouter()
const vehicleStore = useVehicleStore()
const authStore = useAuthStore()

const vehicleId = route.params.id as string

// Computed property untuk akses data dengan lebih clean
const currentVehicle = computed(() => vehicleStore.currentVehicle)
const loading = computed(() => vehicleStore.loading)
const error = computed(() => vehicleStore.error)

// ✅ Helper: Get local vendor ID by matching email (same as VehicleView)
const localVendorId = computed(() => {
  if (authStore.user?.role !== 'RentalVendor' || !authStore.user?.email) {
    return null
  }

  const userEmail = authStore.user.email
  const matchingVendor = vehicleStore.vendors.find(
    (vendor) => vendor.email === userEmail
  )

  return matchingVendor?.id || null
})

// ✅ RBAC: Check if user can edit/delete this vehicle - using localVendorId with type conversion
const canModifyVehicle = computed(() => {
  if (!authStore.user || !currentVehicle.value) return false

  const userRole = authStore.user.role

  // Superadmin can modify all vehicles
  if (userRole === 'Superadmin') return true

  // Rental Vendor can only modify their own vehicles
  if (userRole === 'RentalVendor') {
    if (localVendorId.value === null) {
      return false
    }
    // Convert rentalVendorId to number for comparison
    const vehicleVendorId = typeof currentVehicle.value.rentalVendorId === 'string'
      ? parseInt(currentVehicle.value.rentalVendorId)
      : currentVehicle.value.rentalVendorId
    return vehicleVendorId === localVendorId.value
  }

  return false
})

onMounted(async () => {
  await vehicleStore.fetchVehicleById(vehicleId)
})

const handleUpdate = () => {
  router.push({ name: 'update-vehicle', params: { id: vehicleId } })
}

const handleDeleteSuccess = () => {
  router.push({ name: 'vehicles' })
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
    case 'unavailable':
      return 'bg-red-100 text-red-800'
    case 'rented':
      return 'bg-blue-100 text-blue-800'
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getVendorName = () => {
  if (!currentVehicle.value) return 'N/A'
  // Vehicle interface already has rentalVendorName property
  return currentVehicle.value.rentalVendorName || 'N/A'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header with Title and Action Buttons -->
      <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <h1 class="text-4xl font-bold text-gray-900">Vehicle Details</h1>

        <!-- ✅ Action Buttons - Only show if user can modify this vehicle -->
        <div v-if="canModifyVehicle" class="flex gap-3 w-full md:w-auto">
          <button
            @click="handleUpdate"
            class="flex-1 md:flex-none px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            Update Vehicle Details
          </button>
          <VDeleteVehicleButton
            :vehicle-id="vehicleId"
            :vehicle-name="currentVehicle ? `${currentVehicle.brand} ${currentVehicle.model}` : 'Kendaraan'"
            @deleted="handleDeleteSuccess"
            class="flex-1 md:flex-none"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <p class="mt-4 text-gray-600">Loading vehicle details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 mb-6">
        <p class="font-semibold">Error:</p>
        <p>{{ error }}</p>
      </div>

      <!-- Vehicle Details -->
      <div v-else-if="currentVehicle" class="bg-white shadow-lg rounded-lg p-8 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Left Column -->
          <div class="space-y-6">
            <!-- Vehicle ID -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle ID</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentVehicle.id }}</p>
            </div>

            <!-- Vendor Name -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Rental Vendor</p>
              <p class="text-lg font-semibold text-gray-900">{{ getVendorName() }}</p>
            </div>

            <!-- Vehicle Type -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle Type</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentVehicle.type }}</p>
            </div>

            <!-- Vehicle Brand -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle Brand</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentVehicle.brand }}</p>
            </div>

            <!-- Vehicle Model -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle Model</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentVehicle.model }}</p>
            </div>

            <!-- Production Year -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Production Year</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentVehicle.year }}</p>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- Location -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Location</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentVehicle.location }}</p>
            </div>

            <!-- License Plate -->
            <div>
              <p class="text-sm text-gray-500 font-medium">License Plate</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentVehicle.licensePlate }}</p>
            </div>

            <!-- Capacity -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Capacity</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentVehicle.capacity }} passengers</p>
            </div>

            <!-- Transmission -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Transmission</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentVehicle.transmission }}</p>
            </div>

            <!-- Fuel Type -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Fuel Type</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentVehicle.fuelType }}</p>
            </div>

            <!-- Status -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Status</p>
              <div class="mt-1">
                <span :class="['px-3 py-1 rounded-full text-sm font-medium', getStatusColor(currentVehicle.status)]">
                  {{ currentVehicle.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Price Section (Highlight) -->
        <div class="mt-8 pt-8 border-t border-gray-200">
          <div class="flex justify-between items-center">
            <p class="text-gray-600 font-medium">Price per Day:</p>
            <p class="text-3xl font-bold text-green-600">{{ formatPrice(currentVehicle.price) }}</p>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-else class="bg-gray-100 rounded-lg p-8 text-center">
        <p class="text-gray-600">No vehicle data available</p>
      </div>

      <!-- Back Button -->
      <button
        @click="handleBack"
        class="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition mt-6"
      >
        Back
      </button>
    </div>
  </div>
</template>

<style scoped>
button {
  transition: all 0.3s ease;
}
</style>
