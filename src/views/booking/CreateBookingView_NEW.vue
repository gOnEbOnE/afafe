<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useBookingStore } from '@/stores/booking/booking.store'
import type { RentalAddOn, AvailableVehicleResponseDTO } from '@/interfaces/booking.interface'
import { toast } from 'vue-sonner'

const router = useRouter()
const authStore = useAuthStore()
const bookingStore = useBookingStore()

// RBAC Check - Only Superadmin and Customer can create booking
onMounted(() => {
  if (authStore.user?.role !== 'Superadmin' && authStore.user?.role !== 'Customer') {
    toast.error('Anda tidak memiliki akses untuk membuat booking')
    router.push('/bookings')
    return
  }
  loadProvinces()
  loadAddOns()
})

// Step state
const currentStep = ref<'details' | 'vehicles' | 'addons'>('details')

// Form data
const formData = ref({
  includeDriver: false,
  pickUpLocation: '',
  dropOffLocation: '',
  pickUpTime: '',
  dropOffTime: '',
  capacityNeeded: 1,
  transmissionNeeded: 'Automatic',
})

const selectedVehicle = ref<AvailableVehicleResponseDTO | null>(null)
const selectedAddOns = ref<string[]>([])

// UI states
const searchLoading = ref(false)
const isSubmitting = ref(false)
const hasSearched = ref(false)

// Computed properties
const provinces = computed(() => bookingStore.provinces)
const availableVehicles = computed(() => bookingStore.availableVehicles)
const allAddOns = computed(() => bookingStore.addOns)
const loading = computed(() => bookingStore.loading)

const minPickUpTime = computed(() => {
  const now = new Date()
  return now.toISOString().slice(0, 16)
})

const minDropOffTime = computed(() => {
  if (!formData.value.pickUpTime) return minPickUpTime.value
  return formData.value.pickUpTime
})

const rentalDays = computed(() => {
  if (!formData.value.pickUpTime || !formData.value.dropOffTime) return 0
  const pickUp = new Date(formData.value.pickUpTime)
  const dropOff = new Date(formData.value.dropOffTime)
  const hours = (dropOff.getTime() - pickUp.getTime()) / (1000 * 60 * 60)
  return Math.ceil(hours / 24) || 1
})

const driverCostPerDay = 100000

