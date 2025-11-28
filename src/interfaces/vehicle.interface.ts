export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  capacity: number;
  transmission: 'Manual' | 'Automatic';
  fuelType: 'Bensin' | 'Solar' | 'Hybrid' | 'Elektrik';
  dailyPrice: number;
  location: string;
  vendorId: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateVehicleRequest {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  capacity: number;
  transmission: string;
  fuelType: string;
  dailyPrice: number;
  location: string;
  vendorId: string;
}

export interface UpdateVehicleRequest extends CreateVehicleRequest {
  id: string;
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
