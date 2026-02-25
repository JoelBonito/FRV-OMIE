import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAutoSync } from '@/hooks/useSync'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)

  // Auto-sync: triggers if last sync > configured interval
  useAutoSync()

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
        />
        <main className="p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
