import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Pago = Database['public']['Tables']['pagos']['Row']
type PagoInsert = Database['public']['Tables']['pagos']['Insert']

export const pagosService = {
  async getByNegocio(negocioId: string) {
    const { data, error } = await supabase
      .from('pagos')
      .select('*, planes(nombre, precio_mensual)')
      .eq('negocio_id', negocioId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getAll() {
    const { data, error } = await supabase
      .from('pagos')
      .select('*, negocios(nombre, slug), planes(nombre)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(pago: PagoInsert) {
    const { data, error } = await supabase
      .from('pagos')
      .insert(pago)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async aprobar(pagoId: string) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('No autenticado')
    
    const { error } = await supabase
      .rpc('aprobar_pago', { 
        pago_id: pagoId, 
        admin_id: user.user.id 
      })
    if (error) throw error
  },

  async rechazar(pagoId: string, motivo?: string) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('No autenticado')
    
    const { error } = await supabase
      .rpc('rechazar_pago', { 
        pago_id: pagoId, 
        admin_id: user.user.id,
        motivo 
      })
    if (error) throw error
  }
}
