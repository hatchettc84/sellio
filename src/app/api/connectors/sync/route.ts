/**
 * API endpoint for triggering connector syncs
 * Can be called by cron jobs or manually
 */

import { NextRequest, NextResponse } from 'next/server'
import { processConnectorSyncs, findConnectorsNeedingSync } from '@/lib/connectors/sync-worker'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/connectors/sync
 * Returns connectors that need syncing (for monitoring/debugging)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10)

    const connectors = await findConnectorsNeedingSync(limit)

    return NextResponse.json({
      connectors: connectors.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        tenantId: c.tenantId,
        lastSyncAt: c.lastSyncAt,
        syncInterval: c.syncInterval,
      })),
      count: connectors.length,
    })
  } catch (error) {
    console.error('Error fetching connectors needing sync:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch connectors',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/connectors/sync
 * Triggers sync for connectors that need it
 * Can be called by cron jobs (e.g., Vercel Cron, GitHub Actions, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    // For cron jobs, you might want to check for a secret header
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const limit = body.limit ? Number.parseInt(String(body.limit), 10) : 10

    const results = await processConnectorSyncs(limit)

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      failed,
      results: results.map((r) => ({
        connectorId: r.connectorId,
        success: r.success,
        recordsFetched: r.recordsFetched,
        recordsProcessed: r.recordsProcessed,
        datasetId: r.datasetId,
        error: r.error,
      })),
    })
  } catch (error) {
    console.error('Error processing connector syncs:', error)
    return NextResponse.json(
      {
        error: 'Failed to process connector syncs',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

