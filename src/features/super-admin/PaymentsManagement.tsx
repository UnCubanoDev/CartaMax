import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pagosService } from '@/services/pagosService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { StorageImage } from '@/components/shared/StorageImage'
import type { Database } from '@/types/database'

type Pago = Database['public']['Tables']['pagos']['Row'] & {
  negocios?: { nombre: string; slug: string }
  planes?: { nombre: string }
}

export function PaymentsManagement() {
  const queryClient = useQueryClient()
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: pagos, isLoading } = useQuery<Pago[]>({
    queryKey: ['pagos-all'],
    staleTime: 30_000,
    queryFn: () => pagosService.getAll(),
  })

  const approveMutation = useMutation({
    mutationFn: pagosService.aprobar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos-all'] })
      toast.success('Pago aprobado y licencia activada')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) => pagosService.rechazar(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos-all'] })
      toast.success('Pago rechazado')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Pagos</h1>

      <Card>
        <CardHeader><CardTitle>Todos los Pagos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos?.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell className="font-medium">{pago.negocios?.nombre || '-'}</TableCell>
                    <TableCell>{pago.planes?.nombre || '-'}</TableCell>
                    <TableCell>${pago.monto.toFixed(2)}</TableCell>
                    <TableCell>
                      {pago.comprobante_url ? (
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedPago(pago); setDialogOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        pago.estado === 'aprobado' ? 'default' :
                        pago.estado === 'rechazado' ? 'destructive' : 'secondary'
                      }>
                        {pago.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(pago.fecha_pago).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {pago.estado === 'pendiente' && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => approveMutation.mutate(pago.id)}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            const motivo = prompt('Motivo del rechazo:')
                            rejectMutation.mutate({ id: pago.id, motivo: motivo || undefined })
                          }}>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Comprobante de Pago</DialogTitle></DialogHeader>
          {selectedPago?.comprobante_url && (
            <StorageImage bucket="comprobantes" path={selectedPago.comprobante_url} className="w-full rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
