import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useVendasPorVendedor } from '@/hooks/useDashboard'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

const PODIUM_COLORS: Record<number, { bg: string; text: string; ring: string }> = {
  0: { bg: 'bg-[#FFD700]', text: 'text-amber-950', ring: 'ring-amber-400/30' },
  1: { bg: 'bg-[#C0C0C0]', text: 'text-slate-900', ring: 'ring-slate-300/30' },
  2: { bg: 'bg-[#CD7F32]', text: 'text-amber-50', ring: 'ring-amber-600/30' },
}

const DEFAULT_AVATAR = { bg: 'bg-[#0066FF]', text: 'text-white', ring: 'ring-[#0066FF]/10' }

interface VendedoresPivotTableProps {
  ano: number
}

interface VendedorRow {
  vendedor: string
  vendedorId: string
  values: Record<number, number>
  clienteCount: Record<number, number>
  total: number
  totalClientes: number
}

// --- Utility functions ---

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0]?.[0]?.toUpperCase() ?? '?'
}

function formatCompactCurrency(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`
  }
  return formatCurrency(value)
}

// --- Sub-components ---

function RankingCardSkeleton() {
  return (
    <Card className="min-w-[220px] shrink-0 py-4">
      <CardContent className="flex flex-col items-center gap-3 px-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-6 w-full" />
      </CardContent>
    </Card>
  )
}

function MiniBarChart({ values, months }: { values: Record<number, number>; months: number[] }) {
  const maxVal = Math.max(...months.map(m => values[m] ?? 0), 1)

  return (
    <div className="flex items-end gap-[3px] h-8 w-full mt-2">
      {months.map(m => {
        const val = values[m] ?? 0
        const heightPercent = Math.max((val / maxVal) * 100, 2)
        return (
          <div
            key={m}
            className="flex-1 rounded-sm bg-[#0066FF]/20 transition-all duration-300 hover:bg-[#0066FF]/40"
            style={{ height: `${heightPercent}%` }}
            title={`${MONTH_LABELS[m - 1]}: ${formatCurrency(val)}`}
          />
        )
      })}
    </div>
  )
}

function VendedorRankingCard({
  row,
  rank,
  months,
}: {
  row: VendedorRow
  rank: number
  months: number[]
}) {
  const colors = PODIUM_COLORS[rank] ?? DEFAULT_AVATAR
  const displayName = toTitleCase(row.vendedor)

  return (
    <Card className="min-w-[220px] shrink-0 py-4 transition-transform duration-200 hover:scale-[1.02]">
      <CardContent className="flex flex-col items-center gap-2 px-4">
        {/* Avatar */}
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ring-4',
            colors.bg,
            colors.text,
            colors.ring
          )}
        >
          {getInitials(row.vendedor)}
        </div>

        {/* Name */}
        <span className="text-sm font-semibold text-foreground text-center leading-tight">
          {displayName}
        </span>

        {/* Annual total */}
        <span className="text-lg font-bold tabular-nums text-foreground font-mono">
          {formatCompactCurrency(row.total)}
        </span>

        {/* Client count */}
        <span className="text-xs text-muted-foreground">
          {row.totalClientes} cliente{row.totalClientes !== 1 ? 's' : ''} atendido{row.totalClientes !== 1 ? 's' : ''}
        </span>

        {/* Mini bar chart */}
        <MiniBarChart values={row.values} months={months} />
      </CardContent>
    </Card>
  )
}

// --- Main component ---

export function VendedoresPivotTable({ ano }: VendedoresPivotTableProps) {
  const { data, isLoading } = useVendasPorVendedor(ano)

  const { months, rows, totals } = useMemo(() => {
    if (!data?.length)
      return {
        months: [] as number[],
        rows: [] as VendedorRow[],
        totals: { values: {} as Record<number, number>, total: 0 },
      }

    const monthSet = new Set<number>()
    const vendedorMap = new Map<string, VendedorRow>()

    for (const d of data) {
      monthSet.add(d.mes)

      if (!vendedorMap.has(d.vendedor_id)) {
        vendedorMap.set(d.vendedor_id, {
          vendedor: d.vendedor,
          vendedorId: d.vendedor_id,
          values: {},
          clienteCount: {},
          total: 0,
          totalClientes: 0,
        })
      }

      const row = vendedorMap.get(d.vendedor_id)!
      row.values[d.mes] = (row.values[d.mes] ?? 0) + d.total
      row.clienteCount[d.mes] = d.clientes_atendidos
      row.total += d.total
    }

    // Compute unique client counts per vendedor across all months
    for (const row of vendedorMap.values()) {
      const uniqueClients = new Set<number>()
      for (const mes of Object.keys(row.clienteCount)) {
        const count = row.clienteCount[Number(mes)]
        if (count > 0) uniqueClients.add(count)
      }
      // Sum all monthly client counts as best approximation
      row.totalClientes = Object.values(row.clienteCount).reduce((sum, c) => sum + c, 0)
    }

    const meses = [...monthSet].sort((a, b) => a - b)
    const vendedorRows = [...vendedorMap.values()].sort(
      (a, b) => b.total - a.total
    )

    const monthTotals: Record<number, number> = {}
    let grandTotal = 0
    for (const mes of meses) {
      monthTotals[mes] = vendedorRows.reduce(
        (sum, r) => sum + (r.values[mes] ?? 0),
        0
      )
      grandTotal += monthTotals[mes]
    }

    return {
      months: meses,
      rows: vendedorRows,
      totals: { values: monthTotals, total: grandTotal },
    }
  }, [data])

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Ranking cards skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <RankingCardSkeleton key={i} />
          ))}
        </div>
        {/* Table skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // --- Empty state ---
  if (!data?.length) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        Nenhum dado disponivel para {ano}.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* TOP SECTION: Ranking Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {rows.map((row, idx) => (
          <VendedorRankingCard
            key={row.vendedorId}
            row={row}
            rank={idx}
            months={months}
          />
        ))}
      </div>

      {/* BOTTOM SECTION: Monthly Performance Table */}
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="sticky left-0 z-10 bg-background min-w-[180px] shadow-[4px_0_6px_-4px_rgba(0,0,0,0.1)]"
              >
                Vendedor
              </TableHead>
              {months.map((mes) => (
                <TableHead key={mes} className="text-right min-w-[110px]">
                  {MONTH_LABELS[mes - 1]}
                </TableHead>
              ))}
              <TableHead
                className="sticky right-0 z-10 bg-muted/50 text-right min-w-[120px] shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]"
              >
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIdx) => {
              const displayName = toTitleCase(row.vendedor)
              const avatarColors = PODIUM_COLORS[rowIdx] ?? DEFAULT_AVATAR
              const isEven = rowIdx % 2 === 0

              return (
                <TableRow
                  key={row.vendedorId}
                  className={cn(isEven && 'bg-muted/30')}
                >
                  {/* Sticky first col: avatar + name */}
                  <TableCell
                    className={cn(
                      'sticky left-0 z-10 px-4 py-3 font-medium shadow-[4px_0_6px_-4px_rgba(0,0,0,0.1)]',
                      isEven ? 'bg-muted/30' : 'bg-background'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                          avatarColors.bg,
                          avatarColors.text
                        )}
                      >
                        {getInitials(row.vendedor)}
                      </div>
                      <span className="truncate">{displayName}</span>
                    </div>
                  </TableCell>

                  {/* Monthly cells */}
                  {months.map((mes) => {
                    const val = row.values[mes]
                    const clientCount = row.clienteCount[mes]

                    return (
                      <TableCell key={mes} className="px-4 py-3 text-right tabular-nums">
                        {val ? (
                          <div>
                            <div className="text-sm font-bold font-mono text-foreground">{formatCompactCurrency(val)}</div>
                            {clientCount > 0 && (
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                {clientCount} cli
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">&mdash;</span>
                        )}
                      </TableCell>
                    )
                  })}

                  {/* Sticky total col */}
                  <TableCell
                    className={cn(
                      'sticky right-0 z-10 px-4 py-3 text-right tabular-nums font-bold font-mono shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]',
                      isEven ? 'bg-muted/30' : 'bg-background'
                    )}
                  >
                    {formatCompactCurrency(row.total)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/50 font-bold">
              <TableCell className="sticky left-0 z-10 bg-muted/50 px-4 py-3 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.1)]">
                VENDAS TOTAIS
              </TableCell>
              {months.map((mes) => (
                <TableCell key={mes} className="px-4 py-3 text-right tabular-nums font-mono">
                  {formatCompactCurrency(totals.values[mes] ?? 0)}
                </TableCell>
              ))}
              <TableCell className="sticky right-0 z-10 bg-muted px-4 py-3 text-right tabular-nums font-bold font-mono shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]">
                {formatCompactCurrency(totals.total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
