import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { planesService } from '@/services/planesService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PlanDialog } from './PlanDialog'
import { toast } from 'sonner'

export function PlansManagement() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  const { data: planes, isLoading } = useQuery({
    queryKey: ['planes-all'],
    staleTime: 60_000,
    queryFn: () => planesService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: planesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-all'] })
      toast.success('Plan eliminado')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <div className="space-y-6">
      <div className="flex-col sm:flex-row flex items-start sm:items-center gap-2 justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Planes</h1>
        <Button onClick={() => { setEditingPlan(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Planes Disponibles</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Precio Mensual</TableHead>
                  <TableHead>Max Productos</TableHead>
                  <TableHead>Max Mesas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planes?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.nombre}</TableCell>
                    <TableCell>{plan.descripcion || '-'}</TableCell>
                    <TableCell>${plan.precio_mensual.toFixed(2)}</TableCell>
                    <TableCell>{plan.max_productos || '∞'}</TableCell>
                    <TableCell>{plan.max_mesas || '∞'}</TableCell>
                    <TableCell>
                      <Badge variant={plan.activo ? 'default' : 'secondary'}>
                        {plan.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPlan(plan); setDialogOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(plan.id)}>
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

      <PlanDialog open={dialogOpen} onOpenChange={setDialogOpen} plan={editingPlan} />
    </div>
  )
}
