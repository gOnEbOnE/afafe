import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginSuccess from '../views/LoginSuccess.vue'
import { useAuthStore } from '@/stores/auth/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login-success',
      name: 'login-success',
      component: LoginSuccess
    },
    {
      path: '/login-success/:pathMatch(.*)*',
      name: 'login-success-wildcard',
      component: LoginSuccess
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
    {
      path: '/bookings/create',
      name: 'create-booking',
      component: () => import('../views/booking/CreateBookingView.vue'),
    },
    {
      path: '/bookings/:id',
      name: 'booking-detail',
      component: () => import('../views/booking/DetailBookingView.vue'),
    },
    {
      path: '/bookings/:id/update-details',
      name: 'update-booking',
      component: () => import('@/views/booking/UpdateBookingView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/bookings/:id/update-addons',
      name: 'update-addons',
      component: () => import('@/views/booking/UpdateAddOnsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/bookings/:id/update-status',
      name: 'update-booking-status',
      component: () => import('@/views/booking/UpdateBookingStatusView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/bookings/chart',
      name: 'booking-chart',
      component: () => import('../views/booking/BookingChartView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

// Navigation Guard: Proteksi route berdasarkan autentikasi
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Daftar halaman yang BOLEH diakses TANPA login (Public)
  // '/login-success' WAJIB ada di sini agar proses login tidak error/looping
  const publicPages = ['/', '/about'];
  const authNotRequiredPaths = ['/login-success', '/vehicles', '/bookings'];

  // Cek apakah path dimulai dengan salah satu dari authNotRequiredPaths
  const isPublicPage = publicPages.includes(to.path) || 
                       authNotRequiredPaths.some(path => to.path.startsWith(path));
  
  // Cek apakah halaman yang dituju memerlukan autentikasi
  const authRequired = !isPublicPage && to.meta.requiresAuth !== false;

  // Jika butuh login TAPI user belum punya token
  if (authRequired && !authStore.token) {
    // Redirect paksa ke halaman utama (Home)
    // Di Home nanti user bisa klik tombol "Login" manual
    return next('/');

    // OPSI ALTERNATIF: Jika ingin langsung lempar ke SSO Login page:
    // authStore.loginRedirect();
    // return;
  }

  // Jika user sudah login atau halaman public, izinkan akses
  next();
});

export default router
