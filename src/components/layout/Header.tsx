import { useNavigate } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS } from '@/lib/roles'
import { APP_NAME, ROUTES } from '@/lib/constants'
import { ROLE_BADGE_CLASSES } from '@/lib/theme-constants'

interface HeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
}

export function Header({ collapsed, onToggleSidebar }: HeaderProps) {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate(ROUTES.LOGIN)
  }

  const badgeClass = ROLE_BADGE_CLASSES[role] ?? ROLE_BADGE_CLASSES.vendedor

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between shadow-sm bg-background/80 backdrop-blur-md px-5 border-b">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
        <h1
          className="text-lg font-semibold md:hidden"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {APP_NAME}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <Badge variant="outline" className={badgeClass}>
              {ROLE_LABELS[role]}
            </Badge>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          aria-label="Sair"
          className="hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
