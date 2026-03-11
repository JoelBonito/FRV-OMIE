import { useMemo, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Database,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { useSyncLogs, useConfigOmie, acquireSyncLock, releaseSyncLock, isSyncLocked } from '@/hooks/useSync'
import { triggerSync, type SyncResult, type SyncMode } from '@/services/api/sync'
import type { Tables } from '@/lib/types/database'

type SyncLog = Tables<'sync_logs'>
type SyncScope = 'full' | 'vendedores' | 'clientes' | 'vendas' | 'pedidos'

const SCOPE_LABELS: Record<SyncScope, string> = {
  full: 'Completo (Sequencial)',
  vendedores: 'Apenas Vendedores',
  clientes: 'Apenas Clientes',
  vendas: 'Apenas Vendas',
  pedidos: 'Apenas Pedidos',
}

const MODE_LABELS: Record<SyncMode, string> = {
  incremental: 'Incremental (novos)',
  full: 'Full (tudo)',
}

const PHASE_LABELS: Record<string, string> = {
  vendedores: 'Sincronizando vendedores...',
  clientes: 'Sincronizando clientes...',
  vendas: 'Sincronizando vendas...',
  pedidos: 'Sincronizando pedidos...',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    success: {
      label: 'Sucesso',
      className: 'bg-[#00C896]/10 text-[#00C896] border-[#00C896]/20',
    },
    error: {
      label: 'Erro',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    running: {
      label: 'Em andamento',
      className: 'bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/20',
    },
    partial: {
      label: 'Parcial',
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    },
  }
  const cfg = map[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  }
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-[#00C896]" />
    case 'error':
      return <XCircle className="h-5 w-5 text-destructive" />
    case 'running':
      return <Loader2 className="h-5 w-5 text-[#0066FF] animate-spin" />
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />
  }
}

function SyncStatusCard({
  status,
  lastSync,
  interval,
  phase,
}: {
  status: string
  lastSync: string | null
  interval: number
  phase: string | null
}) {
  const statusLabel = phase
    ? PHASE_LABELS[phase] ?? 'Sincronizando...'
    : status === 'idle'
      ? 'Aguardando'
      : status === 'running'
        ? 'Sincronizando...'
        : status === 'error'
          ? 'Erro no último sync'
          : 'OK'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          Status da Sincronização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <StatusIcon status={phase ? 'running' : status === 'idle' ? 'idle' : status} />
          <div>
            <p className="font-medium">{statusLabel}</p>
            <p className="text-xs text-muted-foreground">
              {lastSync
                ? `Último sync: ${formatDateTime(lastSync)}`
                : 'Nenhuma sincronização realizada'}
            </p>
          </div>
        </div>

        {phase && (
          <div className="flex items-center gap-2 rounded-lg bg-[#0066FF]/5 border border-[#0066FF]/20 p-3">
            <Loader2 className="h-4 w-4 text-[#0066FF] animate-spin" />
            <span className="text-sm text-[#0066FF] font-medium">
              Fase: {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">
            Intervalo automático
          </span>
          <span className="text-sm font-medium tabular-nums">
            {interval}h
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function SyncSummaryCards({ logs }: { logs: SyncLog[] }) {
  const stats = useMemo(() => {
    const total = logs.length
    const success = logs.filter((l) => l.status === 'success').length
    const errors = logs.filter((l) => l.status === 'error').length
    const totalRecords = logs.reduce(
      (sum, l) => sum + l.registros_processados,
      0
    )
    return { total, success, errors, totalRecords }
  }, [logs])

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total de Syncs</p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {stats.total}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Sucesso</p>
          <p className="text-2xl font-bold tabular-nums mt-1 text-[#00C896] font-mono">
            {stats.success}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Erros</p>
          <p className="text-2xl font-bold tabular-nums mt-1 text-destructive font-mono">
            {stats.errors}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Registros</p>
          <p className="text-2xl font-bold tabular-nums mt-1 font-mono">
            {stats.totalRecords.toLocaleString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function SyncPage() {
  const queryClient = useQueryClient()
  const { data: logs, isLoading: logsLoading } = useSyncLogs()
  const { data: config, isLoading: configLoading } = useConfigOmie()

  const [syncScope, setSyncScope] = useState<SyncScope>('full')
  const [syncMode, setSyncMode] = useState<SyncMode>('incremental')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncPhase, setSyncPhase] = useState<string | null>(null)

  const isLoading = logsLoading || configLoading
  const hasConfig = config?.has_credentials ?? false

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sync-logs'] })
    queryClient.invalidateQueries({ queryKey: ['config-omie'] })
    queryClient.invalidateQueries({ queryKey: ['vendedores'] })
    queryClient.invalidateQueries({ queryKey: ['clientes'] })
    queryClient.invalidateQueries({ queryKey: ['vendas'] })
    queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    queryClient.invalidateQueries({ queryKey: ['pedido-stats'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }, [queryClient])

  /** Sync pedidos with automatic pagination (loops while hasMore=true) */
  async function syncPedidosWithPagination(mode: SyncMode): Promise<SyncResult | null> {
    let startPage: number | undefined
    let totalProcessados = 0
    let totalCriados = 0
    let totalItens = 0
    let lastResult: SyncResult | null = null
    let batchCount = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
      batchCount++
      const result = await triggerSync('pedidos', mode, { startPage })
      lastResult = result

      const pd = result.results.pedidos
      if (pd) {
        totalProcessados += pd.processados
        totalCriados += pd.criados
        totalItens += pd.itensProcessados ?? 0

        toast.info(
          `Pedidos batch ${batchCount}: ${pd.processados} processados` +
          (pd.totalPages ? ` (pág ${pd.pagesProcessed}/${pd.totalPages})` : ''),
        )

        if (pd.hasMore && pd.nextPage) {
          startPage = pd.nextPage
          continue
        }
      }
      break
    }

    // Patch the final result with accumulated totals
    if (lastResult?.results.pedidos) {
      lastResult.results.pedidos.processados = totalProcessados
      lastResult.results.pedidos.criados = totalCriados
      lastResult.results.pedidos.itensProcessados = totalItens
    }
    return lastResult
  }

  async function handleSync() {
    if (isSyncLocked()) {
      toast.warning('Uma sincronização já está em andamento')
      return
    }
    if (!acquireSyncLock()) {
      toast.warning('Uma sincronização já está em andamento')
      return
    }

    setIsSyncing(true)
    const startTime = Date.now()

    try {
      if (syncScope === 'full') {
        // Sequential sync to avoid 60s Edge Function timeout
        const nonPedidoStages = ['vendedores', 'clientes', 'vendas'] as const
        const results: Partial<Record<'vendedores' | 'clientes' | 'vendas' | 'pedidos', SyncResult>> = {}

        for (const stage of nonPedidoStages) {
          setSyncPhase(stage)
          const result = await triggerSync(stage, syncMode)
          results[stage] = result

          const stageData = result.results[stage]
          if (stageData) {
            toast.info(
              `${stage.charAt(0).toUpperCase() + stage.slice(1)}: ` +
              `${stageData.processados} processados, ` +
              `${stageData.criados} criados`,
            )
          }
        }

        // Pedidos: paginated loop
        setSyncPhase('pedidos')
        const pedidosResult = await syncPedidosWithPagination(syncMode)
        if (pedidosResult) results.pedidos = pedidosResult

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        const ve = results.vendedores?.results.vendedores
        const cl = results.clientes?.results.clientes
        const vd = results.vendas?.results.vendas
        const pd = results.pedidos?.results.pedidos

        toast.success(
          `Sync ${syncMode === 'incremental' ? 'incremental' : 'full'} em ${elapsed}s — ` +
          `Vendedores: ${ve?.processados ?? 0} | ` +
          `Clientes: ${cl?.processados ?? 0} | ` +
          `Vendas: ${vd?.processados ?? 0} | ` +
          `Pedidos: ${pd?.processados ?? 0}`,
        )
      } else if (syncScope === 'pedidos') {
        // Pedidos: paginated loop
        setSyncPhase('pedidos')
        const result = await syncPedidosWithPagination(syncMode)
        const pd = result?.results.pedidos

        toast.success(
          `Sync pedidos em ${((Date.now() - startTime) / 1000).toFixed(1)}s — ` +
          `${pd?.processados ?? 0} processados, ` +
          `${pd?.criados ?? 0} criados, ` +
          `${pd?.itensProcessados ?? 0} itens`,
        )
      } else {
        setSyncPhase(syncScope)
        const result = await triggerSync(syncScope, syncMode)
        const key = syncScope as 'vendedores' | 'clientes' | 'vendas'
        const stageData = result.results[key]

        toast.success(
          `Sync ${syncScope} em ${(result.duration_ms / 1000).toFixed(1)}s — ` +
          `${stageData?.processados ?? 0} processados, ` +
          `${stageData?.criados ?? 0} criados, ` +
          `${stageData?.atualizados ?? 0} atualizados`,
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('409') || message.includes('already in progress')) {
        toast.warning('Outra sincronização já está em andamento no servidor. Aguarde.')
      } else {
        toast.error(`Erro no sync: ${message}`)
      }
    } finally {
      releaseSyncLock()
      setIsSyncing(false)
      setSyncPhase(null)
      invalidateAll()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40 lg:col-span-2" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Sincronização Omie
          </h2>

          <p className="text-muted-foreground">
            Monitor de integração com o CRM Omie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={syncMode}
            onValueChange={(v) => setSyncMode(v as SyncMode)}
            disabled={isSyncing}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={syncScope}
            onValueChange={(v) => setSyncScope(v as SyncScope)}
            disabled={isSyncing}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SCOPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button
                  className="gap-2 bg-[#00C896] hover:bg-[#00B085] shadow-lg shadow-[#00C896]/20"
                  disabled={!hasConfig || isSyncing}
                  onClick={handleSync}
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                </Button>
              </span>
            </TooltipTrigger>
            {!hasConfig && (
              <TooltipContent>
                <p>Configure as credenciais Omie primeiro</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      {/* Alert if no config */}
      {!hasConfig && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium">Credenciais não configuradas</p>
            <p className="text-xs text-muted-foreground">
              Vá para Configurações para informar app_key e app_secret do Omie.
            </p>
          </div>
        </div>
      )}

      {/* Status card + summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SyncStatusCard
          status={config?.status_sync ?? 'idle'}
          lastSync={config?.ultimo_sync ?? null}
          interval={config?.sync_interval_hours ?? 6}
          phase={syncPhase}
        />
        <div className="lg:col-span-2">
          <SyncSummaryCards logs={logs ?? []} />
        </div>
      </div>

      {/* Logs table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico de Sincronizações</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma sincronização registrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Processados</TableHead>
                    <TableHead className="text-right">Criados</TableHead>
                    <TableHead className="text-right">Atualizados</TableHead>
                    <TableHead className="text-right">Duração</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs tabular-nums">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {log.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.endpoint}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-mono">
                        {log.registros_processados}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-mono">
                        {log.registros_criados}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-mono">
                        {log.registros_atualizados}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-mono">
                        {formatDuration(log.duracao_ms)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
