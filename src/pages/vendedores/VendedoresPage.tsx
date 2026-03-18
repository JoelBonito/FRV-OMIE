import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { MoreHorizontal, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { VendedorFormDialog } from './components/VendedorFormDialog'
import {
  useVendedores,
  useVendedorPerformance,
} from '@/hooks/useVendedores'
import { formatCurrency, formatMonthYear } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { Tables } from '@/lib/types/database'

type Vendedor = Tables<'vendedores'>

const now = new Date()
const CURRENT_YEAR = now.getFullYear()
const CURRENT_MONTH = now.getMonth() + 1

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function VendedoresPage() {
  const { data: vendedores, isLoading } = useVendedores()
  const { data: performance } = useVendedorPerformance(CURRENT_YEAR)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null)
  const [filterStatus, setFilterStatus] = useState<'ativo' | 'inativo' | 'todos'>('ativo')

  const filteredVendedores = useMemo(() => {
    if (!vendedores) return []
    return vendedores.filter(v => {
      if (filterStatus === 'todos') return true
      return v.status === filterStatus
    })
  }, [vendedores, filterStatus])

  // Auto-select first vendedor
  const selected = useMemo(() => {
    if (!filteredVendedores.length) return null
    const id = selectedId ?? filteredVendedores[0].id
    const active = filteredVendedores.find((v) => v.id === id)
    if (active) return active
    return filteredVendedores[0]
  }, [filteredVendedores, selectedId])

  // Current month stats for selected vendedor
  const currentMonthStats = useMemo(() => {
    if (!selected || !performance) return null
    return performance.find(
      (p) => p.vendedor_id === selected.id && p.mes === CURRENT_MONTH
    )
  }, [selected, performance])

  // Last 6 months for mini bar chart
  const miniChartData = useMemo(() => {
    if (!selected || !performance) return []
    return performance
      .filter((p) => p.vendedor_id === selected.id)
      .sort((a, b) => a.ano * 100 + a.mes - (b.ano * 100 + b.mes))
      .slice(-6)
      .map((p) => ({
        name: formatMonthYear(p.mes, p.ano),
        total: p.total,
      }))
  }, [selected, performance])

  // Total clients for selected vendedor (from performance data)
  const totalClientes = useMemo(() => {
    if (!currentMonthStats) return 0
    return currentMonthStats.clientes_atendidos
  }, [currentMonthStats])

  const faturamentoMes = currentMonthStats?.total ?? 0
  const meta = selected?.meta_mensal ?? 0
  const metaPct = meta > 0 ? (faturamentoMes / meta) * 100 : 0
  const ticketMedio = totalClientes > 0 ? faturamentoMes / totalClientes : 0



  function handleEdit(vendedor: Vendedor) {
    setEditingVendedor(vendedor)
    setDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Vendedores</h2>
          <p className="text-muted-foreground">
            {filteredVendedores.length} vendedores cadastrados
          </p>
        </div>

      </div>

      <div className="flex flex-wrap gap-1 bg-slate-100/80 p-1 border border-slate-200/50 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setFilterStatus('todos')}
          className={cn(
            "px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/50 min-h-[44px]",
            filterStatus === 'todos' ? "bg-white text-[#0066FF] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('ativo')}
          className={cn(
            "px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/50 min-h-[44px]",
            filterStatus === 'ativo' ? "bg-white text-[#0066FF] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          Ativos
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('inativo')}
          className={cn(
            "px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/50 min-h-[44px]",
            filterStatus === 'inativo' ? "bg-white text-[#0066FF] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          Inativos
        </button>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* LEFT — Cards grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredVendedores.map((v) => (
              <Card
                key={v.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${selected?.id === v.id
                  ? 'ring-2 ring-[#0066FF] shadow-md'
                  : ''
                  }`}
                onClick={() => setSelectedId(v.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0066FF] text-white text-xs font-bold">
                        {getInitials(v.nome)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate tracking-tight">{v.nome}</p>
                        <p className="text-[11px] text-muted-foreground truncate opacity-70">
                          {v.email ?? '—'}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(v)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        v.status === 'ativo'
                          ? 'bg-[#00C896]/10 text-[#00C896] border-[#00C896]/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }
                    >
                      {v.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p>
                      Meta mensal:{' '}
                      <span className="text-foreground font-medium tabular-nums font-mono">
                        {v.meta_mensal
                          ? formatCurrency(v.meta_mensal)
                          : '—'}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* RIGHT — Stats panel */}
        <div className="lg:col-span-2 order-first lg:order-last">
          {selected ? (
            <Card className="sticky top-6">
              <CardHeader className="pb-3 px-5 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0066FF] text-white font-bold text-xs">
                    {getInitials(selected.nome)}
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold tracking-tight">{selected.nome}</CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      {selected.email ?? ''}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Performance metrics */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Faturamento Mês
                    </span>
                    <span className="text-lg font-bold tabular-nums font-mono">
                      {formatCurrency(faturamentoMes)}
                    </span>
                  </div>

                  {meta > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Meta</span>
                        <span
                          className={`font-medium tabular-nums ${metaPct >= 100
                            ? 'text-success'
                            : metaPct >= 75
                              ? 'text-warning-foreground'
                              : 'text-destructive'
                            }`}
                        >
                          {metaPct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(metaPct, 100)}%`,
                            backgroundColor:
                              metaPct >= 100
                                ? '#00C896'
                                : metaPct >= 75
                                  ? '#FF6B35'
                                  : '#dc2626',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Clientes Ativos
                      </p>
                      <p className="text-xl font-bold tabular-nums mt-1">
                        {totalClientes}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Ticket Médio
                      </p>
                      <p className="text-xl font-bold tabular-nums mt-1 font-mono">
                        {ticketMedio > 0 ? formatCurrency(ticketMedio) : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mini bar chart */}
                {miniChartData.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Últimos 6 meses</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={miniChartData}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis hide />
                        <RechartsTooltip
                          formatter={(value: number | undefined) =>
                            value !== undefined ? formatCurrency(value) : ''
                          }
                          contentStyle={{
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="total"
                          fill="#0066FF"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground text-center">
                  Selecione um vendedor para ver os detalhes.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <VendedorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vendedor={editingVendedor}
      />
    </div>
  )
}
