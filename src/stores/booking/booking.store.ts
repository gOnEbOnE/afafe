import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  RentalBooking,
  BookingResponse,
  CreateBookingRequest,
  UpdateBookingDetailsRequest,
  UpdateBookingStatusRequest,
  UpdateBookingAddOnsRequest,
  SearchVehicleRequest,
  AvailableVehicleResponseDTO,
  RentalAddOn
} from '@/interfaces/booking.interface';
import type { Province } from '@/interfaces/location.interface';
import axios from 'axios';
import { toast } from 'vue-sonner';

const baseBookingUrl = `${import.meta.env.VITE_API_URL}/bookings`;

export const useBookingStore = defineStore('booking', () => {
  const bookings = ref<RentalBooking[]>([]);
  const currentBooking = ref<RentalBooking | null>(null);
  const availableVehicles = ref<AvailableVehicleResponseDTO[]>([]);
  const addOns = ref<RentalAddOn[]>([]);
  const provinces = ref<Province[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const bookingCount = ref(0);

  const fetchBookings = async (status?: string) => {
    loading.value = true;
    error.value = null;

    try {
      let url = baseBookingUrl;

      if (status && status.trim()) {
        url += `?status=${status}`;
      }

      const response = await axios.get<BookingResponse>(url);

      // Pastikan data adalah array
      if (Array.isArray(response.data.data)) {
        bookings.value = response.data.data as RentalBooking[];
      } else if (response.data.data) {
        bookings.value = [response.data.data as RentalBooking];
      } else {
        bookings.value = [];
      }

      // Sort by createdAt descending (newest first)
      bookings.value.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      if (bookings.value.length === 0) {
        toast.info('Tidak ada booking ditemukan');
      }

      return bookings.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat booking';
      toast.error(`Error: ${error.value}`);
      bookings.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  };

  const getBookingById = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get<BookingResponse>(`${baseBookingUrl}/${id}`);

      if (Array.isArray(response.data.data)) {
        currentBooking.value = response.data.data[0] as RentalBooking || null;
      } else {
        currentBooking.value = response.data.data as RentalBooking;
      }

      return currentBooking.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Booking tidak ditemukan';
      toast.error(`Error: ${error.value}`);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const createBooking = async (bookingData: CreateBookingRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post<BookingResponse>(`${baseBookingUrl}/finalize`, bookingData);

      const newBooking = Array.isArray(response.data.data)
        ? (response.data.data[0] as RentalBooking)
        : (response.data.data as RentalBooking);

      if (newBooking) {
        bookings.value.unshift(newBooking);
      }
      toast.success('Booking berhasil dibuat');
      return newBooking;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal membuat booking';
      toast.error(`Error: ${error.value}`);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const searchVehicles = async (criteria: SearchVehicleRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post(`${baseBookingUrl}/search`, criteria);

      if (Array.isArray(response.data.data)) {
        availableVehicles.value = response.data.data as AvailableVehicleResponseDTO[];
      } else {
        availableVehicles.value = [];
      }

      if (availableVehicles.value.length === 0) {
        toast.info('Tidak ada kendaraan yang tersedia untuk kriteria tersebut');
      }

      return availableVehicles.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal mencari kendaraan';
      toast.error(`Error: ${error.value}`);
      availableVehicles.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  };

  const updateBookingDetails = async (bookingData: UpdateBookingDetailsRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.put<BookingResponse>(
        `${baseBookingUrl}/update-details`,
        bookingData
      );

      const updatedBooking = Array.isArray(response.data.data)
        ? (response.data.data[0] as RentalBooking)
        : (response.data.data as RentalBooking);

      const index = bookings.value.findIndex(b => b.id === bookingData.id);
      if (index !== -1 && updatedBooking) {
        bookings.value[index] = updatedBooking;
      }
      if (updatedBooking) {
        currentBooking.value = updatedBooking;
      }
      toast.success('Detail booking berhasil diperbarui');
      return updatedBooking;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memperbarui detail booking';
      toast.error(`Error: ${error.value}`);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    loading.value = true;
    error.value = null;

    try {
      const payload: UpdateBookingStatusRequest = { id, status: status as any };
      const response = await axios.put<BookingResponse>(
        `${baseBookingUrl}/update-status`,
        payload
      );

      const updatedBooking = Array.isArray(response.data.data)
        ? (response.data.data[0] as RentalBooking)
        : (response.data.data as RentalBooking);

      const index = bookings.value.findIndex(b => b.id === id);
      if (index !== -1 && updatedBooking) {
        bookings.value[index] = updatedBooking;
      }
      if (updatedBooking) {
        currentBooking.value = updatedBooking;
      }
      toast.success('Status booking berhasil diperbarui');
      return updatedBooking;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memperbarui status booking';
      toast.error(`Error: ${error.value}`);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateBookingAddOns = async (bookingData: UpdateBookingAddOnsRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.put<BookingResponse>(
        `${baseBookingUrl}/update-addons`,
        bookingData
      );

      const updatedBooking = Array.isArray(response.data.data)
        ? (response.data.data[0] as RentalBooking)
        : (response.data.data as RentalBooking);

      const index = bookings.value.findIndex(b => b.id === bookingData.id);
      if (index !== -1 && updatedBooking) {
        bookings.value[index] = updatedBooking;
      }
      if (updatedBooking) {
        currentBooking.value = updatedBooking;
      }
      toast.success('Add-ons booking berhasil diperbarui');
      return updatedBooking;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memperbarui add-ons';
      toast.error(`Error: ${error.value}`);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteBooking = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.delete(`${baseBookingUrl}/${id}/delete`);

      if (response.status === 200) {
        const index = bookings.value.findIndex(b => b.id === id);
        if (index > -1) {
          bookings.value.splice(index, 1);
        }

        if (currentBooking.value?.id === id) {
          currentBooking.value = null;
        }

        toast.success('Booking berhasil dihapus');
        return true;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal menghapus booking';
      console.error('Delete booking error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchAddOns = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${baseBookingUrl}/addons`);

      if (Array.isArray(response.data.data)) {
        addOns.value = response.data.data as RentalAddOn[];
      } else {
        addOns.value = [];
      }

      return addOns.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat add-ons';
      toast.error(`Error: ${error.value}`);
      addOns.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  };

  const fetchProvinces = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${baseBookingUrl}/provinces`);

      if (Array.isArray(response.data.data)) {
        provinces.value = response.data.data as Province[];
      } else {
        provinces.value = [];
      }

      return provinces.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat provinsi';
      toast.error(`Error: ${error.value}`);
      provinces.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  };

  const getBookingCount = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${baseBookingUrl}/count`);
      bookingCount.value = response.data.data;
      return bookingCount.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memload jumlah booking';
      toast.error(`Error: ${error.value}`);
      return 0;
    } finally {
      loading.value = false;
    }
  };

  return {
    bookings,
    currentBooking,
    availableVehicles,
    addOns,
    provinces,
    loading,
    error,
    bookingCount,
    fetchBookings,
    getBookingById,
    searchVehicles,
    createBooking,
    updateBookingDetails,
    updateBookingStatus,
    updateBookingAddOns,
    deleteBooking,
    getBookingCount,
    fetchAddOns,
    fetchProvinces,
  };
});
