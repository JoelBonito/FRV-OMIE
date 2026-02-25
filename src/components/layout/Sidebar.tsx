import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShoppingCart,
  Briefcase,
  RefreshCw,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRole } from '@/hooks/useRole'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/lib/constants'
import { ROLE_LABELS, type UserRole } from '@/lib/roles'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
  minRole?: UserRole
}

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.CLIENTES, icon: Users, label: 'Clientes' },
  { to: ROUTES.VENDEDORES, icon: UserCheck, label: 'Vendedores', minRole: 'gerente' },
  { to: ROUTES.VENDAS, icon: ShoppingCart, label: 'Vendas' },
  { to: ROUTES.CARTEIRAS, icon: Briefcase, label: 'Carteiras' },
  { to: ROUTES.SYNC, icon: RefreshCw, label: 'Sync Omie', minRole: 'admin' },
  { to: ROUTES.CONFIG, icon: Settings, label: 'Configurações', minRole: 'admin' },
]

interface SidebarProps {
  collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { hasMinRole } = useRole()
  const { user, role } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.minRole || hasMinRole(item.minRole)
  )

  const userInitials = getUserInitials(user?.email)
  const userName = user?.email?.split('@')[0] ?? 'user'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-28 shrink-0 flex-col justify-center border-b border-sidebar-border bg-sidebar-accent/5',
          collapsed ? 'items-center px-2' : 'px-8'
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 p-2 ring-1 ring-white/15 shadow-2xl">
            <img
              src="/favicon.svg"
              alt="Omie Icon"
              className="h-full w-full object-contain pointer-events-none select-none"
              style={{ filter: 'brightness(0) invert(1) saturate(5) hue-rotate(160deg)' }}
            />
          </div>
          {!collapsed && (
            <img
              src="/omie-logo.png"
              alt="Omie Logo"
              className="h-[22px] w-auto brightness-0 invert opacity-95 pointer-events-none select-none"
            />
          )}
        </div>
        {!collapsed && (
          <div className="mt-4 flex w-full items-center justify-start pl-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sidebar-foreground/30 leading-none">
              DASHBOARD V2.0
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-2">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'relative w-full flex items-center gap-3 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'text-white shadow-lg shadow-[#0066FF]/20'
                  : 'text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-0 bg-[#0066FF]" />
                )}
                <Icon className="relative z-10 h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="relative z-10">{label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="mt-auto shrink-0 border-t border-sidebar-border p-4">
        <div
          className={cn(
            'rounded-xl border border-sidebar-border bg-sidebar-accent',
            collapsed ? 'flex items-center justify-center p-2' : 'p-3'
          )}
        >
          <div
            className={cn(
              'flex items-center',
              collapsed ? 'justify-center' : 'gap-3'
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0066FF] text-sm font-bold text-white">
                {userInitials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar-accent bg-[#00C896]" />
            </div>

            {/* User info */}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-sidebar-foreground">
                  {userName}
                </p>
                <p className="text-xs text-sidebar-foreground/60">
                  {ROLE_LABELS[role]}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

/** Extract up to 2 uppercase initials from an email address. */
function getUserInitials(email?: string | null): string {
  if (!email) return 'U'
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
