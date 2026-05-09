import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { planesService } from '@/services/planesService'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  descripcion: z.string().optional(),
  precio_mensual: z.number().min(0, 'Requerido'),
  max_productos: z.number().min(0).optional().nullable(),
  max_categorias: z.number().min(0).optional().nullable(),
  max_mesas: z.number().min(0).optional().nullable(),
  activo: z.boolean().default(true),
})

export function PlanDialog({ open, onOpenChange, plan }: any) {
  const queryClient = useQueryClient()
  const isEditing = !!plan

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', descripcion: '', precio_mensual: 0, max_productos: null, max_categorias: null, max_mesas: null, activo: true }
  })

  useEffect(() => {
    if (plan) {
      reset({
        nombre: plan.nombre || '',
        descripcion: plan.descripcion || '',
        precio_mensual: plan.precio_mensual || 0,
        max_productos: plan.max_productos || null,
        max_categorias: plan.max_categorias || null,
        max_mesas: plan.max_mesas || null,
        activo: plan.activo ?? true,
      })
    } else {
      reset({ nombre: '', descripcion: '', precio_mensual: 0, max_productos: null, max_categorias: null, max_mesas: null, activo: true })
    }
  }, [plan, reset])

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        max_productos: data.max_productos || null,
        max_categorias: data.max_categorias || null,
        max_mesas: data.max_mesas || null,
      }
      if (isEditing) return planesService.update(plan.id, payload)
      return planesService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-all'] })
      toast.success(isEditing ? 'Plan actualizado' : 'Plan creado')
      onOpenChange(false)
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEditing ? 'Editar' : 'Nuevo'} Plan</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2"><Label>Nombre</Label><Input {...register('nombre')} /></div>
          <div className="space-y-2"><Label>Descripción</Label><Textarea {...register('descripcion')} /></div>
          <div className="space-y-2"><Label>Precio Mensual</Label><Input type="number" step="0.01" {...register('precio_mensual', { valueAsNumber: true })} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Max Productos</Label><Input type="number" {...register('max_productos', { valueAsNumber: true })} placeholder="Ilimitado" /></div>
            <div className="space-y-2"><Label>Max Categorías</Label><Input type="number" {...register('max_categorias', { valueAsNumber: true })} placeholder="Ilimitado" /></div>
            <div className="space-y-2"><Label>Max Mesas</Label><Input type="number" {...register('max_mesas', { valueAsNumber: true })} placeholder="Ilimitado" /></div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Activo</Label>
            <Switch checked={watch('activo')} onCheckedChange={(checked) => setValue('activo', checked)} />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
