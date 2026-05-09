import { supabase } from '@/lib/supabase'

export const planLimitsService = {
  async getPlanLimits(planId: string | null) {
    if (!planId) return { max_productos: null, max_categorias: null, max_mesas: null }

    const { data, error } = await supabase
      .from('planes')
      .select('max_productos, max_categorias, max_mesas')
      .eq('id', planId)
      .single()

    if (error) throw error
    return data
  },

  async checkProductLimit(negocioId: string, planId: string | null) {
    const limits = await this.getPlanLimits(planId)
    if (limits.max_productos === null) return

    const { count, error } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('negocio_id', negocioId)

    if (error) throw error
    if (count !== null && count >= limits.max_productos) {
      throw new Error(`Límite de productos alcanzado (${limits.max_productos})`)
    }
  },

  async checkCategoriaLimit(negocioId: string, planId: string | null) {
    const limits = await this.getPlanLimits(planId)
    if (limits.max_categorias === null) return

    const { count, error } = await supabase
      .from('categorias')
      .select('*', { count: 'exact', head: true })
      .eq('negocio_id', negocioId)

    if (error) throw error
    if (count !== null && count >= limits.max_categorias) {
      throw new Error(`Límite de categorías alcanzado (${limits.max_categorias})`)
    }
  },

  async checkMesaLimit(negocioId: string, planId: string | null) {
    const limits = await this.getPlanLimits(planId)
    if (limits.max_mesas === null) return

    const { count, error } = await supabase
      .from('mesas')
      .select('*', { count: 'exact', head: true })
      .eq('negocio_id', negocioId)

    if (error) throw error
    if (count !== null && count >= limits.max_mesas) {
      throw new Error(`Límite de mesas alcanzado (${limits.max_mesas})`)
    }
  },
}
