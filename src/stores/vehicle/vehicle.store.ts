import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Vehicle, VehicleResponse, CreateVehicleRequest } from '@/interfaces/vehicle.interface';
import axios from 'axios';
import { toast } from 'vue-sonner';

const baseVehicleUrl = 'http://localhost:8080/api/vehicles';

export const useVehicleStore = defineStore('vehicle', () => {
  const vehicles = ref<Vehicle[]>([]);
  const currentVehicle = ref<Vehicle | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const vehicleCount = ref(0);

  const fetchVehicles = async (type?: string, keyword?: string) => {
    loading.value = true;
    error.value = null;

    try {
      let url = baseVehicleUrl;
      const params = new URLSearchParams();

      if (type && type.trim()) {
        params.append('type', type);
      }

      if (keyword && keyword.trim()) {
        params.append('keyword', keyword);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get<VehicleResponse>(url);

      // Pastikan data adalah array
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

  const getVehicleById = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get<VehicleResponse>(`${baseVehicleUrl}/${id}`);

      if (Array.isArray(response.data.data)) {
        currentVehicle.value = response.data.data[0];
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
      const response = await axios.post<VehicleResponse>(`${baseVehicleUrl}`, vehicleData);

      const newVehicle = Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data as Vehicle;

      vehicles.value.push(newVehicle);
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
      const response = await axios.put<VehicleResponse>(`${baseVehicleUrl}/${id}`, vehicleData);

      const updatedVehicle = Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data as Vehicle;

      const index = vehicles.value.findIndex(v => v.id === id);
      if (index !== -1) {
        vehicles.value[index] = updatedVehicle;
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
      await axios.delete(`${baseVehicleUrl}/${id}`);
      vehicles.value = vehicles.value.filter(v => v.id !== id);
      toast.success('Kendaraan berhasil dihapus');
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal menghapus kendaraan';
      toast.error(`Error: ${error.value}`);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const getVehicleCount = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${baseVehicleUrl}/count`);
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

  return {
    vehicles,
    currentVehicle,
    loading,
    error,
    vehicleCount,
    fetchVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleCount,
  };
});
