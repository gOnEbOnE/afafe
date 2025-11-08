<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationStore } from '@/stores/location/location.store'
import { useBookingStore } from '@/stores/booking/booking.store'
import type { Province } from '@/interfaces/location.interface'
import type { RentalAddOn, AvailableVehicleResponseDTO } from '@/interfaces/booking.interface'
import { toast } from 'vue-sonner'
import axios from 'axios'

const router = useRouter()
const locationStore = useLocationStore()
const bookingStore = useBookingStore()

// Step state
const currentStep = ref<'details' | 'addons' | 'success'>('details')

// Form data - Page 1
const formPage1 = ref({
  includeDriver: false,
  pickUpLocation: '',
  dropOffLocation: '',
  pickUpTime: '',
  dropOffTime: '',
  capacityNeeded: 0,
  transmissionNeeded: 'Automatic',
})

// Form data - Page 2
const selectedVehicle = ref<AvailableVehicleResponseDTO | null>(null)
const selectedAddOns = ref<string[]>([])

// Data
const provinces = ref<Province[]>([])
const availableVehicles = ref<AvailableVehicleResponseDTO[]>([])
const allAddOns = ref<RentalAddOn[]>([])

// UI states
const loading = ref(false)
const searchLoading = ref(false)
const error = ref<string | null>(null)
const hasSearched = ref(false)
const isSubmitting = ref(false)
const successMessage = ref('')

// Computed properties
const minPickUpTime = computed(() => {
  const now = new Date()
  // Set minimum ke sekarang (tanpa +1 menit, biar lebih fleksibel)
  return now.toISOString().slice(0, 16)
})

const minDropOffTime = computed(() => {
  if (!formPage1.value.pickUpTime) return minPickUpTime.value
  return formPage1.value.pickUpTime
})

const rentalDays = computed(() => {
  if (!formPage1.value.pickUpTime || !formPage1.value.dropOffTime) return 0
  const pickUp = new Date(formPage1.value.pickUpTime)
  const dropOff = new Date(formPage1.value.dropOffTime)
  const hours = (dropOff.getTime() - pickUp.getTime()) / (1000 * 60 * 60)
  return Math.ceil(hours / 24) || 1
})

const driverCostPerDay = 100000

const selectedVehicleTotalPrice = computed(() => {
  if (!selectedVehicle.value) return 0

  // ✅ BASE: Vehicle price only (tanpa driver)
  const baseCost = selectedVehicle.value.pricePerDay * rentalDays.value

  // ✅ ADD: Driver cost if included
  const driverCost = formPage1.value.includeDriver
    ? rentalDays.value * driverCostPerDay
    : 0

  const total = baseCost + driverCost

  console.log('💰 Price Calculation:')
  console.log('   Base (vehicle only):', baseCost)
  console.log('   Driver cost:', driverCost)
  console.log('   Include driver:', formPage1.value.includeDriver)
  console.log('   Total:', total)

  return total
})

const addOnsTotalPrice = computed(() => {
  return selectedAddOns.value.reduce((total, addOnId) => {
    const addOn = allAddOns.value.find(a => a.id === addOnId)
    return total + (addOn?.price || 0)
  }, 0)
})

const grandTotal = computed(() => {
  return selectedVehicleTotalPrice.value + addOnsTotalPrice.value
})

// Methods
const loadProvinces = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:8080/api/bookings/provinces')
    if (response.data.status === 200) {
      const provinceNames = response.data.data
      provinces.value = provinceNames.map(name => ({
        code: name.toLowerCase().replace(/\s+/g, '-'),
        name: name
      }))
    } else {
      toast.error('Gagal memuat daftar lokasi')
    }
  } catch (err) {
    console.error('Error loading provinces:', err)
    toast.error('Gagal memuat daftar lokasi')
  } finally {
    loading.value = false
  }
}

