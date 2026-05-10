import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Building2, CreditCard, Package, Users, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/businesses', label: 'Negocios', icon: Building2 },
  { path: '/admin/users', label: 'Usuarios', icon: Users },
  { path: '/admin/plans', label: 'Planes', icon: Package },
  { path: '/admin/payments', label: 'Pagos', icon: CreditCard },
]

export function SuperAdminLayout() {
  const { pathname } = useLocation()
  const { signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out",
          "lg:relative lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <Link to="/admin" className="text-xl font-bold">CartaMax Admin</Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64">
          <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex-1" />
            </div>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
