import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Producto = Database['public']['Tables']['productos']['Row']
type ProductoInsert = Database['public']['Tables']['productos']['Insert']
type ProductoUpdate = Database['public']['Tables']['productos']['Update']

export const productosService = {
  async getByNegocio(negocioId: string) {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .eq('negocio_id', negocioId)
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async getByCategoria(categoriaId: string) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('categoria_id', categoriaId)
      .eq('disponible', true)
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async create(producto: ProductoInsert) {
    const { data, error } = await supabase
      .from('productos')
      .insert(producto)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: ProductoUpdate) {
    const { data, error } = await supabase
      .from('productos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async updateOrder(id: string, orden: number) {
    const { error } = await supabase
      .from('productos')
      .update({ orden })
      .eq('id', id)
    if (error) throw error
  }
}
