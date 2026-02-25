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
import { useResumoGlobal } from '@/hooks/useDashboard'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const MONTH_ABBR = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

interface ResumoGlobalTableProps {
  ano: number
}

interface RowConfig {
  key: string
  label: string
  dotColor: string
}

const ROW_CONFIG: RowConfig[] = [
  { key: 'adm', label: 'Administradoras', dotColor: 'bg-[#0066FF]' },
  { key: 'emp', label: 'Empresas', dotColor: 'bg-amber-500' },
  { key: 'sind', label: 'Sindicos', dotColor: 'bg-[#00C896]' },
  { key: 'cf', label: 'Cons. Final', dotColor: 'bg-slate-400' },
]

/** Compact currency: "R$ 76,9k" for thousands, full format below 1000 */
function formatCompactCurrency(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`
  }
  return formatCurrency(value)
}

export function ResumoGlobalTable({ ano }: ResumoGlobalTableProps) {
  const { data, isLoading } = useResumoGlobal(ano)

  const { months, rowData, annualTotals } = useMemo(() => {
    if (!data?.length) {
      return {
        months: [] as number[],
        rowData: {} as Record<string, Record<number, number>>,
        annualTotals: { adm: 0, emp: 0, sind: 0, cf: 0, admSind: 0, empCf: 0, geral: 0 },
      }
    }

    const sorted = [...data].sort((a, b) => a.mes - b.mes)
    const meses = sorted.map((d) => d.mes)

    // Build monthly values per row key
    const rows: Record<string, Record<number, number>> = {
      adm: {},
      emp: {},
      sind: {},
      cf: {},
      geral: {},
    }

    const totals = { adm: 0, emp: 0, sind: 0, cf: 0, admSind: 0, empCf: 0, geral: 0 }

    for (const d of sorted) {
      const admVal = d.total_adm ?? 0
      const empVal = d.total_empresas ?? 0
      const sindVal = d.total_sindicos ?? 0
      const cfVal = d.total_cf ?? 0
      const geralVal = d.total_geral ?? 0

      rows.adm[d.mes] = admVal
      rows.emp[d.mes] = empVal
      rows.sind[d.mes] = sindVal
      rows.cf[d.mes] = cfVal
      rows.geral[d.mes] = geralVal

      totals.adm += admVal
      totals.emp += empVal
      totals.sind += sindVal
      totals.cf += cfVal
      totals.geral += geralVal
    }

    totals.admSind = totals.adm + totals.sind
    totals.empCf = totals.emp + totals.cf

    return { months: meses, rowData: rows, annualTotals: totals }
  }, [data])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        Nenhum dado disponivel para {ano}.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* --- TOP SECTION: Annual KPI Summary Cards --- */}
      <div className="space-y-3">
        {/* Row 1: 4 category cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Administradoras"
            value={annualTotals.adm}
            accent="primary"
          />
          <SummaryCard
            label="Empresas"
            value={annualTotals.emp}
            accent="amber"
          />
          <SummaryCard
            label="Sindicos"
            value={annualTotals.sind}
            accent="teal"
          />
          <SummaryCard
            label="Cons. Final"
            value={annualTotals.cf}
            accent="slate"
          />
        </div>

        {/* Row 2: 2 subtotals + grand total */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-l-4 border-l-[#0066FF] bg-blue-50/50 py-3 dark:bg-blue-950/20">
            <CardContent className="px-4 py-0">
              <p className="text-xs font-medium text-muted-foreground">ADM + Sindicos</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-blue-700 dark:text-blue-300 font-mono">
                {formatCurrency(annualTotals.admSind)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 py-3 dark:bg-orange-950/20">
            <CardContent className="px-4 py-0">
              <p className="text-xs font-medium text-muted-foreground">Empresas + Cons. Final</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-orange-700 dark:text-orange-300 font-mono">
                {formatCurrency(annualTotals.empCf)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0066FF] py-3 text-white shadow-lg shadow-[#0066FF]/20">
            <CardContent className="px-4 py-0">
              <p className="text-xs font-medium opacity-80">TOTAL GERAL</p>
              <p className="mt-1 text-xl font-bold tabular-nums font-mono">
                {formatCurrency(annualTotals.geral)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- BOTTOM SECTION: Monthly Detail Table --- */}
      <div className="rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className={cn(
                    'sticky left-0 z-20 min-w-[160px] bg-background',
                    'shadow-[4px_0_6px_-4px_rgba(0,0,0,0.1)]'
                  )}
                >
                  Tipo de Cliente
                </TableHead>
                {months.map((mes) => (
                  <TableHead key={mes} className="min-w-[100px] text-right">
                    {MONTH_ABBR[mes - 1]}
                  </TableHead>
                ))}
                <TableHead
                  className={cn(
                    'sticky right-0 z-20 min-w-[110px] text-right',
                    'bg-muted/50 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]'
                  )}
                >
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {ROW_CONFIG.map((row, idx) => {
                const values = rowData[row.key] ?? {}
                const total = Object.values(values).reduce((s, v) => s + v, 0)

                return (
                  <TableRow
                    key={row.key}
                    className={cn(idx % 2 === 1 && 'bg-muted/30')}
                  >
                    <TableCell
                      className={cn(
                        'sticky left-0 z-10 px-4 py-3 font-medium',
                        idx % 2 === 1 ? 'bg-muted/30' : 'bg-background',
                        'shadow-[4px_0_6px_-4px_rgba(0,0,0,0.1)]'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn('inline-block h-2.5 w-2.5 rounded-full', row.dotColor)} />
                        {row.label}
                      </span>
                    </TableCell>
                    {months.map((mes) => (
                      <TableCell key={mes} className="px-4 py-3 text-right tabular-nums font-mono">
                        {values[mes] ? formatCompactCurrency(values[mes]) : '\u2014'}
                      </TableCell>
                    ))}
                    <TableCell
                      className={cn(
                        'sticky right-0 z-10 px-4 py-3 text-right tabular-nums font-bold font-mono',
                        'bg-muted/50 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]'
                      )}
                    >
                      {formatCompactCurrency(total)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>

            <TableFooter>
              <TableRow className="bg-gradient-to-r from-[#0066FF]/10 to-transparent font-bold border-t-2 border-[#0066FF]/30">
                <TableCell
                  className={cn(
                    'sticky left-0 z-10 px-4 py-3 bg-muted/50',
                    'shadow-[4px_0_6px_-4px_rgba(0,0,0,0.1)]'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0066FF]" />
                    TOTAL GERAL
                  </span>
                </TableCell>
                {months.map((mes) => {
                  const val = rowData.geral?.[mes] ?? 0
                  return (
                    <TableCell key={mes} className="px-4 py-3 text-right tabular-nums font-mono">
                      {val ? formatCompactCurrency(val) : '\u2014'}
                    </TableCell>
                  )
                })}
                <TableCell
                  className={cn(
                    'sticky right-0 z-10 px-4 py-3 text-right tabular-nums font-bold font-mono',
                    'bg-muted/70 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]'
                  )}
                >
                  {formatCompactCurrency(annualTotals.geral)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SummaryCard - reusable accent card for Row 1                      */
/* ------------------------------------------------------------------ */

const ACCENT_MAP = {
  primary: {
    border: 'border-l-[#0066FF]',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-300',
  },
  teal: {
    border: 'border-l-[#00C896]',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    text: 'text-teal-700 dark:text-teal-300',
  },
  amber: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-300',
  },
  slate: {
    border: 'border-l-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-950/20',
    text: 'text-slate-700 dark:text-slate-300',
  },
} as const

type Accent = keyof typeof ACCENT_MAP

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: Accent
}) {
  const colors = ACCENT_MAP[accent]

  return (
    <Card className={cn('border-l-4 py-3', colors.border, colors.bg)}>
      <CardContent className="px-4 py-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn('mt-1 text-lg font-bold tabular-nums font-mono', colors.text)}>
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  )
}
