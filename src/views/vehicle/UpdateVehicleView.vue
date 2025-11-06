<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVehicleStore } from '@/stores/vehicle/vehicle.store'
import type { RentalVendor } from '@/interfaces/vendor.interface'
import { toast } from 'vue-sonner'

const router = useRouter()
const route = useRoute()
const vehicleStore = useVehicleStore()

const vehicleId = ref<string>(route.params.id as string)
const selectedVendor = ref<RentalVendor | null>(null)
const vendors = ref<RentalVendor[]>([])
const loading = ref(false)
const isSubmitting = ref(false)

const form = ref({
  id: '',
  rentalVendorId: null as number | null,
  type: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  location: '',
  licensePlate: '',
  capacity: 0,
  transmission: '',
  fuelType: '',
  price: 0,
  status: 'Available',
})

const vehicleTypes = ['Sedan', 'SUV', 'MPV', 'Luxury']
const transmissionTypes = ['Manual', 'Automatic']
const fuelTypes = ['Bensin', 'Diesel', 'Listrik', 'Hybrid']
const statusOptions = ['Available', 'Unavailable']

const availableLocations = computed(() => {
  if (selectedVendor.value) {
    return selectedVendor.value.listOfLocations || []
  }
  return []
})

const currentYear = new Date().getFullYear()

