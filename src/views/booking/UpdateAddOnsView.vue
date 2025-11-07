<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { RentalBooking, RentalAddOn } from '@/interfaces/booking.interface'
import { toast } from 'vue-sonner'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const bookingId = route.params.id as string
const booking = ref<RentalBooking | null>(null)
const allAddOns = ref<RentalAddOn[]>([])
const selectedAddOns = ref<string[]>([])
const loading = ref(false)
const submitting = ref(false)

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

const currentAddOnsCost = computed(() => {
  if (!booking.value || !booking.value.listOfAddOns) return 0
  return booking.value.listOfAddOns.reduce((sum, addon) => sum + addon.price, 0)
})

const newAddOnsCost = computed(() => {
  return selectedAddOns.value.reduce((total, addOnId) => {
    const addOn = allAddOns.value.find(a => a.id === addOnId)
    return total + (addOn?.price || 0)
  }, 0)
})

const baseCost = computed(() => {
  if (!booking.value) return 0
  return booking.value.totalPrice - currentAddOnsCost.value
})

const estimatedNewTotal = computed(() => {
  return baseCost.value + newAddOnsCost.value
})

onMounted(async () => {
  console.log('════════════════════════════════════════════════════')
  console.log('📄 UpdateAddOnsView mounted')
  console.log('   Booking ID:', bookingId)
  console.log('════════════════════════════════════════════════════')

  await loadBooking()
  await loadAddOns()
})

const loadBooking = async () => {
  console.log('🔍 [FE] loadBooking called')
  loading.value = true
  try {
    const url = `http://localhost:8080/api/bookings/${bookingId}/update-addons`
    console.log('📤 [FE] GET request to:', url)

    const response = await axios.get(url)

    console.log('📥 [FE] Response status:', response.status)
    console.log('📥 [FE] Response data:', response.data)

    if (response.data.status === 200) {
      booking.value = response.data.data
      console.log('✅ [FE] Booking loaded successfully')
      console.log('   ID:', booking.value.id)
      console.log('   Status:', booking.value.status)
      console.log('   Vehicle:', booking.value.vehicleBrand, booking.value.vehicleModel)
      console.log('   Current add-ons:', booking.value.listOfAddOns?.length || 0)
      console.log('   Total price:', booking.value.totalPrice)

      // Prefill selected add-ons
      if (booking.value.listOfAddOns && booking.value.listOfAddOns.length > 0) {
        selectedAddOns.value = booking.value.listOfAddOns.map(addon => addon.id)
        console.log('✅ Prefilled add-ons:', selectedAddOns.value)
      }
    } else {
      console.log('❌ [FE] Response status not 200:', response.data.status)
      toast.error(response.data.message || 'Gagal memuat data booking')
      setTimeout(() => router.back(), 2000)
    }
  } catch (err: any) {
    console.log('❌ [FE] loadBooking error caught')
    console.log('   Error:', err.message)
    console.log('   Response status:', err.response?.status)
    console.log('   Response data:', err.response?.data)

    const errMsg = err.response?.data?.message || 'Gagal memuat data booking'
    console.error('Error loading booking:', err)
    toast.error(errMsg)
    setTimeout(() => router.back(), 2000)
  } finally {
    loading.value = false
  }
}

const loadAddOns = async () => {
  console.log('🔍 [FE] loadAddOns called')
  try {
    const url = 'http://localhost:8080/api/bookings/addons'
    console.log('📤 [FE] GET request to:', url)

    const response = await axios.get(url)

    console.log('📥 [FE] Response status:', response.status)
    console.log('📥 [FE] Response data:', response.data)

    if (response.data.status === 200) {
      allAddOns.value = response.data.data || []
      console.log('✅ [FE] All add-ons loaded:', allAddOns.value.length)
      allAddOns.value.forEach(addon => {
        console.log('   -', addon.name, ':', addon.price)
      })
    }
  } catch (err: any) {
    console.log('❌ [FE] loadAddOns error caught')
    console.log('   Error:', err.message)
    console.error('Error loading add-ons:', err)
  }
}

const handleAddOnChange = (addOnId: string) => {
  const index = selectedAddOns.value.indexOf(addOnId)
  console.log('🔄 [FE] Add-on checkbox changed:', addOnId, '- Selected:', index === -1)
  console.log('   Current selected:', selectedAddOns.value)
}

