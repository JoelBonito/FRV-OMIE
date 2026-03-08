import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSyncLogs, getConfigOmie, triggerSync, type SyncType, type SyncMode } from '@/services/api/sync'

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
  mode?: SyncMode
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
    mutationFn: ({ type = 'full', mode = 'incremental' }: TriggerSyncParams = {}) =>
      triggerSync(type, mode),
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
 * Runs on mount + checks every 30 min for users with dashboard open all day.
 * Uses server-side lock (409 response) as primary protection.
 */
export function useAutoSync() {
  const { data: config } = useConfigOmie()
  const triggered = useRef(false)
  const queryClient = useQueryClient()
  const autoSyncingRef = useRef(false)

  useEffect(() => {
    if (!config || !config.has_credentials) return

    const runAutoSync = async () => {
      if (autoSyncingRef.current) return
      if (config.status_sync === 'running') return

      const interval = (config.sync_interval_hours ?? 6) * 60 * 60 * 1000
      const lastSync = config.ultimo_sync ? new Date(config.ultimo_sync).getTime() : 0
      const elapsed = Date.now() - lastSync

      if (elapsed <= interval) return

      autoSyncingRef.current = true
      const stages: SyncType[] = ['vendedores', 'clientes', 'vendas']

      try {
        for (const stage of stages) {
          try {
            await triggerSync(stage, 'incremental')
          } catch (err) {
            // 409 = server lock active, stop trying
            if (err instanceof Error && err.message.includes('409')) break
          }
        }
      } finally {
        autoSyncingRef.current = false
        queryClient.invalidateQueries()
      }
    }

    // Run once on mount
    if (!triggered.current) {
      triggered.current = true
      runAutoSync()
    }

    // Check every 30 minutes for long-lived sessions
    const timer = setInterval(runAutoSync, 30 * 60 * 1000)
    return () => clearInterval(timer)
  }, [config, queryClient])

  return { isSyncing: autoSyncingRef.current }
}
