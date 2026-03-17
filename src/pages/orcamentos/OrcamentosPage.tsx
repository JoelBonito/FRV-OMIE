import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  FileText,
  Search,
  Package,
  Truck,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, SortableHeader } from '@/components/tables/DataTable'
import { ExportButtons, type ExportColumn } from '@/components/ExportButtons'
import { usePedidos, usePedidoItens, usePedidoStats } from '@/hooks/usePedidos'
import { useVendedoresForSelect } from '@/hooks/useVendas'
import { formatCurrency } from '@/lib/formatters'
import type { PedidoWithRelations } from '@/services/api/pedidos'

const ETAPA_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  'ORCAMENTO': { label: 'Orçamento', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', icon: ClipboardList },
  'SEPARAR': { label: 'Separar Estoque', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400', icon: Package },
  'EM ROTA': { label: 'Em Rota', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400', icon: Truck },
  'ENTREGUE': { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
}

const ETAPA_CARD_COLORS: Record<string, string> = {
  'ORCAMENTO': 'border-l-[#0066FF]',
  'SEPARAR': 'border-l-amber-500',
  'EM ROTA': 'border-l-purple-500',
  'ENTREGUE': 'border-l-[#00C896]',
}

function getEtapaConfig(etapa: string | null) {
  if (!etapa) return { label: 'Sem Etapa', color: 'bg-muted text-muted-foreground', icon: FileText }
  const upper = etapa.toUpperCase()
  for (const [key, cfg] of Object.entries(ETAPA_CONFIG)) {
    if (upper.includes(key)) return cfg
  }
  return { label: etapa, color: 'bg-muted text-muted-foreground', icon: FileText }
}

function getEtapaCardColor(etapa: string) {
  const upper = etapa.toUpperCase()
  for (const [key, color] of Object.entries(ETAPA_CARD_COLORS)) {
    if (upper.includes(key)) return color
  }
  return 'border-l-muted'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function OrcamentosPage() {
  const [searchParams] = useSearchParams()
  const [filterEtapa, setFilterEtapa] = useState<string | undefined>(undefined)
  const [filterVendedor, setFilterVendedor] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [selectedPedido, setSelectedPedido] = useState<PedidoWithRelations | null>(null)

  const { data: pedidos, isLoading } = usePedidos({
    etapa: filterEtapa,
    vendedor_id: filterVendedor,
  })
  const { data: stats } = usePedidoStats()
  const { data: vendedores } = useVendedoresForSelect()
  const { data: itens, isLoading: itensLoading } = usePedidoItens(selectedPedido?.id ?? null)

  // Etapas distintas para o filtro
  const etapasDisponiveis = useMemo(() => {
    if (!stats) return []
    return stats.map((s) => s.etapa).sort()
  }, [stats])

  const filtered = useMemo(() => {
    if (!pedidos) return []
    if (!search) return pedidos
    const q = search.toLowerCase()
    return pedidos.filter(
      (p) =>
        p.clientes?.nome?.toLowerCase().includes(q) ||
        p.vendedores?.nome?.toLowerCase().includes(q) ||
        p.numero_pedido?.toLowerCase().includes(q) ||
        p.etapa?.toLowerCase().includes(q)
    )
  }, [pedidos, search])

  const totalValor = useMemo(
    () => filtered.reduce((sum, p) => sum + p.valor_total, 0),
    [filtered]
  )

  // KPIs
  const kpis = useMemo(() => {
    if (!stats) return { total: 0, valorTotal: 0, mediaValor: 0, etapas: 0 }
    const total = stats.reduce((s, e) => s + e.count, 0)
    const valorTotal = stats.reduce((s, e) => s + e.valor_total, 0)
    return {
      total,
      valorTotal,
      mediaValor: total > 0 ? valorTotal / total : 0,
      etapas: stats.length,
    }
  }, [stats])

  // Preset filters
  function setPreset(preset: 'todos' | 'orcamentos' | 'execucao') {
    if (preset === 'todos') {
      setFilterEtapa(undefined)
    } else if (preset === 'orcamentos') {
      // Find the etapa that contains 'ORCAMENTO'
      const etapa = etapasDisponiveis.find((e) => e.toUpperCase().includes('ORCAMENTO'))
      setFilterEtapa(etapa || 'ORCAMENTO')
    } else {
      // "Em Execução" = everything except ORCAMENTO (clear filter, handle in memo)
      setFilterEtapa('__EXECUCAO__')
    }
  }

  // Deep link: read ?preset= from URL on mount
  useEffect(() => {
    const preset = searchParams.get('preset')
    if (preset === 'todos' || preset === 'orcamentos' || preset === 'execucao') {
      setPreset(preset)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayData = useMemo(() => {
    if (filterEtapa === '__EXECUCAO__') {
      return filtered.filter((p) => !p.etapa?.toUpperCase().includes('ORCAMENTO'))
    }
    return filtered
  }, [filtered, filterEtapa])

  const columns: ColumnDef<PedidoWithRelations>[] = [
    {
      accessorKey: 'numero_pedido',
      header: ({ column }) => (
        <SortableHeader column={column}>Pedido</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">
          #{row.getValue('numero_pedido') || '—'}
        </span>
      ),
    },
    {
      id: 'cliente',
      header: ({ column }) => (
        <SortableHeader column={column}>Cliente</SortableHeader>
      ),
      accessorFn: (row) => row.clientes?.nome ?? '',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.clientes?.nome ?? '—'}</span>
      ),
    },
    {
      id: 'vendedor',
      header: 'Vendedor',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.vendedores?.nome ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'valor_total',
      header: ({ column }) => (
        <SortableHeader column={column}>
          <span className="w-full text-right">Valor</span>
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-bold tabular-nums text-right block font-mono">
          {formatCurrency(row.getValue('valor_total') as number)}
        </span>
      ),
    },
    {
      accessorKey: 'etapa',
      header: 'Etapa',
      cell: ({ row }) => {
        const etapa = row.getValue('etapa') as string | null
        const cfg = getEtapaConfig(etapa)
        return (
          <Badge variant="outline" className={cfg.color}>
            {cfg.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'data_pedido',
      header: ({ column }) => (
        <SortableHeader column={column}>Data</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatDate(row.getValue('data_pedido') as string | null)}
        </span>
      ),
    },
    {
      accessorKey: 'previsao_faturamento',
      header: 'Previsão',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatDate(row.getValue('previsao_faturamento') as string | null)}
        </span>
      ),
    },
  ]

  const footerContent = displayData.length > 0 ? (
    <TableRow className="bg-muted/50">
      <TableCell colSpan={3} className="font-semibold uppercase text-xs text-muted-foreground tracking-wider">
        Total ({displayData.length} pedidos)
      </TableCell>
      <TableCell className="text-right font-bold tabular-nums font-mono text-lg">
        {formatCurrency(filterEtapa === '__EXECUCAO__'
          ? displayData.reduce((s, p) => s + p.valor_total, 0)
          : totalValor
        )}
      </TableCell>
      <TableCell colSpan={3} />
    </TableRow>
  ) : null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Pedidos & Orçamentos</h2>
          <p className="text-muted-foreground">
            Pipeline de pedidos — {pedidos?.length ?? 0} registros
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButtons
            data={displayData.map((p) => ({
              numero: p.numero_pedido ?? '',
              cliente: p.clientes?.nome ?? '—',
              vendedor: p.vendedores?.nome ?? '—',
              valor: p.valor_total,
              etapa: getEtapaConfig(p.etapa).label,
              data: formatDate(p.data_pedido),
              previsao: formatDate(p.previsao_faturamento),
            }))}
            columns={[
              { key: 'numero', header: 'Pedido' },
              { key: 'cliente', header: 'Cliente' },
              { key: 'vendedor', header: 'Vendedor' },
              { key: 'valor', header: 'Valor', format: (v) => formatCurrency(v as number) },
              { key: 'etapa', header: 'Etapa' },
              { key: 'data', header: 'Data' },
              { key: 'previsao', header: 'Previsão' },
            ] satisfies ExportColumn[]}
            title="Relatório de Pedidos & Orçamentos"
            fileName="pedidos"
          />
          <Button
            variant={!filterEtapa ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreset('todos')}
            className={!filterEtapa ? 'bg-[#0066FF] hover:bg-[#0052CC]' : ''}
          >
            Todos
          </Button>
          <Button
            variant={filterEtapa && filterEtapa !== '__EXECUCAO__' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreset('orcamentos')}
            className={filterEtapa && filterEtapa !== '__EXECUCAO__' ? 'bg-[#0066FF] hover:bg-[#0052CC]' : ''}
          >
            Orçamentos Abertos
          </Button>
          <Button
            variant={filterEtapa === '__EXECUCAO__' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreset('execucao')}
            className={filterEtapa === '__EXECUCAO__' ? 'bg-[#0066FF] hover:bg-[#0052CC]' : ''}
          >
            Em Execução
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Pedidos</p>
            <p className="text-2xl font-bold tabular-nums mt-1 font-mono">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Valor Pipeline</p>
            <p className="text-2xl font-bold tabular-nums mt-1 text-[#0066FF] font-mono">
              {formatCurrency(kpis.valorTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Média por Pedido</p>
            <p className="text-2xl font-bold tabular-nums mt-1 font-mono">
              {formatCurrency(kpis.mediaValor)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Etapas Distintas</p>
            <p className="text-2xl font-bold tabular-nums mt-1 font-mono">{kpis.etapas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Etapa Summary Cards */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats
            .sort((a, b) => b.valor_total - a.valor_total)
            .slice(0, 4)
            .map((s) => {
              const cfg = getEtapaConfig(s.etapa)
              const Icon = cfg.icon
              const cardColor = getEtapaCardColor(s.etapa)
              return (
                <Card
                  key={s.etapa}
                  className={`border-l-4 ${cardColor} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => {
                    setFilterEtapa(s.etapa)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground truncate">
                        {cfg.label}
                      </p>
                    </div>
                    <p className="text-xl font-bold tabular-nums font-mono">{s.count}</p>
                    <p className="text-xs text-muted-foreground tabular-nums font-mono mt-0.5">
                      {formatCurrency(s.valor_total)}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Etapa</label>
          <Select
            value={filterEtapa ?? 'todos'}
            onValueChange={(v) => setFilterEtapa(v === 'todos' ? undefined : v)}
          >
            <SelectTrigger className="h-9 w-[180px] text-xs">
              <SelectValue placeholder="Todas as etapas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as etapas</SelectItem>
              {etapasDisponiveis.map((e) => (
                <SelectItem key={e} value={e}>
                  {getEtapaConfig(e).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Vendedor</label>
          <Select
            value={filterVendedor ?? 'todos'}
            onValueChange={(v) => setFilterVendedor(v === 'todos' ? undefined : v)}
          >
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {vendedores?.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground">Busca</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar pedido, cliente, vendedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={displayData}
        defaultPageSize={25}
        footerContent={footerContent}
        onRowClick={(row) => setSelectedPedido(row)}
      />

      {/* Detail Sheet */}
      <Sheet open={!!selectedPedido} onOpenChange={(open) => !open && setSelectedPedido(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pedido #{selectedPedido?.numero_pedido || '—'}
            </SheetTitle>
          </SheetHeader>

          {selectedPedido && (
            <div className="mt-6 space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedPedido.clientes?.nome ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vendedor</p>
                  <p className="font-medium">{selectedPedido.vendedores?.nome ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-lg font-mono">
                    {formatCurrency(selectedPedido.valor_total)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Etapa</p>
                  <Badge variant="outline" className={getEtapaConfig(selectedPedido.etapa).color}>
                    {getEtapaConfig(selectedPedido.etapa).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Pedido</p>
                  <p className="text-sm tabular-nums">{formatDate(selectedPedido.data_pedido)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Previsão</p>
                  <p className="text-sm tabular-nums">{formatDate(selectedPedido.previsao_faturamento)}</p>
                </div>
              </div>

              {selectedPedido.observacao && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observação</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedPedido.observacao}</p>
                </div>
              )}

              {/* Items Table */}
              <div>
                <p className="text-sm font-semibold mb-3">Itens do Pedido</p>
                {itensLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : itens && itens.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itens.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm max-w-[200px] truncate">
                              {item.descricao || '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-mono text-sm">
                              {item.quantidade} {item.unidade || ''}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-mono text-sm">
                              {formatCurrency(item.valor_unitario)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-mono text-sm font-medium">
                              {formatCurrency(item.valor_total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
