import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAutoSync, useConfigOmie } from '@/hooks/useSync'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { data: config } = useConfigOmie()

  // Auto-sync: triggers if last sync > configured interval
  useAutoSync()

  // Sync status for header indicator
  const syncStatus = config?.status_sync ?? 'idle'
  const lastSync = config?.ultimo_sync ?? null

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} />
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-60'
        )}
      >
        <Header
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          syncStatus={syncStatus}
          lastSync={lastSync}
        />
        <main className="p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
