<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { RentalBooking, AvailableVehicleResponseDTO } from '@/interfaces/booking.interface'
import { toast } from 'vue-sonner'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const bookingId = route.params.id as string
const booking = ref<RentalBooking | null>(null)
const provinces = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const searchLoading = ref(false)
const hasSearched = ref(false)

const formPage1 = ref({
  transmissionNeeded: 'Automatic',
  capacityNeeded: 1,
  pickUpLocation: '',
  dropOffLocation: '',
  pickUpTime: '',
  dropOffTime: '',
  includeDriver: false,
})

const availableVehicles = ref<AvailableVehicleResponseDTO[]>([])
const selectedVehicle = ref<AvailableVehicleResponseDTO | null>(null)
const previousVehicleId = ref<string | null>(null)

const minPickUpTime = computed(() => {
  const now = new Date()
  return now.toISOString().slice(0, 16)
})

const rentalDays = computed(() => {
  if (!formPage1.value.pickUpTime || !formPage1.value.dropOffTime) return 0
  const pickUp = new Date(formPage1.value.pickUpTime)
  const dropOff = new Date(formPage1.value.dropOffTime)
  const hours = (dropOff.getTime() - pickUp.getTime()) / (1000 * 60 * 60)
  return Math.max(1, Math.ceil(hours / 24))
})

const driverCostPerDay = 100000

const selectedVehicleTotalPrice = computed(() => {
  if (!selectedVehicle.value) return 0

  const baseCost = selectedVehicle.value.pricePerDay * rentalDays.value
  const driverCost = formPage1.value.includeDriver
    ? rentalDays.value * driverCostPerDay
    : 0

  console.log('💰 Price Calculation:')
  console.log('   Base (vehicle only):', baseCost)
  console.log('   Driver cost:', driverCost)
  console.log('   Include driver:', formPage1.value.includeDriver)
  console.log('   Total:', baseCost + driverCost)

  return baseCost + driverCost
})

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

onMounted(async () => {
  await loadProvinces()
  await loadBooking()
})

const loadProvinces = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/bookings/provinces')
    if (response.data.status === 200) {
      provinces.value = response.data.data.map((name: string) => ({
        code: name.toLowerCase().replace(/\s+/g, '-'),
        name: name
      }))
    }
  } catch (err) {
    console.error('Error loading provinces:', err)
    toast.error('Gagal memuat daftar lokasi')
  }
}

const loadBooking = async () => {
  loading.value = true
  try {
    const response = await axios.get(`http://localhost:8080/api/bookings/${bookingId}/update-details`)

    if (response.data.status === 200) {
      booking.value = response.data.data
      previousVehicleId.value = booking.value.vehicleId

      // Prefill form dengan data booking
      formPage1.value = {
        transmissionNeeded: booking.value.transmissionNeeded,
        capacityNeeded: booking.value.capacityNeeded,
        pickUpLocation: booking.value.pickUpLocation,
        dropOffLocation: booking.value.dropOffLocation,
        pickUpTime: new Date(booking.value.pickUpTime).toISOString().slice(0, 16),
        dropOffTime: new Date(booking.value.dropOffTime).toISOString().slice(0, 16),
        includeDriver: booking.value.includeDriver,
      }

      console.log('✅ Booking loaded:', booking.value)

      // ✅ Auto-search dengan data booking saat page load
      await autoSearchWithPreviousVehicle()
    } else {
      toast.error(response.data.message || 'Gagal memuat data booking')
      setTimeout(() => router.back(), 2000)
    }
  } catch (err: any) {
    const errMsg = err.response?.data?.message || 'Gagal memuat data booking'
    console.error('Error loading booking:', err)
    toast.error(errMsg)
    setTimeout(() => router.back(), 2000)
  } finally {
    loading.value = false
  }
}

