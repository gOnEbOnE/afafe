<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'

interface Props {
  bookingId: string
  bookingStatus?: string
}

const props = withDefaults(defineProps<Props>(), {
  bookingStatus: 'Upcoming'
})

const emit = defineEmits<{
  bookingCancelled: []
}>()

const router = useRouter()
const isDeleting = ref(false)
const showConfirmDialog = ref(false)

const handleCancelClick = () => {
  console.log('════════════════════════════════════════════════════')
  console.log('❌ [FE] Cancel button clicked')
  console.log('   Booking ID:', props.bookingId)
  console.log('   Booking Status:', props.bookingStatus)
  console.log('════════════════════════════════════════════════════')
  
  // Check if booking is Upcoming
  if (props.bookingStatus !== 'Upcoming') {
    console.log('❌ Booking status is not Upcoming:', props.bookingStatus)
    toast.error(`Booking dengan status '${props.bookingStatus}' tidak dapat dibatalkan. Hanya booking dengan status 'Upcoming' yang dapat dibatalkan.`)
    return
  }
  
  showConfirmDialog.value = true
}

const handleConfirmCancel = async () => {
  console.log('════════════════════════════════════════════════════')
  console.log('🗑️  [FE] Confirm cancel clicked')
  console.log('   Booking ID:', props.bookingId)
  console.log('════════════════════════════════════════════════════')
  
  showConfirmDialog.value = false
  isDeleting.value = true
  
  try {
    const url = `http://localhost:8080/api/bookings/${props.bookingId}/delete`
    console.log('📤 [FE] DELETE request to:', url)
    
    const response = await axios.delete(url)
    
    console.log('📥 [FE] Response status:', response.status)
    console.log('📥 [FE] Response data:', response.data)
    
    if (response.data.status === 200) {
      console.log('✅ [FE] Booking cancelled successfully')
      
      const cancelledBooking = response.data.data
      console.log('   Final status:', cancelledBooking.status)
      console.log('   Final total price:', cancelledBooking.totalPrice)
      
      // Show success message
      toast.success('Booking berhasil dibatalkan dan dihapus dari daftar pesanan')
      
      // Emit event
      emit('bookingCancelled')
      
      // Redirect after 2 seconds
      console.log('🔄 [FE] Redirecting to bookings list in 2 seconds...')
      setTimeout(() => {
        router.push({ name: 'bookings' })
      }, 2000)
    } else {
      console.log('❌ [FE] Response status not 200:', response.data.status)
      toast.error(response.data.message || 'Gagal membatalkan booking')
    }
  } catch (err: any) {
    console.log('❌ [FE] handleConfirmCancel error caught')
    console.log('   Error:', err.message)
    console.log('   Response status:', err.response?.status)
    console.log('   Response data:', err.response?.data)
    
    const errMsg = err.response?.data?.message || 'Gagal membatalkan booking'
    console.error('Error cancelling booking:', err)
    toast.error(errMsg)
  } finally {
    isDeleting.value = false
    console.log('════════════════════════════════════════════════════')
  }
}

const handleCancelDialog = () => {
  console.log('🔙 [FE] Cancel dialog - user clicked Cancel')
  showConfirmDialog.value = false
}
</script>

<template>
  <div>
    <!-- Delete Button -->
    <button
      @click="handleCancelClick"
      :disabled="isDeleting || bookingStatus !== 'Upcoming'"
      class="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm md:text-base"
    >
      <span v-if="!isDeleting">Cancel Booking</span>
      <span v-else>Cancelling...</span>
    </button>

    <!-- Confirmation Dialog -->
    <div
      v-if="showConfirmDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
        <h3 class="text-lg font-bold mb-4 text-gray-900">Konfirmasi Pembatalan Pesanan</h3>
        
        <div class="mb-6 space-y-3">
          <p class="text-gray-700">
            ⚠️ Anda yakin ingin membatalkan pesanan ini?
          </p>
          <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <p class="text-red-700 font-semibold">
              Akibat pembatalan:
            </p>
            <ul class="mt-2 space-y-1 text-red-600 ml-4 list-disc">
              <li>Status pesanan akan menjadi Done</li>
              <li>Kendaraan akan kembali menjadi Available</li>
              <li class="text-orange-600 font-semibold">
                Total harga akan diubah menjadi Rp0,00
              </li>
              <li>Pesanan akan dihapus dari daftar pesanan</li>
            </ul>
          </div>
        </div>

        <div class="flex gap-3 justify-end">
          <button
            @click="handleCancelDialog"
            :disabled="isDeleting"
            class="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Tidak, Batalkan
          </button>
          <button
            @click="handleConfirmCancel"
            :disabled="isDeleting"
            class="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span v-if="!isDeleting">Ya, Batalkan Pesanan</span>
            <span v-else>Membatalkan...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any additional styles here */
</style>
