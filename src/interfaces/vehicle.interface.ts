export interface Vehicle {
  id: string;
  rentalVendorId: string;
  rentalVendorName: string;
  type: 'Mobil' | 'Motor' | 'Truk' | 'Bus';
  brand: string;
  model: string;
  year: number;
  location: string;
  licensePlate: string;
  capacity: number;
  transmission: 'Manual' | 'Automatic';
  fuelType: 'Bensin' | 'Solar' | 'Hybrid' | 'Elektrik';
  price: number;
  status: 'Available' | 'Rented' | 'Maintenance';
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateVehicleRequest {
  type: string;
  brand: string;
  model: string;
  year: number;
  location: string;
  licensePlate: string;
  capacity: number;
  transmission: string;
  fuelType: string;
  price: number;
}

export interface UpdateVehicleRequest {
  type: string;
  brand: string;
  model: string;
  year: number;
  location: string;
  licensePlate: string;
  capacity: number;
  transmission: string;
  fuelType: string;
  price: number;
}

export interface VehicleResponse {
  status: number;
  message: string;
  data: Vehicle | Vehicle[] | null;
}

export interface BaseResponseDTO<T> {
  status: number;
  message: string;
  data: T;
}

export interface RentalVendor {
  id: string;
  userId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}
