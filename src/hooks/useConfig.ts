import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConfigOmie, upsertConfigOmie } from '@/services/api/config'
import type { InsertTables } from '@/lib/types/database'

export function useConfigOmie() {
  return useQuery({
    queryKey: ['config-omie'],
    queryFn: getConfigOmie,
  })
}

export function useUpsertConfigOmie() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      config,
      existingId,
    }: {
      config: InsertTables<'config_omie'>
      existingId?: string
    }) => upsertConfigOmie(config, existingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-omie'] })
    },
  })
}
