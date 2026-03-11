import { useQuery } from '@tanstack/react-query'
import { getCurvaAbcValor, getCurvaAbcQuantidade } from '@/services/api/curva-abc'

export function useCurvaAbcValor() {
  return useQuery({
    queryKey: ['curva-abc-valor'],
    queryFn: getCurvaAbcValor,
  })
}

export function useCurvaAbcQuantidade() {
  return useQuery({
    queryKey: ['curva-abc-quantidade'],
    queryFn: getCurvaAbcQuantidade,
  })
}
