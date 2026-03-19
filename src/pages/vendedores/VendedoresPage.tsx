import { useState, useMemo, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { Download, Loader2, MoreHorizontal, Pencil, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import { VendedorFormDialog } from './components/VendedorFormDialog'
import {
  useVendedores,
  useVendedorPerformance,
} from '@/hooks/useVendedores'
import { useVendasPorVendedor } from '@/hooks/useDashboard'
import { useTabFromUrl } from '@/hooks/useTabFromUrl'
import { formatCurrency, formatMonthYear } from '@/lib/formatters'
import { MONTHS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Tables } from '@/lib/types/database'

type Vendedor = Tables<'vendedores'>

const now = new Date()
const CURRENT_YEAR = now.getFullYear()
const CURRENT_MONTH = now.getMonth() + 1

const MEDAL_COLORS = ['text-amber-500', 'text-slate-400', 'text-amber-700']

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function VendedoresPage() {
  const [tab, setTab] = useTabFromUrl('tab', 'equipe')
  const { data: vendedores, isLoading } = useVendedores()
  const { data: performance } = useVendedorPerformance(CURRENT_YEAR)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null)
  const [filterStatus, setFilterStatus] = useState<'ativo' | 'inativo' | 'todos'>('ativo')

  // Ranking state
  const [rankAno, setRankAno] = useState(CURRENT_YEAR)
  const [rankMes, setRankMes] = useState(CURRENT_MONTH)
  const { data: rankingData, isLoading: loadingRanking } = useVendasPorVendedor(rankAno, rankMes)

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

  // Ranking computed
  const ranking = useMemo(() => {
    if (!rankingData || !vendedores) return []
    return [...rankingData]
      .sort((a, b) => b.total - a.total)
      .map((v, i) => {
        const vendedor = vendedores.find((vd) => vd.id === v.vendedor_id)
        const metaVal = vendedor?.meta_mensal ?? 0
        const metaPctVal = metaVal > 0 ? (v.total / metaVal) * 100 : 0
        return {
          position: i + 1,
          vendedor_id: v.vendedor_id,
          nome: v.vendedor,
          total: v.total,
          meta: metaPctVal,
          metaValor: metaVal,
          clientes: v.clientes_atendidos,
        }
      })
  }, [rankingData, vendedores])

  const rankingTotal = useMemo(
    () => ranking.reduce((sum, v) => sum + v.total, 0),
    [ranking]
  )

  const [loadingPdf, setLoadingPdf] = useState(false)

  const handleExportPdf = useCallback(async () => {
    if (!selected) return
    setLoadingPdf(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw = doc.internal.pageSize.getWidth()
      const margin = 20
      let y = 20

      // --- Header bar ---
      doc.setFillColor(0, 102, 255)
      doc.roundedRect(margin, y, pw - margin * 2, 28, 3, 3, 'F')

      // Initials circle
      const circleX = margin + 14
      const circleY = y + 14
      doc.setFillColor(255, 255, 255)
      doc.circle(circleX, circleY, 8, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 102, 255)
      doc.text(getInitials(selected.nome), circleX, circleY + 1, { align: 'center', baseline: 'middle' })

      // Name + email
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.text(selected.nome.toUpperCase(), margin + 26, y + 11)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(selected.email ?? '', margin + 26, y + 18)

      y += 36

      // --- Faturamento ---
      doc.setTextColor(120, 120, 120)
      doc.setFontSize(10)
      doc.text('Faturamento Mês', margin, y)
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(formatCurrency(faturamentoMes), pw - margin, y, { align: 'right' })

      y += 10

      // --- Meta bar ---
      if (meta > 0) {
        doc.setTextColor(120, 120, 120)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('Meta', margin, y)

        const metaColor = metaPct >= 100 ? [0, 200, 150] : metaPct >= 75 ? [255, 107, 53] : [220, 38, 38]
        doc.setTextColor(metaColor[0], metaColor[1], metaColor[2])
        doc.setFont('helvetica', 'bold')
        doc.text(`${metaPct.toFixed(0)}%`, pw - margin, y, { align: 'right' })

        y += 4
        const barW = pw - margin * 2
        const barH = 4
        doc.setFillColor(230, 230, 230)
        doc.roundedRect(margin, y, barW, barH, 2, 2, 'F')
        doc.setFillColor(metaColor[0], metaColor[1], metaColor[2])
        doc.roundedRect(margin, y, barW * Math.min(metaPct, 100) / 100, barH, 2, 2, 'F')

        y += 12
      } else {
        y += 4
      }

      // --- KPI boxes ---
      const boxW = (pw - margin * 2 - 8) / 2
      const boxH = 22

      // Clientes Ativos
      doc.setFillColor(245, 247, 250)
      doc.roundedRect(margin, y, boxW, boxH, 3, 3, 'F')
      doc.setTextColor(120, 120, 120)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Clientes Ativos', margin + 5, y + 8)
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(String(totalClientes), margin + 5, y + 17)

      // Ticket Médio
      const box2X = margin + boxW + 8
      doc.setFillColor(245, 247, 250)
      doc.roundedRect(box2X, y, boxW, boxH, 3, 3, 'F')
      doc.setTextColor(120, 120, 120)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Ticket Médio', box2X + 5, y + 8)
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(ticketMedio > 0 ? formatCurrency(ticketMedio) : '—', box2X + 5, y + 17)

      y += boxH + 12

      // --- Last 6 months chart ---
      if (miniChartData.length > 0) {
        doc.setTextColor(30, 30, 30)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Últimos 6 meses', margin, y)
        y += 6

        const chartW = pw - margin * 2
        const chartH = 50
        const maxVal = Math.max(...miniChartData.map((d) => d.total), 1)
        const barGap = 8
        const colW = (chartW - barGap * (miniChartData.length - 1)) / miniChartData.length

        for (let i = 0; i < miniChartData.length; i++) {
          const d = miniChartData[i]
          const barHeight = (d.total / maxVal) * (chartH - 12)
          const x = margin + i * (colW + barGap)
          const barY = y + chartH - 12 - barHeight

          doc.setFillColor(0, 102, 255)
          doc.roundedRect(x, barY, colW, barHeight, 2, 2, 'F')

          // Value on top
          doc.setTextColor(30, 30, 30)
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          const valStr = d.total >= 1000
            ? `R$ ${(d.total / 1000).toFixed(1).replace('.', ',')}k`
            : formatCurrency(d.total)
          doc.text(valStr, x + colW / 2, barY - 2, { align: 'center' })

          // Label below
          doc.setTextColor(120, 120, 120)
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.text(d.name, x + colW / 2, y + chartH - 2, { align: 'center' })
        }

        y += chartH + 8
      }

      // --- Footer ---
      doc.setDrawColor(220, 220, 220)
      doc.line(margin, y, pw - margin, y)
      y += 5
      doc.setTextColor(160, 160, 160)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — FRV Omie`,
        margin,
        y,
      )

      doc.save(`vendedor-${selected.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`)
      toast.success('PDF exportado')
    } catch (err) {
      console.error('PDF export error:', err)
      toast.error('Erro ao gerar PDF')
    } finally {
      setLoadingPdf(false)
    }
  }, [selected, faturamentoMes, meta, metaPct, totalClientes, ticketMedio, miniChartData])

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
            {tab === 'equipe'
              ? `${filteredVendedores.length} vendedores cadastrados`
              : `Ranking de ${MONTHS[rankMes - 1]} / ${rankAno}`}
          </p>
        </div>
      </div>

      {/* Tabs: Equipe / Ranking */}
      <div className="flex flex-wrap gap-1 bg-slate-100/80 p-1 border border-slate-200/50 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab('equipe')}
          className={cn(
            "px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/50 min-h-[44px]",
            tab === 'equipe' ? "bg-white text-[#0066FF] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          Equipe
        </button>
        <button
          type="button"
          onClick={() => setTab('ranking')}
          className={cn(
            "px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/50 min-h-[44px] flex items-center gap-1.5",
            tab === 'ranking' ? "bg-white text-[#0066FF] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          <Trophy className="h-3.5 w-3.5" />
          Ranking
        </button>
      </div>

      {/* ===================== TAB: EQUIPE ===================== */}
      {tab === 'equipe' && (
        <>
          {/* Status filter */}
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0066FF] text-white font-bold text-xs">
                          {getInitials(selected.nome)}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base font-bold tracking-tight truncate">{selected.nome}</CardTitle>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {selected.email ?? ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shrink-0 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950/50 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors"
                        onClick={handleExportPdf}
                        disabled={loadingPdf}
                      >
                        {loadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        PDF
                      </Button>
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
        </>
      )}

      {/* ===================== TAB: RANKING ===================== */}
      {tab === 'ranking' && (
        <>
          {/* Period selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(rankMes)} onValueChange={(v) => setRankMes(Number(v))}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(rankAno)} onValueChange={(v) => setRankAno(Number(v))}>
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[CURRENT_YEAR - 1, CURRENT_YEAR].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Faturado</p>
                <p className="text-2xl font-bold tabular-nums font-mono mt-1">
                  {loadingRanking ? '—' : formatCurrency(rankingTotal)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Vendedores Ativos</p>
                <p className="text-2xl font-bold tabular-nums mt-1">
                  {loadingRanking ? '—' : ranking.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Média por Vendedor</p>
                <p className="text-2xl font-bold tabular-nums font-mono mt-1">
                  {loadingRanking || ranking.length === 0
                    ? '—'
                    : formatCurrency(rankingTotal / ranking.length)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ranking list */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground/80">
                Ranking — {MONTHS[rankMes - 1]} / {rankAno}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRanking ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : ranking.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
                  Sem dados de vendas para {MONTHS[rankMes - 1]} / {rankAno}
                </div>
              ) : (
                <div className="space-y-3">
                  {ranking.map((v) => {
                    const pctOfTotal = rankingTotal > 0 ? (v.total / rankingTotal) * 100 : 0
                    return (
                      <div
                        key={v.vendedor_id}
                        className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                      >
                        {/* Position */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                          {v.position <= 3 ? (
                            <Trophy className={cn('h-6 w-6', MEDAL_COLORS[v.position - 1])} />
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground tabular-nums">
                              {v.position}
                            </span>
                          )}
                        </div>

                        {/* Avatar + name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0066FF] text-white text-xs font-bold">
                            {getInitials(v.nome)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate">{v.nome}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{v.clientes} clientes</span>
                              {v.metaValor > 0 && (
                                <span className={cn(
                                  'font-medium',
                                  v.meta >= 100 ? 'text-[#00C896]' : v.meta >= 75 ? 'text-amber-500' : 'text-destructive'
                                )}>
                                  {v.meta.toFixed(0)}% da meta
                                </span>
                              )}
                            </div>
                            {/* Progress bar — share of total */}
                            <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(pctOfTotal, 100)}%`,
                                  backgroundColor:
                                    v.position === 1
                                      ? '#0066FF'
                                      : v.position === 2
                                        ? '#3D8BFF'
                                        : v.position === 3
                                          ? '#6BA8FF'
                                          : '#94bdff',
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold tabular-nums font-mono">
                            {formatCurrency(v.total)}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {pctOfTotal.toFixed(1)}% do total
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Form Dialog */}
      <VendedorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vendedor={editingVendedor}
      />
    </div>
  )
}
