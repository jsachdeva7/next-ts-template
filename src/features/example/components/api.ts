import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/lib/http'

export type VersionResponse = { version: string }

// single source of truth for keys
export const exampleKeys = {
  version: ['version'] as const
}

// queryFn (server facing)
export function getVersion() {
  return fetchJson<VersionResponse>('/api/version')
}

// hook (client facing)
export function useVersionQuery() {
  return useQuery({
    queryKey: exampleKeys.version,
    queryFn: getVersion,
    staleTime: 60_000
  })
}
