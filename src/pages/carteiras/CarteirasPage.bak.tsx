import { useState, useMemo } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { TransferModal } from './components/TransferModal'
import {
  useCarteiraDetalhada,
  useVendedoresForTabs,
} from '@/hooks/useCarteiras'
import { formatCurrency, formatMonthYear } from '@/lib/formatters'

export function CarteirasPage() {
  const { data: vendedores, isLoading: loadingVendedores } =
    useVendedoresForTabs()
  const [selectedTab, setSelectedTab] = useState<string>('todos')
  const [transferOpen, setTransferOpen] = useState(false)

  const vendedorId =
    selectedTab === 'todos' ? undefined : selectedTab

  const { data: carteira, isLoading: loadingCarteira } =
    useCarteiraDetalhada(vendedorId)

  // Extract unique months (sorted) for columns
  const months = useMemo(() => {
    if (!carteira) return []
    const set = new Map<string, { ano: number; mes: number }>()
    for (const row of carteira) {
      const key = `${row.ano}-${String(row.mes).padStart(2, '0')}`
      if (!set.has(key)) set.set(key, { ano: row.ano, mes: row.mes })
    }
    return [...set.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({ key, ...val }))
  }, [carteira])

  // Build pivot: { clienteId -> { nome, values: { "2025-06": valor }, media } }
  const pivotRows = useMemo(() => {
    if (!carteira) return []

    const map = new Map<
      string,
      {
        clienteId: string
        nome: string
        tipo: string
        values: Record<string, number>
        media: number
        total: number
        count: number
      }
    >()

    for (const row of carteira) {
      const key = row.cliente_id
      if (!map.has(key)) {
        map.set(key, {
          clienteId: row.cliente_id,
          nome: row.cliente,
          tipo: row.tipo,
          values: {},
          media: row.media_cliente,
          total: 0,
          count: 0,
        })
      }
      const entry = map.get(key)!
      const monthKey = `${row.ano}-${String(row.mes).padStart(2, '0')}`
      entry.values[monthKey] = row.valor
      entry.total += row.valor
      entry.count++
    }

    // Recalculate media
    for (const entry of map.values()) {
      entry.media = entry.count > 0 ? entry.total / entry.count : 0
    }

    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome))
  }, [carteira])

  // Monthly totals row
  const monthTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const row of pivotRows) {
      for (const [key, val] of Object.entries(row.values)) {
        totals[key] = (totals[key] ?? 0) + val
      }
    }
    return totals
  }, [pivotRows])

  // Summary stats
  const totalClientes = pivotRows.length
  const fatMes = months.length
    ? monthTotals[months[months.length - 1].key] ?? 0
    : 0
  const mediaCliente = totalClientes > 0 ? fatMes / totalClientes : 0

  // Global media for color coding
  const globalMedia = useMemo(() => {
    let total = 0
    let count = 0
    for (const row of pivotRows) {
      for (const val of Object.values(row.values)) {
        total += val
        count++
      }
    }
    return count > 0 ? total / count : 0
  }, [pivotRows])

  if (loadingVendedores) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Carteiras</h2>
          <p className="text-muted-foreground">
            Distribuição de clientes por vendedor
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setTransferOpen(true)}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transferir Cliente
        </Button>
      </div>

      {/* Vendedor Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="todos">Visão Geral</TabsTrigger>
          {vendedores?.map((v) => (
            <TabsTrigger key={v.id} value={v.id}>
              {v.nome}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Summary stats */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 p-4">
          <div>
            <span className="text-xs text-muted-foreground">
              Total Clientes
            </span>
            <p className="text-lg font-bold tabular-nums">{totalClientes}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-xs text-muted-foreground">
              Faturamento Mês
            </span>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(fatMes)}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-xs text-muted-foreground">
              Média/Cliente
            </span>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(mediaCliente)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pivot Table */}
      <Card>
        <CardContent className="p-0">
          {loadingCarteira ? (
            <div className="p-6">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : pivotRows.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Sem dados para o período selecionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium text-foreground min-w-[200px]">
                      Cliente
                    </th>
                    {months.map((m) => (
                      <th
                        key={m.key}
                        className="px-3 py-3 text-right font-medium text-muted-foreground whitespace-nowrap min-w-[90px]"
                      >
                        {formatMonthYear(m.mes, m.ano)}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right font-medium text-foreground min-w-[90px]">
                      Média
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pivotRows.map((row, i) => (
                    <tr
                      key={row.clienteId}
                      className={`border-b transition-colors hover:bg-muted/30 ${
                        i % 2 === 1 ? 'bg-muted/20' : ''
                      }`}
                    >
                      <td className="sticky left-0 z-10 bg-background px-4 py-2.5 font-medium">
                        {row.nome}
                      </td>
                      {months.map((m) => {
                        const val = row.values[m.key]
                        if (val === undefined) {
                          return (
                            <td
                              key={m.key}
                              className="px-3 py-2.5 text-right text-muted-foreground"
                            >
                              —
                            </td>
                          )
                        }
                        const isAbove = val >= globalMedia
                        return (
                          <td
                            key={m.key}
                            className={`px-3 py-2.5 text-right tabular-nums font-medium ${
                              isAbove ? 'text-success' : 'text-destructive'
                            }`}
                          >
                            {val.toLocaleString('pt-BR')}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                        {row.media.toLocaleString('pt-BR', {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  ))}

                  {/* Totals row */}
                  <tr className="border-t-2 bg-muted/50 font-bold">
                    <td className="sticky left-0 z-10 bg-muted/50 px-4 py-3">
                      TOTAL
                    </td>
                    {months.map((m) => (
                      <td
                        key={m.key}
                        className="px-3 py-3 text-right tabular-nums"
                      >
                        {(monthTotals[m.key] ?? 0).toLocaleString('pt-BR')}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right tabular-nums">
                      {pivotRows.length > 0
                        ? Math.round(
                            pivotRows.reduce((s, r) => s + r.media, 0) /
                              pivotRows.length
                          ).toLocaleString('pt-BR')
                        : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground">
        Valores em R$. Células vazias (—) indicam meses sem faturamento.{' '}
        <span className="text-success">Verde</span> = acima da média,{' '}
        <span className="text-destructive">Vermelho</span> = abaixo da média.
      </p>

      {/* Transfer Modal */}
      <TransferModal open={transferOpen} onOpenChange={setTransferOpen} />
    </div>
  )
}
