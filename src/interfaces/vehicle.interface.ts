export interface Vehicle {
    id: string;
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
    status: string;
    rentalVendorId?: number;
    rentalVendorName?: string;
    rentalVendor?: {
        id: number;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface VehicleResponse {
    status: number;
    message: string;
    timestamp: string;
    data: Vehicle | Vehicle[];
}

export interface VehicleCountResponse {
    status: number;
    message: string;
    timestamp: string;
    data: number;
}

export interface CreateVehicleRequest {
    rentalVendorId: number;
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

export interface UpdateVehicleRequest extends CreateVehicleRequest {
    id: string;
    status: string;
}

export interface DeleteVehicleRequest {
    id: string;
}
