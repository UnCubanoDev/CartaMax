import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './components/ui/theme-provider'
import { Toaster } from './components/ui/sonner'
import { AuthProvider } from './features/auth/AuthContext'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="cartamax-theme">
        <AuthProvider>
          <App />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </HashRouter>
)
