import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosService, type AuthUser } from '@/services/usuariosService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { UserDialog } from './UserDialog'
import { toast } from 'sonner'

export function UserManagement() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: users, isLoading } = useQuery<AuthUser[]>({
    queryKey: ['auth-users'],
    staleTime: 30_000,
    queryFn: () => usuariosService.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: usuariosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-users'] })
      toast.success('Usuario eliminado')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <div className="space-y-6">
      <div className="flex-col sm:flex-row flex items-start sm:items-center gap-2 justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Usuarios</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Usuarios del Sistema</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm('¿Eliminar este usuario?')) deleteMutation.mutate(user.id)
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No hay usuarios</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
