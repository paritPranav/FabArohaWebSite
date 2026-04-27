// apps/client/src/lib/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('fab-aroha-auth')
      if (raw) {
        const { state } = JSON.parse(raw)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      }
    } catch (_) {}
  }
  return config
})

// Handle 401 globally — clear auth & redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('fab-aroha-auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Typed API helpers ─────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: object)  => api.post('/auth/register', data),
  login:    (data: object)  => api.post('/auth/login', data),
  me:       ()              => api.get('/auth/me'),
  updateProfile: (d: object)=> api.put('/auth/profile', d),
  addAddress: (d: object)   => api.post('/auth/address', d),
  deleteAddress: (id: string)=> api.delete(`/auth/address/${id}`),
}

export const productAPI = {
  list:    (params?: object) => api.get('/products', { params }),
  get:     (slug: string)    => api.get(`/products/${slug}`),
  create:  (data: object)    => api.post('/products', data),
  update:  (id: string, data: object) => api.put(`/products/${id}`, data),
  delete:  (id: string)      => api.delete(`/products/${id}`),
  review:  (id: string, data: object) => api.post(`/products/${id}/review`, data),
  toggleWishlist: (id: string) => api.post(`/products/${id}/wishlist`),
}

export const collectionAPI = {
  list:   () => api.get('/collections'),
  get:    (slug: string) => api.get(`/collections/${slug}`),
  create: (data: object) => api.post('/collections', data),
  update: (id: string, data: object) => api.put(`/collections/${id}`, data),
  delete: (id: string)   => api.delete(`/collections/${id}`),
}

export const orderAPI = {
  create:  (data: object)     => api.post('/orders', data),
  myOrders: ()                => api.get('/orders/my'),
  get:     (id: string)       => api.get(`/orders/${id}`),
  all:     (params?: object)  => api.get('/orders', { params }),
  updateStatus: (id: string, data: object) => api.put(`/orders/${id}/status`, data),
  stats:   ()                 => api.get('/orders/admin/stats'),
}

export const paymentAPI = {
  createOrder:    (data: object) => api.post('/payments/create-order', data),
  verify:         (data: object) => api.post('/payments/verify', data),
  validateCoupon:  (data: object) => api.post('/coupons/validate', data),
  publicCoupons:   ()             => api.get('/coupons/public'),
}

export const userAPI = {
  list:       (params?: object) => api.get('/users', { params }),
  block:      (id: string, isBlocked: boolean) => api.put(`/users/${id}/block`, { isBlocked }),
  wishlist:   () => api.get('/users/wishlist'),
}

export const uploadAPI = {
  presign: (data: object) => api.post('/upload/presign', data),
}
