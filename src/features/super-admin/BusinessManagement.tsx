import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { negociosService } from '@/services/negociosService'
import { planesService } from '@/services/planesService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { NegocioDialog } from './NegocioDialog'
import { toast } from 'sonner'
import type { Database } from '@/types/database'
import { useState } from 'react'

type Negocio = Database['public']['Tables']['negocios']['Row'] & {
  planes?: { nombre: string; precio_mensual: number }
}

export function BusinessManagement() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNegocio, setEditingNegocio] = useState<Negocio | null>(null)

  const { data: negocios, isLoading } = useQuery<Negocio[]>({
    queryKey: ['negocios-all'],
    staleTime: 30_000,
    queryFn: () => negociosService.getAll(),
  })

  const { data: planes } = useQuery({
    queryKey: ['planes-all'],
    staleTime: 30_000,
    queryFn: () => planesService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: negociosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negocios-all'] })
      toast.success('Negocio eliminado')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <div className="space-y-6">
      <div className="flex-col sm:flex-row flex items-start sm:items-center gap-2 justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Negocios</h1>
        <Button onClick={() => { setEditingNegocio(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Negocio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Negocios</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {negocios?.map((negocio) => (
                  <TableRow key={negocio.id}>
                    <TableCell className="font-medium">{negocio.nombre}</TableCell>
                    <TableCell>{negocio.slug}</TableCell>
                    <TableCell>{negocio.planes?.nombre || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        negocio.estado === 'activo' ? 'default' :
                        negocio.estado === 'vencido' ? 'destructive' : 'secondary'
                      }>
                        {negocio.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {negocio.fecha_vencimiento ? new Date(negocio.fecha_vencimiento).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingNegocio(negocio); setDialogOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(negocio.id)}>
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

      <NegocioDialog open={dialogOpen} onOpenChange={setDialogOpen} negocio={editingNegocio} planes={planes || []} />
    </div>
  )
}
