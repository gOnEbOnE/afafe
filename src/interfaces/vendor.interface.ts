export interface RentalVendor {
  id: number
  name: string
  email: string
  phone: string
  listOfLocations: string[]
  listOfVehicles?: any[]
  createdAt?: string
  updatedAt?: string
}
