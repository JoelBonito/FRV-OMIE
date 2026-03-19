import { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import {
  DollarSign,
  Building2,
  Users,
  ShoppingCart,
  AlertTriangle,
  Filter,
  Info,
  UserMinus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiCard } from './components/KpiCard'
import {
  useResumoGlobalAll,
  useVendasPorVendedor,
  useClientesInativos,
  useClientesAtivosCount,
  useVendasMesCount,
  useVendedores,
} from '@/hooks/useDashboard'
import { Link, useNavigate } from 'react-router-dom'
import { formatCurrency, formatMonthYear } from '@/lib/formatters'
import { MONTHS, ROUTES } from '@/lib/constants'
import { useTopQuedas, useClientesChurn } from '@/hooks/useComparacao'
import { CHART_COLORS, TYPE_COLORS, TYPE_LABELS_PLURAL as TYPE_LABELS } from '@/lib/theme-constants'



const now = new Date()
const CURRENT_YEAR = now.getFullYear()
const CURRENT_MONTH = now.getMonth() + 1

function currencyTick(value: number) {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`
  return `R$${value}`
}

function CurrencyTooltipFormatter(value: number | undefined) {
  if (value === undefined) return ''
  return formatCurrency(value)
}

// Map donut/bar label → tipo_cliente query param
const TYPE_NAME_TO_PARAM: Record<string, string> = {
  [TYPE_LABELS.administradora]: 'administradora',
  [TYPE_LABELS.sindico]: 'sindico',
  [TYPE_LABELS.empresa]: 'empresa',
  [TYPE_LABELS.consumidor_final]: 'consumidor_final',
  Administradoras: 'administradora',
  'Síndicos': 'sindico',
  Empresas: 'empresa',
  'Consumidor Final': 'consumidor_final',
}

// Parse "Jan/2026" → { mes: 1, ano: 2026 }
function parseMonthLabel(label: string): { mes: number; ano: number } | null {
  const parts = label.split('/')
  if (parts.length !== 2) return null
  const mesIdx = MONTHS.indexOf(parts[0] as (typeof MONTHS)[number])
  if (mesIdx === -1) return null
  const anoVal = Number(parts[1])
  return { mes: mesIdx + 1, ano: anoVal < 100 ? 2000 + anoVal : anoVal }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [ano, setAno] = useState(CURRENT_YEAR)
  const [mes, setMes] = useState(CURRENT_MONTH)

  const { data: resumo, isLoading: loadingResumo } = useResumoGlobalAll()
  const { data: vendedorData, isLoading: loadingVendedor } =
    useVendasPorVendedor(ano, mes)
  const { data: vendedores } = useVendedores()
  const { data: inativos, isLoading: loadingInativos } = useClientesInativos()
  const { data: clientesAtivos, isLoading: loadingClientes } =
    useClientesAtivosCount()
  const { data: vendasCount, isLoading: loadingVendas } = useVendasMesCount(
    ano,
    mes
  )

  // Auto-redirect to last month with data if current selection has none
  useEffect(() => {
    if (!resumo?.length) return
    const sorted = [...resumo].sort(
      (a, b) => b.ano * 100 + b.mes - (a.ano * 100 + a.mes)
    )
    const curr = resumo.find((r) => r.ano === ano && r.mes === mes)
    if (!curr && sorted.length > 0) {
      setAno(sorted[0].ano)
      setMes(sorted[0].mes)
    }
    // Only run on data load, not on ano/mes change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumo])

  // Current and previous month data for KPIs
  const { currentMonth, previousMonth } = useMemo(() => {
    if (!resumo) return { currentMonth: null, previousMonth: null }
    const sorted = [...resumo].sort(
      (a, b) => a.ano * 100 + a.mes - (b.ano * 100 + b.mes)
    )
    const curr = sorted.find((r) => r.ano === ano && r.mes === mes)
    const prevMes = mes === 1 ? 12 : mes - 1
    const prevAno = mes === 1 ? ano - 1 : ano
    const prev = sorted.find((r) => r.ano === prevAno && r.mes === prevMes)
    return { currentMonth: curr ?? null, previousMonth: prev ?? null }
  }, [resumo, ano, mes])

  // Percentage change helper
  function pctChange(current: number | null, previous: number | null): number | undefined {
    if (!current || !previous || previous === 0) return undefined
    return ((current - previous) / previous) * 100
  }

  // Line chart data (last 12 months, cross-year)
  const lineChartData = useMemo(() => {
    if (!resumo) return []
    return [...resumo]
      .sort((a, b) => a.ano * 100 + a.mes - (b.ano * 100 + b.mes))
      .slice(-12)
      .map((r) => ({
        name: formatMonthYear(r.mes, r.ano),
        total: r.total_geral,
        adm: r.total_adm ?? 0,
      }))
  }, [resumo])

  // Donut chart data (type distribution for selected month)
  const donutData = useMemo(() => {
    if (!currentMonth) return []
    return [
      {
        name: TYPE_LABELS.administradora,
        value: currentMonth.total_adm ?? 0,
        color: TYPE_COLORS.administradora,
      },
      {
        name: TYPE_LABELS.sindico,
        value: currentMonth.total_sindicos ?? 0,
        color: TYPE_COLORS.sindico,
      },
      {
        name: TYPE_LABELS.empresa,
        value: currentMonth.total_empresas ?? 0,
        color: TYPE_COLORS.empresa,
      },
      {
        name: TYPE_LABELS.consumidor_final,
        value: currentMonth.total_cf ?? 0,
        color: TYPE_COLORS.consumidor_final,
      },
    ].filter((d) => d.value > 0)
  }, [currentMonth])

  // Stacked bar chart data (last 12 months, cross-year)
  const stackedBarData = useMemo(() => {
    if (!resumo) return []
    return [...resumo]
      .sort((a, b) => a.ano * 100 + a.mes - (b.ano * 100 + b.mes))
      .slice(-12)
      .map((r) => ({
        name: formatMonthYear(r.mes, r.ano),
        Administradoras: r.total_adm ?? 0,
        Síndicos: r.total_sindicos ?? 0,
        Empresas: r.total_empresas ?? 0,
        'Consumidor Final': r.total_cf ?? 0,
      }))
  }, [resumo])

  // Top vendedores ranking
  const ranking = useMemo(() => {
    if (!vendedorData || !vendedores) return []
    return [...vendedorData]
      .sort((a, b) => b.total - a.total)
      .map((v, i) => {
        const vendedor = vendedores.find((vd) => vd.id === v.vendedor_id)
        const meta = vendedor?.meta_mensal ?? 0
        const metaPct = meta > 0 ? (v.total / meta) * 100 : 0
        return {
          position: i + 1,
          vendedor_id: v.vendedor_id,
          nome: v.vendedor,
          total: v.total,
          meta: metaPct,
          clientes: v.clientes_atendidos,
        }
      })
  }, [vendedorData, vendedores])

  // Churn: compare current month with previous
  const prevMesChurn = mes === 1 ? 12 : mes - 1
  const prevAnoChurn = mes === 1 ? ano - 1 : ano
  const { data: topQuedas } = useTopQuedas(prevAnoChurn, prevMesChurn, ano, mes, 3)
  const { data: churnClientes } = useClientesChurn(prevAnoChurn, prevMesChurn, ano, mes)

  const kpiLoading = loadingResumo || loadingClientes || loadingVendas

  return (
    <div className="space-y-6">
      {/* Page header + period filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral de vendas e faturamento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(mes)}
            onValueChange={(v) => setMes(Number(v))}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(ano)}
            onValueChange={(v) => setAno(Number(v))}
          >
            <SelectTrigger className="w-full sm:w-[100px]">
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
          <Button size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
        </div>
      </div>

      {/* Empty state banner */}
      {!kpiLoading && !currentMonth && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200/50 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800/50 p-4">
          <Info className="h-5 w-5 shrink-0 text-blue-500" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Sem vendas registradas para {MONTHS[mes - 1]}/{ano}. Mostrando dados do ultimo periodo disponivel.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Faturamento Total"
          value={
            currentMonth ? formatCurrency(currentMonth.total_geral) : '—'
          }
          change={pctChange(
            currentMonth?.total_geral ?? null,
            previousMonth?.total_geral ?? null
          )}
          description={`${MONTHS[mes - 1]} / ${ano}`}
          icon={DollarSign}
          loading={kpiLoading}
          color="primary"
          href={`${ROUTES.VENDAS}?ano=${ano}&mes=${mes}`}
        />
        <KpiCard
          title="Administradoras"
          value={
            currentMonth
              ? formatCurrency(currentMonth.total_adm ?? 0)
              : '—'
          }
          change={pctChange(
            currentMonth?.total_adm ?? null,
            previousMonth?.total_adm ?? null
          )}
          description={`${MONTHS[mes - 1]} / ${ano}`}
          icon={Building2}
          loading={kpiLoading}
          color="primary"
          href={`${ROUTES.VENDAS}?ano=${ano}&mes=${mes}&tipo=administradora`}
        />
        <KpiCard
          title="Clientes Ativos"
          value={String(clientesAtivos ?? 0)}
          description="Total Acumulado"
          icon={Users}
          loading={kpiLoading}
          color="amber"
          href={`${ROUTES.CLIENTES}?status=ativo`}
        />
        <KpiCard
          title="Vendas no Mês"
          value={String(vendasCount ?? 0)}
          description={`Mês de ${MONTHS[mes - 1]}`}
          icon={ShoppingCart}
          loading={kpiLoading}
          color="teal"
          href={`${ROUTES.VENDAS}?ano=${ano}&mes=${mes}`}
        />
      </div>

      {/* Charts row 1: Line + Donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Line chart — Evolução Mensal */}
        <Card className="lg:col-span-3 min-w-0">
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground/80">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingResumo ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <defs>
                    <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientAdm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={currencyTick}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    formatter={CurrencyTooltipFormatter}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                  />
                  <Area type="monotone" dataKey="total" fill="url(#gradientTotal)" stroke="none" />
                  <Area type="monotone" dataKey="adm" fill="url(#gradientAdm)" stroke="none" />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Faturamento Total"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={{ r: 4, cursor: 'pointer' }}
                    activeDot={{ r: 6, cursor: 'pointer', onClick: (_: unknown, payload: { payload?: { name?: string } }) => {
                      const parsed = payload?.payload?.name ? parseMonthLabel(payload.payload.name) : null
                      if (parsed) navigate(`${ROUTES.VENDAS}?ano=${parsed.ano}&mes=${parsed.mes}`)
                    }}}
                  />
                  <Line
                    type="monotone"
                    dataKey="adm"
                    name="Administradoras"
                    stroke={CHART_COLORS.teal}
                    strokeWidth={2}
                    dot={{ r: 4, cursor: 'pointer' }}
                    activeDot={{ r: 6, cursor: 'pointer', onClick: (_: unknown, payload: { payload?: { name?: string } }) => {
                      const parsed = payload?.payload?.name ? parseMonthLabel(payload.payload.name) : null
                      if (parsed) navigate(`${ROUTES.VENDAS}?ano=${parsed.ano}&mes=${parsed.mes}&tipo=administradora`)
                    }}}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut chart — Distribuição por Tipo */}
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground/80">Distribuição por Tipo</CardTitle>
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-0.5">
              {MONTHS[mes - 1]} / {ano}
            </p>
          </CardHeader>
          <CardContent>
            {loadingResumo ? (
              <Skeleton className="h-[300px] w-full" />
            ) : donutData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                Sem dados para o período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                    cursor="pointer"
                    onClick={(data: { name?: string }) => {
                      const tipo = data?.name ? TYPE_NAME_TO_PARAM[data.name] : null
                      if (tipo) navigate(`${ROUTES.VENDAS}?ano=${ano}&mes=${mes}&tipo=${tipo}`)
                    }}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* Center label */}
                  <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-sm font-bold">
                    Total
                  </text>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
                    100%
                  </text>
                  <RechartsTooltip
                    formatter={CurrencyTooltipFormatter}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value: string) => {
                      const item = donutData.find((d) => d.name === value)
                      const total = donutData.reduce((sum, d) => sum + d.value, 0)
                      const pct = item && total > 0 ? ((item.value / total) * 100).toFixed(0) : '0'
                      const tipo = TYPE_NAME_TO_PARAM[value]
                      return (
                        <span
                          className="text-xs text-foreground cursor-pointer hover:underline"
                          onClick={() => { if (tipo) navigate(`${ROUTES.VENDAS}?ano=${ano}&mes=${mes}&tipo=${tipo}`) }}
                        >
                          {value} {pct}%
                        </span>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: Stacked Bar + Top Vendedores */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Stacked bar chart — Vendas por Tipo */}
        <Card className="lg:col-span-3 min-w-0">
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground/80">
              Vendas por Tipo (Mensal)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingResumo ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stackedBarData}>
                  <defs>
                    <linearGradient id="barGradientAdm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={1} />
                      <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={currencyTick}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    formatter={CurrencyTooltipFormatter}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="Administradoras"
                    stackId="a"
                    fill="url(#barGradientAdm)"
                    radius={[4, 4, 4, 4]}
                    cursor="pointer"
                    onClick={(data: { name?: string }) => {
                      const parsed = data?.name ? parseMonthLabel(data.name) : null
                      if (parsed) navigate(`${ROUTES.VENDAS}?ano=${parsed.ano}&mes=${parsed.mes}&tipo=administradora`)
                    }}
                  />
                  <Bar
                    dataKey="Síndicos"
                    stackId="a"
                    fill={CHART_COLORS.teal}
                    radius={[4, 4, 4, 4]}
                    cursor="pointer"
                    onClick={(data: { name?: string }) => {
                      const parsed = data?.name ? parseMonthLabel(data.name) : null
                      if (parsed) navigate(`${ROUTES.VENDAS}?ano=${parsed.ano}&mes=${parsed.mes}&tipo=sindico`)
                    }}
                  />
                  <Bar
                    dataKey="Empresas"
                    stackId="a"
                    fill={CHART_COLORS.amber}
                    radius={[4, 4, 4, 4]}
                    cursor="pointer"
                    onClick={(data: { name?: string }) => {
                      const parsed = data?.name ? parseMonthLabel(data.name) : null
                      if (parsed) navigate(`${ROUTES.VENDAS}?ano=${parsed.ano}&mes=${parsed.mes}&tipo=empresa`)
                    }}
                  />
                  <Bar
                    dataKey="Consumidor Final"
                    stackId="a"
                    fill={CHART_COLORS.gray}
                    radius={[4, 4, 4, 4]}
                    cursor="pointer"
                    onClick={(data: { name?: string }) => {
                      const parsed = data?.name ? parseMonthLabel(data.name) : null
                      if (parsed) navigate(`${ROUTES.VENDAS}?ano=${parsed.ano}&mes=${parsed.mes}&tipo=consumidor_final`)
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Vendedores ranking */}
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground/80">Top Vendedores</CardTitle>
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-0.5">
              {MONTHS[mes - 1]} / {ano}
            </p>
          </CardHeader>
          <CardContent>
            {loadingVendedor ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : ranking.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">
                Sem dados para o período
              </div>
            ) : (
              <div className="space-y-3">
                {ranking.map((v) => (
                  <Link
                    key={v.position}
                    to={`${ROUTES.VENDEDORES}?tab=ranking`}
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {v.position}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{v.nome}</p>
                      <div className="mt-1 h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(v.meta, 100)}%`,
                            backgroundColor:
                              v.meta >= 100
                                ? '#16a34a'
                                : v.meta >= 75
                                  ? '#eab308'
                                  : '#dc2626',
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums">
                        {formatCurrency(v.total)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {v.meta.toFixed(0)}% da meta
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert banner — Churn de clientes */}
      {churnClientes && churnClientes.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200/50 bg-red-50 dark:bg-red-900/10 dark:border-red-800/50 p-4">
          <UserMinus className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">
              {churnClientes.length} cliente{churnClientes.length !== 1 && 's'} compraram em {MONTHS[prevMesChurn - 1]} mas nao compraram em {MONTHS[mes - 1]}
            </p>
            {topQuedas && topQuedas.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p className="font-medium text-red-600 dark:text-red-400">Top administradoras afetadas:</p>
                {topQuedas.map((q) => (
                  <p key={q.administradora}>
                    {q.administradora}: {q.condominios_perdidos} perdidos ({formatCurrency(q.valor_perdido)})
                  </p>
                ))}
              </div>
            )}
          </div>
          <Link to={ROUTES.COMPARACAO}>
            <Button variant="outline" size="sm" className="shrink-0">
              Ver detalhes
            </Button>
          </Link>
        </div>
      )}

      {/* Alert banner — Clientes inativos */}
      {!loadingInativos && inativos && inativos.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200/50 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {inativos.length} cliente{inativos.length !== 1 && 's'} sem
              compras há 60+ dias
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {inativos
                .slice(0, 3)
                .map((c) => c.nome)
                .join(', ')}
              {inativos.length > 3 && ` e mais ${inativos.length - 3}`}
            </p>
          </div>
          <Link to={`${ROUTES.CLIENTES}?status=ativo&dias_inativo=60`}>
            <Button variant="outline" size="sm" className="shrink-0">
              Ver detalhes
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
