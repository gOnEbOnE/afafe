export interface StatisticsResponse {
  status: number;
  message: string;
  timestamp: string;
  data: number;
}

export interface PlatformStatistics {
  vehicleCount: number;
  vendorCount: number;
  bookingCount: number;
}
