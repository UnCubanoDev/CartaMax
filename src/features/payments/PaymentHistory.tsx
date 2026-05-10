import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { pagosService } from '@/services/pagosService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { StorageImage } from '@/components/shared/StorageImage'
import type { Database } from '@/types/database'

type Pago = Database['public']['Tables']['pagos']['Row'] & {
  planes?: { nombre: string }
}

export function PaymentHistory() {
  const { negocio } = useAuth()
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null)

  const { data: pagos, isLoading } = useQuery<Pago[]>({
    queryKey: ['pagos-negocio', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 30_000,
    queryFn: () => pagosService.getByNegocio(negocio!.id),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Historial de Pagos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Todos mis pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {pagos?.map((pago) => (
                <div key={pago.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
                  <div>
                    <p className="font-medium">${pago.monto.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Plan: {pago.planes?.nombre || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(pago.fecha_pago), 'dd MMMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      pago.estado === 'aprobado' ? 'default' :
                      pago.estado === 'rechazado' ? 'destructive' : 'secondary'
                    }>
                      {pago.estado}
                    </Badge>
                    {pago.comprobante_url && (
                      <Button variant="ghost" size="icon" onClick={() => setSelectedPago(pago)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {pagos?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No hay pagos registrados</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPago} onOpenChange={() => setSelectedPago(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprobante de Pago</DialogTitle>
          </DialogHeader>
          {selectedPago?.comprobante_url && (
            <StorageImage bucket="comprobantes" path={selectedPago.comprobante_url} className="w-full rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
