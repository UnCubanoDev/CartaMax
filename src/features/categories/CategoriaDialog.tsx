import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/features/auth/AuthContext'
import { categoriasService } from '@/services/categoriasService'
import { planLimitsService } from '@/services/planLimitsService'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Categoria = Database['public']['Tables']['categorias']['Row']

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
  activa: z.boolean().default(true),
})

export function CategoriaDialog({ open, onOpenChange, categoria }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria: Categoria | null
}) {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()
  const isEditing = !!categoria

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', descripcion: '', activa: true }
  })

  useEffect(() => {
    if (categoria) {
      reset({
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || '',
        activa: categoria.activa ?? true,
      })
    } else {
      reset({ nombre: '', descripcion: '', activa: true })
    }
  }, [categoria, reset])

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!isEditing) {
        await planLimitsService.checkCategoriaLimit(negocio!.id, negocio?.plan_id || null)
      }
      if (isEditing) {
        return categoriasService.update(categoria.id, data)
      }
      return categoriasService.create({ ...data, negocio_id: negocio!.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      toast.success(isEditing ? 'Categoría actualizada' : 'Categoría creada')
      onOpenChange(false)
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar' : 'Nueva'} Categoría</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register('nombre')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" {...register('descripcion')} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="activa">Activa</Label>
            <Switch
              id="activa"
              checked={watch('activa')}
              onCheckedChange={(checked) => setValue('activa', checked)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
