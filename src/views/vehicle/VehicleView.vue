<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useVehicleStore } from '@/stores/vehicle/vehicle.store';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import VDeleteVehicleButton from '@/components/vehicle/VDeleteVehicleButton.vue';

const router = useRouter();
const vehicleStore = useVehicleStore();
const { vehicles, loading, vehicleCount } = storeToRefs(vehicleStore);

const searchKeyword = ref('');
const selectedType = ref('');

const vehicleTypes = ['SUV', 'MPV', 'Luxury', 'Economy', 'Sport'];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const getStatusClass = (status: string) => {
  if (status === 'Available') {
    return 'bg-green-100 text-green-800';
  }
  return 'bg-red-100 text-red-800';
};

const getStatusBadgeColor = (status: string) => {
  return status === 'Available'
    ? 'bg-green-500 hover:bg-green-600'
    : 'bg-gray-500 hover:bg-gray-600';
};

const handleSearch = async () => {
  await vehicleStore.fetchVehicles(selectedType.value, searchKeyword.value);
};

const handleFilter = async (type: string) => {
  selectedType.value = type;
  searchKeyword.value = '';
  await vehicleStore.fetchVehicles(type, '');
};

const handleReset = async () => {
  selectedType.value = '';
  searchKeyword.value = '';
  await vehicleStore.fetchVehicles();
};

const handleVehicleDeleted = async (vehicleId: string) => {
  console.log('🗑️ VehicleView: Vehicle deleted:', vehicleId)
  // Refresh list setelah kendaraan dihapus
  await vehicleStore.fetchVehicles();
};

const goToDetail = (id: string) => {
  router.push(`/vehicles/${id}`);
};

const goToCreate = () => {
  router.push('/vehicles/create');
};

const getVehicleCount = async () => {
  await vehicleStore.getVehicleCount();
};

onMounted(async () => {
  await vehicleStore.fetchVehicles();
});
</script>

<template>
  <main class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Vehicle Rental App</h1>
            <p class="text-gray-600 text-sm mt-1">Kelola kendaraan rental Anda</p>
          </div>
          <div class="flex gap-2">
            <button
              @click="$router.push('/')"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Action Buttons and Stats -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex justify-between items-center flex-wrap gap-4 mb-4">
          <div class="flex gap-2">
            <button
              @click="goToCreate"
              class="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition"
            >
              ➕ Add A New Vehicle
            </button>
            <button
              @click="getVehicleCount"
              class="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition"
            >
              📊 Statistics
            </button>
          </div>
        </div>

        <!-- Vehicle Count Display -->
        <div v-if="vehicleCount > 0" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span class="text-green-800 font-medium">
              Total Kendaraan di Database: {{ vehicleCount }}
            </span>
          </div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Search Input -->
          <div class="col-span-1 md:col-span-2">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="Search vehicles..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <!-- Type Filter -->
          <div>
            <select
              v-model="selectedType"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Types</option>
              <option v-for="type in vehicleTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
        </div>

        <!-- Search Buttons -->
        <div class="flex gap-2">
          <button
            @click="handleSearch"
            class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            🔍 Search
          </button>
          <button
            @click="handleReset"
            class="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p class="text-gray-500 mt-4">Memuat kendaraan...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="vehicles.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
        <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 text-lg">Tidak ada kendaraan ditemukan</p>
        <p class="text-gray-400 text-sm mt-2">Coba ubah filter atau tambahkan kendaraan baru</p>
      </div>

      <!-- Vehicles Table -->
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-100 border-b">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">No</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Brand</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Model</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Capacity</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price per Day</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="(vehicle, index) in vehicles" :key="vehicle.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900">{{ index + 1 }}</td>
                <td class="px-6 py-4 text-sm text-gray-900 font-mono">{{ vehicle.id }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ vehicle.type }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ vehicle.brand }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ vehicle.model }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ vehicle.capacity }} seats</td>
                <td class="px-6 py-4 text-sm">
                  <span
                    :class="['px-3 py-1 rounded-full text-xs font-semibold', getStatusClass(vehicle.status)]"
                  >
                    {{ vehicle.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 font-semibold">
                  {{ formatPrice(vehicle.price) }}
                </td>
                <td class="px-6 py-4 text-sm">
                  <div class="flex gap-2">
                    <button
                      @click="goToDetail(vehicle.id)"
                      :class="['px-4 py-1 text-white rounded font-semibold hover:opacity-90 transition', getStatusBadgeColor(vehicle.status)]"
                    >
                      Detail
                    </button>
                    <!-- ✅ Gunakan VDeleteVehicleButton -->
                    <VDeleteVehicleButton
                      :vehicleId="vehicle.id"
                      :vehicleName="`${vehicle.brand} ${vehicle.model}`"
                      @deleted="handleVehicleDeleted"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Footer -->
        <div class="bg-gray-50 px-6 py-4 border-t">
          <p class="text-sm text-gray-600">
            Menampilkan {{ vehicles.length }} dari total {{ vehicleCount }} kendaraan
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Add custom styles if needed */
</style>
