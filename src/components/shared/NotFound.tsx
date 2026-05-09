import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { QrCode } from 'lucide-react'

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <QrCode className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">Página no encontrada</p>
        <Button asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}
