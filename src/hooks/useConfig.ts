import { useQuery } from '@tanstack/react-query'
import { getConfigOmie } from '@/services/api/config'

export function useConfigOmie() {
  return useQuery({
    queryKey: ['config-omie'],
    queryFn: getConfigOmie,
  })
}
