import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  ArrowLeftRight,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'

interface BottomItem {
  to: string
  icon: LucideIcon
  label: string
}

const BOTTOM_ITEMS: BottomItem[] = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Home' },
  { to: ROUTES.VENDAS, icon: ShoppingCart, label: 'Vendas' },
  { to: ROUTES.ORCAMENTOS, icon: FileText, label: 'Pedidos' },
  { to: ROUTES.COMPARACAO, icon: ArrowLeftRight, label: 'Comparar' },
]

const MORE_ITEMS = [
  { to: ROUTES.CLIENTES, label: 'Clientes' },
  { to: ROUTES.VENDEDORES, label: 'Vendedores' },
  { to: ROUTES.CURVA_ABC, label: 'Curva ABC' },
  { to: ROUTES.CARTEIRAS, label: 'Carteiras' },
  { to: ROUTES.SYNC, label: 'Sync Omie' },
  { to: ROUTES.CONFIG, label: 'Configurações' },
]

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur-md md:hidden">
      {BOTTOM_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-[#0066FF]'
                : 'text-muted-foreground'
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}

      {/* More dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
          <MoreHorizontal className="h-5 w-5" />
          Mais
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-2">
          {MORE_ITEMS.map((item) => (
            <DropdownMenuItem key={item.to} onClick={() => navigate(item.to)}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
