import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mesasService } from '@/services/mesasService'
import { useAuth } from '@/features/auth/AuthContext'
import { toast } from 'sonner'

export function useMesas() {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()

  const { data: mesas, isLoading } = useQuery({
    queryKey: ['mesas-list', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 30_000,
    queryFn: () => mesasService.getByNegocio(negocio!.id),
  })

  const createMutation = useMutation({
    mutationFn: mesasService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-list'] })
      toast.success('Mesa creada')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      mesasService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-list'] })
      toast.success('Mesa actualizada')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: mesasService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-list'] })
      toast.success('Mesa eliminada')
    },
  })

  return {
    mesas,
    isLoading,
    createMesa: createMutation.mutate,
    updateMesa: updateMutation.mutate,
    deleteMesa: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  }
}
