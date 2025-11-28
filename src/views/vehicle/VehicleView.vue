<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVehicleStore } from '@/stores/vehicle/vehicle.store';
import { useAuthStore } from '@/stores/auth/auth.store';
import type { Vehicle } from '@/interfaces/vehicle.interface';
import { toast } from 'vue-sonner';

const router = useRouter();
const vehicleStore = useVehicleStore();
const authStore = useAuthStore();

// RBAC - Check permissions
const canCreate = computed(() => {
  const userRole = authStore.user?.role || '';
  return userRole === 'Superadmin' || userRole === 'RentalVendor';
});

const canEdit = computed(() => {
  const userRole = authStore.user?.role || '';
  return userRole === 'Superadmin' || userRole === 'RentalVendor';
});

const canDelete = computed(() => {
  const userRole = authStore.user?.role || '';
  return userRole === 'Superadmin' || userRole === 'RentalVendor';
});

// ✅ FIX: Client-side filtering untuk Rental Vendor
const filteredVehicles = computed(() => {
  const userRole = authStore.user?.role || '';
  const userId = authStore.user?.id || '';

  // Superadmin bisa lihat semua kendaraan
  if (userRole === 'Superadmin') {
    return vehicleStore.vehicles;
  }

  // Rental Vendor HANYA lihat kendaraan miliknya sendiri
  if (userRole === 'RentalVendor') {
    return vehicleStore.vehicles.filter(vehicle => {
      // Filter berdasarkan rentalVendorId yang cocok dengan user.id
      return vehicle.rentalVendorId === userId;
    });
  }

  // Customer atau role lain: lihat semua kendaraan yang tersedia
  return vehicleStore.vehicles;
});

// Lifecycle
onMounted(() => {
  vehicleStore.fetchVehicles();
});

// Methods
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

const getStatusBadge = (status: string) => {
  const badges: Record<string, { class: string; label: string }> = {
    Available: { class: 'badge-success', label: 'Tersedia' },
    Rented: { class: 'badge-warning', label: 'Disewa' },
    Maintenance: { class: 'badge-danger', label: 'Maintenance' },
  };
  return badges[status] || { class: 'badge-secondary', label: status };
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

// ✅ FIX: Check ownership sebelum delete
const canDeleteVehicle = (vehicle: Vehicle): boolean => {
  const userRole = authStore.user?.role || '';
  const userId = authStore.user?.id || '';

  // Superadmin bisa hapus semua kendaraan
  if (userRole === 'Superadmin') {
    return true;
  }

  // Rental Vendor hanya bisa hapus kendaraan miliknya sendiri
  if (userRole === 'RentalVendor') {
    return vehicle.rentalVendorId === userId;
  }

  return false;
};

// ✅ FIX: Check ownership sebelum edit
const canEditVehicle = (vehicle: Vehicle): boolean => {
  const userRole = authStore.user?.role || '';
  const userId = authStore.user?.id || '';

  // Superadmin bisa edit semua kendaraan
  if (userRole === 'Superadmin') {
    return true;
  }

  // Rental Vendor hanya bisa edit kendaraan miliknya sendiri
  if (userRole === 'RentalVendor') {
    return vehicle.rentalVendorId === userId;
  }

  return false;
};

const confirmDelete = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus kendaraan ini?')) {
    try {
      await vehicleStore.deleteVehicle(id);
      // Tidak perlu refresh manual karena store sudah update state
    } catch (err) {
      console.error('Delete error:', err);
    }
  }
};
</script>

<template>
  <div class="vehicle-container">
    <div class="vehicle-header">
      <div>
        <h1>Manajemen Kendaraan</h1>
        <p class="vehicle-count">
          Menampilkan {{ filteredVehicles.length }} kendaraan
          <span v-if="authStore.user?.role === 'RentalVendor'" class="vendor-info">
            (milik Anda)
          </span>
        </p>
      </div>
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
            <th>Vendor</th>
            <th>Type</th>
            <th>Brand</th>
            <th>Model</th>
            <th>Tahun</th>
            <th>Plat Nomor</th>
            <th>Kapasitas</th>
            <th>Transmisi</th>
            <th>Bahan Bakar</th>
            <th>Harga/Hari</th>
            <th>Lokasi</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(vehicle, index) in filteredVehicles" :key="vehicle.id">
            <td>{{ index + 1 }}</td>
            <td>{{ vehicle.rentalVendorName }}</td>
            <td>{{ vehicle.type }}</td>
            <td>{{ vehicle.brand }}</td>
            <td>{{ vehicle.model }}</td>
            <td>{{ vehicle.year }}</td>
            <td>{{ vehicle.licensePlate }}</td>
            <td>{{ vehicle.capacity }} penumpang</td>
            <td>{{ vehicle.transmission }}</td>
            <td>{{ vehicle.fuelType }}</td>
            <td>Rp {{ formatCurrency(vehicle.price) }}</td>
            <td>{{ vehicle.location }}</td>
            <td>
              <span :class="['badge', getStatusBadge(vehicle.status).class]">
                {{ getStatusBadge(vehicle.status).label }}
              </span>
            </td>
            <td class="action-cell">
              <button
                @click="goToDetail(vehicle.id)"
                class="btn-info"
              >
                Lihat
              </button>
              <button
                v-if="canEdit && canEditVehicle(vehicle)"
                @click="goToUpdate(vehicle.id)"
                class="btn-warning"
              >
                Edit
              </button>
              <button
                v-if="canDelete && canDeleteVehicle(vehicle)"
                @click="confirmDelete(vehicle.id)"
                class="btn-danger"
              >
                Hapus
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredVehicles.length === 0" class="empty-state">
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
  margin-bottom: 5px;
}

.vehicle-count {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.vendor-info {
  color: #007bff;
  font-weight: 500;
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

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.badge-success {
  background-color: #d4edda;
  color: #155724;
}

.badge-warning {
  background-color: #fff3cd;
  color: #856404;
}

.badge-danger {
  background-color: #f8d7da;
  color: #721c24;
}

.badge-secondary {
  background-color: #e2e3e5;
  color: #383d41;
}
</style>
