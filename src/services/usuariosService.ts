import { supabase } from '@/lib/supabase'

export type AuthUser = {
  id: string
  email: string
  created_at: string
}

export const usuariosService = {
  async list() {
    const { data, error } = await supabase.rpc('admin_list_users')
    if (error) throw error
    return data as AuthUser[]
  },

  async create(email: string, password: string) {
    const { data, error } = await supabase.rpc('admin_create_user', { p_email: email, p_password: password })
    if (error) throw error
    return data
  },

  async delete(userId: string) {
    const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId })
    if (error) throw error
  },
}
