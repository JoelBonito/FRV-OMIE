import { useState } from 'react'
import {
  Settings,
  Key,
  Users,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
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
import { useQueryClient } from '@tanstack/react-query'
import { updateOmieCredentials, generateWebhookSecret } from '@/services/api/config'
import type { ConfigOmieSafe } from '@/services/api/config'

function OmieStatusSection({ config }: { config: ConfigOmieSafe | null }) {
  const hasCredentials = config?.has_credentials ?? false
  const hasWebhookSecret = (config as any)?.has_webhook_secret ?? false
  const queryClient = useQueryClient()

  const [appKey, setAppKey] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    if (!appKey.trim() || !appSecret.trim()) {
      setMessage({ type: 'error', text: 'App Key e App Secret são obrigatórios' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await updateOmieCredentials(appKey.trim(), appSecret.trim(), webhookSecret.trim() || undefined)
      setMessage({ type: 'success', text: 'Credenciais salvas com sucesso!' })
      setAppKey('')
      setAppSecret('')
      setWebhookSecret('')
      queryClient.invalidateQueries({ queryKey: ['config-omie'] })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao salvar' })
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateSecret = async () => {
    setGenerating(true)
    try {
      const secret = await generateWebhookSecret()
      setWebhookSecret(secret)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao gerar' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Credential status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            Credenciais API Omie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            {hasCredentials ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Credenciais configuradas</p>
                  <p className="text-xs text-muted-foreground">
                    As chaves da API Omie estão armazenadas de forma segura no banco de dados.
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Credenciais não configuradas</p>
                  <p className="text-xs text-muted-foreground">
                    Insira as chaves da API Omie abaixo para ativar a sincronização.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Credential form */}
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">{hasCredentials ? 'Atualizar Credenciais' : 'Configurar Credenciais'}</p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="App Key"
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="App Secret"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Webhook Secret (opcional)</p>
                <Badge variant={hasWebhookSecret ? 'default' : 'secondary'} className="text-xs">
                  {hasWebhookSecret ? 'Configurado' : 'Não configurado'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Webhook Secret"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono"
                />
                <button
                  onClick={handleGenerateSecret}
                  disabled={generating}
                  className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Gerar
                </button>
              </div>
            </div>

            {message && (
              <div className={`rounded-md px-3 py-2 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || (!appKey.trim() && !appSecret.trim())}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar Credenciais'}
            </button>
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
