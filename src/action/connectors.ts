'use server'

import { prismaClient } from '@/lib/prismaClient'
import { ConnectorType, ConnectorStatus, SyncStatus } from '@prisma/client'
import { createConnector } from '@/lib/connectors/factory'
import type { ConnectorConfig, ConnectorCredentials } from '@/lib/connectors/base'
import { runTenantOperation } from '@/lib/tenant/auth'
import { MissingTenantContextError } from '@/lib/tenant/context'

/**
 * Create a new connector
 */
export async function createConnectorAction(
  tenantId: string,
  userId: string,
  name: string,
  type: ConnectorType,
  config: ConnectorConfig,
  credentials: ConnectorCredentials | null
) {
  try {
    // Validate connector configuration
    const connector = createConnector(type, config, credentials, tenantId)
    const validation = connector.validateConfig(config)

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid connector configuration'
      }
    }

    // Test connection
    const testResult = await connector.testConnection()
    if (!testResult.success) {
      return {
        success: false,
        error: testResult.message || 'Connection test failed'
      }
    }

    // Create connector in database
    const newConnector = await prismaClient.connector.create({
      data: {
        tenantId,
        createdById: userId,
        name,
        type,
        config: config as Record<string, unknown>,
        credentials: credentials ? (credentials as Record<string, unknown>) : null,
        status: ConnectorStatus.INACTIVE, // Start as inactive until first sync
        autoSync: true,
        syncInterval: 3600 // 1 hour default
      }
    })

    return {
      success: true,
      connector: newConnector
    }
  } catch (error) {
    console.error('Error creating connector:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create connector'
    }
  }
}

/**
 * Get all connectors for a tenant
 * Uses tenant context from authentication
 */
export async function getConnectorsByTenant() {
  try {
    const result = await runTenantOperation(async (prisma, context) => {
      console.log('Fetching connectors for tenant:', context.tenantId)
      
      if (!context.tenantId) {
        throw new MissingTenantContextError('Tenant ID is missing from context')
      }
      
      // The middleware will automatically add tenantId filter
      // We don't need to explicitly set it - the middleware handles it
      const connectors = await prisma.connector.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          datasets: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          syncHistory: {
            take: 5,
            orderBy: {
              startedAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      // Filter datasets by tenantId in memory (since they're already filtered by connector's tenantId)
      const connectorsWithFilteredDatasets = connectors.map(connector => ({
        ...connector,
        datasets: connector.datasets.filter(ds => ds.status === 'READY' || ds.status === 'PROCESSING')
      }))

      console.log(`Found ${connectorsWithFilteredDatasets.length} connectors`)

      return {
        success: true,
        connectors: connectorsWithFilteredDatasets
      }
    })
    
    return result
  } catch (error) {
    console.error('Error fetching connectors:', error)
    console.error('Error type:', error?.constructor?.name)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Handle specific tenant context errors
    if (error instanceof MissingTenantContextError) {
      return {
        success: false,
        error: 'Tenant context is required. Please ensure you are properly authenticated.',
        connectors: []
      }
    }
    
    // Log the full error for debugging
    const errorMessage = error instanceof Error 
      ? `${error.name || 'Error'}: ${error.message}` 
      : String(error)
    
    return {
      success: false,
      error: errorMessage || 'Failed to fetch connectors',
      connectors: []
    }
  }
}

/**
 * Get a single connector by ID
 */
export async function getConnectorById(connectorId: string, tenantId: string) {
  try {
    const connector = await prismaClient.connector.findFirst({
      where: {
        id: connectorId,
        tenantId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        datasets: true,
        syncHistory: {
          take: 10,
          orderBy: {
            startedAt: 'desc'
          }
        }
      }
    })

    if (!connector) {
      return {
        success: false,
        error: 'Connector not found'
      }
    }

    return {
      success: true,
      connector
    }
  } catch (error) {
    console.error('Error fetching connector:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch connector'
    }
  }
}

/**
 * Update connector configuration
 */
export async function updateConnectorAction(
  connectorId: string,
  tenantId: string,
  updates: {
    name?: string
    config?: ConnectorConfig
    credentials?: ConnectorCredentials | null
    autoSync?: boolean
    syncInterval?: number
  }
) {
  try {
    const connector = await prismaClient.connector.findFirst({
      where: {
        id: connectorId,
        tenantId
      }
    })

    if (!connector) {
      return {
        success: false,
        error: 'Connector not found'
      }
    }

    // If config or credentials are being updated, validate
    if (updates.config || updates.credentials !== undefined) {
      const newConfig = updates.config || (connector.config as ConnectorConfig)
      const newCredentials = updates.credentials !== undefined ? updates.credentials : (connector.credentials as ConnectorCredentials | null)

      const connectorInstance = createConnector(connector.type, newConfig, newCredentials, tenantId)
      const validation = connectorInstance.validateConfig(newConfig)

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid connector configuration'
        }
      }
    }

    const updated = await prismaClient.connector.update({
      where: {
        id: connectorId
      },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.config && { config: updates.config as Record<string, unknown> }),
        ...(updates.credentials !== undefined && { credentials: updates.credentials ? (updates.credentials as Record<string, unknown>) : null }),
        ...(updates.autoSync !== undefined && { autoSync: updates.autoSync }),
        ...(updates.syncInterval !== undefined && { syncInterval: updates.syncInterval })
      }
    })

    return {
      success: true,
      connector: updated
    }
  } catch (error) {
    console.error('Error updating connector:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update connector'
    }
  }
}

