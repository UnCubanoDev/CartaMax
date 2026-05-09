import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { QrCode } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold">
            <QrCode className="h-8 w-8" />
            CartaMax
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Menús digitales QR para restaurantes
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
