import { useState, useMemo } from 'react'
import { useTabFromUrl } from '@/hooks/useTabFromUrl'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { BarChart3, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, SortableHeader } from '@/components/tables/DataTable'
import { ExportButtons, type ExportColumn } from '@/components/ExportButtons'
import { useCurvaAbcValor, useCurvaAbcQuantidade } from '@/hooks/useCurvaAbc'
import { formatCurrency } from '@/lib/formatters'
import type { CurvaAbcValorItem, CurvaAbcQuantidadeItem } from '@/services/api/curva-abc'

const ABC_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  A: {
    bg: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    bar: '#10b981',
  },
  B: {
    bg: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    bar: '#f59e0b',
  },
  C: {
    bg: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
    text: 'text-red-600 dark:text-red-400',
    bar: '#ef4444',
  },
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(n)
}

export function CurvaAbcPage() {
  const [mode, setMode] = useTabFromUrl('tab', 'valor')
  const [search, setSearch] = useState('')

  const { data: dataValor, isLoading: loadingValor } = useCurvaAbcValor()
  const { data: dataQtd, isLoading: loadingQtd } = useCurvaAbcQuantidade()

  const isLoading = mode === 'valor' ? loadingValor : loadingQtd
  const rawData = mode === 'valor' ? dataValor : dataQtd

  // Filter by search
  const filtered = useMemo(() => {
    if (!rawData) return []
    if (!search) return rawData
    const q = search.toLowerCase()
    return rawData.filter((item) => item.descricao.toLowerCase().includes(q))
  }, [rawData, search])

  // KPIs
  const kpis = useMemo(() => {
    if (!rawData || rawData.length === 0)
      return { total: 0, classA: 0, classB: 0, classC: 0, pctA: 0, pctB: 0, pctC: 0 }
    const classA = rawData.filter((i) => i.abc === 'A').length
    const classB = rawData.filter((i) => i.abc === 'B').length
    const classC = rawData.filter((i) => i.abc === 'C').length
    const total = rawData.length
    return {
      total,
      classA,
      classB,
      classC,
      pctA: total > 0 ? (classA / total) * 100 : 0,
      pctB: total > 0 ? (classB / total) * 100 : 0,
      pctC: total > 0 ? (classC / total) * 100 : 0,
    }
  }, [rawData])

  // Chart data (top 30 for readability)
  const chartData = useMemo(() => {
    if (!rawData) return []
    return rawData.slice(0, 30).map((item) => ({
      name: item.descricao.length > 20 ? item.descricao.slice(0, 20) + '...' : item.descricao,
      fullName: item.descricao,
      value: mode === 'valor' ? item.valor : item.quantidade,
      pct_acumulado: item.pct_acumulado,
      abc: item.abc,
    }))
  }, [rawData, mode])

  // Columns for DataTable
  const columns: ColumnDef<CurvaAbcValorItem | CurvaAbcQuantidadeItem>[] = useMemo(
    () => [
      {
        accessorKey: 'ordem',
        header: ({ column }) => <SortableHeader column={column}>#</SortableHeader>,
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">{row.getValue('ordem')}</span>
        ),
        size: 60,
      },
      {
        accessorKey: 'descricao',
        header: ({ column }) => <SortableHeader column={column}>Produto</SortableHeader>,
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.getValue('descricao')}</span>
        ),
      },
      {
        accessorKey: mode === 'valor' ? 'valor' : 'quantidade',
        header: ({ column }) => (
          <SortableHeader column={column}>
            <span className="w-full text-right">{mode === 'valor' ? 'Faturado' : 'Qtd'}</span>
          </SortableHeader>
        ),
        cell: ({ row }) => {
          const val = mode === 'valor' ? (row.original as CurvaAbcValorItem).valor : (row.original as CurvaAbcQuantidadeItem).quantidade
          return (
            <span className="font-bold tabular-nums text-right block font-mono">
              {mode === 'valor' ? formatCurrency(val) : formatNumber(val)}
            </span>
          )
        },
      },
      {
        accessorKey: 'pct_participacao',
        header: ({ column }) => (
          <SortableHeader column={column}>
            <span className="w-full text-right">% Part.</span>
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-right block font-mono">
            {Number(row.getValue('pct_participacao')).toFixed(2)}%
          </span>
        ),
      },
      {
        accessorKey: 'pct_acumulado',
        header: ({ column }) => (
          <SortableHeader column={column}>
            <span className="w-full text-right">% Acum.</span>
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-right block font-mono">
            {Number(row.getValue('pct_acumulado')).toFixed(2)}%
          </span>
        ),
      },
      {
        accessorKey: 'pedidos',
        header: ({ column }) => (
          <SortableHeader column={column}>
            <span className="w-full text-right">Pedidos</span>
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-right block font-mono">
            {row.getValue('pedidos')}
          </span>
        ),
      },
      {
        accessorKey: 'abc',
        header: 'ABC',
        cell: ({ row }) => {
          const abc = row.getValue('abc') as string
          const colors = ABC_COLORS[abc] || ABC_COLORS.C
          return (
            <Badge variant="outline" className={colors.bg}>
              {abc}
            </Badge>
          )
        },
        size: 70,
      },
    ],
    [mode]
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[350px] w-full" />
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
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#0066FF]" />
            <h2 className="text-2xl font-extrabold tracking-tight">Curva ABC</h2>
          </div>
          <p className="text-muted-foreground">
            Classificação Pareto de produtos — {rawData?.length ?? 0} itens
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons
            data={filtered.map((item) => ({
              ordem: item.ordem,
              descricao: item.descricao,
              valor: mode === 'valor' ? (item as CurvaAbcValorItem).valor : (item as CurvaAbcQuantidadeItem).quantidade,
              pct_participacao: item.pct_participacao,
              pct_acumulado: item.pct_acumulado,
              pedidos: item.pedidos,
              abc: item.abc,
            }))}
            columns={[
              { key: 'ordem', header: '#' },
              { key: 'descricao', header: 'Produto' },
              { key: 'valor', header: mode === 'valor' ? 'Faturado' : 'Qtd', format: (v) => mode === 'valor' ? formatCurrency(v as number) : formatNumber(v as number) },
              { key: 'pct_participacao', header: '% Part.', format: (v) => `${(v as number).toFixed(2)}%` },
              { key: 'pct_acumulado', header: '% Acum.', format: (v) => `${(v as number).toFixed(2)}%` },
              { key: 'pedidos', header: 'Pedidos' },
              { key: 'abc', header: 'ABC' },
            ] satisfies ExportColumn[]}
            title={`Curva ABC — ${mode === 'valor' ? 'Por Valor' : 'Por Quantidade'}`}
            fileName={`curva_abc_${mode}`}
          />
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              <TabsTrigger value="valor">Por Valor</TabsTrigger>
              <TabsTrigger value="quantidade">Por Quantidade</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Produtos</p>
            <p className="text-2xl font-bold tabular-nums mt-1 font-mono">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Classe A (80%)</p>
            <p className="text-2xl font-bold tabular-nums mt-1 font-mono text-emerald-600">
              {kpis.classA}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums font-mono mt-0.5">
              {kpis.pctA.toFixed(1)}% dos produtos
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Classe B (15%)</p>
            <p className="text-2xl font-bold tabular-nums mt-1 font-mono text-amber-600">
              {kpis.classB}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums font-mono mt-0.5">
              {kpis.pctB.toFixed(1)}% dos produtos
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Classe C (5%)</p>
            <p className="text-2xl font-bold tabular-nums mt-1 font-mono text-red-600">
              {kpis.classC}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums font-mono mt-0.5">
              {kpis.pctC.toFixed(1)}% dos produtos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pareto Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground/80">
              Gráfico Pareto — Top 30 Produtos {mode === 'valor' ? '(por Valor)' : '(por Quantidade)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v: number) =>
                    mode === 'valor'
                      ? v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                      : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const item = payload[0]?.payload
                    return (
                      <div className="rounded-2xl border bg-card p-3 shadow-lg text-sm space-y-1">
                        <p className="font-medium">{item?.fullName}</p>
                        <p>
                          {mode === 'valor' ? 'Valor' : 'Qtd'}:{' '}
                          <span className="font-bold font-mono">
                            {mode === 'valor' ? formatCurrency(item?.value ?? 0) : formatNumber(item?.value ?? 0)}
                          </span>
                        </p>
                        <p>
                          % Acumulado:{' '}
                          <span className="font-bold font-mono">{item?.pct_acumulado?.toFixed(2)}%</span>
                        </p>
                        <Badge variant="outline" className={ABC_COLORS[item?.abc]?.bg}>
                          Classe {item?.abc}
                        </Badge>
                      </div>
                    )
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={ABC_COLORS[entry.abc]?.bar ?? '#0066FF'}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pct_acumulado"
                  stroke="#0066FF"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0066FF' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Search + DataTable */}
      <div className="space-y-1 max-w-sm">
        <label className="text-xs font-medium text-muted-foreground">Busca por produto</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        defaultPageSize={25}
      />
    </div>
  )
}