const selectedVehicleTotalPrice = computed(() => {
  if (!selectedVehicle.value) return 0
  const baseCost = selectedVehicle.value.pricePerDay * rentalDays.value
  const driverCost = formData.value.includeDriver ? driverCostPerDay * rentalDays.value : 0
  return baseCost + driverCost
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
  try {
    await bookingStore.fetchProvinces()
  } catch (err) {
    toast.error('Gagal memuat daftar lokasi')
  }
}

const loadAddOns = async () => {
  try {
    await bookingStore.fetchAddOns()
  } catch (err) {
    toast.error('Gagal memuat add-ons')
  }
}

const validatePage1 = (): boolean => {
  if (!formData.value.pickUpLocation) {
    toast.error('Pilih lokasi pick-up')
    return false
  }
  if (!formData.value.dropOffLocation) {
    toast.error('Pilih lokasi drop-off')
    return false
  }
  if (!formData.value.pickUpTime) {
    toast.error('Pilih waktu pick-up')
    return false
  }
  if (!formData.value.dropOffTime) {
    toast.error('Pilih waktu drop-off')
    return false
  }

  const pickUp = new Date(formData.value.pickUpTime)
  const dropOff = new Date(formData.value.dropOffTime)

  if (pickUp >= dropOff) {
    toast.error('Waktu drop-off harus setelah pick-up')
    return false
  }

  if (formData.value.capacityNeeded <= 0) {
    toast.error('Kapasitas minimal 1')
    return false
  }

  return true
}

const searchVehicles = async () => {
  if (!validatePage1()) return

  searchLoading.value = true
  hasSearched.value = false

  try {
    const searchCriteria = {
      pickUpLocation: formData.value.pickUpLocation,
      dropOffLocation: formData.value.dropOffLocation,
      pickUpTime: formData.value.pickUpTime,
      dropOffTime: formData.value.dropOffTime,
      capacityNeeded: formData.value.capacityNeeded,
      transmissionNeeded: formData.value.transmissionNeeded,
    }

    await bookingStore.searchVehicles(searchCriteria)
    hasSearched.value = true
    currentStep.value = 'vehicles'

    if (availableVehicles.value.length === 0) {
      toast.info('Tidak ada kendaraan tersedia untuk kriteria ini')
    }
  } catch (err: any) {
    toast.error('Gagal mencari kendaraan')
  } finally {
    searchLoading.value = false
  }
}

const selectVehicle = (vehicle: AvailableVehicleResponseDTO) => {
  selectedVehicle.value = vehicle
  selectedAddOns.value = []
  currentStep.value = 'addons'
}

const goBackToDetails = () => {
  currentStep.value = 'details'
  selectedVehicle.value = null
  selectedAddOns.value = []
}

const goBackToVehicles = () => {
  currentStep.value = 'vehicles'
  selectedVehicle.value = null
  selectedAddOns.value = []
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
    const bookingPayload = {
      vehicleId: selectedVehicle.value.vehicleId,
      pickUpTime: formData.value.pickUpTime,
      dropOffTime: formData.value.dropOffTime,
      pickUpLocation: formData.value.pickUpLocation,
      dropOffLocation: formData.value.dropOffLocation,
      capacityNeeded: formData.value.capacityNeeded,
      transmissionNeeded: formData.value.transmissionNeeded,
      includeDriver: formData.value.includeDriver,
      addOnIds: selectedAddOns.value,
    }

    const result = await bookingStore.createBooking(bookingPayload)

    if (result) {
      toast.success('Booking berhasil dibuat!')
      setTimeout(() => {
        router.push('/bookings')
      }, 1500)
    }
  } catch (err: any) {
    toast.error('Gagal membuat booking')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push('/bookings')
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Buat Booking Baru</h1>

      <!-- Step 1: Search Criteria -->
      <div v-if="currentStep === 'details'" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Detail Booking</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Lokasi Pick-up *</label>
            <select v-model="formData.pickUpLocation" class="w-full border rounded px-3 py-2">
              <option value="">-- Pilih Provinsi --</option>
              <option v-for="province in provinces" :key="province.name" :value="province.name">
                {{ province.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Lokasi Drop-off *</label>
            <select v-model="formData.dropOffLocation" class="w-full border rounded px-3 py-2">
              <option value="">-- Pilih Provinsi --</option>
              <option v-for="province in provinces" :key="province.name" :value="province.name">
                {{ province.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Waktu Pick-up *</label>
            <input
              v-model="formData.pickUpTime"
              type="datetime-local"
              :min="minPickUpTime"
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Waktu Drop-off *</label>
            <input
              v-model="formData.dropOffTime"
              type="datetime-local"
              :min="minDropOffTime"
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Kapasitas Penumpang *</label>
            <input
              v-model.number="formData.capacityNeeded"
              type="number"
              min="1"
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Transmisi *</label>
            <select v-model="formData.transmissionNeeded" class="w-full border rounded px-3 py-2">
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <div class="md:col-span-2">
            <label class="flex items-center gap-2">
              <input v-model="formData.includeDriver" type="checkbox" class="w-4 h-4" />
              <span>Sertakan Driver (Rp {{ formatPrice(driverCostPerDay) }}/hari)</span>
            </label>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="searchVehicles"
            :disabled="searchLoading"
            class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ searchLoading ? 'Mencari...' : 'Cari Kendaraan' }}
          </button>
          <button
            @click="handleCancel"
            class="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Batal
          </button>
        </div>
      </div>

      <!-- Step 2: Vehicle Selection -->
      <div v-if="currentStep === 'vehicles'" class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Pilih Kendaraan</h2>
          <button
            @click="goBackToDetails"
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Kembali
          </button>
        </div>

        <div v-if="loading" class="text-center py-8">Memuat kendaraan...</div>

        <div v-else-if="availableVehicles.length === 0 && hasSearched" class="text-center py-8 text-gray-500">
          Tidak ada kendaraan tersedia
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="vehicle in availableVehicles"
            :key="vehicle.vehicleId"
            class="border rounded p-4 hover:shadow-lg transition cursor-pointer"
            @click="selectVehicle(vehicle)"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-lg">{{ vehicle.brand }} {{ vehicle.model }}</h3>
                <p class="text-sm text-gray-600">{{ vehicle.type }} - {{ vehicle.year }}</p>
                <p class="text-sm text-gray-600">Vendor: {{ vehicle.rentalVendorName }}</p>
                <p class="text-sm text-gray-600">Kapasitas: {{ vehicle.capacity }} penumpang</p>
                <p class="text-sm text-gray-600">Transmisi: {{ vehicle.transmission }}</p>
                <p class="text-sm text-gray-600">Bahan Bakar: {{ vehicle.fuelType }}</p>
                <p class="text-sm text-gray-600">Lokasi: {{ vehicle.location }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500">Harga/hari</p>
                <p class="text-xl font-bold text-green-600">{{ formatPrice(vehicle.pricePerDay) }}</p>
                <p class="text-sm text-gray-500 mt-2">Total {{ rentalDays }} hari</p>
                <p class="text-lg font-bold text-blue-600">
                  {{ formatPrice(vehicle.pricePerDay * rentalDays) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Add-ons Selection -->
      <div v-if="currentStep === 'addons'" class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Pilih Add-ons (Opsional)</h2>
          <button
            @click="goBackToVehicles"
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Kembali
          </button>
        </div>

        <div class="mb-6">
          <h3 class="font-semibold mb-2">Kendaraan Terpilih:</h3>
          <p>{{ selectedVehicle?.brand }} {{ selectedVehicle?.model }}</p>
          <p class="text-sm text-gray-600">Total: {{ formatPrice(selectedVehicleTotalPrice) }}</p>
        </div>

        <div class="space-y-3 mb-6">
          <div
            v-for="addOn in allAddOns"
            :key="addOn.id"
            class="border rounded p-3 cursor-pointer hover:bg-gray-50"
            :class="{ 'bg-blue-50 border-blue-500': isAddOnSelected(addOn.id) }"
            @click="toggleAddOn(addOn.id)"
          >
            <div class="flex justify-between items-center">
              <div>
                <input
                  type="checkbox"
                  :checked="isAddOnSelected(addOn.id)"
                  class="mr-2"
                  @click.stop="toggleAddOn(addOn.id)"
                />
                <span class="font-medium">{{ addOn.name }}</span>
              </div>
              <span class="text-green-600 font-semibold">{{ formatPrice(addOn.price) }}</span>
            </div>
          </div>
        </div>

        <div class="border-t pt-4 mb-6">
          <div class="flex justify-between text-lg font-bold">
            <span>Grand Total:</span>
            <span class="text-green-600">{{ formatPrice(grandTotal) }}</span>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="saveBooking"
            :disabled="isSubmitting"
            class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {{ isSubmitting ? 'Menyimpan...' : 'Konfirmasi Booking' }}
          </button>
          <button
            @click="handleCancel"
            class="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
button:disabled {
  cursor: not-allowed;
}
</style>
