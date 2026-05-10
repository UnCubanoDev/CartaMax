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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/features/auth/AuthContext'
import { productosService } from '@/services/productosService'
import { planLimitsService } from '@/services/planLimitsService'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
  precio: z.number().min(0, 'Requerido'),
  categoria_id: z.string().optional(),
  disponible: z.boolean().default(true),
  destacado: z.boolean().default(false),
})

export function ProductoDialog({ open, onOpenChange, producto, categorias }: any) {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()
  const isEditing = !!producto
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', descripcion: '', precio: 0, categoria_id: '', disponible: true, destacado: false }
  })

  useEffect(() => {
    if (producto) {
      reset({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio || 0,
        categoria_id: producto.categoria_id || '',
        disponible: producto.disponible ?? true,
        destacado: producto.destacado ?? false,
      })
      setImagePreview(producto.imagen_url || null)
    } else {
      reset({ nombre: '', descripcion: '', precio: 0, categoria_id: '', disponible: true, destacado: false })
      setImagePreview(null)
    }
  }, [producto, reset])

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!negocio) return null
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${negocio.id}/${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('productos')
      .upload(fileName, file, { upsert: true })
    
    setUploading(false)
    
    if (error) {
      toast.error('Error al subir imagen', { description: error.message })
      return null
    }
    
    const { data } = supabase.storage.from('productos').getPublicUrl(fileName)
    return data.publicUrl
  }

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) {
        const preview = URL.createObjectURL(file)
        setImagePreview(preview)
        const url = await uploadImage(file)
        if (url) setImagePreview(url)
      }
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!isEditing) {
        await planLimitsService.checkProductLimit(negocio!.id, negocio?.plan_id || null)
      }

      let imagen_url = producto?.imagen_url || null
      if (imagePreview && imagePreview.startsWith('blob:')) {
        const file = await fetch(imagePreview).then(r => r.blob()).then(b => new File([b], 'image.jpg'))
        imagen_url = await uploadImage(file)
      }
      
      const payload = { ...data, categoria_id: data.categoria_id || null, imagen_url, negocio_id: negocio!.id }
      if (isEditing) {
        return productosService.update(producto.id, payload)
      }
      return productosService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      toast.success(isEditing ? 'Producto actualizado' : 'Producto creado')
      onOpenChange(false)
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar' : 'Nuevo'} Producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" {...register('nombre')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio</Label>
              <Input id="precio" type="number" step="0.01" {...register('precio', { valueAsNumber: true })} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" {...register('descripcion')} />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={watch('categoria_id')} onValueChange={(val) => setValue('categoria_id', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Imagen</Label>
            <div {...getRootProps()} className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary">
              <input {...getInputProps()} />
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="" className="max-h-32 rounded" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); setImagePreview(null) }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Arrastra una imagen o haz clic</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={watch('disponible')}
                onCheckedChange={(checked) => setValue('disponible', checked)}
              />
              <Label>Disponible</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={watch('destacado')}
                onCheckedChange={(checked) => setValue('destacado', checked)}
              />
              <Label>Destacado</Label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending || uploading}>
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
