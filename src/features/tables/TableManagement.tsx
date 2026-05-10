import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { mesasService } from '@/services/mesasService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, ExternalLink, Download } from 'lucide-react'
import { MesaDialog } from './MesaDialog'
import { toast } from 'sonner'
import { QRCodeCanvas } from 'qrcode.react'
import QRCode from 'qrcode'
import type { Database } from '@/types/database'

type Mesa = Database['public']['Tables']['mesas']['Row']

export function TableManagement() {
  const { negocio } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null)

  const downloadQR = async (mesa: Mesa) => {
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, `${window.location.origin}${import.meta.env.BASE_URL}#/menu/${negocio?.slug}?mesa=${mesa.numero}`, {
      width: 1024,
      margin: 2,
    })
    const link = document.createElement('a')
    link.download = `mesa-${mesa.numero}-${negocio?.slug || 'qr'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const { data: mesas, isLoading } = useQuery<Mesa[]>({
    queryKey: ['mesas', negocio?.id],
    enabled: !!negocio?.id,
    staleTime: 30_000,
    queryFn: () => mesasService.getByNegocio(negocio!.id),
  })

  const deleteMutation = useMutation({
    mutationFn: mesasService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      toast.success('Mesa eliminada')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  const baseUrl = window.location.origin

  return (
    <div className="space-y-6">
      <div className="flex-col sm:flex-row flex items-start sm:items-center gap-2 justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Mesas</h1>
        <Button onClick={() => { setEditingMesa(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Mesa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Mesas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mesas?.map((mesa) => (
                  <TableRow key={mesa.id}>
                    <TableCell className="font-medium">{mesa.numero}</TableCell>
                    <TableCell>{mesa.nombre || `-`}</TableCell>
                    <TableCell>
                      {mesa.activa && (
                        <div className="flex items-center gap-1">
                          <div className="bg-white p-1 inline-block rounded">
                            <QRCodeCanvas
                              id={`qr-${mesa.id}`}
                              value={`${baseUrl}${import.meta.env.BASE_URL}#/menu/${negocio?.slug}?mesa=${mesa.numero}`}
                              size={48}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => window.open(`${baseUrl}${import.meta.env.BASE_URL}#/menu/${negocio?.slug}?mesa=${mesa.numero}`, '_blank')}
                              className="p-1 hover:bg-accent rounded transition-colors"
                              title="Abrir enlace"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadQR(mesa)}
                              className="p-1 hover:bg-accent rounded transition-colors"
                              title="Descargar QR"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={mesa.activa ? 'default' : 'secondary'}>
                        {mesa.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingMesa(mesa); setDialogOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(mesa.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MesaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mesa={editingMesa}
      />
    </div>
  )
}
