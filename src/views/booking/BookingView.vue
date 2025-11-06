<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import { useBookingStore } from '@/stores/booking/booking.store';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-dt/css/jquery.dataTables.min.css';
import type { RentalBooking } from '@/interfaces/booking.interface';

const router = useRouter();
const bookingStore = useBookingStore();
const { bookings, loading, bookingCount } = storeToRefs(bookingStore);

const selectedStatus = ref('');
const showTable = ref(false);
const tableInstance = ref<any>(null);

const statusOptions = ['Upcoming', 'Ongoing', 'Done', 'Cancelled'];

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-800';
    case 'ongoing':
      return 'bg-yellow-100 text-yellow-800';
    case 'done':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const initializeDataTable = async () => {
  await nextTick();

  // Destroy existing table if it exists
  if (tableInstance.value) {
    $(tableInstance.value).DataTable().destroy();
  }

  // Initialize new table
  tableInstance.value = $('#bookingTable').DataTable({
    responsive: true,
    pageLength: 10,
    ordering: false,
    searching: false,
    paging: true,
    info: true,
    lengthChange: true,
    lengthMenu: [
      [5, 10, 25, 50, -1],
      ['5', '10', '25', '50', 'All'],
    ],
    language: {
      paginate: {
        first: '« First',
        last: 'Last »',
        next: 'Next ›',
        previous: '‹ Previous',
      },
      lengthMenu: 'Show _MENU_ entries',
      info: 'Showing _START_ to _END_ of _TOTAL_ entries',
      infoEmpty: 'Showing 0 to 0 of 0 entries',
      search: 'Search:',
    },
    columnDefs: [
      { width: '50px', targets: 0 },
      { width: '90px', targets: 1 },
      { width: '90px', targets: 2 },
      { width: '150px', targets: [3, 4] },
      { width: '130px', targets: 5 },
      { width: '100px', targets: 6 },
      { width: '130px', targets: 7 },
      { width: '90px', targets: 8 },
    ],
  });
};

const handleFilterStatus = async () => {
  await bookingStore.fetchBookings(selectedStatus.value);
  showTable.value = true;
  await initializeDataTable();
};

const handleReset = async () => {
  selectedStatus.value = '';
  await bookingStore.fetchBookings();
  showTable.value = true;
  await initializeDataTable();
};

const handleBookingDeleted = async () => {
  console.log('🗑️ BookingView: Booking deleted');
  await bookingStore.fetchBookings();
  await initializeDataTable();
};

const goToDetail = (id: string) => {
  router.push({ name: 'booking-detail', params: { id } });
};

const goToCreate = () => {
  router.push({ name: 'create-booking' });
};

const getBookingCount = async () => {
  await bookingStore.getBookingCount();
};

onMounted(async () => {
  await bookingStore.fetchBookings();
  showTable.value = true;
  await initializeDataTable();
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
            <p class="text-gray-600 text-sm mt-1">Kelola pesanan rental Anda</p>
          </div>
          <div class="flex gap-2">
            <router-link
              to="/"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              ← Kembali
            </router-link>
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
              class="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition flex items-center gap-2"
            >
              ➕ Create A New Booking
            </button>
            <button
              @click="getBookingCount"
              class="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition flex items-center gap-2"
            >
              📊 Statistics
            </button>
          </div>
        </div>

        <!-- Booking Count Display -->
        <div v-if="bookingCount > 0" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="text-green-800 font-medium">
              Total Booking: {{ bookingCount }}
            </span>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Status Filter -->
          <div class="col-span-1 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              v-model="selectedStatus"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option v-for="status in statusOptions" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </div>

          <!-- Buttons -->
          <div class="flex gap-2 items-end">
            <button
              @click="handleFilterStatus"
              class="flex-1 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
            >
              🔍 Filter
            </button>
            <button
              @click="handleReset"
              class="flex-1 px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-semibold"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12 bg-white rounded-lg shadow">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p class="text-gray-500 mt-4">Memuat booking...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="bookings.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
        <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 text-lg">Tidak ada booking ditemukan</p>
        <p class="text-gray-400 text-sm mt-2">Coba ubah filter atau buat booking baru</p>
      </div>

      <!-- DataTable -->
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <table id="bookingTable" class="w-full stripe hover">
          <thead>
            <tr>
              <th class="bg-gray-100 px-6 py-3 text-left text-sm font-semibold text-gray-900">No</th>
              <th class="bg-gray-100 px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
              <th class="bg-gray-100 px-6 py-3 text-left text-sm font-semibold text-gray-900">Vehicle ID</th>
              <th class="bg-gray-100 px-6 py-3 text-left text-sm font-semibold text-gray-900">Pick-up Time</th>
              <th class="bg-gray-100 px-6 py-3 text-left text-sm font-semibold text-gray-900">Drop-off Time</th>
              <th class="bg-gray-100 px-6 py-3 text-left text-sm font-semibold text-gray-900">Pick-up Location</th>
              <th class="bg-gray-100 px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th class="bg-gray-100 px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Price</th>
              <th class="bg-gray-100 px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="(booking, index) in bookings" :key="booking.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-900">{{ index + 1 }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 font-mono">{{ booking.id }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 font-mono">{{ booking.vehicleId }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ formatDate(booking.pickupTime) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ formatDate(booking.dropoffTime) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ booking.pickupLocation }}</td>
              <td class="px-6 py-4 text-sm">
                <span
                  :class="['px-3 py-1 rounded-full text-xs font-semibold', getStatusBadgeColor(booking.status)]"
                >
                  {{ booking.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 font-semibold">
                {{ formatPrice(booking.totalPrice) }}
              </td>
              <td class="px-6 py-4 text-sm">
                <button
                  @click="goToDetail(booking.id)"
                  class="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold"
                >
                  Detail
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Table Footer -->
        <div class="bg-gray-50 px-6 py-4 border-t">
          <p class="text-sm text-gray-600">
            Menampilkan {{ bookings.length }} dari total {{ bookingCount }} booking
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
:deep(.dataTables_wrapper) {
  padding: 1rem;
}

:deep(.dataTables_length) {
  margin-bottom: 1rem;
}

:deep(.dataTables_info) {
  padding-top: 0;
  font-size: 0.875rem;
}

:deep(.dataTables_paginate) {
  margin-top: 1rem;
}

:deep(.paginate_button) {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  background-color: white;
  color: #333;
  cursor: pointer;
  border-radius: 0.375rem;
  margin: 0 0.25rem;
  transition: all 0.3s ease;
}

:deep(.paginate_button:hover) {
  background-color: #e5e7eb;
}

:deep(.paginate_button.current) {
  background-color: #16a34a;
  color: white;
  border-color: #16a34a;
}

:deep(.paginate_button.disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

:deep(.stripe tbody tr:nth-child(odd)) {
  background-color: #fafafa;
}

:deep(.stripe tbody tr:hover) {
  background-color: #f0f0f0 !important;
}

:deep(.sorting_asc::before),
:deep(.sorting_desc::before),
:deep(.sorting::before) {
  content: '' !important;
}
</style>
