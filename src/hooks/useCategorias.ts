import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriasService } from '@/services/categoriasService'
import { useAuth } from '@/features/auth/AuthContext'
import { toast } from 'sonner'

export function useCategorias() {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()

  const { data: categorias, isLoading } = useQuery({
    queryKey: ['categorias-list', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 30_000,
    queryFn: () => categoriasService.getByNegocio(negocio!.id),
  })

  const createMutation = useMutation({
    mutationFn: categoriasService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-list'] })
      toast.success('Categoría creada')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      categoriasService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-list'] })
      toast.success('Categoría actualizada')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: categoriasService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-list'] })
      toast.success('Categoría eliminada')
    },
  })

  return {
    categorias,
    isLoading,
    createCategoria: createMutation.mutate,
    updateCategoria: updateMutation.mutate,
    deleteCategoria: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  }
}
