<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { RentalBooking } from '@/interfaces/booking.interface'
import { toast } from 'vue-sonner'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const bookingId = route.params.id as string
const booking = ref<RentalBooking | null>(null)
const availableStatuses = ref<string[]>([])
const selectedNewStatus = ref<string>('')
const loading = ref(false)
const submitting = ref(false)

const statusColors = {
  'Upcoming': 'text-blue-600',
  'Ongoing': 'text-orange-600',
  'Done': 'text-green-600',
  'Cancelled': 'text-red-600'
}

const statusBgColors = {
  'Upcoming': 'bg-blue-50',
  'Ongoing': 'bg-orange-50',
  'Done': 'bg-green-50',
  'Cancelled': 'bg-red-50'
}

const statusDescriptions = {
  'Upcoming': 'Pesanan telah dibuat, menunggu waktu pengambilan kendaraan',
  'Ongoing': 'Kendaraan sedang digunakan dalam periode rental',
  'Done': 'Pesanan selesai, kendaraan telah dikembalikan',
  'Cancelled': 'Pesanan telah dibatalkan'
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isPenaltyApplicable = computed(() => {
  if (!booking.value) return false
  const now = new Date()
  const dropOffTime = new Date(booking.value.dropOffTime)
  return now > dropOffTime && booking.value.status === 'Ongoing'
})

const estimatedPenalty = computed(() => {
  if (!booking.value || !isPenaltyApplicable.value) return 0

  const now = new Date()
  const dropOffTime = new Date(booking.value.dropOffTime)
  const minutesLate = Math.floor((now.getTime() - dropOffTime.getTime()) / (1000 * 60))
  const hoursLate = Math.ceil(minutesLate / 60)

  console.log('💰 Penalty Calculation:')
  console.log('   Minutes late:', minutesLate)
  console.log('   Hours late (rounded up):', hoursLate)
  console.log('   Penalty per hour: 20000')
  console.log('   Total penalty:', hoursLate * 20000)

  return hoursLate * 20000
})

const estimatedNewTotal = computed(() => {
  if (!booking.value) return 0

  if (selectedNewStatus.value === 'Done' && isPenaltyApplicable.value) {
    const newTotal = booking.value.totalPrice + estimatedPenalty.value
    console.log('💰 Estimated new total:', newTotal)
    return newTotal
  }

  return booking.value.totalPrice
})

onMounted(async () => {
  console.log('════════════════════════════════════════════════════')
  console.log('📄 UpdateBookingStatusView mounted')
  console.log('   Booking ID:', bookingId)
  console.log('════════════════════════════════════════════════════')

  await loadBooking()
  await loadAvailableStatuses()
})

const loadBooking = async () => {
  console.log('🔍 [FE] loadBooking called')
  loading.value = true
  try {
    const url = `http://localhost:8080/api/bookings/${bookingId}/update-status`
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
      console.log('   Pick-up:', booking.value.pickUpTime)
      console.log('   Drop-off:', booking.value.dropOffTime)
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

const loadAvailableStatuses = async () => {
  console.log('🔍 [FE] loadAvailableStatuses called')
  try {
    const url = `http://localhost:8080/api/bookings/${bookingId}/available-status-transitions`
    console.log('📤 [FE] GET request to:', url)

    const response = await axios.get(url)

    console.log('📥 [FE] Response status:', response.status)
    console.log('📥 [FE] Response data:', response.data)

    if (response.data.status === 200) {
      availableStatuses.value = response.data.data || []
      console.log('✅ [FE] Available statuses:', availableStatuses.value)
    } else {
      console.log('❌ [FE] Response status not 200:', response.data.status)
    }
  } catch (err: any) {
    console.log('❌ [FE] loadAvailableStatuses error caught')
    console.log('   Error:', err.message)
    console.log('   Response status:', err.response?.status)
    console.log('   Response data:', err.response?.data)
    console.error('Error loading available statuses:', err)
  }
}

const handleSave = async () => {
  console.log('════════════════════════════════════════════════════')
  console.log('💾 [FE] handleSave called')
  console.log('════════════════════════════════════════════════════')

  if (!selectedNewStatus.value) {
    console.log('❌ [FE] No status selected')
    toast.error('Pilih status baru terlebih dahulu')
    return
  }

  console.log('📋 [FE] Selected new status:', selectedNewStatus.value)
  submitting.value = true

  try {
    const payload = {
      bookingId: bookingId,
      newStatus: selectedNewStatus.value,
    }

    console.log('📤 [FE] Sending update status payload:', payload)

    const response = await axios.put(
      'http://localhost:8080/api/bookings/update-status',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    console.log('📥 [FE] Update status response:', response.data)

    if (response.data.status === 200) {
      const updatedBooking = response.data.data

      console.log('✅ [FE] Status updated successfully')
      console.log('   New status:', updatedBooking.status)
      console.log('   New total price:', updatedBooking.totalPrice)

      // Show success message with details
      let successMessage = `Status booking berhasil diubah menjadi ${updatedBooking.status}!`

      if (selectedNewStatus.value === 'Done' && estimatedPenalty.value > 0) {
        successMessage += `\n\nDenda keterlambatan: ${formatPrice(estimatedPenalty.value)}\nTotal harga baru: ${formatPrice(updatedBooking.totalPrice)}`
        console.log('   Penalty applied:', estimatedPenalty.value)
      }

      toast.success(successMessage)

      console.log('🔄 [FE] Redirecting to booking detail...')
      setTimeout(() => {
        router.push({ name: 'booking-detail', params: { id: bookingId } })
      }, 3000)
    } else {
      console.log('❌ [FE] Response status not 200:', response.data.status)
      toast.error(response.data.message || 'Gagal memperbarui status booking')
    }
  } catch (err: any) {
    console.log('❌ [FE] handleSave error caught')
    console.log('   Error:', err.message)
    console.log('   Response status:', err.response?.status)
    console.log('   Response data:', err.response?.data)

    const errMsg = err.response?.data?.message || 'Gagal memperbarui status booking'
    console.error('Error updating status:', err)
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
      <h1 class="text-3xl font-bold mb-2">Update Booking Status</h1>
      <p class="text-gray-600">Booking ID: {{ bookingId }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="ml-4 text-gray-600">Memuat data booking...</p>
    </div>

    <!-- Content -->
    <div v-else-if="booking" class="max-w-2xl">
      <div class="bg-white rounded-lg shadow-md p-6 space-y-6">

        <!-- Booking Info -->
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3">Informasi Booking</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Vehicle:</span>
              <span class="font-semibold">{{ booking.vehicleBrand }} {{ booking.vehicleModel }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Pick-up:</span>
              <span>{{ formatDateTime(booking.pickUpTime) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Drop-off:</span>
              <span>{{ formatDateTime(booking.dropOffTime) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Lokasi Pengambilan:</span>
              <span>{{ booking.pickUpLocation }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Lokasi Pengembalian:</span>
              <span>{{ booking.dropOffLocation }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Total Harga:</span>
              <span class="font-semibold">{{ formatPrice(booking.totalPrice) }}</span>
            </div>
          </div>
        </div>

        <!-- Current Status -->
        <div>
          <label class="block text-sm font-semibold mb-3">Status Saat Ini</label>
          <div :class="['p-4 rounded-lg border-2', statusBgColors[booking.status]]">
            <p :class="['text-lg font-bold', statusColors[booking.status]]">
              {{ booking.status }}
            </p>
            <p class="text-sm text-gray-600 mt-2">{{ statusDescriptions[booking.status] }}</p>
          </div>
        </div>

        <!-- Status Transition -->
        <div v-if="availableStatuses.length > 0">
          <label class="block text-sm font-semibold mb-3">Pilih Status Baru</label>
          <select
            v-model="selectedNewStatus"
            @change="() => console.log('📋 [FE] Selected new status:', selectedNewStatus)"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Pilih Status --</option>
            <option v-for="status in availableStatuses" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </div>

        <!-- No Transition Available -->
        <div v-else class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-700 font-semibold">⚠️ Tidak ada perubahan status yang tersedia</p>
          <p class="text-sm text-red-600 mt-2">
            Booking dengan status "{{ booking.status }}" tidak dapat diubah pada saat ini.
          </p>
        </div>

        <!-- Late Return Warning -->
        <div v-if="isPenaltyApplicable" class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p class="text-orange-700 font-semibold">⏰ Denda Keterlambatan</p>
          <p class="text-sm text-orange-600 mt-2">
            Waktu pengembalian telah terlewat. Jika Anda mengubah status menjadi "Done", denda keterlambatan akan dikenakan.
          </p>
          <div class="mt-3 space-y-1 text-sm">
            <div class="flex justify-between">
              <span>Denda (Rp20.000/jam):</span>
              <span class="font-semibold text-orange-700">{{ formatPrice(estimatedPenalty) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Total Harga Baru:</span>
              <span class="font-semibold text-orange-700">{{ formatPrice(estimatedNewTotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="selectedNewStatus" class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 class="font-semibold text-gray-900 mb-3">Ringkasan Perubahan</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>Status Saat Ini:</span>
              <span :class="statusColors[booking.status]" class="font-semibold">{{ booking.status }}</span>
            </div>
            <div class="flex justify-between">
              <span>Status Baru:</span>
              <span class="font-semibold text-green-600">{{ selectedNewStatus }}</span>
            </div>
            <div v-if="selectedNewStatus === 'Ongoing'" class="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
              ℹ️ Kendaraan akan berubah status menjadi "In Use"
            </div>
            <div v-if="selectedNewStatus === 'Done'" class="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
              ℹ️ Kendaraan akan berubah status menjadi "Available" dan lokasi diperbarui ke {{ booking.dropOffLocation }}
            </div>
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
            @click="handleSave"
            :disabled="submitting || !selectedNewStatus || availableStatuses.length === 0"
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
