import { useQuery } from '@tanstack/react-query'
import {
  getPedidos,
  getPedido,
  getPedidoItens,
  getPedidoStats,
  type PedidoFilters,
} from '@/services/api/pedidos'

export function usePedidos(filters?: PedidoFilters) {
  return useQuery({
    queryKey: ['pedidos', filters],
    queryFn: () => getPedidos(filters),
  })
}

export function usePedido(id: string | null) {
  return useQuery({
    queryKey: ['pedido', id],
    queryFn: () => getPedido(id!),
    enabled: !!id,
  })
}

export function usePedidoItens(pedidoId: string | null) {
  return useQuery({
    queryKey: ['pedido-itens', pedidoId],
    queryFn: () => getPedidoItens(pedidoId!),
    enabled: !!pedidoId,
  })
}

export function usePedidoStats() {
  return useQuery({
    queryKey: ['pedido-stats'],
    queryFn: getPedidoStats,
  })
}
