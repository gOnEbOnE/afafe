import axios from "axios";
import { defineStore } from "pinia";
import { toast } from "vue-sonner";

const AUTH_URL_API = "https://acc-be.beel.my.id/api/auth";
const PROFILE_FE_LOGIN_URL = "https://acc-fe.beel.my.id/auth/login";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null as any | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    // Decode JWT (Helper)
    parseJwt(token: string) {
      try {
        const parts = token.split(".");
        if (parts.length < 3) return null;

        const base64Url = parts[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    },

    // Fungsi Init (Dipanggil saat refresh halaman)
    async initialize() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;

        // 1. Parse data awal dari token (biar UI tidak kosong saat loading)
        const payload = this.parseJwt(token);
        if (payload) {
          this.user = {
            id: payload.sub,
            role: payload.role,
            email: payload.email,
            name: payload.name || payload.sub
          };
        }

        // 2. Fetch data terbaru dari server (untuk update saldo, dll)
        await this.fetchUser();
      }
    },

    // Redirect ke SSO Login
    loginRedirect() {
      const callbackUrl = "http://localhost:5173/login-success"; // Pastikan URL ini sesuai dengan FE kamu
      const encodedCallback = encodeURIComponent(callbackUrl);
      window.location.href = `${PROFILE_FE_LOGIN_URL}?redirect=${encodedCallback}`;
    },

    // Exchange OTT Code dengan Token
    async exchangeToken(ott: string) {
      this.loading = true;
      this.error = null;

      try {
        const payload = { ott: ott };
        const response = await axios.post(`${AUTH_URL_API}/exchange`, payload);
        const data = response.data.data;

        if (data && data.token) {
          // Simpan Token
          this.token = data.token;
          localStorage.setItem('token', data.token);

          // Ambil data user lengkap
          await this.fetchUser();

          toast.success("Login Berhasil!");
          return true;
        } else {
          throw new Error("Token tidak ditemukan di response");
        }

      } catch (err: any) {
        console.error("Gagal Exchange Token:", err);
        this.error = "Gagal login";
        toast.error("Gagal Login SSO");
        return false;
      } finally {
        this.loading = false;
      }
    },

    // Fetch User Profile dari API
    async fetchUser() {
      if (!this.token) return;

      try {
        // Panggil endpoint /me dengan Authorization Header
        const response = await axios.get(`${AUTH_URL_API}/me`, {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });

        const userData = response.data.data;

        if (userData) {
          // Update state user dengan data lengkap dari API
          this.user = {
            id: userData.id,
            username: userData.username,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            saldo: userData.saldo, // Data penting yang biasanya tidak ada di JWT
            gender: userData.gender
          };
        }
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
        // Opsional: Jika token expired/invalid, bisa auto logout
        // this.logout();
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      toast.info("Logout berhasil");
      window.location.href = '/';
    }
  }
});
