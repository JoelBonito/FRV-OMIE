import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  ArrowLeft,
  Pencil,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClienteFormDialog } from './components/ClienteFormDialog'
import { useCliente, useDeleteCliente } from '@/hooks/useClientes'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatMonthYear } from '@/lib/formatters'
import { TYPE_LABEL, TYPE_BADGE_COLORS } from '@/lib/theme-constants'
import type { Tables } from '@/lib/types/database'
import type { ClienteWithVendedor } from '@/services/api/clientes'

type Venda = Tables<'vendas'>



export function ClienteDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: cliente, isLoading } = useCliente(id)
  const deleteMutation = useDeleteCliente()
  const [editOpen, setEditOpen] = useState(false)

  const { data: vendas } = useQuery({
    queryKey: ['vendas-cliente', id],
    queryFn: async (): Promise<Venda[]> => {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('cliente_id', id!)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
      if (error) throw error
      return (data ?? []) as Venda[]
    },
    enabled: !!id,
  })

  function handleDelete() {
    if (!cliente || !confirm(`Excluir cliente "${cliente.nome}"?`)) return
    deleteMutation.mutate(cliente.id, {
      onSuccess: () => {
        toast.success('Cliente excluído')
        navigate('/clientes')
      },
      onError: () => toast.error('Erro ao excluir cliente'),
    })
  }

  const chartData =
    vendas
      ?.slice()
      .sort((a, b) => a.ano * 100 + a.mes - (b.ano * 100 + b.mes))
      .map((v) => ({
        name: formatMonthYear(v.mes, v.ano),
        valor: v.valor,
      })) ?? []

  const totalVendas = vendas?.reduce((sum, v) => sum + v.valor, 0) ?? 0
  const mediaVendas = vendas?.length ? totalVendas / vendas.length : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/clientes')}>
          Voltar
        </Button>
      </div>
    )
  }

  const clienteForDialog: ClienteWithVendedor = {
    ...cliente,
    vendedores: cliente.vendedores
      ? { nome: cliente.vendedores.nome }
      : null,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/clientes')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Clientes
          </button>
          <h2 className="text-3xl font-extrabold tracking-tight">{cliente.nome}</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            <InfoItem label="Tipo">
              {(() => {
                const color = TYPE_BADGE_COLORS[cliente.tipo]
                const badgeClass = color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                  color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' :
                    color === 'teal' ? 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400' :
                      'bg-muted text-muted-foreground'
                return (
                  <Badge variant="outline" className={badgeClass}>
                    {TYPE_LABEL[cliente.tipo] ?? cliente.tipo}
                  </Badge>
                )
              })()}
            </InfoItem>
            <InfoItem label="Status">
              <Badge
                variant="outline"
                className={
                  cliente.status === 'ativo'
                    ? 'bg-[#00C896]/10 text-[#00C896] border-[#00C896]/20'
                    : 'bg-destructive/10 text-destructive border-destructive/20'
                }
              >
                {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
            </InfoItem>
            <InfoItem label="Vendedor">
              {cliente.vendedores?.nome ?? '—'}
            </InfoItem>
            <InfoItem label="CNPJ">{cliente.cnpj ?? '—'}</InfoItem>
            <InfoItem label="Email">{cliente.email ?? '—'}</InfoItem>
            <InfoItem label="Telefone">{cliente.telefone ?? '—'}</InfoItem>
            {cliente.notas && (
              <div className="col-span-full">
                <InfoItem label="Notas">{cliente.notas}</InfoItem>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="historico">
        <TabsList>
          <TabsTrigger value="historico">Histórico de Vendas</TabsTrigger>
          <TabsTrigger value="transferencias">Transferências</TabsTrigger>
        </TabsList>

        <TabsContent value="historico" className="space-y-4 mt-4">
          {/* Mini chart */}
          {chartData.length > 1 && (
            <Card>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                      }
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      formatter={(value: number | undefined) =>
                        value !== undefined ? formatCurrency(value) : ''
                      }
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      name="Valor"
                      stroke="#00C896"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Vendas table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês/Ano</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>NF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas && vendas.length > 0 ? (
                    vendas.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          {formatMonthYear(v.mes, v.ano)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(v.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              v.status === 'faturado'
                                ? 'bg-success/10 text-success border-success/20'
                                : v.status === 'pendente'
                                  ? 'bg-warning/10 text-warning-foreground border-warning/20'
                                  : 'bg-destructive/10 text-destructive border-destructive/20'
                            }
                          >
                            {v.status === 'faturado'
                              ? 'Faturado'
                              : v.status === 'pendente'
                                ? 'Pendente'
                                : 'Cancelado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {v.nota_fiscal ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhuma venda registrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Totals */}
          {vendas && vendas.length > 0 && (
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>
                Média:{' '}
                <strong className="text-foreground tabular-nums font-mono">
                  {formatCurrency(mediaVendas)}
                </strong>
              </span>
              <span>
                Total:{' '}
                <strong className="text-foreground tabular-nums font-mono">
                  {formatCurrency(totalVendas)}
                </strong>
              </span>
              <span>{vendas.length} registros</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="transferencias" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                Histórico de transferências será exibido aqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <ClienteFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        cliente={clienteForDialog}
      />
    </div>
  )
}

function InfoItem({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  )
}
