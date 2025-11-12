#!/usr/bin/env node
/**
 * Background job processor for connector syncs
 * Finds connectors that need syncing based on their syncInterval and autoSync settings
 * Processes sync jobs and creates datasets from synced data
 */

import { PrismaClient, ConnectorStatus, SyncStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [limitArg] = process.argv.slice(2)
  const limit = limitArg ? Number.parseInt(limitArg, 10) : 10

  // Find connectors that need syncing
  const connectorsToSync = await findConnectorsNeedingSync(limit)

  if (connectorsToSync.length === 0) {
    console.log('No connectors need syncing at this time.')
    return
  }

  console.log(`Found ${connectorsToSync.length} connector(s) that need syncing.`)

  for (const connector of connectorsToSync) {
    await processConnectorSync(connector)
  }
}

/**
 * Find connectors that need syncing based on:
 * - autoSync is enabled
 * - status is ACTIVE (not ERROR, SYNCING, or INACTIVE)
 * - lastSyncAt + syncInterval < now (or never synced)
 */
async function findConnectorsNeedingSync(limit = 10) {
  const now = new Date()

  // Get all active connectors with autoSync enabled
  const activeConnectors = await prisma.connector.findMany({
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
async function processConnectorSync(connector) {
  console.log(`Processing sync for connector ${connector.id} (${connector.name}) - Tenant: ${connector.tenantId}`)

  // Check if connector is already syncing (avoid duplicate syncs)
  const existingSync = await prisma.connectorSync.findFirst({
    where: {
      connectorId: connector.id,
      status: SyncStatus.IN_PROGRESS,
    },
  })

  if (existingSync) {
    console.log(`Connector ${connector.id} already has a sync in progress. Skipping.`)
    return
  }

  // Create sync record
  let syncRecord
  try {
    syncRecord = await prisma.connectorSync.create({
      data: {
        connectorId: connector.id,
        status: SyncStatus.IN_PROGRESS,
      },
    })

    // Update connector status to SYNCING
    await prisma.connector.update({
      where: {
        id: connector.id,
      },
      data: {
        status: ConnectorStatus.SYNCING,
      },
    })
  } catch (error) {
    console.error(`Failed to create sync record for connector ${connector.id}:`, error)
    return
  }

  try {
    // Import the sync function dynamically
    // Note: In a real implementation, you'd import the actual sync logic
    // For now, we'll use a simplified version that calls the sync action logic
    
    const syncResult = await performConnectorSync(connector)

    // Update sync record with results
    await prisma.connectorSync.update({
      where: {
        id: syncRecord.id,
      },
      data: {
        status: syncResult.success ? SyncStatus.COMPLETED : SyncStatus.FAILED,
        completedAt: new Date(),
        recordsFetched: syncResult.recordsFetched || 0,
        recordsProcessed: syncResult.recordsProcessed || 0,
        errorMessage: syncResult.error || null,
        metadata: syncResult.metadata || null,
      },
    })

    // Update connector
    await prisma.connector.update({
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

    if (syncResult.success) {
      console.log(
        `✓ Connector ${connector.id} synced successfully. Fetched: ${syncResult.recordsFetched}, Processed: ${syncResult.recordsProcessed}`
      )
    } else {
      console.error(`✗ Connector ${connector.id} sync failed: ${syncResult.error}`)
    }
  } catch (error) {
    console.error(`Error syncing connector ${connector.id}:`, error)

    // Update sync record on error
    await prisma.connectorSync.update({
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
    await prisma.connector.update({
      where: {
        id: connector.id,
      },
      data: {
        status: ConnectorStatus.ERROR,
        lastSyncStatus: SyncStatus.FAILED,
        lastSyncError: error instanceof Error ? error.message : String(error),
      },
    })
  }
}

/**
 * Perform the actual connector sync
 * Uses the sync-worker utility functions
 * Note: This requires the TypeScript to be compiled or using tsx/ts-node
 * For production, prefer using the API endpoint: POST /api/connectors/sync
 */
async function performConnectorSync(connector) {
  try {
    // Try to use the compiled sync-worker
    // In production, you should use the API endpoint instead
    const syncWorkerPath = process.env.SYNC_WORKER_PATH || '../dist/lib/connectors/sync-worker.js'
    
    let syncResult
    
    try {
      const { processConnectorSync } = await import(syncWorkerPath)
      syncResult = await processConnectorSync(connector.id)
    } catch (importError) {
      // If import fails, use direct database approach with connector factory
      // This is a fallback that requires the connector implementations to be available
      console.warn('Could not import sync-worker, using direct approach. Consider using API endpoint instead.')
      
      // For now, return an error suggesting to use the API endpoint
      // In a real implementation, you would implement the sync logic here
      throw new Error(
        'Sync worker not available. Please use the API endpoint (POST /api/connectors/sync) or ensure TypeScript is compiled.'
      )
    }

    return {
      success: syncResult.success,
      recordsFetched: syncResult.recordsFetched,
      recordsProcessed: syncResult.recordsProcessed,
      error: syncResult.error,
      metadata: {
        datasetId: syncResult.datasetId,
      },
    }
  } catch (error) {
    return {
      success: false,
      recordsFetched: 0,
      recordsProcessed: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Run the processor
main()
  .catch((error) => {
    console.error('Connector sync processor failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

