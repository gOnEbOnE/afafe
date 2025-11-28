<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useVehicleStore } from '@/stores/vehicle/vehicle.store';
import { useAuthStore } from '@/stores/auth/auth.store';
import type { Vehicle } from '@/interfaces/vehicle.interface';
import { toast } from 'vue-sonner';

const router = useRouter();
const vehicleStore = useVehicleStore();
const authStore = useAuthStore();

// ✅ NEW: State untuk search, filter, dan sort
const searchQuery = ref('');
const selectedType = ref('');
const sortOption = ref('default');

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

// ✅ ENHANCED: Client-side filtering dengan Search, Filter Type, dan Sorting
const filteredVehicles = computed(() => {
  const userRole = authStore.user?.role || '';
  const userId = authStore.user?.id || '';

  // STEP 1: Filter berdasarkan RBAC
  let result = vehicleStore.vehicles;

  // Superadmin bisa lihat semua kendaraan
  if (userRole === 'Superadmin') {
    result = vehicleStore.vehicles;
  }
  // Rental Vendor HANYA lihat kendaraan miliknya sendiri
  else if (userRole === 'RentalVendor') {
    result = vehicleStore.vehicles.filter(vehicle => {
      return vehicle.rentalVendorId === userId;
    });
  }
  // Customer atau role lain: lihat semua kendaraan yang tersedia
  else {
    result = vehicleStore.vehicles;
  }

  // STEP 2: Filter berdasarkan Search Query (semua kolom)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(vehicle => {
      const brand = vehicle.brand?.toLowerCase() || '';
      const model = vehicle.model?.toLowerCase() || '';
      const vendorName = vehicle.rentalVendorName?.toLowerCase() || '';
      const type = vehicle.type?.toLowerCase() || '';
      const year = vehicle.year?.toString() || '';
      const licensePlate = vehicle.licensePlate?.toLowerCase() || '';
      const transmission = vehicle.transmission?.toLowerCase() || '';
      const fuelType = vehicle.fuelType?.toLowerCase() || '';
      const location = vehicle.location?.toLowerCase() || '';
      const status = vehicle.status?.toLowerCase() || '';

      return brand.includes(query) ||
             model.includes(query) ||
             vendorName.includes(query) ||
             type.includes(query) ||
             year.includes(query) ||
             licensePlate.includes(query) ||
             transmission.includes(query) ||
             fuelType.includes(query) ||
             location.includes(query) ||
             status.includes(query);
    });
  }

  // STEP 3: Filter berdasarkan Type
  if (selectedType.value && selectedType.value !== '') {
    result = result.filter(vehicle => {
      return vehicle.type === selectedType.value;
    });
  }

  // STEP 4: Sorting berdasarkan pilihan
  if (sortOption.value === 'price_asc') {
    result = [...result].sort((a, b) => a.price - b.price);
  } else if (sortOption.value === 'price_desc') {
    result = [...result].sort((a, b) => b.price - a.price);
  } else if (sortOption.value === 'capacity_asc') {
    result = [...result].sort((a, b) => a.capacity - b.capacity);
  } else if (sortOption.value === 'capacity_desc') {
    result = [...result].sort((a, b) => b.capacity - a.capacity);
  } else if (sortOption.value === 'id_asc') {
    result = [...result].sort((a, b) => a.id.localeCompare(b.id));
  } else if (sortOption.value === 'id_desc') {
    result = [...result].sort((a, b) => b.id.localeCompare(a.id));
  }

  return result;
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

    <!-- ✅ NEW: Toolbar - Search, Filter, Sort -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Cari kendaraan..."
            class="search-input"
          />
        </div>

        <div class="filter-box">
          <select v-model="selectedType" class="filter-select">
            <option value="">Semua Tipe</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="MPV">MPV</option>
            <option value="Luxury">Luxury</option>
          </select>
        </div>

        <div class="sort-box">
          <select v-model="sortOption" class="sort-select">
            <option value="default">Urutkan</option>
            <option value="price_asc">💰 Harga: Termurah</option>
            <option value="price_desc">💰 Harga: Termahal</option>
            <option value="capacity_asc">👥 Kapasitas: Terkecil</option>
            <option value="capacity_desc">👥 Kapasitas: Terbesar</option>
            <option value="id_asc">🆔 ID: A-Z</option>
            <option value="id_desc">🆔 ID: Z-A</option>
          </select>
        </div>
      </div>

      <div class="toolbar-right">
        <button
          v-if="searchQuery || selectedType"
          @click="searchQuery = ''; selectedType = ''"
          class="btn-reset"
        >
          🔄 Reset Filter
        </button>
      </div>
    </div>

    <!-- ✅ NEW: Filter Result Info -->
    <div v-if="searchQuery || selectedType" class="filter-info">
      <span class="info-icon">ℹ️</span>
      <span>
        Menampilkan <strong>{{ filteredVehicles.length }}</strong> kendaraan
        <span v-if="searchQuery"> dengan kata kunci "<strong>{{ searchQuery }}</strong>"</span>
        <span v-if="selectedType"> tipe "<strong>{{ selectedType }}</strong>"</span>
      </span>
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
            <th>ID</th>
            <th>Type</th>
            <th>Brand</th>
            <th>Model</th>
            <th>Kapasitas</th>
            <th>Status</th>
            <th>Harga/Hari</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(vehicle, index) in filteredVehicles" :key="vehicle.id">
            <td>{{ index + 1 }}</td>
            <td>{{ vehicle.id }}</td>
            <td>{{ vehicle.type }}</td>
            <td>{{ vehicle.brand }}</td>
            <td>{{ vehicle.model }}</td>
            <td>{{ vehicle.capacity }} penumpang</td>
            <td>
              <span :class="['badge', getStatusBadge(vehicle.status).class]">
                {{ getStatusBadge(vehicle.status).label }}
              </span>
            </td>
            <td>Rp {{ formatCurrency(vehicle.price) }}</td>
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
        <div class="empty-icon">🔍</div>
        <p class="empty-title">Tidak ada kendaraan ditemukan</p>
        <p class="empty-desc" v-if="searchQuery || selectedType">
          Coba ubah filter atau kata kunci pencarian Anda
        </p>
        <button
          v-if="searchQuery || selectedType"
          @click="searchQuery = ''; selectedType = ''"
          class="btn-reset-empty"
        >
          Reset Filter
        </button>
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

