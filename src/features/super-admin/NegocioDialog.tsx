import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { negociosService } from '@/services/negociosService'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Negocio = Database['public']['Tables']['negocios']['Row']
type Plan = Database['public']['Tables']['planes']['Row']
type AuthUser = { id: string; email: string; created_at: string }

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  owner_email: z.string().email(),
  password: z.string().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  plan_id: z.string().optional(),
  estado: z.enum(['activo', 'inactivo', 'pendiente', 'vencido']).default('pendiente'),
})

export function NegocioDialog({ open, onOpenChange, negocio, planes }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  negocio: Negocio | null
  planes: Plan[]
}) {
  const queryClient = useQueryClient()
  const isEditing = !!negocio

  const { data: authUsers } = useQuery<AuthUser[]>({
    queryKey: ['auth-users'],
    queryFn: () => negociosService.listUsers(),
    enabled: open && !isEditing,
    staleTime: 30_000,
  })

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', slug: '', owner_email: '', password: '', telefono: '', direccion: '', plan_id: '', estado: 'pendiente' }
  })

  useEffect(() => {
    if (negocio) {
      reset({
        nombre: negocio.nombre || '',
        slug: negocio.slug || '',
        owner_email: negocio.owner_email || '',
        password: '',
        telefono: negocio.telefono || '',
        direccion: negocio.direccion || '',
        plan_id: negocio.plan_id || '',
        estado: negocio.estado || 'pendiente',
      })
    } else {
      reset({ nombre: '', slug: '', owner_email: '', password: '', telefono: '', direccion: '', plan_id: '', estado: 'pendiente' })
    }
  }, [negocio, reset])

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!isEditing && data.password) {
        await negociosService.createUser(data.owner_email, data.password)
      }
      const { password, ...negocioData } = data
      if (negocioData.estado === 'activo') {
        const shouldSetDate = !isEditing || (isEditing && negocio?.estado !== 'activo')
        if (shouldSetDate) {
          const fecha = new Date()
          fecha.setDate(fecha.getDate() + 30)
          negocioData.fecha_vencimiento = fecha.toISOString().split('T')[0]
        }
      }
      if (isEditing) return negociosService.update(negocio.id, negocioData)
      return negociosService.create(negocioData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negocios-all'] })
      toast.success(isEditing ? 'Negocio actualizado' : 'Negocio creado')
      onOpenChange(false)
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{isEditing ? 'Editar' : 'Nuevo'} Negocio</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...register('nombre')} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input {...register('slug')} />
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label>Usuario existente (opcional)</Label>
              <Select
                value={watch('owner_email')}
                onValueChange={(val) => setValue('owner_email', val)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar usuario..." /></SelectTrigger>
                <SelectContent>
                  {authUsers?.map((u) => (
                    <SelectItem key={u.id} value={u.email}>{u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Email Dueño</Label>
            <Input type="email" {...register('owner_email')} />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label>Contraseña <span className="text-muted-foreground">(solo si es usuario nuevo)</span></Label>
              <Input type="password" {...register('password')} placeholder="••••••••" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input {...register('telefono')} />
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={watch('plan_id')} onValueChange={(val) => setValue('plan_id', val)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                <SelectContent>
                  {planes?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre} - ${p.precio_mensual}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={watch('estado')} onValueChange={(val: any) => setValue('estado', val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
