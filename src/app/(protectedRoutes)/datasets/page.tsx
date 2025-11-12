'use client'

import DatasetStatusSummary from './_components/DatasetStatusSummary'
import DatasetTable from './_components/DatasetTable'
import DatasetUploadCard from './_components/DatasetUploadCard'
import DatasetInsightsCard from './_components/DatasetInsightsCard'
import { useTenantDatasets } from '@/hooks/useTenantDatasets'
import { useTenantContext } from '@/hooks/useTenantContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const LoadingView = () => {
  return (
    <div className="space-y-6 py-4">
      <div className="h-20 w-full animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-60 animate-pulse rounded-2xl bg-muted" />
        <div className="h-60 animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="h-[400px] animate-pulse rounded-2xl bg-muted" />
    </div>
  )
}

const DatasetPage = () => {
  const { tenantId, tenantName, isLoaded } = useTenantContext()

  const { datasets, isLoading: datasetsLoading, error: datasetsError } = useTenantDatasets(tenantId)

  if (!isLoaded) {
    return <LoadingView />
  }

  if (!tenantId) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>Please sign in to manage datasets.</AlertDescription>
      </Alert>
    )
  }

  const isLoading = datasetsLoading && datasets.length === 0

  if (isLoading) {
    return <LoadingView />
  }

  return (
    <main className="space-y-6 py-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Training datasets</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {tenantName ? `${tenantName} datasets` : 'Tenant datasets'}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Upload documents, monitor ingestion state, and align datasets with marketplace offerings to power tenant
          experiences.
        </p>
      </div>

      {datasetsError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load datasets</AlertTitle>
          <AlertDescription>{datasetsError}</AlertDescription>
        </Alert>
      ) : null}

      <DatasetUploadCard />

      <div className="grid gap-6 lg:grid-cols-2">
        <DatasetStatusSummary datasets={datasets} />
        <DatasetInsightsCard datasets={datasets} />
      </div>

      <DatasetTable datasets={datasets} />
    </main>
  )
}

export default DatasetPage
