import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { planesService } from '@/services/planesService'
import { pagosService } from '@/services/pagosService'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, CheckCircle, Upload } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Database } from '@/types/database'
import { useState } from 'react'

type Plan = Database['public']['Tables']['planes']['Row']
type Pago = Database['public']['Tables']['pagos']['Row'] & {
  planes?: { nombre: string }
}

export function LicenseManagement() {
  const { negocio, refreshNegocio } = useAuth()
  const queryClient = useQueryClient()
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  const { data: planes, isLoading: planesLoading } = useQuery<Plan[]>({
    queryKey: ['planes-active'],
    staleTime: 60_000,
    queryFn: () => planesService.getActive(),
  })

  const { data: pagos } = useQuery<Pago[]>({
    queryKey: ['pagos-negocio', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 60_000,
    queryFn: () => pagosService.getByNegocio(negocio!.id),
  })

  const createPagoMutation = useMutation({
    mutationFn: async ({ planId, file }: { planId: string; file: File }) => {
      if (!negocio) throw new Error('Negocio no encontrado')
      const plan = planes?.find(p => p.id === planId)
      if (!plan) throw new Error('Plan no encontrado')
      
      let comprobante_url = null
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${negocio.id}/${Date.now()}.${fileExt}`
        const { error } = await supabase.storage
          .from('comprobantes')
          .upload(fileName, file, { upsert: true })
        if (error) throw error
        comprobante_url = fileName
      }

      return pagosService.create({
        negocio_id: negocio!.id,
        plan_id: planId,
        monto: plan.precio_mensual,
        comprobante_url,
        fecha_pago: new Date().toISOString().split('T')[0],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos-negocio'] })
      toast.success('Comprobante enviado. En espera de aprobación.')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file && selectedPlan) {
        setUploading(true)
        await createPagoMutation.mutateAsync({ planId: selectedPlan, file })
        setUploading(false)
      }
    }
  })

  const activateMutation = useMutation({
    mutationFn: async () => {
      if (!negocio) return
      const { error } = await supabase.rpc('activar_licencia', {
        negocio_id: negocio.id,
        meses: 1
      })
      if (error) throw error
    },
    onSuccess: () => {
      refreshNegocio()
      toast.success('Licencia activada')
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Licencia</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {negocio?.estado === 'activo' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            Estado de Licencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Estado actual:</span>
            <Badge variant={negocio?.estado === 'activo' ? 'default' : 'destructive'}>
              {negocio?.estado || 'pendiente'}
            </Badge>
          </div>
          {negocio?.fecha_vencimiento && (
            <div className="flex items-center justify-between">
              <span>Fecha de vencimiento:</span>
              <span className="font-medium">
                {format(new Date(negocio.fecha_vencimiento), 'dd MMMM yyyy', { locale: es })}
              </span>
            </div>
          )}
          {negocio?.plan_id && (
            <div className="flex items-center justify-between">
              <span>Plan actual:</span>
              <span className="font-medium">
                {planes?.find(p => p.id === negocio.plan_id)?.nombre || 'Desconocido'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Renovar Licencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Seleccionar Plan</Label>
            {planesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {planes?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.nombre} - ${plan.precio_mensual}/mes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedPlan && (() => {
            const plan = planes?.find(p => p.id === selectedPlan)
            if (!plan) return null
            
            const features = [
              { label: 'Productos', value: plan.max_productos, icon: '🛒' },
              { label: 'Categorías', value: plan.max_categorias, icon: '📂' },
              { label: 'Mesas', value: plan.max_mesas, icon: '🪑' },
            ]

            return (
              <div className="space-y-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-bold">{plan.nombre}</h3>
                      <p className="text-3xl font-bold text-primary mt-1">
                        ${plan.precio_mensual.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground">/mes</span>
                      </p>
                      {plan.descripcion && (
                        <p className="text-sm text-muted-foreground mt-2">{plan.descripcion}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {features.map((f) => (
                        <div key={f.label} className="text-center p-3 bg-background rounded-lg border">
                          <div className="text-lg mb-1">{f.icon}</div>
                          <div className="text-xs text-muted-foreground">{f.label}</div>
                          <div className="font-semibold">
                            {f.value === null ? '∞' : f.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Subir Comprobante de Pago</Label>
                  <div {...getRootProps()} className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors">
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Arrastra tu comprobante aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos: JPG, PNG, PDF
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          {createPagoMutation.isPending || uploading ? (
            <p className="text-sm text-muted-foreground">Enviando comprobante...</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pagos?.map((pago) => (
              <div key={pago.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="font-medium">${pago.monto.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(pago.fecha_pago), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
                <Badge variant={
                  pago.estado === 'aprobado' ? 'default' :
                  pago.estado === 'rechazado' ? 'destructive' : 'secondary'
                }>
                  {pago.estado}
                </Badge>
              </div>
            ))}
            {pagos?.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No hay pagos registrados</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
