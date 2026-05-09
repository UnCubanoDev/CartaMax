import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Plan = Database['public']['Tables']['planes']['Row']
type PlanInsert = Database['public']['Tables']['planes']['Insert']
type PlanUpdate = Database['public']['Tables']['planes']['Update']

export const planesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('planes')
      .select('*')
      .order('precio_mensual', { ascending: true })
    if (error) throw error
    return data
  },

  async getActive() {
    const { data, error } = await supabase
      .from('planes')
      .select('*')
      .eq('activo', true)
      .order('precio_mensual', { ascending: true })
    if (error) throw error
    return data
  },

  async create(plan: PlanInsert) {
    const { data, error } = await supabase
      .from('planes')
      .insert(plan)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: PlanUpdate) {
    const { data, error } = await supabase
      .from('planes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('planes')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
