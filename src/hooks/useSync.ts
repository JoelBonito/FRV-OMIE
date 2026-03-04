import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSyncLogs, getConfigOmie, triggerSync, type SyncType } from '@/services/api/sync'

export function useSyncLogs(limit = 50) {
  return useQuery({
    queryKey: ['sync-logs', limit],
    queryFn: () => getSyncLogs(limit),
  })
}

export function useConfigOmie() {
  return useQuery({
    queryKey: ['config-omie'],
    queryFn: getConfigOmie,
  })
}

interface TriggerSyncParams {
  type?: SyncType
  maxPages?: number
}

// Global lock to prevent concurrent syncs (auto-sync vs manual button)
let syncLock = false
export function isSyncLocked() { return syncLock }
export function acquireSyncLock() {
  if (syncLock) return false
  syncLock = true
  return true
}
export function releaseSyncLock() { syncLock = false }

export function useTriggerSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ type = 'full', maxPages }: TriggerSyncParams = {}) =>
      triggerSync(type, maxPages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] })
      queryClient.invalidateQueries({ queryKey: ['config-omie'] })
      queryClient.invalidateQueries({ queryKey: ['vendedores'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['vendas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

/**
 * Auto-sync: triggers a full sequential sync if the last sync was more than
 * `intervalHours` ago. Works on any Supabase plan (no pg_cron needed).
 * Runs once on mount. Respects global sync lock to avoid race conditions.
 */
export function useAutoSync() {
  const { data: config } = useConfigOmie()
  const triggered = useRef(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (triggered.current || !config || !config.has_credentials) return

    const interval = (config.sync_interval_hours ?? 6) * 60 * 60 * 1000
    const lastSync = config.ultimo_sync ? new Date(config.ultimo_sync).getTime() : 0
    const elapsed = Date.now() - lastSync

    if (elapsed > interval && config.status_sync !== 'running') {
      triggered.current = true

      // Acquire lock — if another sync is already running, skip
      if (!acquireSyncLock()) return

      const stages: Array<'vendedores' | 'clientes' | 'vendas'> = ['vendedores', 'clientes', 'vendas']

      ;(async () => {
        try {
          for (const stage of stages) {
            await triggerSync(stage, 50)
          }
        } catch {
          // Silent fail — user can check sync page for errors
        } finally {
          releaseSyncLock()
          queryClient.invalidateQueries({ queryKey: ['sync-logs'] })
          queryClient.invalidateQueries({ queryKey: ['config-omie'] })
          queryClient.invalidateQueries({ queryKey: ['vendedores'] })
          queryClient.invalidateQueries({ queryKey: ['clientes'] })
          queryClient.invalidateQueries({ queryKey: ['vendas'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        }
      })()
    }
  }, [config, queryClient])
}
