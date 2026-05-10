import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { categoriasService } from '@/services/categoriasService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { CategoriaDialog } from './CategoriaDialog'
import { toast } from 'sonner'
import type { Database } from '@/types/database'
import { useState } from 'react'

type Categoria = Database['public']['Tables']['categorias']['Row'] & {
  productos?: Database['public']['Tables']['productos']['Row'][]
}

export function CategoryManagement() {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)

  const { data: categorias, isLoading } = useQuery<Categoria[]>({
    queryKey: ['categorias', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 30_000,
    queryFn: () => categoriasService.getByNegocio(negocio!.id),
  })

  const deleteMutation = useMutation({
    mutationFn: categoriasService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      toast.success('Categoría eliminada')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <div className="space-y-6">
      <div className="flex-col sm:flex-row flex items-start sm:items-center gap-2 justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Categorías</h1>
        <Button onClick={() => { setEditingCategoria(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.nombre}</TableCell>
                    <TableCell>{cat.descripcion || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={cat.activa ? 'default' : 'secondary'}>
                        {cat.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell>{cat.productos?.length || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCategoria(cat); setDialogOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cat.id)}>
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

      <CategoriaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categoria={editingCategoria}
      />
    </div>
  )
}
