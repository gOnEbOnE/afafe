export interface RentalAddOn {
  id: string;
  name: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface RentalBooking {
  id: string;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  pickUpTime: string;
  dropOffTime: string;
  pickUpLocation: string;
  dropOffLocation: string;
  capacityNeeded: number;
  transmissionNeeded: string;
  totalPrice: number;
  includeDriver: boolean;
  status: 'Upcoming' | 'Ongoing' | 'Done' | 'Cancelled';
  listOfAddOns: RentalAddOn[];
  createdAt: string;
  updatedAt: string;
}

export interface AvailableVehicleResponseDTO {
  vehicleId: string;
  rentalVendorId: string;
  rentalVendorName: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  location: string;
  licensePlate: string;
  capacity: number;
  transmission: string;
  fuelType: string;
  pricePerDay: number;
}

export interface SearchVehicleRequest {
  pickUpLocation: string;
  dropOffLocation: string;
  pickUpTime: string;
  dropOffTime: string;
  capacityNeeded: number;
  transmissionNeeded: string;
}

export interface BookingResponse {
  status: number;
  message: string;
  timestamp: string;
  data: RentalBooking | RentalBooking[];
}

export interface CreateBookingRequest {
  vehicleId: string;
  pickUpTime: string;
  dropOffTime: string;
  pickUpLocation: string;
  dropOffLocation: string;
  capacityNeeded: number;
  transmissionNeeded: string;
  includeDriver: boolean;
  addOnIds?: string[];
}

export interface UpdateBookingDetailsRequest {
  id: string;
  pickUpLocation: string;
  dropOffLocation: string;
  pickUpTime: string;
  dropOffTime: string;
  capacityNeeded: number;
  transmissionNeeded: string;
  includeDriver: boolean;
}

export interface UpdateBookingStatusRequest {
  id: string;
  status: 'Upcoming' | 'Ongoing' | 'Done' | 'Cancelled';
}

export interface UpdateBookingAddOnsRequest {
  id: string;
  addOnIds: string[];
}
