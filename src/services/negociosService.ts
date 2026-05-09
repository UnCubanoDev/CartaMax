import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Negocio = Database['public']['Tables']['negocios']['Row']
type NegocioInsert = Database['public']['Tables']['negocios']['Insert']
type NegocioUpdate = Database['public']['Tables']['negocios']['Update']

export const negociosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('negocios')
      .select('*, planes(nombre, precio_mensual)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('negocios')
      .select('*, planes(nombre, precio_mensual)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('negocios')
      .select('*, planes(nombre, precio_mensual)')
      .eq('slug', slug)
      .single()
    if (error) throw error
    return data
  },

  async create(negocio: NegocioInsert) {
    const { data, error } = await supabase
      .from('negocios')
      .insert(negocio)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: NegocioUpdate) {
    const { data, error } = await supabase
      .from('negocios')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('negocios')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async validateSlug(slug: string) {
    const { data, error } = await supabase
      .rpc('validar_negocio_activo', { slug_param: slug })
    if (error) throw error
    return data?.[0] || null
  },

  async listUsers() {
    const { data, error } = await supabase.rpc('admin_list_users')
    if (error) throw error
    return data
  },

  async createUser(email: string, password: string) {
    const { data, error } = await supabase.rpc('admin_create_user', { p_email: email, p_password: password })
    if (error) throw error
    return data
  }
}
