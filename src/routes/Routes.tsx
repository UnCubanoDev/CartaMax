import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'
import { BusinessLayout } from '@/layouts/BusinessLayout'
import { PublicMenuLayout } from '@/layouts/PublicMenuLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { SuperAdminDashboard } from '@/features/super-admin/SuperAdminDashboard'
import { BusinessDashboard } from '@/features/business/BusinessDashboard'
import { PublicMenu } from '@/features/public-menu/PublicMenu'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterBusiness } from '@/features/auth/RegisterBusiness'
import { BusinessManagement } from '@/features/super-admin/BusinessManagement'
import { PlansManagement } from '@/features/super-admin/PlansManagement'
import { PaymentsManagement } from '@/features/super-admin/PaymentsManagement'
import { CategoryManagement } from '@/features/categories/CategoryManagement'
import { ProductManagement } from '@/features/products/ProductManagement'
import { TableManagement } from '@/features/tables/TableManagement'
import { LicenseManagement } from '@/features/licenses/LicenseManagement'
import { PaymentHistory } from '@/features/payments/PaymentHistory'
import { BusinessOrders } from '@/features/orders/BusinessOrders'
import { KitchenView } from '@/features/orders/KitchenView'
import { NotFound } from '@/components/shared/NotFound'
import { ServiceUnavailable } from '@/components/shared/ServiceUnavailable'
import { RouteGuard } from '@/components/shared/RouteGuard'

export function AppRoutes() {
  const { user, loading, role } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route element={<AuthLayout />}>
        <Route path="/login" element={user ? <Navigate to={role === 'super_admin' ? '/admin' : '/business'} replace /> : <LoginPage />} />
        <Route path="/register" element={<RegisterBusiness />} />
      </Route>

      <Route element={<RouteGuard allowedRoles={['super_admin']} />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/admin" element={<SuperAdminDashboard />} />
          <Route path="/admin/businesses" element={<BusinessManagement />} />
          <Route path="/admin/plans" element={<PlansManagement />} />
          <Route path="/admin/payments" element={<PaymentsManagement />} />
        </Route>
      </Route>

      <Route element={<RouteGuard allowedRoles={['negocio']} />}>
        <Route element={<BusinessLayout />}>
          <Route path="/business" element={<BusinessDashboard />} />
          <Route path="/business/categories" element={<CategoryManagement />} />
          <Route path="/business/products" element={<ProductManagement />} />
          <Route path="/business/tables" element={<TableManagement />} />
          <Route path="/business/license" element={<LicenseManagement />} />
          <Route path="/business/orders" element={<BusinessOrders />} />
          <Route path="/business/payments" element={<PaymentHistory />} />
        </Route>
      </Route>

      <Route path="/cocina/:slug" element={<KitchenView />} />

      <Route element={<PublicMenuLayout />}>
        <Route path="/menu/:slug" element={<PublicMenu />} />
        <Route path="/unavailable" element={<ServiceUnavailable />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
