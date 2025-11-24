import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PlatformStatistics, StatisticsResponse } from '@/interfaces/statistics.interface';

export const useStatisticsStore = defineStore('statistics', () => {
  const statistics = ref<PlatformStatistics>({
    vehicleCount: 0,
    vendorCount: 0,
    bookingCount: 0,
  });

  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchStatistics = async () => {
    loading.value = true;
    error.value = null;

    const apiUrl = import.meta.env.VITE_API_URL;

    try {
      const [vehicleRes, vendorRes, bookingRes] = await Promise.all([
        fetch(`${apiUrl}/vehicles/count`),
        fetch(`${apiUrl}/vehicles/vendor/count`),
        fetch(`${apiUrl}/bookings/count`),
      ]);

      const vehicleData: StatisticsResponse = await vehicleRes.json();
      const vendorData: StatisticsResponse = await vendorRes.json();
      const bookingData: StatisticsResponse = await bookingRes.json();

      statistics.value = {
        vehicleCount: vehicleData.data,
        vendorCount: vendorData.data,
        bookingCount: bookingData.data,
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch statistics';
    } finally {
      loading.value = false;
    }
  };

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  };
});
