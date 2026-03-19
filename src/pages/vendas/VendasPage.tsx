import { useState, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  List,
  BarChart3,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// Sheet removed — advanced filters moved inline
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableCell, TableRow } from '@/components/ui/table'
import { DataTable, SortableHeader } from '@/components/tables/DataTable'
import { ExportButtons, type ExportColumn } from '@/components/ExportButtons'
import { VendaFormDialog } from './components/VendaFormDialog'
import { ResumoGlobalTable } from './components/ResumoGlobalTable'
import { VendedoresPivotTable } from './components/VendedoresPivotTable'
import {
  useVendas,
  useDeleteVenda,
  useVendedoresForSelect,
} from '@/hooks/useVendas'
import { formatCurrency, formatMonthYear } from '@/lib/formatters'
import { CLIENT_TYPES, SALE_STATUSES, MONTHS } from '@/lib/constants'
import { TYPE_LABEL, TYPE_BADGE_COLORS, STATUS_BADGE } from '@/lib/theme-constants'
import { useFilterParams } from '@/hooks/useFilterParams'
import type { VendaWithRelations } from '@/services/api/vendas'

const now = new Date()
const CURRENT_YEAR = now.getFullYear()

type ViewMode = 'registros' | 'resumo' | 'vendedores'



export function VendasPage() {
  const urlParams = useFilterParams()
  const [viewMode, setViewMode] = useState<ViewMode>('registros')
  const [filterAno, setFilterAno] = useState(urlParams.ano ?? CURRENT_YEAR)
  const [filterMes, setFilterMes] = useState<number | undefined>(urlParams.mes)
  const [filterVendedor, setFilterVendedor] = useState<string | undefined>(
    urlParams.vendedor
  )
  const [filterTipo, setFilterTipo] = useState<string | undefined>(urlParams.tipo)
  const [filterStatus, setFilterStatus] = useState<string | undefined>(
    urlParams.status
  )
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVenda, setEditingVenda] = useState<VendaWithRelations | null>(
    null
  )

  const { data: vendas, isLoading } = useVendas({
    ano: filterAno,
    mes: filterMes,
    vendedor_id: filterVendedor,
    tipo_cliente: filterTipo,
    status: filterStatus,
  })
  const { data: vendedores } = useVendedoresForSelect()
  const deleteMutation = useDeleteVenda()

  const filtered = useMemo(() => {
    if (!vendas) return []
    if (!search) return vendas
    const q = search.toLowerCase()
    return vendas.filter(
      (v) =>
        v.clientes?.nome?.toLowerCase().includes(q) ||
        v.vendedores?.nome?.toLowerCase().includes(q) ||
        v.nota_fiscal?.toLowerCase().includes(q)
    )
  }, [vendas, search])

  const totalValor = useMemo(
    () => filtered.reduce((sum, v) => sum + v.valor, 0),
    [filtered]
  )

  const vendasPendentes = useMemo(() => {
    if (!vendas) return []
    return vendas.filter((v) => v.status === 'pendente')
  }, [vendas])



  function handleEdit(venda: VendaWithRelations) {
    setEditingVenda(venda)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir esta venda?')) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Venda excluída'),
      onError: () => toast.error('Erro ao excluir'),
    })
  }

  const columns: ColumnDef<VendaWithRelations>[] = [
    {
      id: 'periodo',
      header: ({ column }) => (
        <SortableHeader column={column}>Data</SortableHeader>
      ),
      accessorFn: (row) => row.ano * 100 + row.mes,
      cell: ({ row }) => (
        <span className="tabular-nums font-mono">
          {formatMonthYear(row.original.mes, row.original.ano)}
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
        <span className="font-medium">
          {row.original.clientes?.nome ?? '—'}
        </span>
      ),
    },
    {
      id: 'vendedor',
      header: 'Vendedor',
      meta: { className: 'hidden md:table-cell' },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.vendedores?.nome ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'tipo_cliente',
      header: 'Tipo',
      meta: { className: 'hidden md:table-cell' },
      cell: ({ row }) => {
        const tipo = row.getValue('tipo_cliente') as string
        const color = TYPE_BADGE_COLORS[tipo]
        const badgeClass = color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
          color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' :
            color === 'teal' ? 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400' :
              'bg-muted text-muted-foreground'
        return (
          <Badge variant="outline" className={badgeClass}>
            {TYPE_LABEL[tipo] ?? tipo}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => (
        <SortableHeader column={column}>
          <span className="w-full text-right">Valor</span>
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-bold tabular-nums text-right block font-mono">
          {formatCurrency(row.getValue('valor') as number)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variant = STATUS_BADGE[status] as any
        const labels: Record<string, string> = { faturado: 'Faturado', pendente: 'Pendente', cancelado: 'Cancelado' }
        return (
          <Badge variant={variant || 'outline'}>
            {labels[status] || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'nota_fiscal',
      header: 'NF',
      meta: { className: 'hidden md:table-cell' },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue('nota_fiscal') || '—'}
        </span>
      ),
    },
    {
      id: 'acoes',
      header: '',
      cell: ({ row }) => {
        const v = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(v)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(v.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const footerContent = filtered.length > 0 ? (
    <TableRow className="bg-muted/50">
      <TableCell colSpan={4} className="font-semibold uppercase text-xs text-muted-foreground tracking-wider">
        Total ({filtered.length} registros)
      </TableCell>
      <TableCell className="text-right font-bold tabular-nums font-mono text-lg">
        {formatCurrency(totalValor)}
      </TableCell>
      <TableCell colSpan={3} />
    </TableRow>
  ) : null

  if (isLoading && viewMode === 'registros') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-40" />
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
          <h2 className="text-2xl font-extrabold tracking-tight">Vendas</h2>
          <p className="text-muted-foreground">
            {viewMode === 'registros'
              ? `${vendas?.length ?? 0} registros no período`
              : `Visão consolidada — ${filterAno}`}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            data={filtered.map((v) => ({
              periodo: formatMonthYear(v.mes, v.ano),
              cliente: v.clientes?.nome ?? '—',
              vendedor: v.vendedores?.nome ?? '—',
              tipo: v.tipo_cliente,
              valor: v.valor,
              status: v.status,
              nota_fiscal: v.nota_fiscal ?? '',
            }))}
            columns={[
              { key: 'periodo', header: 'Período' },
              { key: 'cliente', header: 'Cliente' },
              { key: 'vendedor', header: 'Vendedor' },
              { key: 'tipo', header: 'Tipo' },
              { key: 'valor', header: 'Valor', format: (v) => formatCurrency(v as number) },
              { key: 'status', header: 'Status' },
              { key: 'nota_fiscal', header: 'NF' },
            ] satisfies ExportColumn[]}
            title="Relatório de Vendas"
            fileName="vendas"
          />

        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList className="bg-slate-100/80 p-1 border border-slate-200/50 h-auto">
          <TabsTrigger value="registros" className="gap-2 h-9 px-4 data-[state=active]:bg-white data-[state=active]:text-[#0066FF] data-[state=active]:shadow-sm rounded-md transition-all">
            <List className="h-4 w-4" />
            Registros
          </TabsTrigger>
          <TabsTrigger value="resumo" className="gap-2 h-9 px-4 data-[state=active]:bg-white data-[state=active]:text-[#0066FF] data-[state=active]:shadow-sm rounded-md transition-all">
            <BarChart3 className="h-4 w-4" />
            Resumo Global
          </TabsTrigger>
          <TabsTrigger value="vendedores" className="gap-2 h-9 px-4 data-[state=active]:bg-white data-[state=active]:text-[#0066FF] data-[state=active]:shadow-sm rounded-md transition-all">
            <Users className="h-4 w-4" />
            Por Vendedor
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Registros ── */}
        <TabsContent value="registros" className="space-y-6 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1 min-w-[180px] flex-1 max-w-[320px]">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Search className="h-3 w-3 text-[#0066FF]" />
                Buscar Venda
              </label>
              <Input
                placeholder="Cliente, vendedor, NF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-xs border-slate-200 focus-visible:ring-[#0066FF]/20 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Mês</label>
              <Select
                value={String(filterMes ?? 'todos')}
                onValueChange={(v) =>
                  setFilterMes(v === 'todos' ? undefined : Number(v))
                }
              >
                <SelectTrigger className="h-9 w-[110px] text-xs border-slate-200 shadow-sm focus:ring-[#0066FF]/20">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="font-bold">Todos</SelectItem>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Ano</label>
              <Select
                value={String(filterAno)}
                onValueChange={(v) => setFilterAno(Number(v))}
              >
                <SelectTrigger className="h-9 w-[90px] text-xs border-slate-200 shadow-sm focus:ring-[#0066FF]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Vendedor</label>
              <Select
                value={filterVendedor ?? 'todos'}
                onValueChange={(v) =>
                  setFilterVendedor(v === 'todos' ? undefined : v)
                }
              >
                <SelectTrigger className="h-9 w-[130px] text-xs border-slate-200 shadow-sm focus:ring-[#0066FF]/20">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="font-bold">Todos</SelectItem>
                  {vendedores?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tipo</label>
              <Select
                value={filterTipo ?? 'todos'}
                onValueChange={(v) =>
                  setFilterTipo(v === 'todos' ? undefined : v)
                }
              >
                <SelectTrigger className="h-9 w-[130px] text-xs border-slate-200 shadow-sm focus:ring-[#0066FF]/20">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="font-bold">Todos</SelectItem>
                  {CLIENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Status</label>
              <Select
                value={filterStatus ?? 'todos'}
                onValueChange={(v) =>
                  setFilterStatus(v === 'todos' ? undefined : v)
                }
              >
                <SelectTrigger className="h-9 w-[120px] text-xs border-slate-200 shadow-sm focus:ring-[#0066FF]/20">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="font-bold">Todos</SelectItem>
                  {SALE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Table */}
          <DataTable
            columns={columns}
            data={filtered}
            defaultPageSize={25}
            footerContent={footerContent}
          />

          {/* Alert: Vendas pendentes */}
          {vendasPendentes.length > 0 && (
            <div className="rounded-lg border-l-4 border-l-orange-500 border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">
                    {vendasPendentes.length} venda
                    {vendasPendentes.length !== 1 && 's'} pendente
                    {vendasPendentes.length !== 1 && 's'}
                  </p>
                  <p className="text-xs text-orange-700 mt-0.5">
                    Vendas com status pendente aguardando faturamento
                  </p>
                  <div className="mt-3 space-y-1">
                    {vendasPendentes.slice(0, 3).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-orange-800">
                          {formatMonthYear(v.mes, v.ano)} —{' '}
                          {v.clientes?.nome ?? 'Sem cliente'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold tabular-nums text-orange-900 font-mono">
                            {formatCurrency(v.valor)}
                          </span>
                          <button
                            className="text-primary hover:underline font-medium"
                            onClick={() => handleEdit(v)}
                          >
                            Classificar
                          </button>
                        </div>
                      </div>
                    ))}
                    {vendasPendentes.length > 3 && (
                      <p className="text-xs text-orange-600 pt-1">
                        + {vendasPendentes.length - 3} mais
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Resumo Global ── */}
        <TabsContent value="resumo" className="space-y-4 mt-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Mês
              </label>
              <Select
                value={String(filterMes ?? 'todos')}
                onValueChange={(v) =>
                  setFilterMes(v === 'todos' ? undefined : Number(v))
                }
              >
                <SelectTrigger className="h-9 w-[120px] text-xs">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="font-bold">Todos</SelectItem>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Ano
              </label>
              <Select
                value={String(filterAno)}
                onValueChange={(v) => setFilterAno(Number(v))}
              >
                <SelectTrigger className="h-9 w-[100px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground pb-2">
              Vendas totais por tipo de cliente{filterMes ? ` — ${MONTHS[filterMes - 1]}` : ', mês a mês'}
            </p>
          </div>
          <ResumoGlobalTable ano={filterAno} mes={filterMes} />
        </TabsContent>

        {/* ── Tab: Por Vendedor ── */}
        <TabsContent value="vendedores" className="space-y-4 mt-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Ano
              </label>
              <Select
                value={String(filterAno)}
                onValueChange={(v) => setFilterAno(Number(v))}
              >
                <SelectTrigger className="h-9 w-[100px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground pb-2">
              Faturamento por vendedor, mês a mês
            </p>
          </div>
          <VendedoresPivotTable ano={filterAno} />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <VendaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        venda={editingVenda}
      />
    </div>
  )
}
