import { useQuery } from '@tanstack/react-query'
import {
  getChurnPorAdministradora,
  getClientesChurn,
  getClientesNovos,
  getClientesComparacao,
  getTopQuedas,
  getComparacaoPorVendedor,
  getComparacaoPorTipo,
} from '@/services/api/comparacao'

export function useChurnPorAdministradora(
  ano1: number, mes1: number,
  ano2: number, mes2: number
) {
  return useQuery({
    queryKey: ['churn-administradora', ano1, mes1, ano2, mes2],
    queryFn: () => getChurnPorAdministradora(ano1, mes1, ano2, mes2),
    enabled: ano1 > 0 && mes1 > 0 && ano2 > 0 && mes2 > 0,
  })
}

export function useClientesChurn(
  anoRef: number, mesRef: number,
  anoAtual: number, mesAtual: number
) {
  return useQuery({
    queryKey: ['clientes-churn', anoRef, mesRef, anoAtual, mesAtual],
    queryFn: () => getClientesChurn(anoRef, mesRef, anoAtual, mesAtual),
    enabled: anoRef > 0 && mesRef > 0 && anoAtual > 0 && mesAtual > 0,
  })
}

export function useClientesNovos(
  anoRef: number, mesRef: number,
  anoAtual: number, mesAtual: number
) {
  return useQuery({
    queryKey: ['clientes-novos', anoRef, mesRef, anoAtual, mesAtual],
    queryFn: () => getClientesNovos(anoRef, mesRef, anoAtual, mesAtual),
    enabled: anoRef > 0 && mesRef > 0 && anoAtual > 0 && mesAtual > 0,
  })
}

export function useTopQuedas(
  ano1: number, mes1: number,
  ano2: number, mes2: number,
  limit = 5
) {
  return useQuery({
    queryKey: ['top-quedas', ano1, mes1, ano2, mes2, limit],
    queryFn: () => getTopQuedas(ano1, mes1, ano2, mes2, limit),
    enabled: ano1 > 0 && mes1 > 0 && ano2 > 0 && mes2 > 0,
  })
}

export function useClientesComparacao(
  ano1: number, mes1: number,
  ano2: number, mes2: number
) {
  return useQuery({
    queryKey: ['clientes-comparacao', ano1, mes1, ano2, mes2],
    queryFn: () => getClientesComparacao(ano1, mes1, ano2, mes2),
    enabled: ano1 > 0 && mes1 > 0 && ano2 > 0 && mes2 > 0,
  })
}

export function useComparacaoPorVendedor(
  ano1: number, mes1: number,
  ano2: number, mes2: number
) {
  return useQuery({
    queryKey: ['comparacao-vendedor', ano1, mes1, ano2, mes2],
    queryFn: () => getComparacaoPorVendedor(ano1, mes1, ano2, mes2),
    enabled: ano1 > 0 && mes1 > 0 && ano2 > 0 && mes2 > 0,
  })
}

export function useComparacaoPorTipo(
  ano1: number, mes1: number,
  ano2: number, mes2: number
) {
  return useQuery({
    queryKey: ['comparacao-tipo', ano1, mes1, ano2, mes2],
    queryFn: () => getComparacaoPorTipo(ano1, mes1, ano2, mes2),
    enabled: ano1 > 0 && mes1 > 0 && ano2 > 0 && mes2 > 0,
  })
}
