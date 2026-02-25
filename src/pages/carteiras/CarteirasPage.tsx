import { useState, useMemo, useEffect } from 'react'
import { ArrowRightLeft, Calendar, User, Search, Filter, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransferModal } from './components/TransferModal'
import {
  useCarteiraDetalhada,
  useVendedoresForTabs,
} from '@/hooks/useCarteiras'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export function CarteirasPage() {
  const { data: vendedores, isLoading: loadingVendedores } = useVendedoresForTabs()
  const [selectedVendedor, setSelectedVendedor] = useState<string>('todos')
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear(), new Date().getFullYear() - 1])
  const [search, setSearch] = useState('')
  const [transferOpen, setTransferOpen] = useState(false)

  const vendedorId = selectedVendedor === 'todos' ? undefined : selectedVendedor

  const { data: carteira, isLoading: loadingCarteira } = useCarteiraDetalhada(vendedorId)

  // Extract all available years from data
  const availableYears = useMemo(() => {
    if (!carteira) return []
    const years = new Set<number>()
    carteira.forEach(row => years.add(row.ano))
    return Array.from(years).sort((a, b) => b - a)
  }, [carteira])

  // Sync selectedYears if empty and availableYears has data
  useEffect(() => {
    if (selectedYears.length === 0 && availableYears.length > 0) {
      setSelectedYears([availableYears[0]])
    }
  }, [availableYears, selectedYears])

  const toggleYear = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year].sort((a, b) => b - a)
    )
  }

  // Pivot Rows: Cliente -> { [ano]: total }
  const pivotRows = useMemo(() => {
    if (!carteira) return []

    const map = new Map<string, any>()

    carteira.forEach((row) => {
      // Search filter
      if (search && !row.cliente.toLowerCase().includes(search.toLowerCase())) return

      const key = row.cliente_id
      if (!map.has(key)) {
        map.set(key, {
          clienteId: row.cliente_id,
          nome: row.cliente,
          tipo: row.tipo,
          vendedorNome: row.vendedor,
          years: {},
          totalVendido: 0,
          countYears: 0
        })
      }

      const entry = map.get(key)!
      const ano = row.ano

      // We only care about selected years in the table view
      if (selectedYears.includes(ano)) {
        entry.years[ano] = (entry.years[ano] || 0) + row.valor
        entry.totalVendido += row.valor
        entry.countYears = Object.keys(entry.years).length
      }
    })

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [carteira, search, selectedYears])

  // Totals per Year
  const yearTotals = useMemo(() => {
    const totals: Record<number, number> = {}
    pivotRows.forEach(row => {
      selectedYears.forEach(year => {
        totals[year] = (totals[year] || 0) + (row.years[year] || 0)
      })
    })
    return totals
  }, [pivotRows, selectedYears])

  // Summary counts
  const totalClientes = pivotRows.length
  const totalFaturamento = Object.values(yearTotals).reduce((a, b) => a + b, 0)
  const faturamentoMedio = totalClientes > 0 ? totalFaturamento / totalClientes : 0

  if (loadingVendedores) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header Premium */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-950 p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <UserCircle2 className="h-8 w-8 text-[#0066FF]" />
            Carteiras
          </h2>
          <p className="text-muted-foreground font-medium">
            Gestão e acompanhamento da distribuição de clientes por vendedor
          </p>
        </div>
        <Button
          className="gap-2 bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-lg shadow-[#0066FF]/20 py-5 px-6 font-bold"
          onClick={() => setTransferOpen(true)}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transferir Cliente
        </Button>
      </div>

      {/* Control Panel */}
      <Card className="border-none shadow-md overflow-hidden outline outline-1 outline-slate-200">
        <CardHeader className="bg-slate-50/50 border-b py-3 px-5">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
            <Filter className="h-3.5 w-3.5" />
            Painel de Controle
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Vendedor Selector */}
            <div className="md:col-span-4 space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4 text-[#0066FF]" />
                Vendedor Responsável
              </label>
              <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-[#0066FF] capitalize text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="font-bold">Todos os Vendedores</SelectItem>
                  {vendedores?.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="capitalize">
                      {v.nome.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Selector (Multi) */}
            <div className="md:col-span-4 space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0066FF]" />
                Anos para Comparação
              </label>
              <div className="flex flex-wrap gap-2">
                {availableYears.length > 0 ? (
                  availableYears.map(year => (
                    <Badge
                      key={year}
                      variant={selectedYears.includes(year) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer px-4 py-1.5 text-sm transition-all",
                        selectedYears.includes(year)
                          ? "bg-[#0066FF] hover:bg-[#0052CC] shadow-md"
                          : "hover:bg-slate-100"
                      )}
                      onClick={() => toggleYear(year)}
                    >
                      {year}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Nenhum dado disponível</span>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="md:col-span-4 space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Search className="h-4 w-4 text-[#0066FF]" />
                Buscar Cliente
              </label>
              <Input
                placeholder="Nome da empresa ou síndico..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 border-slate-200 outline-none focus-visible:ring-[#0066FF] text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-[#0066FF] shadow-sm">
          <CardContent className="p-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Clientes</span>
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-0.5">Total Geral</p>
            <div className="text-3xl font-black mt-1 font-mono text-slate-900">{totalClientes}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#00C896] shadow-sm">
          <CardContent className="p-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Faturamento Acumulado</span>
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-0.5">
              {selectedYears.sort().join(' - ')}
            </p>
            <div className="text-3xl font-black mt-1 font-mono text-slate-900">{formatCurrency(totalFaturamento)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Média por Cliente</span>
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-0.5">
              {selectedYears.sort().join(' - ')}
            </p>
            <div className="text-3xl font-black mt-1 font-mono text-slate-900">{formatCurrency(faturamentoMedio)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Content */}
      <Card className="shadow-lg border-none overflow-hidden">
        <CardContent className="p-0">
          {loadingCarteira ? (
            <div className="p-12">
              <Skeleton className="h-96 w-full" />
            </div>
          ) : pivotRows.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center text-muted-foreground gap-4">
              <Search className="h-12 w-12 opacity-20" />
              <p className="font-medium text-lg">Nenhum cliente encontrado com estes filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="sticky left-0 z-20 bg-slate-50 px-3 py-2.5 text-left font-bold text-slate-600 min-w-[200px] border-r text-[10px] uppercase tracking-wider">
                      CLIENTE
                    </th>
                    {selectedVendedor === 'todos' && (
                      <th className="px-3 py-2.5 text-left font-bold text-slate-600 text-[10px] uppercase tracking-wider min-w-[140px]">
                        VENDEDOR
                      </th>
                    )}
                    {selectedYears.map((year) => (
                      <th
                        key={year}
                        className="px-2 py-2.5 text-right font-black text-slate-900 tabular-nums min-w-[90px] text-[10px] uppercase tracking-wider"
                      >
                        ANO {year}
                      </th>
                    ))}
                    <th className="px-2 py-2.5 text-right font-bold text-[#0066FF] bg-blue-50/30 min-w-[90px] text-[10px] uppercase tracking-wider">
                      TOTAL PERÍODO
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pivotRows.map((row) => (
                    <tr
                      key={row.clienteId}
                      className="group hover:bg-slate-50/80 transition-all border-b border-slate-100 last:border-0"
                    >
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 px-3 py-2 font-bold text-slate-900 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[190px] text-[13px]">{row.nome}</span>
                          <span className="text-[8px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5 opacity-70">
                            {row.tipo?.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      {selectedVendedor === 'todos' && (
                        <td className="px-3 py-2 text-slate-500 font-medium whitespace-nowrap text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-[#0066FF]/40" />
                            {row.vendedorNome}
                          </div>
                        </td>
                      )}
                      {selectedYears.map((year) => {
                        const val = row.years[year]
                        return (
                          <td
                            key={year}
                            className="px-2 py-2 text-right tabular-nums font-mono text-slate-600 text-[12px]"
                          >
                            {val ? formatCurrency(val) : <span className="text-slate-200">—</span>}
                          </td>
                        )
                      })}
                      <td className="px-2 py-2 text-right tabular-nums font-mono font-black text-[#0066FF] bg-blue-50/5 group-hover:bg-blue-50/30 transition-colors text-[12px]">
                        {formatCurrency(row.totalVendido)}
                      </td>
                    </tr>
                  ))}

                  {/* Totals row */}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="sticky left-0 z-10 bg-slate-900 px-3 py-4 border-r text-xs tracking-tighter">
                      TOTAL CONSOLIDADO
                    </td>
                    {selectedVendedor === 'todos' && (
                      <td className="bg-slate-900 px-2 py-4" />
                    )}
                    {selectedYears.map((year) => (
                      <td
                        key={year}
                        className="px-2 py-4 text-right tabular-nums font-mono text-sm"
                      >
                        {formatCurrency(yearTotals[year] || 0)}
                      </td>
                    ))}
                    <td className="px-2 py-4 text-right tabular-nums font-mono font-black text-lg text-[#00C896]">
                      {formatCurrency(totalFaturamento)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info helper */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium justify-center">
        <Filter className="h-3 w-3" />
        Use os filtros acima para comparar performance anual entre carteiras. Os dados são provenientes do Omie ERP.
      </div>

      {/* Transfer Modal */}
      <TransferModal open={transferOpen} onOpenChange={setTransferOpen} />
    </div>
  )
}
