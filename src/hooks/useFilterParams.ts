import { useSearchParams } from 'react-router-dom'

/**
 * Reads URL query params and returns typed filter values.
 * Used by pages that receive drill-down navigation from Dashboard.
 */
export function useFilterParams() {
  const [searchParams] = useSearchParams()

  return {
    ano: searchParams.has('ano') ? Number(searchParams.get('ano')) : undefined,
    mes: searchParams.has('mes') ? Number(searchParams.get('mes')) : undefined,
    tipo: searchParams.get('tipo') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    vendedor: searchParams.get('vendedor') ?? undefined,
    tab: searchParams.get('tab') ?? undefined,
  }
}
