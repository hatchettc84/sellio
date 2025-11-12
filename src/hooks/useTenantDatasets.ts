'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import type { TenantSummaryDataset } from '@/lib/types/tenant'

interface UseTenantDatasetsResult {
  datasets: TenantSummaryDataset[]
  isLoading: boolean
  error: string | null
}

export function useTenantDatasets(tenantId?: string | null): UseTenantDatasetsResult {
  const [datasets, setDatasets] = useState<TenantSummaryDataset[]>([])
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

    const fetchDatasets = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await apiFetch<{ datasets: TenantSummaryDataset[] }>('/v1/tenants/datasets', {
          headers: {
            'x-tenant-id': resolvedTenantId,
          },
        })

        if (isCurrent) {
          setDatasets(response.datasets ?? [])
        }
      } catch (err) {
        if (isCurrent) {
          setError(err instanceof Error ? err.message : 'Failed to load datasets')
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    fetchDatasets()

    return () => {
      isCurrent = false
    }
  }, [resolvedTenantId])

  return { datasets, isLoading, error }
}
