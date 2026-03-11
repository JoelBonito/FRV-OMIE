import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { useAutoSync, useConfigOmie } from '@/hooks/useSync'
import { cn } from '@/lib/utils'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()
  const location = useLocation()
  const { data: config } = useConfigOmie()

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Auto-sync: triggers if last sync > configured interval
  useAutoSync()

  // Sync status for header indicator
  const syncStatus = config?.status_sync ?? 'idle'
  const lastSync = config?.ultimo_sync ?? null

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: fixed on desktop, drawer on mobile */}
      <div
        className={cn(
          isMobile
            ? 'fixed left-0 top-0 z-50 transition-transform duration-300'
            : '',
          isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0'
        )}
      >
        <Sidebar collapsed={isMobile ? false : collapsed} />
      </div>

      <div
        className={cn(
          'transition-all duration-300',
          isMobile ? 'ml-0' : collapsed ? 'ml-16' : 'ml-60'
        )}
      >
        <Header
          collapsed={collapsed}
          onToggleSidebar={() => {
            if (isMobile) {
              setMobileOpen((prev) => !prev)
            } else {
              setCollapsed((prev) => !prev)
            }
          }}
          syncStatus={syncStatus}
          lastSync={lastSync}
        />
        <main className={cn('p-5', isMobile && 'pb-20')}>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav for mobile */}
      <BottomNav />
    </div>
  )
}