const loadAddOns = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/bookings/addons')
    if (response.data.status === 200) {
      allAddOns.value = response.data.data || []
    } else {
      console.warn('Gagal memuat add-ons:', response.data.message)
    }
  } catch (err) {
    console.error('Error loading add-ons:', err)
    toast.error('Gagal memuat add-ons')
  }
}

const validatePage1 = (): boolean => {
  if (!formPage1.value.pickUpLocation) {
    toast.error('Pilih lokasi pengambilan kendaraan')
    return false
  }

  if (!formPage1.value.dropOffLocation) {
    toast.error('Pilih lokasi pengembalian kendaraan')
    return false
  }

  if (!formPage1.value.pickUpTime) {
    toast.error('Pilih waktu pengambilan kendaraan')
    return false
  }

  if (!formPage1.value.dropOffTime) {
    toast.error('Pilih waktu pengembalian kendaraan')
    return false
  }

  const pickUp = new Date(formPage1.value.pickUpTime)
  const dropOff = new Date(formPage1.value.dropOffTime)
  const now = new Date()

  console.log('🕐 [FE] Time validation:')
  console.log('   Device time:', now.toLocaleString())
  console.log('   Pick-up time:', pickUp.toLocaleString())
  console.log('   Difference (ms):', pickUp.getTime() - now.getTime())

  // ✅ INCREASED tolerance to 10 minutes
  const minAllowedTime = new Date(now.getTime() - 10 * 60000)

  if (pickUp < minAllowedTime) {
    console.log('❌ Pick-up time is too far in past')
    toast.error('Pick-up time paling cepat adalah sekarang')
    return false
  }

  if (pickUp >= dropOff) {
    toast.error('Waktu pengambilan harus sebelum waktu pengembalian')
    return false
  }

  if (formPage1.value.capacityNeeded <= 0) {
    toast.error('Kapasitas yang dibutuhkan harus lebih dari 0')
    return false
  }

  if (!formPage1.value.transmissionNeeded) {
    toast.error('Pilih jenis transmisi')
    return false
  }

  return true
}

