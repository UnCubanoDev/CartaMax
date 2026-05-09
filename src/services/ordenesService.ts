import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Orden = Database['public']['Tables']['ordenes']['Row']
type OrdenInsert = Database['public']['Tables']['ordenes']['Insert']
type OrdenUpdate = Database['public']['Tables']['ordenes']['Update']

export interface OrdenWithItems extends Orden {
  ordenes_productos: (Database['public']['Tables']['ordenes_productos']['Row'])[]
}

export const ordenesService = {
  async create(orden: OrdenInsert, items: { producto_id: string; nombre_producto: string; precio_unitario: number; cantidad: number; subtotal: number }[]) {
    const { data: ordenData, error: ordenError } = await supabase
      .from('ordenes')
      .insert(orden)
      .select()
      .single()
    if (ordenError) throw ordenError

    const { error: itemsError } = await supabase
      .from('ordenes_productos')
      .insert(items.map(item => ({ ...item, orden_id: ordenData.id })))
    if (itemsError) throw itemsError

    return ordenData
  },

  async getByNegocio(negocioId: string) {
    const { data, error } = await supabase
      .from('ordenes')
      .select(`*, ordenes_productos(*)`)
      .eq('negocio_id', negocioId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as OrdenWithItems[]
  },

  async getByNegocioActive(negocioId: string) {
    const { data, error } = await supabase
      .from('ordenes')
      .select(`*, ordenes_productos(*)`)
      .eq('negocio_id', negocioId)
      .in('estado', ['pendiente', 'en_preparacion', 'listo'])
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as OrdenWithItems[]
  },

  async update(id: string, updates: OrdenUpdate) {
    const { data, error } = await supabase
      .from('ordenes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  subscribeByNegocio(negocioId: string, callback: (orden: OrdenWithItems) => void) {
    return supabase
      .channel(`ordenes:${negocioId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ordenes', filter: `negocio_id=eq.${negocioId}` },
        (payload) => { callback(payload.new as OrdenWithItems) }
      )
      .subscribe()
  }
}
