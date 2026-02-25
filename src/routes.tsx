import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Loader2 } from 'lucide-react'

// Lazy-loaded pages for code splitting
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientesPage = lazy(() => import('@/pages/clientes/ClientesPage').then(m => ({ default: m.ClientesPage })))
const ClienteDetalhePage = lazy(() => import('@/pages/clientes/ClienteDetalhePage').then(m => ({ default: m.ClienteDetalhePage })))
const VendedoresPage = lazy(() => import('@/pages/vendedores/VendedoresPage').then(m => ({ default: m.VendedoresPage })))
const VendasPage = lazy(() => import('@/pages/vendas/VendasPage').then(m => ({ default: m.VendasPage })))
const CarteirasPage = lazy(() => import('@/pages/carteiras/CarteirasPage').then(m => ({ default: m.CarteirasPage })))
const SyncPage = lazy(() => import('@/pages/sync/SyncPage').then(m => ({ default: m.SyncPage })))
const ConfigPage = lazy(() => import('@/pages/config/ConfigPage').then(m => ({ default: m.ConfigPage })))
const LoginPage = lazy(() => import('@/pages/login/LoginPage').then(m => ({ default: m.LoginPage })))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
          { path: 'clientes', element: <SuspenseWrapper><ClientesPage /></SuspenseWrapper> },
          { path: 'clientes/:id', element: <SuspenseWrapper><ClienteDetalhePage /></SuspenseWrapper> },
          { path: 'vendedores', element: <SuspenseWrapper><VendedoresPage /></SuspenseWrapper> },
          { path: 'vendas', element: <SuspenseWrapper><VendasPage /></SuspenseWrapper> },
          { path: 'carteiras', element: <SuspenseWrapper><CarteirasPage /></SuspenseWrapper> },
          { path: 'sync', element: <SuspenseWrapper><SyncPage /></SuspenseWrapper> },
          { path: 'config', element: <SuspenseWrapper><ConfigPage /></SuspenseWrapper> },
        ],
      },
    ],
  },
])
