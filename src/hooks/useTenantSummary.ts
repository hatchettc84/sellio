'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import type { TenantSummary } from '@/lib/types/tenant'

interface UseTenantSummaryResult {
  data: TenantSummary | null
  isLoading: boolean
  error: string | null
}

export function useTenantSummary(tenantId?: string | null): UseTenantSummaryResult {
  const [data, setData] = useState<TenantSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedTenantId = useMemo(() => {
    if (!tenantId) {
      return null
    }
    return tenantId
  }, [tenantId])

  useEffect(() => {
    if (!resolvedTenantId) {
      return
    }

    let isCurrent = true

    const fetchSummary = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const summary = await apiFetch<TenantSummary>('/v1/tenants/summary', {
          headers: {
            'x-tenant-id': resolvedTenantId,
          },
        })

        if (isCurrent) {
          setData(summary)
        }
      } catch (err) {
        if (isCurrent) {
          setError(err instanceof Error ? err.message : 'Failed to fetch tenant summary')
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    fetchSummary()

    return () => {
      isCurrent = false
    }
  }, [resolvedTenantId])

  return { data, isLoading, error }
}
