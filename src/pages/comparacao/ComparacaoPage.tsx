import { useMemo, useState } from 'react'
import { useTabFromUrl } from '@/hooks/useTabFromUrl'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  ArrowDownRight, ArrowUpRight, Minus,
  DollarSign, TrendingDown, TrendingUp, UserMinus, UserPlus, Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExportButtons, type ExportColumn } from '@/components/ExportButtons'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiCard } from '@/pages/dashboard/components/KpiCard'
import {
  useChurnPorAdministradora,
  useClientesChurn,
  useClientesNovos,
  useClientesComparacao,
  useComparacaoPorVendedor,
  useComparacaoPorTipo,
} from '@/hooks/useComparacao'
import { formatCurrency, formatMonthYear } from '@/lib/formatters'
import { MONTHS } from '@/lib/constants'
import { CHART_COLORS, TYPE_COLORS, TYPE_LABEL } from '@/lib/theme-constants'

const now = new Date()
const CURRENT_YEAR = now.getFullYear()
const CURRENT_MONTH = now.getMonth() + 1
const YEARS = Array.from({ length: 3 }, (_, i) => CURRENT_YEAR - i)
const MONTH_OPTIONS = MONTHS.map((label, i) => ({ value: i + 1, label }))

export function ComparacaoPage() {
  // Period selectors: A = reference (older), B = current (newer)
  const [tab, setTab] = useTabFromUrl('tab', 'administradoras')

  const [anoA, setAnoA] = useState(CURRENT_MONTH === 1 ? CURRENT_YEAR - 1 : CURRENT_YEAR)
  const [mesA, setMesA] = useState(CURRENT_MONTH === 1 ? 12 : CURRENT_MONTH - 1)
  const [anoB, setAnoB] = useState(CURRENT_YEAR)
  const [mesB, setMesB] = useState(CURRENT_MONTH)

  const { data: adminData, isLoading: loadingAdmin } =
    useChurnPorAdministradora(anoA, mesA, anoB, mesB)
  const { data: perdidos, isLoading: loadingPerdidos } =
    useClientesChurn(anoA, mesA, anoB, mesB)
  const { data: novos, isLoading: loadingNovos } =
    useClientesNovos(anoA, mesA, anoB, mesB)
  const { data: vendedorData, isLoading: loadingVendedor } =
    useComparacaoPorVendedor(anoA, mesA, anoB, mesB)
  const { data: tipoData, isLoading: loadingTipo } =
    useComparacaoPorTipo(anoA, mesA, anoB, mesB)
  const { data: allClientes, isLoading: loadingAllClientes } =
    useClientesComparacao(anoA, mesA, anoB, mesB)

  const isLoading = loadingAdmin || loadingPerdidos || loadingNovos || loadingVendedor || loadingTipo || loadingAllClientes

  // KPI summaries
  const kpis = useMemo(() => {
    if (!adminData) return null
    const totalFatA = adminData.reduce((s, r) => s + r.faturamento_mes1, 0)
    const totalFatB = adminData.reduce((s, r) => s + r.faturamento_mes2, 0)
    const totalRetidos = adminData.reduce((s, r) => s + r.retidos, 0)
    const totalPerdidos = adminData.reduce((s, r) => s + r.perdidos, 0)
    const totalNovos = adminData.reduce((s, r) => s + r.novos, 0)
    const totalCondosA = adminData.reduce((s, r) => s + r.condominios_mes1, 0)
    const retencao = totalCondosA > 0 ? (totalRetidos / totalCondosA) * 100 : 0
    const delta = totalFatA > 0 ? ((totalFatB - totalFatA) / totalFatA) * 100 : 0
    return { totalFatA, totalFatB, delta, retencao, totalPerdidos, totalNovos }
  }, [adminData])

  const labelA = formatMonthYear(mesA, anoA)
  const labelB = formatMonthYear(mesB, anoB)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comparacao de Periodos</h1>
          <p className="text-sm text-muted-foreground">
            Analise de churn, retencao e evolucao entre dois meses
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <PeriodSelector
            label="Periodo A"
            ano={anoA} mes={mesA}
            onAnoChange={setAnoA} onMesChange={setMesA}
          />
          <span className="text-muted-foreground font-bold hidden sm:inline">vs</span>
          <PeriodSelector
            label="Periodo B"
            ano={anoB} mes={mesB}
            onAnoChange={setAnoB} onMesChange={setMesB}
          />
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : kpis && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KpiCard
            title={`Faturamento ${labelA}`}
            value={formatCurrency(kpis.totalFatA)}
            icon={DollarSign}
            color="primary"
          />
          <KpiCard
            title={`Faturamento ${labelB}`}
            value={formatCurrency(kpis.totalFatB)}
            icon={DollarSign}
            color={kpis.delta >= 0 ? 'teal' : 'amber'}
            change={kpis.delta}
          />
          <KpiCard
            title="Retencao"
            value={`${kpis.retencao.toFixed(1)}%`}
            icon={Users}
            color={kpis.retencao >= 70 ? 'teal' : 'amber'}
          />
          <KpiCard
            title="Clientes Perdidos"
            value={String(kpis.totalPerdidos)}
            icon={UserMinus}
            color="amber"
          />
          <KpiCard
            title="Clientes Novos"
            value={String(kpis.totalNovos)}
            icon={UserPlus}
            color="teal"
          />
        </div>
      )}

      {/* Export (for active admin data) */}
      {adminData && adminData.length > 0 && (
        <div className="flex justify-end">
          <ExportButtons
            data={adminData.map((row) => ({
              administradora: row.administradora,
              condominios_mes1: row.condominios_mes1,
              condominios_mes2: row.condominios_mes2,
              retidos: row.retidos,
              perdidos: row.perdidos,
              novos: row.novos,
              taxa_retencao: row.taxa_retencao,
              faturamento_mes1: row.faturamento_mes1,
              faturamento_mes2: row.faturamento_mes2,
              delta_faturamento: row.delta_faturamento,
              pct_faturamento: row.faturamento_mes1 > 0
                ? (row.faturamento_mes2 - row.faturamento_mes1) / row.faturamento_mes1 * 100
                : 0,
              delta_pedidos: row.pedidos_mes2 - row.pedidos_mes1,
              delta_condominios: row.condominios_mes2 - row.condominios_mes1,
            }))}
            columns={[
              { key: 'administradora', header: 'Administradora' },
              { key: 'condominios_mes1', header: `Cond. ${labelA}` },
              { key: 'condominios_mes2', header: `Cond. ${labelB}` },
              { key: 'retidos', header: 'Retidos' },
              { key: 'perdidos', header: 'Perdidos' },
              { key: 'novos', header: 'Novos' },
              { key: 'taxa_retencao', header: 'Retenção %', format: (v) => `${(v as number).toFixed(1)}%` },
              { key: 'faturamento_mes1', header: `Fat. ${labelA}`, format: (v) => formatCurrency(v as number) },
              { key: 'faturamento_mes2', header: `Fat. ${labelB}`, format: (v) => formatCurrency(v as number) },
              { key: 'delta_faturamento', header: 'Delta Fat.', format: (v) => formatCurrency(v as number) },
              { key: 'pct_faturamento', header: '% Fat.', format: (v) => `${(v as number).toFixed(1)}%` },
              { key: 'delta_pedidos', header: 'Δ Pedidos' },
              { key: 'delta_condominios', header: 'Δ Condominios' },
            ] satisfies ExportColumn[]}
            title={`Comparação ${labelA} vs ${labelB}`}
            fileName={`comparacao_${labelA}_${labelB}`}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-slate-100/80 p-1 border border-slate-200/50 h-auto grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
          <TabsTrigger value="administradoras" className="h-9 data-[state=active]:bg-white data-[state=active]:text-[#0066FF] data-[state=active]:shadow-sm rounded-md transition-all font-medium text-xs sm:text-sm">Administradoras</TabsTrigger>
          <TabsTrigger value="condominios" className="h-9 data-[state=active]:bg-white data-[state=active]:text-[#0066FF] data-[state=active]:shadow-sm rounded-md transition-all font-medium text-xs sm:text-sm">Condominios</TabsTrigger>
          <TabsTrigger value="vendedores" className="h-9 data-[state=active]:bg-white data-[state=active]:text-[#0066FF] data-[state=active]:shadow-sm rounded-md transition-all font-medium text-xs sm:text-sm">Vendedores</TabsTrigger>
          <TabsTrigger value="tipos" className="h-9 data-[state=active]:bg-white data-[state=active]:text-[#0066FF] data-[state=active]:shadow-sm rounded-md transition-all font-medium text-xs sm:text-sm">Tipo Cliente</TabsTrigger>
          <TabsTrigger value="perdidos" className="h-9 data-[state=active]:bg-white data-[state=active]:text-[#0066FF] data-[state=active]:shadow-sm rounded-md transition-all font-medium text-xs sm:text-sm">Perdidos</TabsTrigger>
          <TabsTrigger value="novos" className="h-9 data-[state=active]:bg-white data-[state=active]:text-[#0066FF] data-[state=active]:shadow-sm rounded-md transition-all font-medium text-xs sm:text-sm">Novos</TabsTrigger>
        </TabsList>

        {/* Tab 1: Administradoras */}
        <TabsContent value="administradoras">
          <Card>
            <CardHeader>
              <CardTitle>Churn por Administradora ({labelA} vs {labelB})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAdmin ? (
                <Skeleton className="h-96" />
              ) : !adminData?.length ? (
                <p className="py-8 text-center text-muted-foreground">
                  Sem dados de administradoras para o periodo selecionado.
                  Rode um sync completo para popular o campo administradora.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium sticky left-0 z-10 bg-card whitespace-nowrap">Administradora</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap" title="Condominios">Cond. {labelA}</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap" title="Condominios">Cond. {labelB}</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap">Retidos</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap">Perdidos</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap">Novos</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap" title="Taxa de Retenção">Ret. %</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap" title="Faturamento">Fat. {labelA}</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap" title="Faturamento">Fat. {labelB}</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap" title="Delta Faturamento">Δ Fat.</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap" title="% Faturamento">% Fat.</th>
                        <th className="pb-3 pr-4 font-medium text-right whitespace-nowrap" title="Delta Pedidos">Δ Ped.</th>
                        <th className="pb-3 font-medium text-right whitespace-nowrap" title="Delta Condominios">Δ Cond.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminData.map((row) => (
                        <tr key={row.administradora} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 pr-4 font-medium sticky left-0 z-10 bg-card">{row.administradora}</td>
                          <td className="py-3 pr-4 text-right">{row.condominios_mes1}</td>
                          <td className="py-3 pr-4 text-right">{row.condominios_mes2}</td>
                          <td className="py-3 pr-4 text-right">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                              {row.retidos}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {row.perdidos > 0 ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                {row.perdidos}
                              </Badge>
                            ) : '0'}
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {row.novos > 0 ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                {row.novos}
                              </Badge>
                            ) : '0'}
                          </td>
                          <td className="py-3 pr-4 text-right">{row.taxa_retencao.toFixed(1)}%</td>
                          <td className="py-3 pr-4 text-right">{formatCurrency(row.faturamento_mes1)}</td>
                          <td className="py-3 pr-4 text-right">{formatCurrency(row.faturamento_mes2)}</td>
                          <td className="py-3 pr-4 text-right">
                            <DeltaIndicator value={row.delta_faturamento} />
                          </td>
                          <td className="py-3 pr-4 text-right text-sm tabular-nums">
                            {row.faturamento_mes1 > 0
                              ? <DeltaPercent value={(row.faturamento_mes2 - row.faturamento_mes1) / row.faturamento_mes1 * 100} />
                              : '—'}
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <DeltaInt value={row.pedidos_mes2 - row.pedidos_mes1} />
                          </td>
                          <td className="py-3 text-right">
                            <DeltaInt value={row.condominios_mes2 - row.condominios_mes1} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Condominios por Admin (all clients) */}
        <TabsContent value="condominios">
          <Card>
            <CardHeader>
              <CardTitle>Condominios por Administradora ({labelA} vs {labelB})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAllClientes ? (
                <Skeleton className="h-96" />
              ) : !allClientes?.length ? (
                <p className="py-8 text-center text-muted-foreground">
                  Sem dados para o periodo selecionado.
                </p>
              ) : (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {allClientes.length} clientes:
                    {' '}{allClientes.filter(c => c.status === 'Retido').length} retidos,
                    {' '}{allClientes.filter(c => c.status === 'Perdido').length} perdidos,
                    {' '}{allClientes.filter(c => c.status === 'Novo').length} novos.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium sticky left-0 z-10 bg-card">Administradora</th>
                          <th className="pb-3 pr-4 font-medium">Cliente</th>
                          <th className="pb-3 pr-4 font-medium text-right">Fat. {labelA}</th>
                          <th className="pb-3 pr-4 font-medium text-right">Fat. {labelB}</th>
                          <th className="pb-3 pr-4 font-medium text-right">Ped. {labelA}</th>
                          <th className="pb-3 pr-4 font-medium text-right">Ped. {labelB}</th>
                          <th className="pb-3 pr-4 font-medium text-right">Delta</th>
                          <th className="pb-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allClientes.map((row) => (
                          <tr key={row.cliente_id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2.5 pr-4 text-muted-foreground sticky left-0 z-10 bg-card">{row.administradora ?? '-'}</td>
                            <td className="py-2.5 pr-4 font-medium">{row.nome}</td>
                            <td className="py-2.5 pr-4 text-right tabular-nums">{formatCurrency(row.faturamento_mes1)}</td>
                            <td className="py-2.5 pr-4 text-right tabular-nums">{formatCurrency(row.faturamento_mes2)}</td>
                            <td className="py-2.5 pr-4 text-right">{row.pedidos_mes1}</td>
                            <td className="py-2.5 pr-4 text-right">{row.pedidos_mes2}</td>
                            <td className="py-2.5 pr-4 text-right">
                              <DeltaIndicator value={row.delta_faturamento} />
                            </td>
                            <td className="py-2.5">
                              <Badge variant="outline" className={
                                row.status === 'Retido'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                  : row.status === 'Perdido'
                                    ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              }>
                                {row.status === 'Retido' ? 'Retido' : row.status === 'Perdido' ? `Perdido em ${labelB}` : `Novo em ${labelB}`}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Vendedores */}
        <TabsContent value="vendedores">
          <Card>
            <CardHeader>
              <CardTitle>Comparacao por Vendedor ({labelA} vs {labelB})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingVendedor ? (
                <Skeleton className="h-80" />
              ) : vendedorData?.length ? (
                <>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={vendedorData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="vendedor" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                      <RechartsTooltip
                        formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                      />
                      <Legend />
                      <Bar dataKey="faturamento_mes1" name={labelA} fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="faturamento_mes2" name={labelB} fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">Vendedor</th>
                          <th className="pb-3 pr-4 font-medium text-right">Fat. {labelA}</th>
                          <th className="pb-3 pr-4 font-medium text-right">Fat. {labelB}</th>
                          <th className="pb-3 pr-4 font-medium text-right">Delta</th>
                          <th className="pb-3 pr-4 font-medium text-right">Clientes {labelA}</th>
                          <th className="pb-3 font-medium text-right">Clientes {labelB}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendedorData.map((row) => (
                          <tr key={row.vendedor_id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 pr-4 font-medium">{row.vendedor}</td>
                            <td className="py-3 pr-4 text-right">{formatCurrency(row.faturamento_mes1)}</td>
                            <td className="py-3 pr-4 text-right">{formatCurrency(row.faturamento_mes2)}</td>
                            <td className="py-3 pr-4 text-right">
                              <DeltaIndicator value={row.delta_faturamento} />
                            </td>
                            <td className="py-3 pr-4 text-right">{row.clientes_mes1}</td>
                            <td className="py-3 text-right">{row.clientes_mes2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="py-8 text-center text-muted-foreground">Sem dados para o periodo.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Tipo Cliente */}
        <TabsContent value="tipos">
          <Card>
            <CardHeader>
              <CardTitle>Comparacao por Tipo de Cliente ({labelA} vs {labelB})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingTipo ? (
                <Skeleton className="h-80" />
              ) : tipoData?.length ? (
                <>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-medium text-muted-foreground">{labelA}</p>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={tipoData.filter(d => d.faturamento_mes1 > 0)}
                            dataKey="faturamento_mes1"
                            nameKey="tipo_cliente"
                            cx="50%" cy="50%"
                            outerRadius={90}
                            label={({ name, percent }: { name?: string; percent?: number }) => `${TYPE_LABEL[name ?? ''] ?? name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {tipoData.filter(d => d.faturamento_mes1 > 0).map((entry) => (
                              <Cell key={entry.tipo_cliente} fill={TYPE_COLORS[entry.tipo_cliente] ?? CHART_COLORS.gray} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-muted-foreground">{labelB}</p>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={tipoData.filter(d => d.faturamento_mes2 > 0)}
                            dataKey="faturamento_mes2"
                            nameKey="tipo_cliente"
                            cx="50%" cy="50%"
                            outerRadius={90}
                            label={({ name, percent }: { name?: string; percent?: number }) => `${TYPE_LABEL[name ?? ''] ?? name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {tipoData.filter(d => d.faturamento_mes2 > 0).map((entry) => (
                              <Cell key={entry.tipo_cliente} fill={TYPE_COLORS[entry.tipo_cliente] ?? CHART_COLORS.gray} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">Tipo</th>
                          <th className="pb-3 pr-4 font-medium text-right">Fat. {labelA}</th>
                          <th className="pb-3 pr-4 font-medium text-right">Fat. {labelB}</th>
                          <th className="pb-3 pr-4 font-medium text-right">Delta</th>
                          <th className="pb-3 pr-4 font-medium text-right">Clientes {labelA}</th>
                          <th className="pb-3 font-medium text-right">Clientes {labelB}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tipoData.map((row) => (
                          <tr key={row.tipo_cliente} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 pr-4 font-medium">{TYPE_LABEL[row.tipo_cliente] ?? row.tipo_cliente}</td>
                            <td className="py-3 pr-4 text-right">{formatCurrency(row.faturamento_mes1)}</td>
                            <td className="py-3 pr-4 text-right">{formatCurrency(row.faturamento_mes2)}</td>
                            <td className="py-3 pr-4 text-right">
                              <DeltaIndicator value={row.delta_faturamento} />
                            </td>
                            <td className="py-3 pr-4 text-right">{row.clientes_mes1}</td>
                            <td className="py-3 text-right">{row.clientes_mes2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="py-8 text-center text-muted-foreground">Sem dados para o periodo.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Clientes Perdidos */}
        <TabsContent value="perdidos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Clientes Perdidos ({labelA} → {labelB})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPerdidos ? (
                <Skeleton className="h-96" />
              ) : !perdidos?.length ? (
                <p className="py-8 text-center text-muted-foreground">Nenhum cliente perdido neste periodo.</p>
              ) : (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {perdidos.length} clientes compraram em {labelA} mas nao compraram em {labelB}.
                    Impacto total: {formatCurrency(perdidos.reduce((s, r) => s + r.valor_ref, 0))}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium sticky left-0 z-10 bg-card">Cliente</th>
                          <th className="pb-3 pr-4 font-medium">Administradora</th>
                          <th className="pb-3 pr-4 font-medium">Tipo</th>
                          <th className="pb-3 pr-4 font-medium">Vendedor</th>
                          <th className="pb-3 pr-4 font-medium text-right">Valor {labelA}</th>
                          <th className="pb-3 pr-4 font-medium text-right">Pedidos {labelA}</th>
                          <th className="pb-3 font-medium text-right">Ultima Emissao</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perdidos.map((row) => (
                          <tr key={row.cliente_id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2.5 pr-4 font-medium sticky left-0 z-10 bg-card">{row.nome}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{row.administradora ?? '-'}</td>
                            <td className="py-2.5 pr-4">
                              <Badge variant="outline" className="text-xs">
                                {TYPE_LABEL[row.tipo] ?? row.tipo}
                              </Badge>
                            </td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{row.vendedor ?? '-'}</td>
                            <td className="py-2.5 pr-4 text-right font-medium text-red-600 dark:text-red-400">
                              {formatCurrency(row.valor_ref)}
                            </td>
                            <td className="py-2.5 pr-4 text-right">{row.pedidos_ref}</td>
                            <td className="py-2.5 text-right text-muted-foreground">
                              {row.ultima_emissao
                                ? new Date(row.ultima_emissao + 'T00:00:00').toLocaleDateString('pt-BR')
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Clientes Novos */}
        <TabsContent value="novos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Clientes Novos ({labelA} → {labelB})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingNovos ? (
                <Skeleton className="h-96" />
              ) : !novos?.length ? (
                <p className="py-8 text-center text-muted-foreground">Nenhum cliente novo neste periodo.</p>
              ) : (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {novos.length} clientes novos em {labelB} (nao compraram em {labelA}).
                    Valor total: {formatCurrency(novos.reduce((s, r) => s + r.valor_atual, 0))}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">Cliente</th>
                          <th className="pb-3 pr-4 font-medium">Administradora</th>
                          <th className="pb-3 pr-4 font-medium">Tipo</th>
                          <th className="pb-3 pr-4 font-medium">Vendedor</th>
                          <th className="pb-3 pr-4 font-medium text-right">Valor {labelB}</th>
                          <th className="pb-3 font-medium text-right">Pedidos {labelB}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {novos.map((row) => (
                          <tr key={row.cliente_id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2.5 pr-4 font-medium">{row.nome}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{row.administradora ?? '-'}</td>
                            <td className="py-2.5 pr-4">
                              <Badge variant="outline" className="text-xs">
                                {TYPE_LABEL[row.tipo] ?? row.tipo}
                              </Badge>
                            </td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{row.vendedor ?? '-'}</td>
                            <td className="py-2.5 pr-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(row.valor_atual)}
                            </td>
                            <td className="py-2.5 text-right">{row.pedidos_atual}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ----------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------

function PeriodSelector({
  label, ano, mes, onAnoChange, onMesChange,
}: {
  label: string
  ano: number; mes: number
  onAnoChange: (v: number) => void
  onMesChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{label}:</span>
      <Select value={String(mes)} onValueChange={(v) => onMesChange(Number(v))}>
        <SelectTrigger className="h-8 w-full sm:w-[80px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={String(value)}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(ano)} onValueChange={(v) => onAnoChange(Number(v))}>
        <SelectTrigger className="h-8 w-full sm:w-[80px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function DeltaPercent({ value }: { value: number }) {
  const color = value > 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : value < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-muted-foreground'
  return <span className={color}>{value > 0 ? '+' : ''}{value.toFixed(1)}%</span>
}

function DeltaInt({ value }: { value: number }) {
  if (value > 0) {
    return <span className="text-emerald-600 dark:text-emerald-400">+{value}</span>
  }
  if (value < 0) {
    return <span className="text-red-600 dark:text-red-400">{value}</span>
  }
  return <span className="text-muted-foreground">0</span>
}

function DeltaIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <ArrowUpRight className="h-3.5 w-3.5" />
        {formatCurrency(value)}
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
        <ArrowDownRight className="h-3.5 w-3.5" />
        {formatCurrency(value)}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
      R$ 0,00
    </span>
  )
}
