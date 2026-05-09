import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/features/auth/AuthContext'
import { mesasService } from '@/services/mesasService'
import { planLimitsService } from '@/services/planLimitsService'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Mesa = Database['public']['Tables']['mesas']['Row']

const mesaSchema = z.object({
  numero: z.number().min(1, 'Minimo 1'),
  nombre: z.string().optional(),
  activa: z.boolean().default(true),
})

export function MesaDialog({ open, onOpenChange, mesa }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mesa: Mesa | null
}) {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()
  const isEditing = !!mesa

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    resolver: zodResolver(mesaSchema),
    defaultValues: { numero: 1, nombre: '', activa: true }
  })

  useEffect(() => {
    if (mesa) {
      reset({
        numero: mesa.numero,
        nombre: mesa.nombre || '',
        activa: mesa.activa ?? true,
      })
    } else {
      reset({ numero: 1, nombre: '', activa: true })
    }
  }, [mesa, reset])

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!isEditing) {
        await planLimitsService.checkMesaLimit(negocio!.id, negocio?.plan_id || null)
      }
      if (isEditing) {
        return mesasService.update(mesa.id, data)
      }
      return mesasService.create({ ...data, negocio_id: negocio!.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      toast.success(isEditing ? 'Mesa actualizada' : 'Mesa creada')
      onOpenChange(false)
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar' : 'Nueva'} Mesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numero">Número</Label>
            <Input
              id="numero"
              type="number"
              {...register('numero', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre (opcional)</Label>
            <Input id="nombre" {...register('nombre')} placeholder="Ej. Terraza" />
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
