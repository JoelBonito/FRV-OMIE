import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types/database'

type Pedido = Tables<'pedidos'>
type PedidoItem = Tables<'pedido_itens'>

export interface PedidoWithRelations extends Pedido {
  clientes: { nome: string } | null
  vendedores: { nome: string } | null
}

export interface PedidoFilters {
  etapa?: string
  vendedor_id?: string
  dateFrom?: string
  dateTo?: string
}

export interface PedidoStats {
  etapa: string
  count: number
  valor_total: number
}

export async function getPedidos(filters?: PedidoFilters): Promise<PedidoWithRelations[]> {
  let query = supabase
    .from('pedidos')
    .select('*, clientes(nome), vendedores(nome)')
    .order('data_pedido', { ascending: false })

  if (filters?.etapa) query = query.eq('etapa', filters.etapa)
  if (filters?.vendedor_id) query = query.eq('vendedor_id', filters.vendedor_id)
  if (filters?.dateFrom) query = query.gte('data_pedido', filters.dateFrom)
  if (filters?.dateTo) query = query.lte('data_pedido', filters.dateTo)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as PedidoWithRelations[]
}

export async function getPedido(id: string): Promise<PedidoWithRelations | null> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, clientes(nome), vendedores(nome)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as PedidoWithRelations | null
}

export async function getPedidoItens(pedidoId: string): Promise<PedidoItem[]> {
  const { data, error } = await supabase
    .from('pedido_itens')
    .select('*')
    .eq('pedido_id', pedidoId)
    .order('valor_total', { ascending: false })
  if (error) throw error
  return (data ?? []) as PedidoItem[]
}

export async function getPedidoStats(): Promise<PedidoStats[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('etapa, valor_total')

  if (error) throw error

  const statsMap = new Map<string, { count: number; valor_total: number }>()
  for (const row of (data ?? []) as Pedido[]) {
    const etapa = row.etapa || 'SEM ETAPA'
    const entry = statsMap.get(etapa) || { count: 0, valor_total: 0 }
    entry.count++
    entry.valor_total += row.valor_total
    statsMap.set(etapa, entry)
  }

  return Array.from(statsMap.entries()).map(([etapa, stats]) => ({
    etapa,
    ...stats,
  }))
}
