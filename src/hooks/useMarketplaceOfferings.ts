'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api-client'

export interface MarketplaceOffering {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  rating: number
  reviews: number
  status: 'draft' | 'published'
  createdAt: string
}

interface UseMarketplaceOfferingsOptions {
  tenantId?: string | null
}

interface UseMarketplaceOfferingsResult {
  offerings: MarketplaceOffering[]
  isLoading: boolean
  error: string | null
}

export function useMarketplaceOfferings(options: UseMarketplaceOfferingsOptions = {}): UseMarketplaceOfferingsResult {
  const { tenantId } = options
  const [offerings, setOfferings] = useState<MarketplaceOffering[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedTenantId = useMemo(() => {
    if (!tenantId) {
      return null
    }
    return tenantId
  }, [tenantId])

  useEffect(() => {
    let isCurrent = true

    const fetchOfferings = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await apiFetch<{ offerings: MarketplaceOffering[] }>('/v1/marketplace/offerings', {
          headers: resolvedTenantId ? { 'x-tenant-id': resolvedTenantId } : undefined,
        })

        if (isCurrent) {
          setOfferings(response.offerings ?? [])
        }
      } catch (err) {
        if (isCurrent) {
          setError(err instanceof Error ? err.message : 'Failed to load marketplace offerings')
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    fetchOfferings()

    return () => {
      isCurrent = false
    }
  }, [resolvedTenantId])

  return { offerings, isLoading, error }
}
