import type { Prisma } from '@prisma/client'
import type { TenantContext, TenantOperation } from './context'
import { MissingTenantContextError } from './context'
import { getTenantContext, withTenantContext } from './context'
import { enforceTenantIsolation } from './isolation'

interface PrismaClientLike {
  tenantAuditLog: {
    create: (args: Prisma.TenantAuditLogCreateArgs) => Promise<unknown>
  }
}

export interface AuditLogMetadata extends Record<string, unknown> {
  actorTenantId?: string
  requestedTenantId?: string
  operation?: TenantOperation
  outcome?: 'allowed' | 'blocked'
}

export interface CrossTenantAttemptInput {
  context: TenantContext
  targetTenantId: string
  resourceType: string
  resourceId?: string
  operation: TenantOperation
  metadata?: Record<string, unknown>
  outcome: 'allowed' | 'blocked'
}

function sanitizeMetadata(metadata: Record<string, unknown> | undefined): Prisma.JsonObject | undefined {
  if (!metadata) return undefined
  const sanitized = Object.entries(metadata).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value as Prisma.JsonValue
    }
    return acc
  }, {})
  return sanitized as Prisma.JsonObject
}

export class TenantAuditLogger {
  constructor(private readonly prisma: PrismaClientLike) {}

  async logCrossTenantAttempt(input: CrossTenantAttemptInput): Promise<void> {
    const metadata: AuditLogMetadata = {
      actorTenantId: input.context.tenantId,
      requestedTenantId: input.targetTenantId,
      operation: input.operation,
      outcome: input.outcome,
      ...input.metadata,
    }

    await this.prisma.tenantAuditLog.create({
      data: {
        tenantId: input.targetTenantId,
        actorId: input.context.actorId ?? null,
        action: `cross-tenant-${input.outcome}`,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        metadata: sanitizeMetadata(metadata),
      },
    })
  }
}

export async function withTenantIsolation<T>(
  tenantId: string,
  options: {
    actorId?: string
    actorType?: TenantContext['actorType']
    resourceType: string
    resourceId?: string
    operation: TenantOperation
    metadata?: Record<string, unknown>
    auditLogger?: TenantAuditLogger
    allowSameTenant?: boolean
  },
  callback: () => Promise<T>,
): Promise<T> {
  const context = getTenantContext()
  if (!context && !tenantId) {
    throw new MissingTenantContextError('Tenant context required')
  }

  const mergedContext: TenantContext = context?.tenantId
    ? context
    : {
        tenantId,
        actorId: options.actorId,
        actorType: options.actorType ?? 'system',
      }

  return withTenantContext(mergedContext, async () => {
    if (!options.allowSameTenant) {
      await enforceTenantIsolation({
        targetTenantId: tenantId,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        operation: options.operation,
        metadata: options.metadata,
        auditLogger: options.auditLogger,
      })
    }

    const result = await callback()

    if (options.auditLogger) {
      await options.auditLogger.logCrossTenantAttempt({
        context: mergedContext,
        targetTenantId: tenantId,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        operation: options.operation,
        metadata: options.metadata,
        outcome: 'allowed',
      })
    }

    return result
  })
}

