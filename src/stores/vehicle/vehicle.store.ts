import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Vehicle, VehicleResponse, CreateVehicleRequest, UpdateVehicleRequest, RentalVendor } from '@/interfaces/vehicle.interface';
import api from '@/utils/api';
import { toast } from 'vue-sonner';

const baseVehicleUrl = `/vehicles`;

export const useVehicleStore = defineStore('vehicle', () => {
  const vehicles = ref<Vehicle[]>([]);
  const vendors = ref<RentalVendor[]>([]);
  const currentVehicle = ref<Vehicle | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const vehicleCount = ref(0);
  const vendorCount = ref(0);

  const fetchVehicles = async (type?: string, keyword?: string) => {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams();
      if (type && type.trim()) params.append('type', type);
      if (keyword && keyword.trim()) params.append('keyword', keyword);

      const response = await api.get<VehicleResponse>(baseVehicleUrl, { params });

      if (Array.isArray(response.data.data)) {
        vehicles.value = response.data.data;
      } else if (response.data.data) {
        vehicles.value = [response.data.data];
      } else {
        vehicles.value = [];
      }

      if (vehicles.value.length === 0) {
        toast.info('Tidak ada kendaraan ditemukan');
      }

      return vehicles.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat kendaraan';
      toast.error(`Error: ${error.value}`);
      vehicles.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  };

  const fetchVehicleById = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<VehicleResponse>(`${baseVehicleUrl}/${id}`);

      if (Array.isArray(response.data.data)) {
        currentVehicle.value = response.data.data[0] || null;
      } else {
        currentVehicle.value = response.data.data as Vehicle;
      }

      return currentVehicle.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Kendaraan tidak ditemukan';
      toast.error(`Error: ${error.value}`);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const createVehicle = async (vehicleData: CreateVehicleRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post<VehicleResponse>(`${baseVehicleUrl}/create`, vehicleData);

      const newVehicle = Array.isArray(response.data.data)
        ? response.data.data[0]
        : (response.data.data as Vehicle);

      if (newVehicle) {
        vehicles.value.push(newVehicle);
      }
      toast.success('Kendaraan berhasil dibuat');
      return newVehicle;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal membuat kendaraan';
      toast.error(`Error: ${error.value}`);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateVehicle = async (id: string, vehicleData: UpdateVehicleRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.put<VehicleResponse>(
        `${baseVehicleUrl}/${id}/update`,
        vehicleData
      );

      const updatedVehicle = Array.isArray(response.data.data)
        ? response.data.data[0]
        : (response.data.data as Vehicle);

      const index = vehicles.value.findIndex(v => v.id === id);
      if (index !== -1 && updatedVehicle) {
        vehicles.value[index] = updatedVehicle;
      }
      if (updatedVehicle) {
        currentVehicle.value = updatedVehicle;
      }
      toast.success('Kendaraan berhasil diperbarui');
      return updatedVehicle;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memperbarui kendaraan';
      toast.error(`Error: ${error.value}`);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteVehicle = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      await api.delete(`${baseVehicleUrl}/${id}`);

      const index = vehicles.value.findIndex(v => v.id === id);
      if (index > -1) {
        vehicles.value.splice(index, 1);
      }

      if (currentVehicle.value?.id === id) {
        currentVehicle.value = null;
      }

      toast.success('Kendaraan berhasil dihapus');
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal menghapus kendaraan';
      toast.error(`Error: ${error.value}`);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getVehicleCount = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`${baseVehicleUrl}/count`);
      vehicleCount.value = response.data.data;
      return vehicleCount.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memload jumlah kendaraan';
      toast.error(`Error: ${error.value}`);
      return 0;
    } finally {
      loading.value = false;
    }
  };

  const fetchVendors = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`${baseVehicleUrl}/vendors`);

      if (Array.isArray(response.data.data)) {
        vendors.value = response.data.data as RentalVendor[];
      } else if (response.data.data) {
        vendors.value = [response.data.data as RentalVendor];
      } else {
        vendors.value = [];
      }

      return vendors.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat vendor';
      toast.error(`Error: ${error.value}`);
      vendors.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  };

  const getVendorCount = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`${baseVehicleUrl}/vendor/count`);
      vendorCount.value = response.data.data;
      return vendorCount.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memload jumlah vendor';
      toast.error(`Error: ${error.value}`);
      return 0;
    } finally {
      loading.value = false;
    }
  };

  return {
    vehicles,
    vendors,
    currentVehicle,
    loading,
    error,
    vehicleCount,
    vendorCount,
    fetchVehicles,
    fetchVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleCount,
    fetchVendors,
    getVendorCount,
  };
});
