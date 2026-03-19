import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAutoSync, useConfigOmie } from '@/hooks/useSync'
import { cn } from '@/lib/utils'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 767px)').matches
    }
    return false
  })

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
  // Auto-recover stale "running" status: if running for > 5 min, treat as idle
  const rawStatus = config?.status_sync ?? 'idle'
  const lastSync = config?.ultimo_sync ?? null
  const isStaleRunning = rawStatus === 'running' && lastSync
    && (Date.now() - new Date(lastSync).getTime()) > 5 * 60 * 1000
  const syncStatus = isStaleRunning ? 'idle' : rawStatus

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: fixed on desktop, drawer on mobile */}
      <div
        className={cn(
          isMobile
            ? 'fixed inset-y-0 left-0 z-[60] transition-transform duration-300'
            : '',
          isMobile && !mobileOpen ? '-translate-x-full' : isMobile ? 'translate-x-0' : ''
        )}
      >
        <Sidebar 
          collapsed={isMobile ? false : collapsed} 
          isMobile={isMobile}
          onCloseMobile={() => setMobileOpen(false)}
        />
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
        <main className="p-3 md:p-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
