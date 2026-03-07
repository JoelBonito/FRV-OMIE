import { useNavigate } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS } from '@/lib/roles'
import { APP_NAME, ROUTES } from '@/lib/constants'
import { ROLE_BADGE_CLASSES } from '@/lib/theme-constants'

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  return `${Math.floor(hours / 24)}d atrás`
}

interface HeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
  syncStatus?: string
  lastSync?: string | null
}

export function Header({ collapsed, onToggleSidebar, syncStatus, lastSync }: HeaderProps) {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate(ROUTES.LOGIN)
  }

  const badgeClass = ROLE_BADGE_CLASSES[role] ?? ROLE_BADGE_CLASSES.vendedor

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between shadow-sm bg-background/80 backdrop-blur-md px-6 border-b">
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
        {/* Sync indicator */}
        {syncStatus && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                {syncStatus === 'running' ? (
                  <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                <span className="text-xs text-muted-foreground hidden md:inline">
                  {syncStatus === 'running'
                    ? 'Sincronizando...'
                    : lastSync
                      ? formatTimeAgo(lastSync)
                      : 'Sem sync'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {syncStatus === 'running'
                  ? 'Sincronização em andamento'
                  : lastSync
                    ? `Último sync: ${new Date(lastSync).toLocaleString('pt-BR')}`
                    : 'Nenhuma sincronização realizada'}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

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
