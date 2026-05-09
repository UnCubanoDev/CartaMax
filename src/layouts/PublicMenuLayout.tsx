import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ServiceUnavailable } from '@/components/shared/ServiceUnavailable'

export function PublicMenuLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}
