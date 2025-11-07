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
}

export interface UpdateBookingRequest {
  id: string;
  pickUpLocation: string;
  dropOffLocation: string;
  pickUpTime: string;
  dropOffTime: string;
  capacityNeeded: number;
  transmissionNeeded: string;
  includeDriver: boolean;
}
