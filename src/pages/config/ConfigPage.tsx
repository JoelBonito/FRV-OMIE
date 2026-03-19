import {
  Settings,
  Key,
  Users,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useConfigOmie } from '@/hooks/useConfig'
import { useRole } from '@/hooks/useRole'
import type { ConfigOmieSafe } from '@/services/api/config'

function OmieStatusSection({ config }: { config: ConfigOmieSafe | null }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            Credenciais API Omie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium">Credenciais gerenciadas pelo sistema</p>
              <p className="text-xs text-muted-foreground">
                As chaves da API Omie são configuradas diretamente no banco de dados pelo administrador do sistema.
              </p>
            </div>
          </div>

          {/* Sync interval */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Intervalo de sincronização</span>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              A cada {config?.sync_interval_hours ?? 6}h
            </Badge>
          </div>

          <Separator />

          {/* Webhook URL info */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Endpoint do Webhook
            </p>
            <code className="block rounded bg-muted px-3 py-2 text-xs break-all">
              {import.meta.env.VITE_SUPABASE_URL}/functions/v1/omie-webhook
            </code>
            <p className="text-xs text-muted-foreground">
              Registre esta URL no painel Omie (Meus Aplicativos &gt; Webhooks).
              Tópicos: <strong>ClienteFornecedor.*</strong> e{' '}
              <strong>Financas.ContaReceber.*</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function UsersSection() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Gestão de Usuários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">
            Gestão de usuários via Supabase Dashboard
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Utilize o painel do Supabase para criar, editar e gerenciar
            usuários e suas roles (admin, gerente, vendedor).
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary">admin</Badge>
            <Badge variant="secondary">gerente</Badge>
            <Badge variant="secondary">vendedor</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            As roles são atribuídas via{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              user_metadata.user_role
            </code>{' '}
            no Supabase Auth.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ConfigPage() {
  const { data: config, isLoading } = useConfigOmie()
  const { isAdmin } = useRole()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight">Configurações</h2>
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Acesso Restrito</p>
            <p className="text-xs text-muted-foreground mt-1">
              Apenas administradores podem acessar as configurações do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h2>
        <p className="text-muted-foreground">
          Status de credenciais e configurações do sistema
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="omie" className="space-y-6">
        <TabsList>
          <TabsTrigger value="omie" className="gap-2">
            <Key className="h-4 w-4" />
            Omie API
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="omie">
          <OmieStatusSection config={config ?? null} />
        </TabsContent>

        <TabsContent value="users">
          <UsersSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
