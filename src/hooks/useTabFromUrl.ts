import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'

/**
 * Syncs a tab/mode state with a URL query parameter.
 * Removes the param when value matches defaultValue to keep URLs clean.
 */
export function useTabFromUrl(paramName: string, defaultValue: string) {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = searchParams.get(paramName) ?? defaultValue

  const setValue = useCallback(
    (newValue: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (newValue === defaultValue) {
            next.delete(paramName)
          } else {
            next.set(paramName, newValue)
          }
          return next
        },
        { replace: true },
      )
    },
    [paramName, defaultValue, setSearchParams],
  )

  return [value, setValue] as const
}
