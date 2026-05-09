import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { negociosService } from '@/services/negociosService'
import { useAuth } from '@/features/auth/AuthContext'
import { toast } from 'sonner'

export function useNegocio() {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()

  const { data: negocios, isLoading } = useQuery({
    queryKey: ['negocios-list'],
    queryFn: () => negociosService.getAll(),
    enabled: false, 
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => negociosService.update(negocio!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negocios-list'] })
      toast.success('Negocio actualizado')
    },
  })

  return {
    negocios,
    isLoading,
    updateNegocio: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}
