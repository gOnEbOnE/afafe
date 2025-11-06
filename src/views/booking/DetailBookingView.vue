<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking/booking.store'
import { useVehicleStore } from '@/stores/vehicle/vehicle.store'
import type { RentalAddOn } from '@/interfaces/booking.interface'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()
const vehicleStore = useVehicleStore()

const bookingId = route.params.id as string
const showAddOnsModal = ref(false)

// Computed properties
const currentBooking = computed(() => bookingStore.currentBooking)
const loading = computed(() => bookingStore.loading)
const error = computed(() => bookingStore.error)

onMounted(async () => {
  await bookingStore.getBookingById(bookingId)
})

// Navigation handlers
const handleUpdateBooking = () => {
  router.push({ name: 'update-booking', params: { id: bookingId } })
}

const handleUpdateAddOns = () => {
  router.push({ name: 'update-add-ons', params: { id: bookingId } })
}

const handleUpdateStatus = () => {
  router.push({ name: 'update-booking-status', params: { id: bookingId } })
}

const handleCancelBooking = async () => {
  if (confirm('Apakah Anda yakin ingin membatalkan booking ini?')) {
    const updatedBooking = await bookingStore.updateBooking({
      id: bookingId,
      vehicleId: currentBooking.value!.vehicleId,
      pickUpTime: currentBooking.value!.pickUpTime,
      dropOffTime: currentBooking.value!.dropOffTime,
      pickUpLocation: currentBooking.value!.pickUpLocation,
      dropOffLocation: currentBooking.value!.dropOffLocation,
      capacityNeeded: currentBooking.value!.capacityNeeded,
      transmissionNeeded: currentBooking.value!.transmissionNeeded,
      includeDriver: currentBooking.value!.includeDriver,
      status: 'Cancelled'
    })
    if (updatedBooking) {
      router.push({ name: 'bookings' })
    }
  }
}

const handleViewVehicle = () => {
  router.push({ name: 'vehicle-detail', params: { id: currentBooking.value?.vehicleId } })
}

const handleBack = () => {
  router.back()
}

// Utility functions
const formatDateTime = (dateTimeString: string) => {
  return new Date(dateTimeString).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price)
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-800'
    case 'ongoing':
      return 'bg-yellow-100 text-yellow-800'
    case 'done':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Check button visibility
const canUpdateBooking = computed(() => {
  return currentBooking.value?.status.toLowerCase() === 'upcoming'
})

const canUpdateAddOns = computed(() => {
  return currentBooking.value?.status.toLowerCase() === 'upcoming'
})

const canUpdateStatus = computed(() => {
  const status = currentBooking.value?.status.toLowerCase()
  return status === 'upcoming' || status === 'ongoing'
})

