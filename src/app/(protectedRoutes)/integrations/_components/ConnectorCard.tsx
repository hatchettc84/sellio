'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, RefreshCw, Trash2, TestTube, Database, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { testConnectorAction, syncConnectorAction, deleteConnectorAction } from '@/action/connectors'
import { useTenantContext } from '@/hooks/useTenantContext'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Connector = {
  id: string
  name: string
  type: string
  status: string
  lastSyncAt: Date | null
  lastSyncStatus: string | null
  datasets: Array<{ id: string; name: string; status: string }>
  syncHistory: Array<{
    id: string
    status: string
    startedAt: Date
    recordsFetched: number
    recordsProcessed: number
  }>
}

type ConnectorCardProps = {
  connector: Connector
  onSync: () => void
  onDelete: () => void
}

const getConnectorIcon = (type: string) => {
  switch (type) {
    case 'AZURE':
      return '🔷'
    case 'GOOGLE':
      return '🔍'
    case 'CRM':
      return '📊'
    case 'PRODUCT_CATALOG':
      return '🛍️'
    default:
      return '🔌'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'SYNCING':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'ERROR':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }
}

export default function ConnectorCard({ connector, onSync, onDelete }: ConnectorCardProps) {
  const { tenantId } = useTenantContext()
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleTest = async () => {
    if (!tenantId) return

    setIsTesting(true)
    try {
      const result = await testConnectorAction(connector.id, tenantId)
      if (result.success) {
        toast.success('Connection test successful')
        onSync()
      } else {
        toast.error(result.message || 'Connection test failed')
      }
    } catch {
      toast.error('Failed to test connection')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSync = async () => {
    if (!tenantId) return

    setIsSyncing(true)
    try {
      const result = await syncConnectorAction(connector.id, tenantId, '') // userId should come from auth
      if (result.success) {
        toast.success(`Synced ${result.recordsFetched} records`)
        onSync()
      } else {
        toast.error(result.error || 'Sync failed')
      }
    } catch {
      toast.error('Failed to sync connector')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDelete = async () => {
    if (!tenantId) return

    setIsDeleting(true)
    try {
      const result = await deleteConnectorAction(connector.id, tenantId)
      if (result.success) {
        toast.success('Connector deleted')
        onDelete()
      } else {
        toast.error(result.error || 'Failed to delete connector')
      }
    } catch {
      toast.error('Failed to delete connector')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const lastSync = connector.lastSyncAt ? format(new Date(connector.lastSyncAt), 'MMM d, yyyy HH:mm') : 'Never'
  const datasetsCount = connector.datasets?.length || 0
  const lastSyncRecord = connector.syncHistory?.[0]

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getConnectorIcon(connector.type)}</div>
              <div>
                <CardTitle className="text-lg">{connector.name}</CardTitle>
                <CardDescription className="capitalize">{connector.type.toLowerCase().replace('_', ' ')}</CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleTest} disabled={isTesting}>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Connection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={getStatusColor(connector.status)}>
              {connector.status}
            </Badge>
            {connector.lastSyncStatus === 'COMPLETED' && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Synced
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last sync: {lastSync}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Database className="h-3 w-3" />
              <span>{datasetsCount} dataset{datasetsCount !== 1 ? 's' : ''}</span>
            </div>
            {lastSyncRecord && (
              <div className="text-xs text-muted-foreground">
                {lastSyncRecord.recordsFetched} records fetched, {lastSyncRecord.recordsProcessed} processed
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTest} disabled={isTesting} className="flex-1">
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
          <Button size="sm" onClick={handleSync} disabled={isSyncing} className="flex-1">
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Sync
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connector</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{connector.name}&quot;? This action cannot be undone. Any datasets
              created from this connector will remain, but future syncs will be disabled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