/**
 * Test connector connection
 */
export async function testConnectorAction(connectorId: string, tenantId: string) {
  try {
    const connector = await prismaClient.connector.findFirst({
      where: {
        id: connectorId,
        tenantId
      }
    })

    if (!connector) {
      return {
        success: false,
        error: 'Connector not found'
      }
    }

    const connectorInstance = createConnector(
      connector.type,
      connector.config as ConnectorConfig,
      connector.credentials as ConnectorCredentials | null,
      tenantId
    )

    const testResult = await connectorInstance.testConnection()

    // Update connector status based on test result
    await prismaClient.connector.update({
      where: {
        id: connectorId
      },
      data: {
        status: testResult.success ? ConnectorStatus.ACTIVE : ConnectorStatus.ERROR,
        lastSyncError: testResult.success ? null : testResult.message
      }
    })

    return {
      success: testResult.success,
      message: testResult.message,
      metadata: testResult.metadata
    }
  } catch (error) {
    console.error('Error testing connector:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to test connector'
    }
  }
}

/**
 * Sync data from connector
 */
export async function syncConnectorAction(connectorId: string, tenantId: string, userId: string) {
  try {
    const connector = await prismaClient.connector.findFirst({
      where: {
        id: connectorId,
        tenantId
      }
    })

    if (!connector) {
      return {
        success: false,
        error: 'Connector not found'
      }
    }

    // Create sync record
    const syncRecord = await prismaClient.connectorSync.create({
      data: {
        connectorId: connector.id,
        status: SyncStatus.IN_PROGRESS
      }
    })

    // Update connector status
    await prismaClient.connector.update({
      where: {
        id: connectorId
      },
      data: {
        status: ConnectorStatus.SYNCING
      }
    })

    try {
      // Create connector instance and sync
      const connectorInstance = createConnector(
        connector.type,
        connector.config as ConnectorConfig,
        connector.credentials as ConnectorCredentials | null,
        tenantId
      )

      const syncResult = await connectorInstance.sync()

      // Create dataset from synced data if successful
      let datasetId: string | null = null
      if (syncResult.success && syncResult.data.length > 0) {
        const dataset = await prismaClient.dataset.create({
          data: {
            tenantId,
            createdById: userId,
            name: `${connector.name} - ${new Date().toISOString()}`,
            description: `Data synced from ${connector.name} connector`,
            status: 'PROCESSING',
            documentsCount: syncResult.data.length,
            connectorId: connector.id,
            metadata: {
              syncId: syncRecord.id,
              recordsFetched: syncResult.recordsFetched,
              recordsProcessed: syncResult.recordsProcessed,
              syncTimestamp: new Date().toISOString()
            }
          }
        })

        datasetId = dataset.id
      }

      // Update sync record
      await prismaClient.connectorSync.update({
        where: {
          id: syncRecord.id
        },
        data: {
          status: syncResult.success ? SyncStatus.COMPLETED : SyncStatus.FAILED,
          completedAt: new Date(),
          recordsFetched: syncResult.recordsFetched,
          recordsProcessed: syncResult.recordsProcessed,
          errorMessage: syncResult.error || null,
          metadata: syncResult.metadata
        }
      })

      // Update connector
      await prismaClient.connector.update({
        where: {
          id: connectorId
        },
        data: {
          status: syncResult.success ? ConnectorStatus.ACTIVE : ConnectorStatus.ERROR,
          lastSyncAt: new Date(),
          lastSyncStatus: syncResult.success ? SyncStatus.COMPLETED : SyncStatus.FAILED,
          lastSyncError: syncResult.error || null
        }
      })

      return {
        success: syncResult.success,
        syncId: syncRecord.id,
        datasetId,
        recordsFetched: syncResult.recordsFetched,
        recordsProcessed: syncResult.recordsProcessed,
        error: syncResult.error
      }
    } catch (syncError) {
      // Update sync record on error
      await prismaClient.connectorSync.update({
        where: {
          id: syncRecord.id
        },
        data: {
          status: SyncStatus.FAILED,
          completedAt: new Date(),
          errorMessage: syncError instanceof Error ? syncError.message : 'Unknown error'
        }
      })

      await prismaClient.connector.update({
        where: {
          id: connectorId
        },
        data: {
          status: ConnectorStatus.ERROR,
          lastSyncStatus: SyncStatus.FAILED,
          lastSyncError: syncError instanceof Error ? syncError.message : 'Unknown error'
        }
      })

      throw syncError
    }
  } catch (error) {
    console.error('Error syncing connector:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync connector'
    }
  }
}

/**
 * Delete connector
 */
export async function deleteConnectorAction(connectorId: string, tenantId: string) {
  try {
    const connector = await prismaClient.connector.findFirst({
      where: {
        id: connectorId,
        tenantId
      }
    })

    if (!connector) {
      return {
        success: false,
        error: 'Connector not found'
      }
    }

    await prismaClient.connector.delete({
      where: {
        id: connectorId
      }
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('Error deleting connector:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete connector'
    }
  }
}

