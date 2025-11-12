'use client'

import { useState, useEffect } from 'react'
import { useTenantContext } from '@/hooks/useTenantContext'
import { getConnectorsByTenant } from '@/action/connectors'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Plus, Plug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConnectorCard from './_components/ConnectorCard'
import CreateConnectorDialog from './_components/CreateConnectorDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Connector = {
  id: string
  name: string
  type: string
  status: string
  lastSyncAt: Date | null
  lastSyncStatus: string | null
  createdAt: Date
  datasets: Array<{ id: string; name: string; status: string }>
  syncHistory: Array<{
    id: string
    status: string
    startedAt: Date
    recordsFetched: number
    recordsProcessed: number
  }>
}

const IntegrationsPage = () => {
  const { tenantId, isLoaded } = useTenantContext()
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const fetchConnectors = async () => {
    if (!tenantId) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('Fetching connectors...')
      const result = await getConnectorsByTenant()
      console.log('Connectors result:', result)
      
      if (result && result.success && result.connectors) {
        setConnectors(result.connectors as Connector[])
      } else {
        const errorMsg = result?.error || 'Failed to load connectors'
        console.error('Failed to load connectors:', errorMsg)
        setError(errorMsg)
      }
    } catch (err) {
      console.error('Exception fetching connectors:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to load connectors'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && tenantId) {
      fetchConnectors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, tenantId])

  if (!isLoaded) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>Please sign in to manage connectors.</AlertDescription>
      </Alert>
    )
  }

  return (
    <main className="space-y-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Data Connectors</p>
          <h1 className="text-3xl font-semibold tracking-tight">Integrations</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Connect your data sources to automatically ingest information for AI training. All connectors are read-only
            and safe to use.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Connector
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load connectors</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : connectors.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <div className="mx-auto h-12 w-12 rounded-full border border-dashed border-primary/50 bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Plug className="h-6 w-6" />
            </div>
            <CardTitle className="text-center">No connectors configured</CardTitle>
            <CardDescription className="text-center">
              Get started by adding a connector to import data from external sources
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Connector
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connectors.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              onSync={fetchConnectors}
              onDelete={fetchConnectors}
            />
          ))}
        </div>
      )}

      <CreateConnectorDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={fetchConnectors} />
    </main>
  )
}

export default IntegrationsPage

