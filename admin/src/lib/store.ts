// apps/admin/src/lib/store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AdminStore {
  admin: { _id: string; name: string; phone: string; role: string } | null
  token: string | null
  _hasHydrated: boolean
  setAuth: (admin: any, token: string) => void
  logout: () => void
  setHasHydrated: (v: boolean) => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      admin: null, token: null,
      _hasHydrated: false,
      setAuth: (admin, token) => set({ admin, token }),
      logout: () => set({ admin: null, token: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'fab-aroha-admin',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true) },
    }
  )
)
