<script setup lang="ts">
import { ref } from 'vue'
import { useVehicleStore } from '@/stores/vehicle/vehicle.store'
import { toast } from 'vue-sonner'

interface Props {
  vehicleId: string
  vehicleName?: string
}

const props = withDefaults(defineProps<Props>(), {
  vehicleName: 'Kendaraan'
})

const emit = defineEmits<{
  deleted: [id: string]
}>()

const vehicleStore = useVehicleStore()
const isDeleting = ref(false)
const showConfirmDialog = ref(false)

const handleDeleteClick = () => {
  console.log('🗑️ VDeleteVehicleButton: Delete button clicked')
  console.log('   Vehicle ID:', props.vehicleId)
  console.log('   Vehicle Name:', props.vehicleName)
  showConfirmDialog.value = true
}

const handleConfirmDelete = async () => {
  console.log('✅ VDeleteVehicleButton: Delete confirmed')
  showConfirmDialog.value = false
  isDeleting.value = true

  try {
    await vehicleStore.deleteVehicle(props.vehicleId)
    console.log('✅ VDeleteVehicleButton: Delete successful, emitting event')

    toast.success(`${props.vehicleName} berhasil dihapus!`, {
      description: 'Kendaraan telah dipindahkan ke tempat sampah',
      duration: 3000,
    })

    emit('deleted', props.vehicleId)
  } catch (error) {
    console.error('❌ VDeleteVehicleButton: Delete failed', error)
    toast.error('Gagal menghapus kendaraan', {
      description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      duration: 3000,
    })
  } finally {
    isDeleting.value = false
  }
}

const handleCancel = () => {
  console.log('❌ VDeleteVehicleButton: Delete cancelled')
  showConfirmDialog.value = false
}
</script>

<template>
  <div>
    <!-- Delete Button -->
    <button
      @click="handleDeleteClick"
      :disabled="isDeleting"
      class="px-4 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {{ isDeleting ? '⏳ Deleting...' : '🗑️ Delete' }}
    </button>

    <!-- Confirmation Modal -->
    <div
      v-if="showConfirmDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <span class="text-xl">⚠️</span>
          </div>
          <h2 class="text-xl font-bold text-gray-900">Hapus Kendaraan?</h2>
        </div>

        <!-- Message -->
        <div class="mb-6">
          <p class="text-gray-600 mb-2">
            Anda akan menghapus kendaraan <span class="font-semibold">{{ vehicleName }}</span>
          </p>
          <p class="text-gray-600 text-sm">
            Kendaraan akan dipindahkan ke tempat sampah dan tidak akan ditampilkan di daftar kendaraan.
            Anda dapat memulihkannya nanti jika diperlukan.
          </p>
        </div>

        <!-- Warning -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p class="text-sm text-yellow-800">
            <span class="font-semibold">Perhatian:</span> Pastikan kendaraan ini tidak sedang disewa sebelum menghapus.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 justify-end">
          <button
            @click="handleCancel"
            :disabled="isDeleting"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="handleConfirmDelete"
            :disabled="isDeleting"
            class="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {{ isDeleting ? '⏳ Deleting...' : '✓ Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
button {
  transition: all 0.3s ease;
}

button:disabled {
  cursor: not-allowed;
}
</style>
