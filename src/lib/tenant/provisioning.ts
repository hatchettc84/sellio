import type { Prisma, ProvisioningStatus, ProvisioningTrigger } from '@prisma/client'
import { getTenantContext, withTenantContext } from './context'
import type { TenantContext } from './context'

interface PrismaProvisioningClient {
  tenantProvisioningJob: {
    create: (args: Prisma.TenantProvisioningJobCreateArgs) => Promise<unknown>
    update: (args: Prisma.TenantProvisioningJobUpdateArgs) => Promise<unknown>
  }
}

export interface ScheduleProvisioningJobInput {
  prisma: PrismaProvisioningClient
  tenantId: string
  trigger: ProvisioningTrigger
  metadata?: Record<string, unknown>
  actorId?: string
}

export interface UpdateProvisioningStatusInput {
  prisma: PrismaProvisioningClient
  jobId: string
  tenantId: string
  status: ProvisioningStatus
  errorDetails?: Record<string, unknown>
}

export async function scheduleProvisioningJob({
  prisma,
  tenantId,
  trigger,
  metadata,
  actorId,
}: ScheduleProvisioningJobInput) {
  const context = resolveTenantContext(tenantId, actorId)

  return withTenantContext(context, async () => {
    const jsonMetadata = metadata ? (metadata as Prisma.JsonObject) : undefined

    const now = new Date()

    return prisma.tenantProvisioningJob.create({
      data: {
        tenantId,
        trigger,
        metadata: jsonMetadata,
        startedAt: trigger === 'SUBSCRIPTION_ACTIVATED' ? now : null,
      },
    })
  })
}

export async function updateProvisioningJobStatus({
  prisma,
  jobId,
  tenantId,
  status,
  errorDetails,
}: UpdateProvisioningStatusInput) {
  const context = resolveTenantContext(tenantId)

  return withTenantContext(context, async () => {
    const jsonErrorDetails = errorDetails ? (errorDetails as Prisma.JsonObject) : undefined
    const timestamps = resolveTimestampsForStatus(status)

    return prisma.tenantProvisioningJob.update({
      where: { id: jobId },
      data: {
        status,
        errorDetails: jsonErrorDetails,
        ...timestamps,
      },
    })
  })
}

function resolveTimestampsForStatus(status: ProvisioningStatus) {
  const now = new Date()

  switch (status) {
    case 'EXECUTING':
      return {
        startedAt: now,
        completedAt: null,
      }
    case 'COMPLETED':
      return {
        completedAt: now,
      }
    case 'FAILED':
      return {
        completedAt: now,
      }
    default:
      return {}
  }
}

function resolveTenantContext(tenantId: string, actorId?: string): TenantContext {
  const existing = getTenantContext()
  if (existing && existing.tenantId === tenantId) {
    return existing
  }

  return {
    tenantId,
    actorId: actorId ?? existing?.actorId ?? 'system',
    actorType: existing?.actorType ?? 'system',
  }
}