const canCancelBooking = computed(() => {
  return currentBooking.value?.status.toLowerCase() === 'upcoming'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header with Title and Action Buttons -->
      <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <h1 class="text-4xl font-bold text-gray-900">Booking Details</h1>
        <div class="flex gap-3 w-full md:w-auto flex-wrap">
          <button
            v-if="canUpdateBooking"
            @click="handleUpdateBooking"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition text-sm md:text-base"
          >
            Update Booking Details
          </button>
          <button
            v-if="canUpdateAddOns"
            @click="handleUpdateAddOns"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm md:text-base"
          >
            Update Add-Ons
          </button>
          <button
            v-if="canUpdateStatus"
            @click="handleUpdateStatus"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition text-sm md:text-base"
          >
            Update Status
          </button>
          <button
            v-if="canCancelBooking"
            @click="handleCancelBooking"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition text-sm md:text-base"
          >
            Cancel Booking
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <p class="mt-4 text-gray-600">Loading booking details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 mb-6">
        <p class="font-semibold">Error:</p>
        <p>{{ error }}</p>
      </div>

      <!-- Booking Details Card -->
      <div v-else-if="currentBooking" class="bg-white shadow-lg rounded-lg p-8 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Left Column -->
          <div class="space-y-6">
            <!-- Booking ID -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Booking ID</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentBooking.id }}</p>
            </div>

            <!-- Pick Up Time -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Pick-up Time</p>
              <p class="text-lg font-semibold text-gray-900">{{ formatDateTime(currentBooking.pickUpTime) }}</p>
            </div>

            <!-- Pick Up Location -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Pick-up Location</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentBooking.pickUpLocation }}</p>
            </div>

            <!-- Include Driver -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Include Driver?</p>
              <p class="text-lg font-semibold text-gray-900">
                {{ currentBooking.includeDriver ? 'Yes' : 'No' }}
              </p>
            </div>

            <!-- Total Price -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Total Price</p>
              <p class="text-lg font-semibold text-green-600">{{ formatPrice(currentBooking.totalPrice) }}</p>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- Vehicle ID (Clickable Link) -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle ID</p>
              <button
                @click="handleViewVehicle"
                class="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition"
              >
                {{ currentBooking.vehicleId }}
              </button>
            </div>

            <!-- Drop Off Time -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Drop-off Time</p>
              <p class="text-lg font-semibold text-gray-900">{{ formatDateTime(currentBooking.dropOffTime) }}</p>
            </div>

            <!-- Drop Off Location -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Drop-off Location</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentBooking.dropOffLocation }}</p>
            </div>

            <!-- Status -->
            <div>
              <p class="text-sm text-gray-500 font-medium">Status</p>
              <div class="mt-1">
                <span :class="['px-3 py-1 rounded-full text-sm font-medium', getStatusColor(currentBooking.status)]">
                  {{ currentBooking.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Vehicle Details Summary -->
        <div class="mt-8 pt-8 border-t border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p class="text-sm text-gray-500 font-medium">Vehicle</p>
              <p class="text-lg font-semibold text-gray-900">
                {{ currentBooking.vehicleBrand }} {{ currentBooking.vehicleModel }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 font-medium">Capacity Needed</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentBooking.capacityNeeded }} passengers</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 font-medium">Transmission Needed</p>
              <p class="text-lg font-semibold text-gray-900">{{ currentBooking.transmissionNeeded }}</p>
            </div>
          </div>
        </div>

        <!-- View Add-Ons Button -->
        <div class="mt-8">
          <button
            @click="showAddOnsModal = true"
            class="w-full py-3 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition"
          >
            View Add-Ons
          </button>
        </div>
      </div>

      <!-- No Data State -->
      <div v-else class="bg-gray-100 rounded-lg p-8 text-center">
        <p class="text-gray-600">No booking data available</p>
      </div>

      <!-- Back Button -->
      <button
        @click="handleBack"
        class="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition mt-6"
      >
        Back
      </button>
    </div>

    <!-- Add-Ons Modal -->
    <div
      v-if="showAddOnsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-gray-900">Add-Ons</h2>
          <button
            @click="showAddOnsModal = false"
            class="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <!-- Add-Ons List -->
        <div v-if="currentBooking?.listOfAddOns && currentBooking.listOfAddOns.length > 0" class="space-y-4">
          <div
            v-for="addOn in currentBooking.listOfAddOns"
            :key="addOn.id"
            class="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div>
              <p class="font-semibold text-gray-900">{{ addOn.name }}</p>
              <p class="text-sm text-gray-500">ID: {{ addOn.id }}</p>
            </div>
            <p class="font-semibold text-green-600">{{ formatPrice(addOn.price) }}</p>
          </div>
        </div>

        <!-- No Add-Ons -->
        <div v-else class="text-center py-8">
          <p class="text-gray-600">No add-ons selected for this booking</p>
        </div>

        <!-- Close Button -->
        <button
          @click="showAddOnsModal = false"
          class="w-full mt-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
button {
  transition: all 0.3s ease;
}
</style>