const autoSearchWithPreviousVehicle = async () => {
  if (!validatePage1()) return

  searchLoading.value = true
  hasSearched.value = false

  try {
    const pickUpLocal = new Date(formPage1.value.pickUpTime)
    const dropOffLocal = new Date(formPage1.value.dropOffTime)

    const payload = {
      includeDriver: formPage1.value.includeDriver,
      pickUpLocation: formPage1.value.pickUpLocation,
      dropOffLocation: formPage1.value.dropOffLocation,
      pickUpTime: pickUpLocal.toISOString(),
      dropOffTime: dropOffLocal.toISOString(),
      capacityNeeded: formPage1.value.capacityNeeded,
      transmissionNeeded: formPage1.value.transmissionNeeded,
    }

    console.log('📤 Auto-search payload:', payload)

    const response = await axios.post(
      'http://localhost:8080/api/bookings/search',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('📥 Auto-search response:', response.data)

    if (response.data.status === 200) {
      availableVehicles.value = response.data.data.availableVehicles || []
      hasSearched.value = true

      // ✅ Set selected vehicle ke yang sebelumnya dipilih
      const previousVehicle = availableVehicles.value.find(v => v.id === previousVehicleId.value)
      if (previousVehicle) {
        selectedVehicle.value = previousVehicle
        console.log('✅ Previous vehicle selected:', previousVehicle)
      }

      if (availableVehicles.value.length === 0) {
        toast.info('Tidak ada kendaraan yang tersedia')
      }
    } else {
      toast.error(response.data.message || 'Gagal mencari kendaraan')
    }
  } catch (err: any) {
    console.error('❌ Search error:', err)
    const errMsg = err.response?.data?.message || 'Gagal mencari kendaraan'
    toast.error(errMsg)
  } finally {
    searchLoading.value = false
  }
}

const validatePage1 = (): boolean => {
  console.log('🔍 [VALIDATE] Starting validation for UPDATE')

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

  // Main validation: dropOff must be after pickUp
  if (pickUp >= dropOff) {
    toast.error('Waktu pengambilan harus sebelum waktu pengembalian')
    return false
  }

  if (formPage1.value.capacityNeeded <= 0) {
    toast.error('Kapasitas yang dibutuhkan harus lebih dari 0')
    return false
  }

  console.log('✅ [VALIDATE] All validations passed')
  return true
}

const searchVehicles = async () => {
  console.log('🔍 [SEARCH] Button clicked!')
  console.log('🔍 [SEARCH] Form data:', formPage1.value)

  if (!validatePage1()) {
    console.log('❌ [SEARCH] Validation failed')
    return
  }

  console.log('✅ [SEARCH] Validation passed')

  searchLoading.value = true
  hasSearched.value = false

  try {
    const pickUpLocal = new Date(formPage1.value.pickUpTime)
    const dropOffLocal = new Date(formPage1.value.dropOffTime)

    console.log('📅 Pick-up local:', pickUpLocal)
    console.log('📅 Drop-off local:', dropOffLocal)

    const payload = {
      includeDriver: formPage1.value.includeDriver,
      pickUpLocation: formPage1.value.pickUpLocation,
      dropOffLocation: formPage1.value.dropOffLocation,
      pickUpTime: pickUpLocal.toISOString(),
      dropOffTime: dropOffLocal.toISOString(),
      capacityNeeded: formPage1.value.capacityNeeded,
      transmissionNeeded: formPage1.value.transmissionNeeded,
    }

    console.log('📤 Sending search payload:', payload)

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

      console.log('✅ [SEARCH] Found vehicles:', availableVehicles.value.length)

      if (availableVehicles.value.length === 0) {
        toast.info('Tidak ada kendaraan yang tersedia')
      } else {
        toast.success(`${availableVehicles.value.length} kendaraan ditemukan`)
      }
    } else {
      console.log('❌ [SEARCH] Response status not 200:', response.data.status)
      toast.error(response.data.message || 'Gagal mencari kendaraan')
    }
  } catch (err: any) {
    console.error('❌ [SEARCH] Error:', err)
    console.error('❌ [SEARCH] Error response:', err.response)

    if (!err.response) {
      const errMsg = 'Gagal menghubungi server. Periksa koneksi internet Anda.'
      toast.error(errMsg)
      return
    }

    const errMsg = err.response?.data?.message || 'Gagal mencari kendaraan'
    console.error('❌ [SEARCH] Final error:', errMsg)
    toast.error(errMsg)
  } finally {
    searchLoading.value = false
  }
}

