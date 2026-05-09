import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export function ServiceUnavailable() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md p-6">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Servicio No Disponible</h1>
        <p className="text-muted-foreground">
          Este menú no está disponible en este momento. Por favor contacta al administrador del restaurante.
        </p>
        <Button asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}