const handleSave = async () => {
  console.log('════════════════════════════════════════════════════')
  console.log('💾 [FE] handleSave called')
  console.log('════════════════════════════════════════════════════')
  console.log('📋 [FE] Selected add-ons:', selectedAddOns.value)
  console.log('💰 [FE] Current add-ons cost:', currentAddOnsCost.value)
  console.log('💰 [FE] New add-ons cost:', newAddOnsCost.value)
  console.log('💰 [FE] Estimated new total:', estimatedNewTotal.value)

  submitting.value = true

  try {
    const payload = {
      bookingId: bookingId,
      selectedAddOnIds: selectedAddOns.value,
    }

    console.log('📤 [FE] Sending update add-ons payload:', payload)

    const response = await axios.put(
      'http://localhost:8080/api/bookings/update-addons',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    console.log('📥 [FE] Update add-ons response:', response.data)

    if (response.data.status === 200) {
      const updatedBooking = response.data.data

      console.log('✅ [FE] Add-ons updated successfully')
      console.log('   Old add-ons cost:', currentAddOnsCost.value)
      console.log('   New add-ons cost:', newAddOnsCost.value)
      console.log('   New total price:', updatedBooking.totalPrice)

      let successMessage = `Add-ons berhasil diperbarui!`

      if (newAddOnsCost.value !== currentAddOnsCost.value) {
        successMessage += `\n\nPerubahan harga:\nSebelumnya: ${formatPrice(booking.value?.totalPrice || 0)}\nSekarang: ${formatPrice(updatedBooking.totalPrice)}`
      }

      toast.success(successMessage)

      console.log('🔄 [FE] Redirecting to booking detail...')
      setTimeout(() => {
        router.push({ name: 'booking-detail', params: { id: bookingId } })
      }, 3000)
    } else {
      console.log('❌ [FE] Response status not 200:', response.data.status)
      toast.error(response.data.message || 'Gagal memperbarui add-ons')
    }
  } catch (err: any) {
    console.log('❌ [FE] handleSave error caught')
    console.log('   Error:', err.message)
    console.log('   Response status:', err.response?.status)
    console.log('   Response data:', err.response?.data)

    const errMsg = err.response?.data?.message || 'Gagal memperbarui add-ons'
    console.error('Error updating add-ons:', err)
    toast.error(errMsg)
  } finally {
    submitting.value = false
    console.log('════════════════════════════════════════════════════')
  }
}

const handleCancel = () => {
  console.log('🔙 [FE] handleCancel - going back')
  router.back()
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Update Booking Add-Ons</h1>
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
    <div v-else-if="booking" class="max-w-3xl">
      <div class="bg-white rounded-lg shadow-md p-6 space-y-6">

        <!-- Current Booking Info -->
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3">Informasi Booking</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Vehicle:</span>
              <span class="font-semibold">{{ booking.vehicleBrand }} {{ booking.vehicleModel }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Pick-up:</span>
              <span>{{ new Date(booking.pickUpTime).toLocaleString('id-ID') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Drop-off:</span>
              <span>{{ new Date(booking.dropOffTime).toLocaleString('id-ID') }}</span>
            </div>
          </div>
        </div>

        <!-- Add-Ons Selection -->
        <div>
          <h3 class="font-bold text-lg mb-4">Pilih Add-Ons</h3>

          <div v-if="allAddOns.length === 0" class="p-4 bg-gray-50 rounded-lg text-center">
            <p class="text-gray-600">Tidak ada add-ons yang tersedia</p>
          </div>

          <div v-else class="space-y-3">
            <label
              v-for="addon in allAddOns"
              :key="addon.id"
              class="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
            >
              <input
                :value="addon.id"
                v-model="selectedAddOns"
                @change="() => handleAddOnChange(addon.id)"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div class="ml-3 flex-1">
                <p class="font-semibold text-gray-900">{{ addon.name }}</p>
                <p class="text-sm text-gray-600">{{ addon.name }}</p>
              </div>
              <span class="font-bold text-blue-600">{{ formatPrice(addon.price) }}</span>
            </label>
          </div>
        </div>

        <!-- Current Add-Ons -->
        <div v-if="booking.listOfAddOns && booking.listOfAddOns.length > 0" class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 class="font-semibold text-gray-900 mb-2">Add-Ons Saat Ini:</h4>
          <div class="space-y-1">
            <p v-for="addon in booking.listOfAddOns" :key="addon.id" class="text-sm text-gray-700">
              • {{ addon.name }} - {{ formatPrice(addon.price) }}
            </p>
          </div>
        </div>

        <!-- Price Summary -->
        <div class="border-2 border-orange-300 rounded-lg p-6 bg-orange-50 space-y-3">
          <h3 class="font-bold text-lg">Ringkasan Harga</h3>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>Biaya Kendaraan + Driver:</span>
              <span class="font-semibold">{{ formatPrice(baseCost) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Add-Ons Saat Ini:</span>
              <span class="font-semibold text-red-600">-{{ formatPrice(currentAddOnsCost) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Add-Ons Baru:</span>
              <span class="font-semibold text-green-600">+{{ formatPrice(newAddOnsCost) }}</span>
            </div>
            <div class="border-t pt-2 flex justify-between font-bold">
              <span>Total Harga (Estimasi):</span>
              <span class="text-lg text-orange-600">{{ formatPrice(estimatedNewTotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Changes Indicator -->
        <div v-if="newAddOnsCost !== currentAddOnsCost" class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-yellow-700 text-sm">
            <strong>⚠️ Perubahan Harga Terdeteksi</strong><br>
            Sebelumnya: {{ formatPrice(booking.totalPrice) }}<br>
            Akan menjadi: {{ formatPrice(estimatedNewTotal) }}<br>
            Selisih: {{ formatPrice(Math.abs(estimatedNewTotal - booking.totalPrice)) }}
          </p>
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
            @click="handleSave"
            :disabled="submitting"
            class="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span v-if="!submitting">Save Add-Ons</span>
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
