// apps/admin/src/lib/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('fab-aroha-admin')
      if (raw) { const { state } = JSON.parse(raw); if (state?.token) config.headers.Authorization = `Bearer ${state.token}` }
    } catch {}
  }
  return config
})

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('fab-aroha-admin')
    window.location.href = '/login'
  }
  return Promise.reject(err)
})

export default api
export const authAPI      = { login: (d: object) => api.post('/auth/login', d) }
export const productAPI   = { list: (p?: object) => api.get('/products', { params: p }), create: (d: object) => api.post('/products', d), update: (id: string, d: object) => api.put(`/products/${id}`, d), delete: (id: string) => api.delete(`/products/${id}`) }
export const collectionAPI= {
  list:       ()                    => api.get('/collections'),
  listAll:    ()                    => api.get('/collections/admin/all'),
  create:     (d: object)           => api.post('/collections', d),
  update:     (id: string, d: object) => api.put(`/collections/${id}`, d),
  activate:   (id: string)          => api.patch(`/collections/${id}/activate`),
  deactivate: (id: string)          => api.patch(`/collections/${id}/deactivate`),
  delete:     (id: string)          => api.delete(`/collections/${id}`),
}
export const orderAPI     = { list: (p?: object) => api.get('/orders', { params: p }), get: (id: string) => api.get(`/orders/${id}`), updateStatus: (id: string, d: object) => api.put(`/orders/${id}/status`, d), stats: () => api.get('/orders/admin/stats') }
export const userAPI      = { list: (p?: object) => api.get('/users', { params: p }), get: (id: string) => api.get(`/users/${id}`), block: (id: string, v: boolean) => api.put(`/users/${id}/block`, { isBlocked: v }) }
export const uploadAPI       = { presign: (d: object) => api.post('/upload/presign', d) }
export const testimonialAPI  = { listAll: () => api.get('/testimonials/admin/all'), create: (d: object) => api.post('/testimonials', d), update: (id: string, d: object) => api.put(`/testimonials/${id}`, d), delete: (id: string) => api.delete(`/testimonials/${id}`) }
