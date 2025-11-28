<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useVehicleStore } from '@/stores/vehicle/vehicle.store'
import { useAuthStore } from '@/stores/auth/auth.store'
import type { RentalVendor } from '@/interfaces/vendor.interface'
import { toast } from 'vue-sonner'

const router = useRouter()
const vehicleStore = useVehicleStore()
const authStore = useAuthStore()

const selectedVendor = ref<RentalVendor | null>(null)
const vendors = ref<RentalVendor[]>([])
const loading = ref(false)
const isSubmitting = ref(false)

const form = reactive({
  rentalVendorId: '' as string,
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
})

const vehicleTypes = ['SUV', 'MPV', 'Sedan', 'Sport', 'Economy', 'Luxury']
const transmissionTypes = ['Automatic', 'Manual']
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric']

// ✅ RBAC: Check user role
const userRole = computed(() => authStore.user?.role || '')
const isRentalVendor = computed(() => userRole.value === 'RentalVendor')
const isSuperadmin = computed(() => userRole.value === 'Superadmin')

// ✅ Dynamic Locations based on selected vendor
const availableLocations = computed(() => {
  if (selectedVendor.value && selectedVendor.value.listOfLocations) {
    return selectedVendor.value.listOfLocations
  }
  return []
})

const currentYear = new Date().getFullYear()

// ✅ Helper: Show vendor dropdown only for Superadmin
const showVendorDropdown = computed(() => isSuperadmin.value)

onMounted(async () => {
  loading.value = true
  try {
    console.log('📋 CreateVehicleView - mounting...')
    console.log('   Current user:', authStore.user)

    // Fetch vendors list
    console.log('⏳ Fetching vendors...')
    await vehicleStore.fetchVendors()
    vendors.value = vehicleStore.vendors
    console.log('✅ Vendors loaded:', vendors.value.length)
    vendors.value.forEach((v, idx) => {
      console.log(`   [${idx}] ID: ${v.id}, Email: ${v.email}, Name: ${v.name}`)
    })

    // ✅ If Rental Vendor, auto-set vendor to current user (match by email)
    if (isRentalVendor.value && authStore.user?.email) {
      console.log('🔍 RentalVendor detected - searching for matching vendor by email...')
      const userEmail = authStore.user.email
      console.log('   User email:', userEmail)

      // Find vendor with matching email (like in VehicleView.vue)
      const currentVendor = vendors.value.find(
        (v) => v.email === userEmail
      )

      if (currentVendor) {
        console.log('✅ Found matching vendor:', currentVendor)
        form.rentalVendorId = currentVendor.id.toString()
        selectedVendor.value = currentVendor
        console.log('✅ Auto-set vendor ID to:', currentVendor.id)
      } else {
        console.error('❌ No vendor found with email:', userEmail)
        toast.error('Vendor tidak ditemukan untuk user ini')
      }
    } else if (isRentalVendor.value) {
      console.error('❌ RentalVendor role detected but no email in auth store')
      toast.error('Email tidak ditemukan di akun Anda')
    }
  } catch (error) {
    console.error('❌ Error in onMounted:', error)
    toast.error('Gagal memuat data vendor')
    console.error(error)
  } finally {
    loading.value = false
  }
})

const handleVendorChange = () => {
  if (form.rentalVendorId) {
    const vendorId = parseInt(form.rentalVendorId)
    selectedVendor.value = vendors.value.find((v) => v.id === vendorId) || null

    // Reset location when vendor changes
    form.location = ''
  }
}

const validateForm = (): boolean => {
  if (!form.rentalVendorId) {
    toast.error('Vendor harus dipilih')
    return false
  }

  if (!form.type) {
    toast.error('Tipe kendaraan harus dipilih')
    return false
  }

  if (!form.brand.trim()) {
    toast.error('Brand kendaraan harus diisi')
    return false
  }

  if (!form.model.trim()) {
    toast.error('Model kendaraan harus diisi')
    return false
  }

  if (form.year < 1900 || form.year > currentYear) {
    toast.error(`Tahun produksi harus antara 1900 - ${currentYear}`)
    return false
  }

  if (!form.location) {
    toast.error('Lokasi harus dipilih')
    return false
  }

  if (!form.licensePlate.trim()) {
    toast.error('License plate harus diisi')
    return false
  }

  if (form.capacity <= 0) {
    toast.error('Kapasitas harus lebih dari 0')
    return false
  }

  if (!form.transmission) {
    toast.error('Transmisi harus dipilih')
    return false
  }

  if (!form.fuelType) {
    toast.error('Tipe bahan bakar harus dipilih')
    return false
  }

  if (form.price <= 0) {
    toast.error('Harga per hari harus lebih dari 0')
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
    const vehicleData = {
      rentalVendorId: form.rentalVendorId,
      type: form.type,
      brand: form.brand,
      model: form.model,
      year: form.year,
      location: form.location,
      licensePlate: form.licensePlate,
      capacity: form.capacity,
      transmission: form.transmission,
      fuelType: form.fuelType,
      price: form.price,
    }

    console.log('📤 Creating vehicle with data:', vehicleData)
    console.log('   rentalVendorId:', vehicleData.rentalVendorId, '(Type:', typeof vehicleData.rentalVendorId, ')')
    console.log('   selectedVendor:', selectedVendor.value)

    const result = await vehicleStore.createVehicle(vehicleData)

    if (result) {
      console.log('✅ Vehicle created successfully:', result)
      toast.success('Kendaraan berhasil dibuat!')
      setTimeout(() => {
        router.push({ name: 'vehicles' })
      }, 1500)
    }
  } catch (error) {
    console.error('❌ Error creating vehicle:', error)
    toast.error('Gagal membuat kendaraan')
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
          Create a New Vehicle
        </h1>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
          <p class="mt-4 text-gray-600">Loading form...</p>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- ✅ Rental Vendor - Only show for Superadmin -->
          <div v-if="showVendorDropdown">
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Rental Vendor <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.rentalVendorId"
              @change="handleVendorChange"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            >
              <option value="">-- Pilih Vendor --</option>
              <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id.toString()">
                {{ vendor.name }}
              </option>
            </select>
          </div>

          <!-- Vehicle Type -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Vehicle Type <span class="text-red-500">*</span>
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

          <!-- ✅ Hidden field for Rental Vendor (auto-filled) -->
          <input v-if="isRentalVendor" type="hidden" v-model="form.rentalVendorId" />

          <!-- ✅ Location (Dynamic based on vendor) -->
          <div>
            <label class="block text-sm font-semibold text-green-600 mb-2">
              Location <span class="text-red-500">*</span>
              Location
            </label>
            <select
              v-model="form.location"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              :disabled="!selectedVendor || availableLocations.length === 0"
              required
            >
              <option value="" disabled>-- Pilih Lokasi --</option>
              <option
                v-for="location in availableLocations"
                :key="location"
                :value="location"
              >
                {{ location }}
              </option>
            </select>
            <p v-if="!selectedVendor" class="text-xs text-yellow-600 mt-1">
              ⚠️ Pilih vendor terlebih dahulu untuk melihat lokasi
            </p>
            <p v-else-if="availableLocations.length === 0" class="text-xs text-red-600 mt-1">
              ❌ Vendor ini belum memiliki lokasi operasi
            </p>
            <p v-else class="text-xs text-gray-500 mt-1">
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

.form-container {
  max-width: 800px;
  margin: 30px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-container h1 {
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
}

.vehicle-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-submit, .btn-cancel {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-submit {
  background-color: #28a745;
  color: white;
}

.btn-submit:hover {
  background-color: #218838;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background-color: #5a6268;
}
</style>
