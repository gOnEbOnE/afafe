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
const tableInstance = ref<any>(null);

const statusOptions = ['Upcoming', 'Ongoing', 'Done', 'Cancelled'];

// ✅ Format date-time with local timezone
const formatDateTime = (dateString: string) => {
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
    responsive: false,
    pageLength: 10,
    ordering: false,
    searching: true,
    paging: true,
    info: true,
    lengthChange: true,
    lengthMenu: [
      [10, 25, 50, 100, -1],
      ['10', '25', '50', '100', 'All'],
    ],
    language: {
      paginate: {
        first: '«',
        last: '»',
        next: '›',
        previous: '‹',
      },
      lengthMenu: 'Show _MENU_ entries',
      info: 'Showing _START_ to _END_ of _TOTAL_ entries',
      infoEmpty: 'Showing 0 to 0 of 0 entries',
      search: 'Search:',
    },
  });
};

const handleFilterStatus = async () => {
  await bookingStore.fetchBookings(selectedStatus.value);
  await initializeDataTable();
};

const handleReset = async () => {
  selectedStatus.value = '';
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
  await initializeDataTable();
});
</script>

<template>
  <main class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">Vehicle Rental App</h1>
          <div class="flex gap-2">
            <router-link
              to="/vehicles"
              class="px-4 py-2 text-gray-600 hover:text-gray-900 transition font-medium"
            >
              Vehicles
            </router-link>
            <router-link
              to="/bookings"
              class="px-4 py-2 text-green-600 font-semibold"
            >
              Bookings
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Action Button -->
      <div class="mb-6">
        <button
          @click="goToCreate"
          class="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition"
        >
          Create A New Booking
        </button>
      </div>

      <!-- Filter Section -->
      <div class="bg-white rounded shadow p-4 mb-4 flex gap-3 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Show
          </label>
          <select
            v-model="selectedStatus"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All</option>
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </div>
        <div class="text-gray-600 text-sm">entries</div>
        <button
          @click="handleFilterStatus"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
        >
          Filter
        </button>
        <button
          @click="handleReset"
          class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
        >
          Reset
        </button>
        <button
          @click="getBookingCount"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold"
        >
          📊
        </button>
      </div>

      <!-- Booking Count -->
      <div v-if="bookingCount > 0" class="bg-white rounded shadow p-3 mb-4 text-sm text-gray-700">
        <strong>Total Booking:</strong> {{ bookingCount }}
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12 bg-white rounded shadow">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p class="text-gray-500 mt-4">Loading bookings...</p>
      </div>

      <!-- Table -->
      <div v-else class="bg-white rounded shadow overflow-hidden">
        <table id="bookingTable" class="w-full text-sm">
          <thead>
            <tr class="bg-gray-100 border-b">
              <th class="px-4 py-3 text-left font-semibold text-gray-900">No</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">ID</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Vehicle ID</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Pick-up Time</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Drop-off Time</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Pick-up Location</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Total Price</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="(booking, index) in bookings" :key="booking.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-900">{{ index + 1 }}</td>
              <td class="px-4 py-3 text-gray-900 font-mono font-semibold">{{ booking.id }}</td>
              <td class="px-4 py-3 text-gray-900">{{ booking.vehicleId }}</td>
              <td class="px-4 py-3 text-gray-900">{{ formatDateTime(booking.pickUpTime) }}</td>
              <td class="px-4 py-3 text-gray-900">{{ formatDateTime(booking.dropOffTime) }}</td>
              <td class="px-4 py-3 text-gray-900 font-semibold">{{ booking.pickUpLocation }}</td>
              <td class="px-4 py-3">
                <span
                  :class="['px-3 py-1 rounded text-xs font-semibold', getStatusBadgeColor(booking.status)]"
                >
                  {{ booking.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-900 font-semibold">{{ formatPrice(booking.totalPrice) }}</td>
              <td class="px-4 py-3">
                <button
                  @click="goToDetail(booking.id)"
                  class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition font-semibold"
                >
                  Detail
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="bookings.length === 0" class="text-center py-12">
          <p class="text-gray-500">No bookings found</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* DataTables override untuk styling */
:deep(.dataTables_length) {
  margin-bottom: 1rem;
}

:deep(.dataTables_info) {
  margin-top: 1rem;
  font-size: 0.875rem;
}

:deep(.dataTables_paginate) {
  margin-top: 1rem;
}

:deep(.paginate_button) {
  padding: 0.25rem 0.5rem;
  margin: 0 0.25rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  cursor: pointer;
}

:deep(.paginate_button.current) {
  background-color: #16a34a;
  color: white;
  border-color: #16a34a;
}

:deep(.paginate_button:hover) {
  background-color: #f3f4f6;
}

:deep(.paginate_button.disabled) {
  color: #999;
  cursor: not-allowed;
}
</style>
