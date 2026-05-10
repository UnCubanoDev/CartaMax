import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { productosService } from '@/services/productosService'
import { categoriasService } from '@/services/categoriasService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { ProductoDialog } from './ProductoDialog'
import { toast } from 'sonner'
import type { Database } from '@/types/database'
import { useState } from 'react'

type Producto = Database['public']['Tables']['productos']['Row'] & {
  categorias?: { nombre: string }
}

type Categoria = Database['public']['Tables']['categorias']['Row']

export function ProductManagement() {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)

  const { data: productos, isLoading } = useQuery<Producto[]>({
    queryKey: ['productos', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 30_000,
    queryFn: () => productosService.getByNegocio(negocio!.id),
  })

  const { data: categorias } = useQuery<Categoria[]>({
    queryKey: ['categorias', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 30_000,
    queryFn: () => categoriasService.getByNegocio(negocio!.id),
  })

  const deleteMutation = useMutation({
    mutationFn: productosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Producto eliminado')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <div className="space-y-6">
      <div className="flex-col sm:flex-row flex items-start sm:items-center gap-2 justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Productos</h1>
        <Button onClick={() => { setEditingProducto(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos?.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell>
                      {producto.imagen_url ? (
                        <img src={producto.imagen_url} alt="" className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>{producto.categorias?.nombre || '-'}</TableCell>
                    <TableCell>${producto.precio.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={producto.disponible ? 'default' : 'secondary'}>
                        {producto.disponible ? 'Disponible' : 'No disponible'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingProducto(producto); setDialogOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(producto.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        producto={editingProducto}
        categorias={categorias || []}
      />
    </div>
  )
}
