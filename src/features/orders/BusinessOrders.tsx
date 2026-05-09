import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { ordenesService } from '@/services/ordenesService'
import type { OrdenWithItems } from '@/services/ordenesService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-500' },
  { value: 'en_preparacion', label: 'Preparando', color: 'bg-blue-500' },
  { value: 'listo', label: 'Listo', color: 'bg-green-500' },
  { value: 'entregado', label: 'Entregado', color: 'bg-gray-400' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500' },
]

export function BusinessOrders() {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<string>('all')

  const { data: ordenes, isLoading } = useQuery<OrdenWithItems[]>({
    queryKey: ['ordenes-business', negocio?.id],
    queryFn: () => ordenesService.getByNegocio(negocio!.id),
    enabled: !!negocio?.id,
    staleTime: 15_000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      ordenesService.update(id, { estado } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-business'] })
      toast.success('Estado actualizado')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  const filtered = filter === 'all' ? ordenes : ordenes?.filter(o => o.estado === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : (
        <div className="space-y-4">
          {filtered?.map(orden => (
            <Card key={orden.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">
                        {orden.mesa_numero ? `Mesa ${orden.mesa_numero}` : 'Para Llevar'}
                      </span>
                      {orden.nombre_cliente && (
                        <span className="text-muted-foreground">- {orden.nombre_cliente}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(orden.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">${orden.total.toFixed(2)}</span>
                    <Select
                      value={orden.estado}
                      onValueChange={(val) => updateMutation.mutate({ id: orden.id, estado: val })}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  {orden.ordenes_productos?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span>{item.cantidad}x {item.nombre_producto}</span>
                      <span className="text-muted-foreground">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay pedidos</p>
          )}
        </div>
      )}
    </div>
  )
}
