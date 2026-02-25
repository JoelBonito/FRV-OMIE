import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Settings,
  Key,
  Users,
  Save,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useConfigOmie, useUpsertConfigOmie } from '@/hooks/useConfig'
import { useRole } from '@/hooks/useRole'
import type { Tables } from '@/lib/types/database'

type ConfigOmie = Tables<'config_omie'>

interface OmieFormValues {
  app_key: string
  app_secret: string
  webhook_secret: string
  sync_interval_hours: string
}

const SYNC_INTERVALS = [
  { value: '1', label: '1 hora' },
  { value: '3', label: '3 horas' },
  { value: '6', label: '6 horas' },
  { value: '12', label: '12 horas' },
  { value: '24', label: '24 horas' },
]

function OmieCredentialsForm({ config }: { config: ConfigOmie | null }) {
  const upsert = useUpsertConfigOmie()
  const [showKey, setShowKey] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { isDirty } } =
    useForm<OmieFormValues>({
      defaultValues: {
        app_key: config?.app_key ?? '',
        app_secret: config?.app_secret ?? '',
        webhook_secret: config?.webhook_secret ?? '',
        sync_interval_hours: String(config?.sync_interval_hours ?? 6),
      },
    })

  const intervalValue = watch('sync_interval_hours')

  function onSubmit(values: OmieFormValues) {
    upsert.mutate(
      {
        config: {
          app_key: values.app_key,
          app_secret: values.app_secret,
          webhook_secret: values.webhook_secret || undefined,
          sync_interval_hours: Number(values.sync_interval_hours),
        },
        existingId: config?.id,
      },
      {
        onSuccess: () => toast.success('Configurações salvas com sucesso'),
        onError: (err) =>
          toast.error(`Erro ao salvar: ${err.message}`),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            Credenciais API Omie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app_key">App Key</Label>
            <div className="relative">
              <Input
                id="app_key"
                type={showKey ? 'text' : 'password'}
                placeholder="Sua app_key do Omie"
                autoComplete="off"
                {...register('app_key', { required: true })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app_secret">App Secret</Label>
            <div className="relative">
              <Input
                id="app_secret"
                type={showSecret ? 'text' : 'password'}
                placeholder="Sua app_secret do Omie"
                autoComplete="off"
                {...register('app_secret', { required: true })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_secret">
              Webhook Secret{' '}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="webhook_secret"
              type="text"
              placeholder="Secret para validação de webhooks"
              {...register('webhook_secret')}
            />
            <p className="text-xs text-muted-foreground">
              Token de autenticação para webhooks do Omie. Será validado via{' '}
              <code className="rounded bg-muted px-1 py-0.5">endpoint_token</code>.
            </p>
          </div>

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

          <Separator />

          <div className="space-y-2">
            <Label>
              <Clock className="mr-1 inline h-3.5 w-3.5" />
              Intervalo de Sincronização
            </Label>
            <Select
              value={intervalValue}
              onValueChange={(v) =>
                setValue('sync_interval_hours', v, { shouldDirty: true })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYNC_INTERVALS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    A cada {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="gap-2" disabled={!isDirty || upsert.isPending}>
          <Save className="h-4 w-4" />
          {upsert.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </form>
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
          Gerenciamento de credenciais e configurações do sistema
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
          <OmieCredentialsForm config={config ?? null} />
        </TabsContent>

        <TabsContent value="users">
          <UsersSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
