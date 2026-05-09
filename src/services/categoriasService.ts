import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Categoria = Database['public']['Tables']['categorias']['Row']
type CategoriaInsert = Database['public']['Tables']['categorias']['Insert']
type CategoriaUpdate = Database['public']['Tables']['categorias']['Update']

export const categoriasService = {
  async getByNegocio(negocioId: string) {
    const { data, error } = await supabase
      .from('categorias')
      .select('*, productos(*)')
      .eq('negocio_id', negocioId)
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async create(categoria: CategoriaInsert) {
    const { data, error } = await supabase
      .from('categorias')
      .insert(categoria)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: CategoriaUpdate) {
    const { data, error } = await supabase
      .from('categorias')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async updateOrder(id: string, orden: number) {
    const { error } = await supabase
      .from('categorias')
      .update({ orden })
      .eq('id', id)
    if (error) throw error
  }
}
