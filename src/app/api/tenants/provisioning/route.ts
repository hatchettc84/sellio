import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { ProvisioningTrigger } from '@prisma/client'
import { prismaClient } from '@/lib/prismaClient'
import { scheduleProvisioningJob } from '@/lib/tenant/provisioning'
import { withTenantFromRequest } from '@/lib/tenant/request'
import { MissingTenantContextError } from '@/lib/tenant/context'

const ALLOWED_TRIGGERS: Set<ProvisioningTrigger> = new Set([
  'SUBSCRIPTION_ACTIVATED',
  'MANUAL_OVERRIDE',
  'SYSTEM_RECOVERY',
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 })
    }

    const trigger = (body as { trigger?: ProvisioningTrigger }).trigger
    const metadata = (body as { metadata?: Record<string, unknown> }).metadata

    if (!trigger || !ALLOWED_TRIGGERS.has(trigger)) {
      return NextResponse.json({ message: 'Unsupported provisioning trigger' }, { status: 400 })
    }

    return await withTenantFromRequest(request, async (tenantContext) => {
      const job = await scheduleProvisioningJob({
        prisma: prismaClient,
        tenantId: tenantContext.tenantId,
        trigger,
        metadata,
        actorId: tenantContext.actorId,
      })

      return NextResponse.json({ job }, { status: 202 })
    })
  } catch (error) {
    if (error instanceof MissingTenantContextError) {
      return NextResponse.json({ message: error.message }, { status: 401 })
    }

    console.error('Failed to schedule tenant provisioning job', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

