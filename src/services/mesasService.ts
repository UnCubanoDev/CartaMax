import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Mesa = Database['public']['Tables']['mesas']['Row']
type MesaInsert = Database['public']['Tables']['mesas']['Insert']
type MesaUpdate = Database['public']['Tables']['mesas']['Update']

export const mesasService = {
  async getByNegocio(negocioId: string) {
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('numero', { ascending: true })
    if (error) throw error
    return data
  },

  async create(mesa: MesaInsert) {
    const { data, error } = await supabase
      .from('mesas')
      .insert(mesa)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: MesaUpdate) {
    const { data, error } = await supabase
      .from('mesas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('mesas')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
