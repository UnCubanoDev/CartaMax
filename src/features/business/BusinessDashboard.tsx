import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table2, Package, Tags, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { QRCodeCanvas } from 'qrcode.react'
import QRCode from 'qrcode'

export function BusinessDashboard() {
  const { negocio } = useAuth()

  const downloadQR = async () => {
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, `${window.location.origin}/menu/${negocio?.slug}`, {
      width: 1024,
      margin: 2,
    })
    const link = document.createElement('a')
    link.download = `${negocio?.slug || 'negocio'}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const { data: stats } = useQuery({
    queryKey: ['business-stats', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const [mesasRes, productosRes, categoriasRes] = await Promise.all([
        supabase.from('mesas').select('id', { count: 'exact' }).eq('negocio_id', negocio!.id),
        supabase.from('productos').select('id', { count: 'exact' }).eq('negocio_id', negocio!.id).eq('disponible', true),
        supabase.from('categorias').select('id', { count: 'exact' }).eq('negocio_id', negocio!.id).eq('activa', true),
      ])
      return {
        totalMesas: mesasRes.count || 0,
        totalProductos: productosRes.count || 0,
        totalCategorias: categoriasRes.count || 0,
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Badge variant={negocio?.estado === 'activo' ? 'default' : 'destructive'}>
          {negocio?.estado === 'activo' ? 'Licencia Activa' : 'Licencia Inactiva'}
        </Badge>
      </div>

      {negocio?.estado !== 'activo' && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div className="flex-1">
                <h3 className="font-semibold">Licencia no activa</h3>
                <p className="text-sm text-muted-foreground">
                  Tu menú no está visible públicamente. Realiza un pago para activar tu licencia.
                </p>
              </div>
              <Button asChild>
                <Link to="/business/license">Gestionar Licencia</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesas</CardTitle>
            <Table2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMesas || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProductos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCategorias || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menú Digital</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Escanea este código QR para ver el menú de {negocio?.nombre}
          </p>
          <div
            className="bg-white p-3 rounded-lg cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={downloadQR}
            title="Descargar QR"
          >
            <QRCodeCanvas
              id="qr-negocio"
              value={`${window.location.origin}/menu/${negocio?.slug}`}
              size={160}
            />
          </div>
        </CardContent>
      </Card>

      {negocio?.fecha_vencimiento && (
        <Card>
          <CardHeader>
            <CardTitle>Información de Licencia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Fecha de vencimiento: {' '}
              <strong>
                {format(new Date(negocio.fecha_vencimiento), 'dd MMMM yyyy', { locale: es })}
              </strong>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
