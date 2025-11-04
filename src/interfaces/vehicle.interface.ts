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
    rentalVendor: {
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
    data: Vehicle[];
}

export interface VehicleCountResponse {
    status: number;
    message: string;
    timestamp: string;
    data: number;
}

export interface CreateVehicleRequest {
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
    rentalVendor: {
        id: number;
    };
}

// export interface UpdateVehicleRequest extends CreateVehicleRequest {}

export interface DeleteVehicleRequest {
    id: string;
}
