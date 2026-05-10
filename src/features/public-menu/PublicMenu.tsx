import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Loader2, ShoppingCart, Plus, Minus, Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ordenesService } from '@/services/ordenesService'
import type { Database } from '@/types/database'

type Categoria = Database['public']['Tables']['categorias']['Row'] & {
  productos: (Database['public']['Tables']['productos']['Row'])[]
}

type Negocio = Database['public']['Tables']['negocios']['Row']

interface CartItem {
  producto: Database['public']['Tables']['productos']['Row']
  cantidad: number
}

export function PublicMenu() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const mesaId = searchParams.get('mesa')
  const readonly = !mesaId
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)

  const { data: validation, isLoading: validating } = useQuery<{
    es_valido: boolean
    negocio_id: string
    nombre: string
    estado_actual: string
    dias_restantes: number
  }[]>({
    queryKey: ['validate-negocio', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('validar_negocio_activo', { slug_param: slug! } as any)
      if (error) throw error
      return data || []
    },
    enabled: !!slug,
  })

  const { data: negocio } = useQuery<Negocio>({
    queryKey: ['negocio-public', slug],
    enabled: !!validation && validation[0]?.es_valido === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('negocios')
        .select('*')
        .eq('slug', slug!)
        .single()
      if (error) throw error
      return data as Negocio
    }
  })

  const { data: categorias, isLoading } = useQuery<Categoria[]>({
    queryKey: ['menu-publico', slug],
    enabled: !!validation && validation[0]?.es_valido === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select(`
          *,
          productos (*)
        `)
        .eq('negocio_id', validation![0].negocio_id)
        .eq('activa', true)
        .order('orden', { ascending: true })
      
      if (error) throw error
      
      return data?.map((cat: any) => ({
        ...cat,
        productos: cat.productos
          ?.filter((p: any) => p.disponible)
          .sort((a: any, b: any) => a.orden - b.orden) || []
      })) as Categoria[]
    }
  })

  const total = cart.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0)
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0)

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!negocio || cart.length === 0) throw new Error('Carrito vacío')
      const items = cart.map(item => ({
        producto_id: item.producto.id,
        nombre_producto: item.producto.nombre,
        precio_unitario: item.producto.precio,
        cantidad: item.cantidad,
        subtotal: item.producto.precio * item.cantidad,
      }))
      await ordenesService.create({
        negocio_id: negocio.id,
        mesa_numero: mesaId ? parseInt(mesaId) : null,
        total,
      }, items)
    },
    onSuccess: () => {
      setCart([])
      setOrderPlaced(true)
      toast.success('Pedido enviado a cocina')
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  })

  if (validating || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!validation || !validation[0]?.es_valido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-6">
          <h1 className="text-2xl font-bold text-destructive">Servicio No Disponible</h1>
          <p className="text-muted-foreground">
            Este menú no está disponible en este momento. Por favor contacta al restaurante.
          </p>
          {negocio && (
            <p className="text-sm">Restaurante: {negocio.nombre}</p>
          )}
        </div>
      </div>
    )
  }

  const addToCart = (producto: Database['public']['Tables']['productos']['Row']) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.id === producto.id)
      if (existing) {
        return prev.map(item =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  const removeFromCart = (productoId: string) => {
    setCart(prev => prev.filter(item => item.producto.id !== productoId))
  }

  const updateQuantity = (productoId: string, delta: number) => {
    setCart(prev =>
      prev.map(item =>
        item.producto.id === productoId
          ? { ...item, cantidad: Math.max(0, item.cantidad + delta) }
          : item
      ).filter(item => item.cantidad > 0)
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-700">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-3 md:px-4 h-12 md:h-14 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-sm md:text-lg font-semibold text-gray-800 truncate">{negocio?.nombre}</h1>
            {mesaId && (
              <p className="text-[10px] md:text-xs text-gray-500">Mesa {mesaId}</p>
            )}
          </div>
          {!readonly && (
            <button
              type="button"
              onClick={() => setCartOpen(!cartOpen)}
              className="relative p-1.5 md:p-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gray-800 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {categorias?.map((categoria) => (
          <section key={categoria.id} className="mb-6 md:mb-10">
            <h2 className="text-base md:text-lg font-bold text-gray-800 mb-1">{categoria.nombre}</h2>
            <div className="w-8 md:w-12 h-0.5 bg-gray-300 mb-3 md:mb-5" />

            <div className="space-y-0">
              {categoria.productos.map(producto => (
                <div key={producto.id} className="py-2 md:py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start gap-2 md:gap-3">
                    {producto.imagen_url && (
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="w-8 h-8 md:w-10 md:h-10 object-cover rounded flex-shrink-0 mt-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1 md:gap-2">
                        <span className="font-medium text-gray-800 text-xs md:text-sm truncate">{producto.nombre}</span>
                        <span className="text-gray-300 flex-shrink-0 text-[8px] md:text-xs leading-relaxed tracking-[0.1em] md:tracking-[0.2em] overflow-hidden hidden md:inline">····································</span>
                        <span className="font-medium text-gray-800 text-xs md:text-sm flex-shrink-0 ml-auto">${producto.precio.toFixed(2)}</span>
                      </div>
                      {producto.descripcion && (
                        <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 leading-relaxed">{producto.descripcion}</p>
                      )}
                      {!readonly && (
                        <button
                          type="button"
                          onClick={() => addToCart(producto)}
                          className="mt-1 text-[10px] md:text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          + Agregar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {!readonly && cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Tu Pedido</h2>
              <button type="button" onClick={() => setCartOpen(false)} className="p-1 text-gray-500 hover:text-gray-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">El carrito está vacío</p>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-3">
                    {cart.map(item => (
                      <div key={item.producto.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.producto.nombre}</p>
                          <p className="text-xs text-gray-500">${item.producto.precio.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.producto.id, -1)}
                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-sm"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm text-gray-800">{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.producto.id, 1)}
                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-sm"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.producto.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                    <div className="flex justify-between text-base font-semibold text-gray-800">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    {orderPlaced ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Pedido Enviado
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => createOrderMutation.mutate()}
                        disabled={createOrderMutation.isPending}
                        className="w-full py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
                      >
                        {createOrderMutation.isPending ? 'Enviando...' : 'Enviar Pedido'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
