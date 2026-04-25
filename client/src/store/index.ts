// apps/client/src/store/index.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ── Types ────────────────────────────────────────────────────────────────────
export interface User {
  _id: string
  name: string
  phone: string
  email?: string
  role: 'user' | 'admin'
  avatar?: string
}

export interface CartItem {
  productId: string
  title: string
  image: string
  price: number
  discountedPrice?: number
  size: string
  color?: string
  quantity: number
  slug: string
}

// ── Auth Store ────────────────────────────────────────────────────────────────
interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user:  null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'fab-aroha-auth', storage: createJSONStorage(() => localStorage) }
  )
)

// ── Cart Store ────────────────────────────────────────────────────────────────
interface CartStore {
  items: CartItem[]
  coupon: { code: string; discount: number } | null
  addItem:    (item: CartItem) => void
  removeItem: (productId: string, size: string) => void
  updateQty:  (productId: string, size: string, qty: number) => void
  clearCart:  () => void
  setCoupon:  (coupon: { code: string; discount: number } | null) => void
  subtotal:   () => number
  total:      () => number
  itemCount:  () => number
  shippingCharge: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items:  [],
      coupon: null,

      addItem: (item) =>
        set((s) => {
          const existing = s.items.find(
            (i) => i.productId === item.productId && i.size === item.size
          )
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId && i.size === item.size
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...s.items, item] }
        }),

      removeItem: (productId, size) =>
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.productId === productId && i.size === size)
          ),
        })),

      updateQty: (productId, size, qty) =>
        set((s) => ({
          items: qty <= 0
            ? s.items.filter((i) => !(i.productId === productId && i.size === size))
            : s.items.map((i) =>
                i.productId === productId && i.size === size
                  ? { ...i, quantity: qty }
                  : i
              ),
        })),

      clearCart:  () => set({ items: [], coupon: null }),
      setCoupon:  (coupon) => set({ coupon }),

      subtotal: () => {
        const { items } = get()
        return items.reduce(
          (acc, i) => acc + (i.discountedPrice ?? i.price) * i.quantity,
          0
        )
      },

      shippingCharge: () => {
        const sub = get().subtotal() - (get().coupon?.discount ?? 0)
        return sub >= 999 ? 0 : 99
      },

      total: () => {
        const { subtotal, coupon, shippingCharge } = get()
        return subtotal() - (coupon?.discount ?? 0) + shippingCharge()
      },

      itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
    }),
    { name: 'fab-aroha-cart', storage: createJSONStorage(() => localStorage) }
  )
)

// ── Wishlist Store ─────────────────────────────────────────────────────────────
interface WishlistStore {
  ids: string[]
  toggle: (id: string) => void
  has:    (id: string) => boolean
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((i) => i !== id) : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
    }),
    { name: 'fab-aroha-wishlist', storage: createJSONStorage(() => localStorage) }
  )
)
