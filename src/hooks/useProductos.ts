import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productosService } from '@/services/productosService'
import { useAuth } from '@/features/auth/AuthContext'
import { toast } from 'sonner'

export function useProductos() {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos-list', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 30_000,
    queryFn: () => productosService.getByNegocio(negocio!.id),
  })

  const createMutation = useMutation({
    mutationFn: productosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-list'] })
      toast.success('Producto creado')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-list'] })
      toast.success('Producto actualizado')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: productosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-list'] })
      toast.success('Producto eliminado')
    },
  })

  return {
    productos,
    isLoading,
    createProducto: createMutation.mutate,
    updateProducto: updateMutation.mutate,
    deleteProducto: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  }
}
