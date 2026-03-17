const PAGE_SIZE = 1000

interface RangeableQuery {
  range(from: number, to: number): PromiseLike<{ data: any[] | null; error: any }>
}

/**
 * Fetches all rows from a Supabase query, paginating automatically
 * to bypass the PostgREST default max-rows limit of 1000.
 *
 * @param buildQuery - Factory that returns a fresh query builder each call.
 *   Must NOT call `.range()` itself — fetchAll handles pagination.
 */
export async function fetchAll<T>(
  buildQuery: () => RangeableQuery,
): Promise<T[]> {
  const all: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1)
    if (error) throw error

    const rows = (data ?? []) as T[]
    all.push(...rows)

    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return all
}
