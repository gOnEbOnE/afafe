<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVehicleStore } from '@/stores/vehicle/vehicle.store';
import { useAuthStore } from '@/stores/auth/auth.store';
import { toast } from 'vue-sonner';

const router = useRouter();
const vehicleStore = useVehicleStore();
const authStore = useAuthStore();

// RBAC - Check permissions
const canCreate = computed(() => {
  const allowedRoles = ['Superadmin', 'Rental Vendor'];
  return allowedRoles.includes(authStore.user?.role || '');
});

const canEdit = computed(() => {
  const allowedRoles = ['Superadmin', 'Rental Vendor'];
  return allowedRoles.includes(authStore.user?.role || '');
});

const canDelete = computed(() => {
  const allowedRoles = ['Superadmin', 'Rental Vendor'];
  return allowedRoles.includes(authStore.user?.role || '');
});

// Lifecycle
onMounted(() => {
  vehicleStore.fetchVehicles();
});

// Methods
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

const goToCreate = () => {
  router.push('/vehicles/create');
};

const goToDetail = (id: string) => {
  router.push(`/vehicles/${id}`);
};

const goToUpdate = (id: string) => {
  router.push(`/vehicles/${id}/update`);
};

const confirmDelete = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus kendaraan ini?')) {
    try {
      await vehicleStore.deleteVehicle(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  }
};
</script>

<template>
  <div class="vehicle-container">
    <div class="vehicle-header">
      <h1>Manajemen Kendaraan</h1>
      <button
        v-if="canCreate"
        @click="goToCreate"
        class="btn-primary"
      >
        + Tambah Kendaraan
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="vehicleStore.loading" class="loading">
      Memuat data kendaraan...
    </div>

    <!-- Error State -->
    <div v-else-if="vehicleStore.error" class="error">
      {{ vehicleStore.error }}
    </div>

    <!-- Table -->
    <div v-else class="table-wrapper">
      <table class="vehicle-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Brand</th>
            <th>Model</th>
            <th>Tahun</th>
            <th>Plat Nomor</th>
            <th>Kapasitas</th>
            <th>Transmisi</th>
            <th>Bahan Bakar</th>
            <th>Harga/Hari</th>
            <th>Lokasi</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(vehicle, index) in vehicleStore.vehicles" :key="vehicle.id">
            <td>{{ index + 1 }}</td>
            <td>{{ vehicle.brand }}</td>
            <td>{{ vehicle.model }}</td>
            <td>{{ vehicle.year }}</td>
            <td>{{ vehicle.licensePlate }}</td>
            <td>{{ vehicle.capacity }} penumpang</td>
            <td>{{ vehicle.transmission }}</td>
            <td>{{ vehicle.fuelType }}</td>
            <td>Rp {{ formatCurrency(vehicle.dailyPrice) }}</td>
            <td>{{ vehicle.location }}</td>
            <td class="action-cell">
              <button
                @click="goToDetail(vehicle.id)"
                class="btn-info"
              >
                Lihat
              </button>
              <button
                v-if="canEdit"
                @click="goToUpdate(vehicle.id)"
                class="btn-warning"
              >
                Edit
              </button>
              <button
                v-if="canDelete"
                @click="confirmDelete(vehicle.id)"
                class="btn-danger"
              >
                Hapus
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="vehicleStore.vehicles.length === 0" class="empty-state">
        Tidak ada kendaraan ditemukan
      </div>
    </div>
  </div>
</template>

<style scoped>
.vehicle-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.vehicle-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.btn-primary {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 16px;
  border-radius: 5px;
}

.loading {
  background-color: #e7f3ff;
  color: #004085;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.vehicle-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.vehicle-table thead {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.vehicle-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #495057;
}

.vehicle-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #dee2e6;
}

.vehicle-table tbody tr:hover {
  background-color: #f8f9fa;
}

.action-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-info, .btn-warning, .btn-danger {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.btn-info:hover {
  background-color: #138496;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background-color: #e0a800;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}
</style>
