import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { negociosService } from '@/services/negociosService'
import { ordenesService } from '@/services/ordenesService'
import type { OrdenWithItems } from '@/services/ordenesService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Bell } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  pendiente: 'bg-yellow-500',
  en_preparacion: 'bg-blue-500',
  listo: 'bg-green-500',
  entregado: 'bg-gray-400',
  cancelado: 'bg-red-500',
}

const statusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export function KitchenView() {
  const { slug } = useParams<{ slug: string }>()
  const queryClient = useQueryClient()
  const [audio] = useState(() => new Audio())
  const [lastCount, setLastCount] = useState(0)

  const { data: negocio } = useQuery({
    queryKey: ['negocio-kitchen', slug],
    queryFn: () => negociosService.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 60_000,
  })

  const { data: ordenes, isLoading } = useQuery<OrdenWithItems[]>({
    queryKey: ['ordenes-kitchen', negocio?.id],
    queryFn: () => ordenesService.getByNegocioActive(negocio!.id),
    enabled: !!negocio?.id,
    staleTime: 15_000,
  })

  useEffect(() => {
    if (!negocio?.id) return
    const sub = ordenesService.subscribeByNegocio(negocio.id, () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-kitchen'] })
    })
    return () => { sub.unsubscribe() }
  }, [negocio?.id, queryClient])

  useEffect(() => {
    if (ordenes && ordenes.length > lastCount && lastCount > 0) {
      toast('Nuevo pedido recibido', { icon: <Bell className="h-4 w-4" /> })
    }
    if (ordenes) setLastCount(ordenes.length)
  }, [ordenes, lastCount])

  const updateStatus = async (id: string, estado: string) => {
    try {
      await ordenesService.update(id, { estado } as any)
      queryClient.invalidateQueries({ queryKey: ['ordenes-kitchen'] })
    } catch {
      toast.error('Error al actualizar')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!negocio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">Negocio no encontrado</p>
      </div>
    )
  }

  const pendientes = ordenes?.filter(o => o.estado === 'pendiente') || []
  const preparacion = ordenes?.filter(o => o.estado === 'en_preparacion') || []
  const listos = ordenes?.filter(o => o.estado === 'listo') || []

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{negocio.nombre} - Cocina</h1>
        <p className="text-gray-400">{new Date().toLocaleTimeString()}</p>
      </header>

      <div className="grid grid-cols-3 gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            Pendientes
            <Badge variant="secondary" className="ml-2">{pendientes.length}</Badge>
          </h2>
          <div className="space-y-4">
            {pendientes.map(orden => (
              <OrderCard key={orden.id} orden={orden} onStatusChange={updateStatus} />
            ))}
            {pendientes.length === 0 && (
              <p className="text-gray-500 text-center py-8">Sin pedidos pendientes</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            En Preparación
            <Badge variant="secondary" className="ml-2">{preparacion.length}</Badge>
          </h2>
          <div className="space-y-4">
            {preparacion.map(orden => (
              <OrderCard key={orden.id} orden={orden} onStatusChange={updateStatus} />
            ))}
            {preparacion.length === 0 && (
              <p className="text-gray-500 text-center py-8">Sin pedidos en preparación</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            Listos
            <Badge variant="secondary" className="ml-2">{listos.length}</Badge>
          </h2>
          <div className="space-y-4">
            {listos.map(orden => (
              <OrderCard key={orden.id} orden={orden} onStatusChange={updateStatus} />
            ))}
            {listos.length === 0 && (
              <p className="text-gray-500 text-center py-8">Sin pedidos listos</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function OrderCard({ orden, onStatusChange }: { orden: OrdenWithItems; onStatusChange: (id: string, estado: string) => void }) {
  const nextStatus = {
    pendiente: 'en_preparacion',
    en_preparacion: 'listo',
    listo: 'entregado',
  }[orden.estado]

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-lg font-bold">#{orden.mesa_numero ? `Mesa ${orden.mesa_numero}` : 'Para Llevar'}</span>
          {orden.nombre_cliente && (
            <p className="text-sm text-gray-400">{orden.nombre_cliente}</p>
          )}
        </div>
        <span className="text-lg font-bold">${orden.total.toFixed(2)}</span>
      </div>

      <div className="space-y-1 mb-3">
        {orden.ordenes_productos?.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.cantidad}x {item.nombre_producto}</span>
            <span className="text-gray-400">${item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 mb-3">
        {new Date(orden.created_at).toLocaleTimeString()}
      </div>

      {nextStatus && (
        <Button
          className="w-full"
          variant={orden.estado === 'pendiente' ? 'default' : 'secondary'}
          onClick={() => onStatusChange(orden.id, nextStatus)}
        >
          {orden.estado === 'pendiente' ? 'Iniciar Preparación' :
           orden.estado === 'en_preparacion' ? 'Marcar Listo' : ''}
        </Button>
      )}
    </div>
  )
}
