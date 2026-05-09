import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pagosService } from '@/services/pagosService'
import { useAuth } from '@/features/auth/AuthContext'
import { toast } from 'sonner'

export function usePagos() {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()

  const { data: pagos, isLoading } = useQuery({
    queryKey: ['pagos-list', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 30_000,
    queryFn: () => pagosService.getByNegocio(negocio!.id),
  })

  const createMutation = useMutation({
    mutationFn: pagosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos-list'] })
      toast.success('Comprobante enviado')
    },
  })

  const aprobarMutation = useMutation({
    mutationFn: pagosService.aprobar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos-list'] })
      toast.success('Pago aprobado')
    },
  })

  const rechazarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) =>
      pagosService.rechazar(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos-list'] })
      toast.success('Pago rechazado')
    },
  })

  return {
    pagos,
    isLoading,
    createPago: createMutation.mutate,
    aprobarPago: aprobarMutation.mutate,
    rechazarPago: rechazarMutation.mutate,
    isProcessing: aprobarMutation.isPending || rechazarMutation.isPending,
  }
}
