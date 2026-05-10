import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usuariosService } from '@/services/usuariosService'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export function UserDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      usuariosService.create(data.email, data.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-users'] })
      toast.success('Usuario creado')
      reset()
      onOpenChange(false)
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuevo Usuario</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Contraseña</Label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