const saveChanges = async () => {
  if (!selectedVehicle.value) {
    toast.error('Pilih kendaraan terlebih dahulu')
    return
  }

  submitting.value = true

  try {
    const payload = {
      id: bookingId,
      pickUpLocation: formPage1.value.pickUpLocation,
      dropOffLocation: formPage1.value.dropOffLocation,
      pickUpTime: new Date(formPage1.value.pickUpTime).toISOString(),
      dropOffTime: new Date(formPage1.value.dropOffTime).toISOString(),
      capacityNeeded: formPage1.value.capacityNeeded,
      transmissionNeeded: formPage1.value.transmissionNeeded,
      includeDriver: formPage1.value.includeDriver,
    }

    console.log('📤 Sending update payload:', payload)

    const response = await axios.put(
      'http://localhost:8080/api/bookings/update-details',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    console.log('📥 Update response:', response.data)

    if (response.data.status === 200) {
      toast.success('Booking berhasil diperbarui!')

      setTimeout(() => {
        router.push({ name: 'booking-detail', params: { id: bookingId } })
      }, 2000)
    } else {
      toast.error(response.data.message || 'Gagal memperbarui booking')
    }
  } catch (err: any) {
    const errMsg = err.response?.data?.message || 'Gagal memperbarui booking'
    console.error('Error updating booking:', err)
    toast.error(errMsg)
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Update Booking Details</h1>
      <p class="text-gray-600">Booking ID: {{ bookingId }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="ml-4 text-gray-600">Memuat data booking...</p>
    </div>

    <!-- Status Alert -->
    <div v-else-if="booking && booking.status !== 'Upcoming'" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-700">⚠️ Booking dengan status '{{ booking.status }}' tidak dapat diubah. Hanya booking dengan status 'Upcoming' yang dapat diubah.</p>
    </div>

    <!-- Form -->
    <div v-else-if="booking" class="max-w-4xl">
      <div class="bg-white rounded-lg shadow-md p-6 space-y-6">
        <!-- Include Driver Checkbox -->
        <div class="flex items-center">
          <input
            v-model="formPage1.includeDriver"
            type="checkbox"
            id="includeDriver"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label for="includeDriver" class="ml-3 text-sm font-semibold">Sertakan Sopir</label>
        </div>

        <!-- Pick-up Location -->
        <div>
          <label class="block text-sm font-semibold mb-2">Lokasi Pengambilan Kendaraan *</label>
          <select v-model="formPage1.pickUpLocation" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Pilih lokasi pengambilan</option>
            <option v-for="province in provinces" :key="province.code" :value="province.name">
              {{ province.name }}
            </option>
          </select>
        </div>

        <!-- Drop-off Location -->
        <div>
          <label class="block text-sm font-semibold mb-2">Lokasi Pengembalian Kendaraan *</label>
          <select v-model="formPage1.dropOffLocation" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Pilih lokasi pengembalian</option>
            <option v-for="province in provinces" :key="province.code" :value="province.name">
              {{ province.name }}
            </option>
          </select>
        </div>

        <!-- Pick-up Date & Time -->
        <div>
          <label class="block text-sm font-semibold mb-2">Waktu Pengambilan Kendaraan *</label>
          <input
            v-model="formPage1.pickUpTime"
            type="datetime-local"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Drop-off Date & Time -->
        <div>
          <label class="block text-sm font-semibold mb-2">Waktu Pengembalian Kendaraan *</label>
          <input
            v-model="formPage1.dropOffTime"
            type="datetime-local"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Capacity -->
        <div>
          <label class="block text-sm font-semibold mb-2">Kapasitas Penumpang yang Dibutuhkan *</label>
          <input
            v-model.number="formPage1.capacityNeeded"
            type="number"
            min="1"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Transmission -->
        <div>
          <label class="block text-sm font-semibold mb-2">Jenis Transmisi *</label>
          <div class="flex gap-6">
            <label class="flex items-center">
              <input v-model="formPage1.transmissionNeeded" type="radio" value="Manual" class="mr-2" />
              <span>Manual</span>
            </label>
            <label class="flex items-center">
              <input v-model="formPage1.transmissionNeeded" type="radio" value="Automatic" class="mr-2" />
              <span>Automatic</span>
            </label>
          </div>
        </div>

        <!-- Search Button -->
        <button
          @click="searchVehicles"
          :disabled="searchLoading"
          class="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <span v-if="!searchLoading">Search for Vehicles</span>
          <span v-else>Mencari kendaraan...</span>
        </button>

        <!-- Available Vehicles -->
        <div v-if="hasSearched">
          <h3 class="font-bold text-lg mb-4">Available Vehicles</h3>

          <div v-if="availableVehicles.length === 0" class="p-4 bg-gray-50 rounded-lg text-center">
            <p class="text-gray-600">Tidak ada kendaraan yang tersedia</p>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="vehicle in availableVehicles"
              :key="vehicle.id"
              @click="selectedVehicle = vehicle"
              :class="[
                'w-full p-4 rounded-lg border-2 text-left transition',
                selectedVehicle?.id === vehicle.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              ]"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-semibold">{{ vehicle.brand }} {{ vehicle.model }}</p>
                  <p class="text-sm text-gray-600">{{ vehicle.type }} • {{ vehicle.transmission }} • Capacity: {{ vehicle.capacity }}</p>
                </div>
                <p class="font-bold text-blue-600">{{ formatPrice(vehicle.totalPrice) }}</p>
              </div>
            </button>
          </div>
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

        <!-- Buttons -->
        <div class="flex gap-4 justify-between pt-6">
          <button
            @click="handleCancel"
            class="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            @click="saveChanges"
            :disabled="submitting || !selectedVehicle"
            class="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span v-if="!submitting">Save Changes</span>
            <span v-else>Menyimpan...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any additional styles here */
</style>
