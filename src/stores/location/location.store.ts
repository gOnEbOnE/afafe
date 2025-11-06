import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Province, LocationResponse } from '@/interfaces/location.interface';
import axios from 'axios';
import { toast } from 'vue-sonner';

const provinceApiUrl = 'https://wilayah.id/api/provinces.json';

export const useLocationStore = defineStore('location', () => {
  const provinces = ref<Province[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchProvinces = async () => {
    // Jika sudah ada di cache, return saja
    if (provinces.value.length > 0) {
      return provinces.value;
    }

    loading.value = true;
    error.value = null;

    try {
      console.log('📍 LocationStore: Fetching provinces from API...');
      const response = await axios.get<LocationResponse>(provinceApiUrl);

      if (response.data.data && Array.isArray(response.data.data)) {
        provinces.value = response.data.data.sort((a, b) => a.name.localeCompare(b.name));
        console.log(`✅ LocationStore: ${provinces.value.length} provinces loaded`);
        return provinces.value;
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat provinces';
      console.error('❌ LocationStore: Error fetching provinces', err);
      toast.error(`Error: ${error.value}`);
      return [];
    } finally {
      loading.value = false;
    }
  };

  const getProvinceByCode = (code: string): Province | undefined => {
    return provinces.value.find((p) => p.code === code);
  };

  const getProvinceByName = (name: string): Province | undefined => {
    return provinces.value.find((p) => p.name.toLowerCase() === name.toLowerCase());
  };

  const searchProvinces = (keyword: string): Province[] => {
    return provinces.value.filter((p) =>
      p.name.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  return {
    provinces,
    loading,
    error,
    fetchProvinces,
    getProvinceByCode,
    getProvinceByName,
    searchProvinces,
  };
});
