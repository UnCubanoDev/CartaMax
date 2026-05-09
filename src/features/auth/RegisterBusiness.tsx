import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from './AuthContext'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombre: z.string().min(2, 'Nombre requerido'),
  slug: z.string().min(2, 'Slug requerido').regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterBusiness() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const watchSlug = watch('slug')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    const { error } = await signUp(data.email, data.password, {
      nombre: data.nombre,
      slug: data.slug,
    })
    setLoading(false)

    if (error) {
      toast.error('Error de registro', { description: error.message })
    } else {
      toast.success('Registro exitoso', { description: 'Tu cuenta está pendiente de aprobación' })
      navigate('/login')
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto mt-8">
      <CardHeader>
        <CardTitle>Registro de Negocio</CardTitle>
        <CardDescription>
          Crea tu cuenta y comienza a usar CartaMax
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Negocio</Label>
            <Input id="nombre" {...register('nombre')} />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" placeholder="mi-restaurante" {...register('slug')} />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Se usará en: tusitio.com/{watchSlug || 'mi-restaurante'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Registrarse
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