const searchVehicles = async () => {
  if (!validatePage1()) return

  searchLoading.value = true
  error.value = null
  hasSearched.value = false

  try {
    // ✅ FIXED: Send as datetime-local format (NOT ISO with Z)
    // datetime-local value is already: "2025-11-07T17:00"
    // This is local time, so send it as-is
    const pickUpLocal = formPage1.value.pickUpTime  // Already "2025-11-07T17:00"
    const dropOffLocal = formPage1.value.dropOffTime  // Already "2025-11-07T17:03"

    const payload = {
      includeDriver: formPage1.value.includeDriver,
      pickUpLocation: formPage1.value.pickUpLocation,
      dropOffLocation: formPage1.value.dropOffLocation,
      pickUpTime: pickUpLocal,  // ✅ Send as local time string
      dropOffTime: dropOffLocal,  // ✅ Send as local time string
      capacityNeeded: formPage1.value.capacityNeeded,
      transmissionNeeded: formPage1.value.transmissionNeeded,
    }

    console.log('📤 [FE] Sending search payload with times:')
    console.log('   Pick-up (local string):', pickUpLocal)
    console.log('   Drop-off (local string):', dropOffLocal)
    console.log('   Current time:', new Date().toLocaleString('id-ID'))

    const response = await axios.post(
      'http://localhost:8080/api/bookings/search',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('📥 Search response:', response.data)

    if (response.data.status === 200) {
      availableVehicles.value = response.data.data.availableVehicles || []
      hasSearched.value = true
      selectedVehicle.value = null

      if (availableVehicles.value.length === 0) {
        toast.info(response.data.message || 'Tidak ada kendaraan yang tersedia')
        error.value = response.data.message
      } else {
        toast.success(`${availableVehicles.value.length} kendaraan ditemukan`)
      }
    } else {
      error.value = response.data.message
      toast.error(response.data.message || 'Gagal mencari kendaraan')
    }
  } catch (err: any) {
    console.error('❌ Search error:', err)

    if (!err.response) {
      const errMsg = 'Gagal menghubungi server. Periksa koneksi internet Anda.'
      error.value = errMsg
      toast.error(errMsg)
      return
    }

    const errMsg = err.response?.data?.message ||
                   err.response?.statusText ||
                   'Gagal mencari kendaraan'
    error.value = errMsg
    toast.error(errMsg)
  } finally {
    searchLoading.value = false
  }
}

const selectVehicle = (vehicle: AvailableVehicleResponseDTO) => {
  selectedVehicle.value = vehicle
  selectedAddOns.value = []
}

const proceedToAddOns = () => {
  if (!selectedVehicle.value) {
    toast.error('Pilih kendaraan terlebih dahulu')
    return
  }
  currentStep.value = 'addons'
}

const goBackToDetails = () => {
  currentStep.value = 'details'
}

const toggleAddOn = (addOnId: string) => {
  const index = selectedAddOns.value.indexOf(addOnId)
  if (index > -1) {
    selectedAddOns.value.splice(index, 1)
  } else {
    selectedAddOns.value.push(addOnId)
  }
}

const isAddOnSelected = (addOnId: string): boolean => {
  return selectedAddOns.value.includes(addOnId)
}

const saveBooking = async () => {
  if (!selectedVehicle.value) {
    toast.error('Pilih kendaraan terlebih dahulu')
    return
  }

  isSubmitting.value = true

  try {
    const payload = {
      bookingDTO: {
        includeDriver: formPage1.value.includeDriver,
        pickUpLocation: formPage1.value.pickUpLocation,
        dropOffLocation: formPage1.value.dropOffLocation,
        pickUpTime: formPage1.value.pickUpTime,  // ✅ Send as local time string
        dropOffTime: formPage1.value.dropOffTime,  // ✅ Send as local time string
        capacityNeeded: formPage1.value.capacityNeeded,
        transmissionNeeded: formPage1.value.transmissionNeeded,
      },
      addOnsDTO: {
        vehicleId: selectedVehicle.value.id,
        selectedAddOnIds: selectedAddOns.value,
      },
    }

    console.log('📤 Sending finalize payload:', payload)

    const response = await axios.post(
      'http://localhost:8080/api/bookings/finalize',
      payload
    )

    console.log('📥 Finalize response:', response.data)

    if (response.data.status === 201 || response.data.status === 200) {
      successMessage.value = `Booking ${response.data.data.id} berhasil dibuat!`
      currentStep.value = 'success'
      toast.success(successMessage.value)

      setTimeout(() => {
        router.push({ name: 'bookings' })
      }, 3000)
    } else {
      toast.error(response.data.message || 'Gagal menyimpan booking')
    }
  } catch (err: any) {
    console.error('❌ Finalize error:', err)

    if (!err.response) {
      const errMsg = 'Gagal menghubungi server. Periksa koneksi internet Anda.'
      toast.error(errMsg)
      return
    }

    const errMsg = err.response?.data?.message ||
                   err.response?.statusText ||
                   'Gagal menyimpan booking'
    toast.error(errMsg)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'bookings' })
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return '-'
  const dt = new Date(dateTimeString)
  return dt.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  loadProvinces()
  loadAddOns()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <!-- Page 1: Booking Details -->
      <div v-if="currentStep === 'details'" class="bg-white shadow-lg rounded-lg p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b-4 border-green-600">
          Create a New Booking
        </h1>

        <!-- Form Fields -->
        <div class="space-y-6">
          <!-- Include Driver Toggle -->
          <div class="flex items-center gap-4">
            <label class="text-sm font-semibold text-gray-700">Include Driver?</label>
            <input
              v-model="formPage1.includeDriver"
              type="checkbox"
              class="w-5 h-5 cursor-pointer rounded"
            />
          </div>

          <!-- Pick-up Location -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Pick-up Location
            </label>
            <select
              v-model="formPage1.pickUpLocation"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              :disabled="loading"
            >
              <option value="">-- Select --</option>
              <option v-for="province in provinces" :key="province.code" :value="province.name">
                {{ province.name }}
              </option>
            </select>
          </div>

          <!-- Drop-off Location -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Drop-off Location
            </label>
            <select
              v-model="formPage1.dropOffLocation"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              :disabled="loading"
            >
              <option value="">-- Select --</option>
              <option v-for="province in provinces" :key="province.code" :value="province.name">
                {{ province.name }}
              </option>
            </select>
          </div>

          <!-- Pick-up Time -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Pick-up Time
            </label>
            <input
              v-model="formPage1.pickUpTime"
              type="datetime-local"
              :min="minPickUpTime"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <!-- Drop-off Time -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Drop-off Time
            </label>
            <input
              v-model="formPage1.dropOffTime"
              type="datetime-local"
              :min="minDropOffTime"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <!-- Capacity Needed -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Capacity Needed
            </label>
            <input
              v-model.number="formPage1.capacityNeeded"
              type="number"
              min="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <!-- Transmission -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Transmission
            </label>
            <div class="flex gap-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="formPage1.transmissionNeeded"
                  type="radio"
                  value="Manual"
                  class="w-4 h-4"
                />
                <span class="text-gray-700">Manual</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="formPage1.transmissionNeeded"
                  type="radio"
                  value="Automatic"
                  class="w-4 h-4"
                />
                <span class="text-gray-700">Automatic</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Search Button -->
        <button
          @click="searchVehicles"
          :disabled="searchLoading"
          class="w-full mt-8 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
        >
          {{ searchLoading ? 'Searching...' : 'Search for Vehicles' }}
        </button>

        <!-- Available Vehicles -->
        <div v-if="hasSearched" class="mt-8 space-y-6">
          <h2 class="text-xl font-bold text-gray-900">Available Vehicles</h2>

          <div v-if="availableVehicles.length === 0" class="text-center py-8 text-gray-600">
            <p>Tidak ada kendaraan yang tersedia</p>
          </div>

          <div v-else class="space-y-4">
            <button
              v-for="vehicle in availableVehicles"
              :key="vehicle.id"
              @click="selectVehicle(vehicle)"
              :class="[
                'w-full p-4 text-left rounded-lg border-2 transition cursor-pointer',
                selectedVehicle?.id === vehicle.id
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-green-400',
              ]"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <p class="font-semibold text-gray-900">
                    {{ vehicle.brand }} {{ vehicle.model }}
                  </p>
                  <p class="text-sm text-gray-600">{{ vehicle.type }}</p>
                </div>
                <p class="font-bold text-green-600">{{ formatPrice(vehicle.totalPrice) }}</p>
              </div>
            </button>
          </div>

          <!-- Booking Price Details -->
          <div v-if="selectedVehicle" class="border-2 border-gray-300 rounded-lg p-6 mt-6">
            <h3 class="font-bold text-lg mb-4">Booking Price Details</h3>
            <div class="space-y-2 text-sm mb-4">
              <div class="flex justify-between">
                <span>Base Price per Day</span>
                <span>{{ formatPrice(selectedVehicle.pricePerDay) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Total Days</span>
                <span>{{ rentalDays }} day(s)</span>
              </div>
              <div class="flex justify-between">
                <span>Price for {{ rentalDays }} day(s)</span>
                <span>{{ formatPrice(selectedVehicle.pricePerDay * rentalDays) }}</span>
              </div>
              <div v-if="formPage1.includeDriver" class="flex justify-between text-blue-600">
                <span>Driver Cost ({{ rentalDays }} day(s) @ Rp 100.000/day)</span>
                <span>{{ formatPrice(driverCostPerDay * rentalDays) }}</span>
              </div>
            </div>
            <div class="border-t-2 pt-4 flex justify-between font-bold text-lg">
              <span>Subtotal (Vehicle + Driver)</span>
              <span class="text-green-600">{{ formatPrice(selectedVehicleTotalPrice) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 mt-8">
            <button
              @click="handleCancel"
              class="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              @click="proceedToAddOns"
              :disabled="!selectedVehicle"
              class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
            >
              Proceed to Add-Ons
            </button>
          </div>
        </div>
      </div>

      <!-- Page 2: Add-Ons Selection -->
      <div v-else-if="currentStep === 'addons'" class="bg-white shadow-lg rounded-lg p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b-4 border-green-600">
          Choose Add-Ons
        </h1>

        <!-- Selected Vehicle Info -->
        <div v-if="selectedVehicle" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-sm text-gray-600">Selected Vehicle:</p>
          <p class="font-semibold text-gray-900">
            {{ selectedVehicle.brand }} {{ selectedVehicle.model }}
          </p>
          <!-- ✅ Tampilkan selectedVehicleTotalPrice (yang include driver) -->
          <p class="text-sm text-gray-600">
            Base Price: {{ formatPrice(selectedVehicleTotalPrice) }}
          </p>
        </div>

        <!-- Add-Ons List -->
        <div class="space-y-3 mb-8">
          <div
            v-for="addOn in allAddOns"
            :key="addOn.id"
            class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <input
              :id="`addon-${addOn.id}`"
              :checked="isAddOnSelected(addOn.id)"
              @change="toggleAddOn(addOn.id)"
              type="checkbox"
              class="w-5 h-5 cursor-pointer rounded"
            />
            <label :for="`addon-${addOn.id}`" class="flex-1 cursor-pointer">
              <p class="font-semibold text-gray-900">{{ addOn.name }}</p>
            </label>
            <p class="font-semibold text-green-600">{{ formatPrice(addOn.price) }}</p>
          </div>
        </div>

        <!-- Price Summary -->
        <div class="border-2 border-gray-300 rounded-lg p-6 mb-8">
          <h3 class="font-bold text-lg mb-4">Price Summary</h3>
          <div class="space-y-2 text-sm mb-4">
            <div class="flex justify-between">
              <span>Base Price per Day</span>
              <span>{{ formatPrice(selectedVehicle?.pricePerDay || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Vehicle Price ({{ rentalDays }} day(s))</span>
              <span>{{ formatPrice((selectedVehicle?.pricePerDay || 0) * rentalDays) }}</span>
            </div>
            <div v-if="formPage1.includeDriver" class="flex justify-between text-blue-600">
              <span>Driver Cost ({{ rentalDays }} day(s))</span>
              <span>{{ formatPrice(driverCostPerDay * rentalDays) }}</span>
            </div>
            <div v-if="selectedAddOns.length > 0" class="flex justify-between text-orange-600">
              <span>Add-Ons ({{ selectedAddOns.length }})</span>
              <span>{{ formatPrice(addOnsTotalPrice) }}</span>
            </div>
          </div>
          <div class="border-t-2 pt-4 flex justify-between font-bold text-lg">
            <span>Grand Total</span>
            <span class="text-green-600">{{ formatPrice(grandTotal) }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <button
            @click="goBackToDetails"
            class="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            Previous
          </button>
          <button
            @click="saveBooking"
            :disabled="isSubmitting"
            class="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
          >
            {{ isSubmitting ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>

      <!-- Page 3: Success -->
      <div v-else-if="currentStep === 'success'" class="bg-white shadow-lg rounded-lg p-8 text-center">
        <div class="mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Booking Successful!</h2>
        <p class="text-lg text-green-600 mb-6">{{ successMessage }}</p>
        <p class="text-gray-600 mb-6">Redirecting to bookings page in a few seconds...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
button {
  transition: all 0.3s ease;
}

input[type='checkbox']:checked,
input[type='radio']:checked {
  accent-color: #16a34a;
}
</style>