const loadData = async () => {
  loading.value = true
  try {
    // Fetch vendors
    const vendorResponse = await fetch('http://localhost:8080/api/vehicles/vendors')
    if (!vendorResponse.ok) {
      throw new Error('Gagal memuat vendor')
    }
    const vendorData = await vendorResponse.json()
    vendors.value = vendorData.data || []

    // ✅ Ubah dari /update ke /{id}/update
    const vehicleResponse = await fetch(`http://localhost:8080/api/vehicles/${vehicleId.value}/update`)
    if (!vehicleResponse.ok) {
      throw new Error('Kendaraan tidak ditemukan')
    }
    const vehicleData = await vehicleResponse.json()

    if (vehicleData.data) {
      const vehicle = vehicleData.data
      form.value = {
        id: vehicle.id,
        rentalVendorId: vehicle.rentalVendorId,
        type: vehicle.type,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        location: vehicle.location,
        licensePlate: vehicle.licensePlate,
        capacity: vehicle.capacity,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        price: vehicle.price,
        status: vehicle.status,
      }

      selectedVendor.value =
        vendors.value.find((v) => v.id === form.value.rentalVendorId) || null
    } else {
      toast.error('Kendaraan tidak ditemukan')
      router.push({ name: 'vehicles' })
    }
  } catch (error) {
    console.error('Error loading data:', error)
    toast.error(error instanceof Error ? error.message : 'Gagal memuat data')
    router.push({ name: 'vehicles' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const handleVendorChange = () => {
  if (form.value.rentalVendorId) {
    selectedVendor.value =
      vendors.value.find((v) => v.id === form.value.rentalVendorId) || null
    // Don't reset location, keep existing one
  }
}

const validateForm = (): boolean => {
  if (!form.value.id) {
    toast.error('Vehicle ID tidak boleh kosong')
    return false
  }

  if (!form.value.rentalVendorId) {
    toast.error('Pilih vendor terlebih dahulu')
    return false
  }

  if (!form.value.type) {
    toast.error('Pilih tipe kendaraan')
    return false
  }

  if (!form.value.brand.trim()) {
    toast.error('Masukkan merek kendaraan')
    return false
  }

  if (!form.value.model.trim()) {
    toast.error('Masukkan model kendaraan')
    return false
  }

  if (form.value.year > currentYear) {
    toast.error('Tahun kendaraan tidak boleh melebihi tahun saat ini')
    return false
  }

  if (!form.value.location) {
    toast.error('Pilih lokasi')
    return false
  }

  if (!form.value.licensePlate.trim()) {
    toast.error('Masukkan nomor plat')
    return false
  }

  if (form.value.capacity <= 0) {
    toast.error('Kapasitas harus lebih dari 0')
    return false
  }

  if (!form.value.transmission) {
    toast.error('Pilih jenis transmisi')
    return false
  }

  if (!form.value.fuelType) {
    toast.error('Pilih tipe bahan bakar')
    return false
  }

  if (form.value.price <= 0) {
    toast.error('Harga harus lebih dari 0')
    return false
  }

  if (!form.value.status) {
    toast.error('Pilih status kendaraan')
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    // ✅ Ubah dari /update ke /{id}/update
    const response = await fetch(`http://localhost:8080/api/vehicles/${form.value.id}/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: form.value.id,
        rentalVendorId: form.value.rentalVendorId,
        type: form.value.type,
        brand: form.value.brand,
        model: form.value.model,
        year: form.value.year,
        location: form.value.location,
        licensePlate: form.value.licensePlate,
        capacity: form.value.capacity,
        transmission: form.value.transmission,
        fuelType: form.value.fuelType,
        price: form.value.price,
        status: form.value.status,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      toast.success('Kendaraan berhasil diperbarui!')
      setTimeout(() => {
        router.push({ name: 'vehicle-detail', params: { id: form.value.id } })
      }, 1500)
    } else {
      toast.error(data.message || 'Gagal memperbarui kendaraan')
    }
  } catch (error) {
    toast.error('Terjadi kesalahan saat memperbarui kendaraan')
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'vehicles' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <!-- Card Container -->
      <div class="bg-white shadow-lg rounded-lg p-8">
        <!-- Header -->
        <h1 class="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b-4 border-green-600">
          Update Vehicle
        </h1>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
          <p class="mt-4 text-gray-600">Loading vehicle data...</p>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Status (New field for update) -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Status
            </label>
            <select
              v-model="form.status"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            >
              <option v-for="status in statusOptions" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              Ubah status untuk Available atau Unavailable (maintenance)
            </p>
          </div>

          <!-- Rental Vendor -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Rental Vendor
            </label>
            <select
              v-model.number="form.rentalVendorId"
              @change="handleVendorChange"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            >
              <option value="">-- Select a Vendor --</option>
              <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
                {{ vendor.name }}
              </option>
            </select>
          </div>

          <!-- Vehicle Type -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Vehicle Type
            </label>
            <select
              v-model="form.type"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            >
              <option value="">-- Select a Vehicle Type --</option>
              <option v-for="type in vehicleTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <!-- Vehicle Brand -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Vehicle Brand
            </label>
            <input
              v-model="form.brand"
              type="text"
              placeholder="e.g., Toyota"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <!-- Vehicle Model -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Vehicle Model
            </label>
            <input
              v-model="form.model"
              type="text"
              placeholder="e.g., Avanza"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <!-- Production Year -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Production Year
            </label>
            <input
              v-model.number="form.year"
              type="number"
              :min="1900"
              :max="currentYear"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <!-- Location -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Location
            </label>
            <select
              v-model="form.location"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
              :disabled="!selectedVendor"
            >
              <option value="">-- Select a location --</option>
              <option
                v-for="location in availableLocations"
                :key="location"
                :value="location"
              >
                {{ location }}
              </option>
            </select>
            <p v-if="!selectedVendor" class="text-xs text-gray-500 mt-1">
              Pilih vendor terlebih dahulu
            </p>
          </div>

          <!-- License Plate -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              License Plate
            </label>
            <input
              v-model="form.licensePlate"
              type="text"
              placeholder="e.g., B123AP"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <!-- Capacity -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Capacity
            </label>
            <input
              v-model.number="form.capacity"
              type="number"
              min="1"
              placeholder="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <!-- Transmission -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Transmission
            </label>
            <select
              v-model="form.transmission"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            >
              <option value="">-- Select a Transmission --</option>
              <option v-for="trans in transmissionTypes" :key="trans" :value="trans">
                {{ trans }}
              </option>
            </select>
          </div>

          <!-- Fuel Type -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Fuel Type
            </label>
            <select
              v-model="form.fuelType"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            >
              <option value="">-- Select a Fuel Type --</option>
              <option v-for="fuel in fuelTypes" :key="fuel" :value="fuel">
                {{ fuel }}
              </option>
            </select>
          </div>

          <!-- Price per Day -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Price per Day
            </label>
            <input
              v-model.number="form.price"
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 mt-8">
            <button
              @click="handleCancel"
              type="button"
              class="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
              :disabled="isSubmitting"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions */
select,
input {
  transition: all 0.3s ease;
}

button {
  transition: all 0.3s ease;
}
</style>