/* ✅ NEW: Toolbar Styles */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.search-box,
.filter-box,
.sort-box {
  flex: 1;
  min-width: 200px;
}

.search-input,
.filter-select,
.sort-select {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus,
.filter-select:focus,
.sort-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.search-input::placeholder {
  color: #999;
}

.btn-reset {
  padding: 10px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  transition: background-color 0.3s ease;
}

.btn-reset:hover {
  background-color: #5a6268;
}

.filter-info {
  background-color: #e7f3ff;
  border-left: 4px solid #007bff;
  padding: 12px 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #004085;
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon {
  font-size: 18px;
}

.filter-info strong {
  color: #007bff;
  font-weight: 600;
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
  padding: 60px 40px;
  color: #999;
  font-size: 16px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #666;
  margin-bottom: 10px;
}

.empty-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}

.btn-reset-empty {
  padding: 10px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.btn-reset-empty:hover {
  background-color: #0056b3;
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

/* ✅ Responsive Design */
@media (max-width: 768px) {
  .vehicle-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .btn-primary {
    width: 100%;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left {
    flex-direction: column;
    width: 100%;
  }

  .toolbar-right {
    width: 100%;
  }

  .btn-reset {
    width: 100%;
  }

  .search-box,
  .filter-box,
  .sort-box {
    width: 100%;
    min-width: 100%;
  }

  .table-wrapper {
    overflow-x: scroll;
  }

  .action-cell {
    flex-direction: column;
    gap: 5px;
  }

  .action-cell button {
    width: 100%;
  }
}
</style>
