'use client'

import MarketplaceAnalytics from './_components/MarketplaceAnalytics'
import MarketplaceFilters, { MarketplaceFiltersState } from './_components/MarketplaceFilters'
import OfferingCreationDialog from './_components/OfferingCreationDialog'
import OfferingGrid from './_components/OfferingGrid'
import { useMarketplaceOfferings } from '@/hooks/useMarketplaceOfferings'
import { useTenantContext } from '@/hooks/useTenantContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useMemo, useState } from 'react'

const LoadingView = () => (
  <div className="space-y-6 py-4">
    <div className="h-20 w-full animate-pulse rounded-2xl bg-muted" />
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-60 animate-pulse rounded-2xl bg-muted" />
      <div className="h-60 animate-pulse rounded-2xl bg-muted" />
    </div>
    <div className="h-[400px] animate-pulse rounded-2xl bg-muted" />
  </div>
)

const MarketplacePage = () => {
  const { tenantId, tenantName, isLoaded } = useTenantContext()

  const { offerings, isLoading, error } = useMarketplaceOfferings({ tenantId })
  const [filters, setFilters] = useState<MarketplaceFiltersState>({ search: '', categories: [], statuses: [] })

  const filteredOfferings = useMemo(() => {
    return offerings.filter((offering) => {
      const matchSearch = filters.search
        ? offering.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          offering.description.toLowerCase().includes(filters.search.toLowerCase())
        : true

      const matchCategory = filters.categories.length === 0 || filters.categories.includes(offering.category)
      const matchStatus =
        filters.statuses.length === 0 || filters.statuses.includes(offering.status === 'published' ? 'Published' : 'Draft')

      return matchSearch && matchCategory && matchStatus
    })
  }, [offerings, filters])

  if (!isLoaded) {
    return <LoadingView />
  }

  if (!tenantId) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>Please sign in to manage marketplace offerings.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading && offerings.length === 0) {
    return <LoadingView />
  }

  return (
    <main className="space-y-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Marketplace</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {tenantName ? `${tenantName} offerings` : 'Tenant offerings'}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Package Spotlight capabilities into curated offerings, manage listing performance, and publish new bundles
            across tenants.
          </p>
        </div>
        <OfferingCreationDialog />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load offerings</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <MarketplaceAnalytics />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <MarketplaceFilters onChange={setFilters} />
        <OfferingGrid offerings={filteredOfferings} />
      </div>
    </main>
  )
}

export default MarketplacePage
