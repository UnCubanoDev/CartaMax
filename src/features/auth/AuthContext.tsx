import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Negocio = Database['public']['Tables']['negocios']['Row']

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  role: 'super_admin' | 'negocio' | null
  negocio: Negocio | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, negocioData: Partial<Negocio>) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshNegocio: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'super_admin' | 'negocio' | null>(null)
  const [negocio, setNegocio] = useState<Negocio | null>(null)

  const fetchUserRole = useCallback(async (_userId: string, email: string) => {
    try {
      const { data: negocioData } = await supabase
        .from('negocios')
        .select('*')
        .eq('owner_email', email)
        .maybeSingle()

      if (negocioData) {
        setRole('negocio')
        setNegocio(negocioData)
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      const userRole = (userData?.user?.user_metadata?.role as 'super_admin' | 'negocio') || 'negocio'
      setRole(userRole)
    } catch (error) {
      console.error('Error fetching user role:', error)
      setRole('negocio')
    }
  }, [])

  const refreshNegocio = useCallback(async () => {
    if (!user?.email) return
    const { data } = await supabase
      .from('negocios')
      .select('*')
      .eq('owner_email', user.email)
      .single()
    setNegocio(data)
  }, [user?.email])

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return
        clearTimeout(timeoutId)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          setLoading(true)
          fetchUserRole(session.user.id, session.user.email || '')
            .catch(() => {})
            .then(() => { if (mounted) setLoading(false) })
        } else {
          setRole(null)
          setNegocio(null)
          if (mounted) setLoading(false)
        }
      }
    )

    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth timed out - setting loading to false')
        setLoading(false)
      }
    }, 3000)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [fetchUserRole])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, negocioData: Partial<Negocio>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          negocio_nombre: negocioData.nombre,
          negocio_slug: negocioData.slug,
        }
      }
    })
    if (error) return { error }
    
    if (data.user) {
      const { error: negocioError } = await supabase
        .from('negocios')
        .insert({
          owner_email: email,
          estado: 'pendiente',
          ...negocioData,
        } as any)
      
      if (negocioError) {
        return { error: negocioError }
      }
    }
    
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setRole(null)
    setNegocio(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading, role, negocio,
      signIn, signUp, signOut, refreshNegocio
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
