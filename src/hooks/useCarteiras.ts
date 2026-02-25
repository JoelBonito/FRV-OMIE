import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCarteiraDetalhada } from '@/services/api/dashboard'
import { getVendedores } from '@/services/api/vendedores'
import { getClientes } from '@/services/api/clientes'
import { supabase } from '@/lib/supabase'

export function useCarteiraDetalhada(vendedorId?: string) {
  return useQuery({
    queryKey: ['carteira-detalhada', vendedorId],
    queryFn: () => getCarteiraDetalhada(vendedorId),
  })
}

export function useVendedoresForTabs() {
  return useQuery({
    queryKey: ['vendedores'],
    queryFn: getVendedores,
  })
}

export function useClientesForTransfer() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: getClientes,
  })
}

export function useTransferirCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      cliente_id: string
      vendedor_anterior_id: string | null
      vendedor_novo_id: string
      motivo: string
      aprovado_por: string | null
    }) => {
      // 1. Update cliente's vendedor_id
      const { error: updateError } = await supabase
        .from('clientes')
        .update({ vendedor_id: params.vendedor_novo_id })
        .eq('id', params.cliente_id)
      if (updateError) throw updateError

      // 2. Insert carteira_historico record
      const { error: histError } = await supabase
        .from('carteira_historico')
        .insert({
          cliente_id: params.cliente_id,
          vendedor_anterior_id: params.vendedor_anterior_id,
          vendedor_novo_id: params.vendedor_novo_id,
          motivo: params.motivo || null,
          aprovado_por: params.aprovado_por,
        })
      if (histError) throw histError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carteira-detalhada'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['vendedores'] })
      queryClient.invalidateQueries({ queryKey: ['vendas-por-vendedor'] })
    },
  })
}
