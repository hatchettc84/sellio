/**
 * Connector Sync Worker
 * Server-side utility functions for background sync processing
 * Can be used by cron jobs, queue workers, or API endpoints
 */

import { prismaClient } from '@/lib/prismaClient'
import { ConnectorStatus, SyncStatus } from '@prisma/client'
import { createConnector } from './factory'
import type { ConnectorConfig, ConnectorCredentials } from './base'

export interface SyncWorkerResult {
  success: boolean
  connectorId: string
  recordsFetched: number
  recordsProcessed: number
  datasetId?: string | null
  error?: string
}

/**
 * Find connectors that need syncing based on their syncInterval
 */
export async function findConnectorsNeedingSync(limit = 10) {
  const now = new Date()

  // Get all active connectors with autoSync enabled
  const activeConnectors = await prismaClient.connector.findMany({
    where: {
      autoSync: true,
      status: ConnectorStatus.ACTIVE,
    },
    include: {
      tenant: {
        select: {
          id: true,
          slug: true,
        },
      },
      createdBy: {
        select: {
          id: true,
        },
      },
    },
    take: limit * 2, // Get more than needed to filter by time
  })

  // Filter connectors that need syncing based on syncInterval
  const connectorsNeedingSync = activeConnectors.filter((connector) => {
    if (!connector.lastSyncAt) {
      // Never synced - needs sync
      return true
    }

    // Calculate next sync time
    const lastSyncTime = new Date(connector.lastSyncAt).getTime()
    const syncIntervalMs = connector.syncInterval * 1000 // Convert seconds to milliseconds
    const nextSyncTime = lastSyncTime + syncIntervalMs

    // Needs sync if next sync time has passed
    return now.getTime() >= nextSyncTime
  })

  // Limit to requested number
  return connectorsNeedingSync.slice(0, limit)
}

/**
 * Process a single connector sync
 */
export async function processConnectorSync(connectorId: string): Promise<SyncWorkerResult> {
  const connector = await prismaClient.connector.findUnique({
    where: {
      id: connectorId,
    },
    include: {
      tenant: {
        select: {
          id: true,
        },
      },
      createdBy: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!connector) {
    return {
      success: false,
      connectorId,
      recordsFetched: 0,
      recordsProcessed: 0,
      error: 'Connector not found',
    }
  }

  // Check if connector is already syncing (avoid duplicate syncs)
  const existingSync = await prismaClient.connectorSync.findFirst({
    where: {
      connectorId: connector.id,
      status: SyncStatus.IN_PROGRESS,
    },
  })

  if (existingSync) {
    return {
      success: false,
      connectorId,
      recordsFetched: 0,
      recordsProcessed: 0,
      error: 'Sync already in progress',
    }
  }

  // Create sync record
  let syncRecord
  try {
    syncRecord = await prismaClient.connectorSync.create({
      data: {
        connectorId: connector.id,
        status: SyncStatus.IN_PROGRESS,
      },
    })

    // Update connector status to SYNCING
    await prismaClient.connector.update({
      where: {
        id: connector.id,
      },
      data: {
        status: ConnectorStatus.SYNCING,
      },
    })
  } catch (error) {
    return {
      success: false,
      connectorId,
      recordsFetched: 0,
      recordsProcessed: 0,
      error: `Failed to create sync record: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  try {
    // Create connector instance and sync
    const connectorInstance = createConnector(
      connector.type,
      connector.config as ConnectorConfig,
      connector.credentials as ConnectorCredentials | null,
      connector.tenantId
    )

    const syncResult = await connectorInstance.sync()

    // Create dataset from synced data if successful
    let datasetId: string | null = null
    if (syncResult.success && syncResult.data.length > 0 && connector.createdById) {
      const dataset = await prismaClient.dataset.create({
        data: {
          tenantId: connector.tenantId,
          createdById: connector.createdById,
          name: `${connector.name} - ${new Date().toISOString()}`,
          description: `Auto-synced data from ${connector.name} connector`,
          status: 'PROCESSING',
          documentsCount: syncResult.data.length,
          connectorId: connector.id,
          metadata: {
            syncId: syncRecord.id,
            recordsFetched: syncResult.recordsFetched,
            recordsProcessed: syncResult.recordsProcessed,
            syncTimestamp: new Date().toISOString(),
          },
        },
      })

      datasetId = dataset.id
    }

    // Update sync record
    await prismaClient.connectorSync.update({
      where: {
        id: syncRecord.id,
      },
      data: {
        status: syncResult.success ? SyncStatus.COMPLETED : SyncStatus.FAILED,
        completedAt: new Date(),
        recordsFetched: syncResult.recordsFetched,
        recordsProcessed: syncResult.recordsProcessed,
        errorMessage: syncResult.error || null,
        metadata: syncResult.metadata || null,
      },
    })

    // Update connector
    await prismaClient.connector.update({
      where: {
        id: connector.id,
      },
      data: {
        status: syncResult.success ? ConnectorStatus.ACTIVE : ConnectorStatus.ERROR,
        lastSyncAt: new Date(),
        lastSyncStatus: syncResult.success ? SyncStatus.COMPLETED : SyncStatus.FAILED,
        lastSyncError: syncResult.error || null,
      },
    })

    return {
      success: syncResult.success,
      connectorId: connector.id,
      recordsFetched: syncResult.recordsFetched,
      recordsProcessed: syncResult.recordsProcessed,
      datasetId,
      error: syncResult.error,
    }
  } catch (error) {
    // Update sync record on error
    await prismaClient.connectorSync.update({
      where: {
        id: syncRecord.id,
      },
      data: {
        status: SyncStatus.FAILED,
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    })

    // Update connector status
    await prismaClient.connector.update({
      where: {
        id: connector.id,
      },
      data: {
        status: ConnectorStatus.ERROR,
        lastSyncStatus: SyncStatus.FAILED,
        lastSyncError: error instanceof Error ? error.message : String(error),
      },
    })

    return {
      success: false,
      connectorId: connector.id,
      recordsFetched: 0,
      recordsProcessed: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Process multiple connector syncs
 */
export async function processConnectorSyncs(limit = 10) {
  const connectors = await findConnectorsNeedingSync(limit)
  const results: SyncWorkerResult[] = []

  for (const connector of connectors) {
    const result = await processConnectorSync(connector.id)
    results.push(result)
  }

  return results
}

