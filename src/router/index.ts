import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/vehicles',
      name: 'vehicles',
      component: () => import('../views/vehicle/VehicleView.vue'),
    },
    {
      path: '/vehicles/create',
      name: 'create-vehicle',
      component: () => import('@/views/vehicle/CreateVehicleView.vue'),
    },
    {
      path: '/vehicles/:id/update',
      name: 'update-vehicle',
      component: () => import('@/views/vehicle/UpdateVehicleView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/vehicles/:id',
      name: 'vehicle-detail',
      component: () => import('@/views/vehicle/DetailVehicleView.vue'),
    },
    // ✅ Booking routes
    {
      path: '/bookings',
      name: 'bookings',
      component: () => import('../views/booking/BookingView.vue'),
    },
    // {
    //   path: '/bookings/create',
    //   name: 'create-booking',
    //   component: () => import('../views/booking/CreateBookingView.vue'),
    // },
    {
      path: '/bookings/:id',
      name: 'booking-detail',
      component: () => import('../views/booking/DetailBookingView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
