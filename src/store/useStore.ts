import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/types/database'

type Negocio = Database['public']['Tables']['negocios']['Row']
type Plan = Database['public']['Tables']['planes']['Row']

interface AppState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  sidebarOpen: boolean
  toggleSidebar: () => void
  
  selectedNegocio: Negocio | null
  setSelectedNegocio: (negocio: Negocio | null) => void
  
  selectedPlan: Plan | null
  setSelectedPlan: (plan: Plan | null) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      selectedNegocio: null,
      setSelectedNegocio: (negocio) => set({ selectedNegocio: negocio }),
      
      selectedPlan: null,
      setSelectedPlan: (plan) => set({ selectedPlan: plan }),
    }),
    {
      name: 'cartamax-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
