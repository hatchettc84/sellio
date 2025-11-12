import {
  MissingTenantContextError,
  TenantIsolationError,
  type TenantAccessDescriptor,
  type TenantContext,
  type TenantOperation,
  getTenantContext,
} from './context'
import type { TenantAuditLogger } from './audit'

export interface EnforceTenantIsolationOptions extends TenantAccessDescriptor {
  auditLogger?: TenantAuditLogger
}

export async function enforceTenantIsolation(options: EnforceTenantIsolationOptions): Promise<void> {
  const context = getTenantContext()
  if (!context) {
    throw new MissingTenantContextError(`Tenant context missing while accessing ${options.resourceType}`)
  }

  const operation: TenantOperation = options.operation ?? 'read'

  if (context.tenantId !== options.targetTenantId) {
    await logCrossTenantAttemptSafe({
      auditLogger: options.auditLogger,
      context,
      targetTenantId: options.targetTenantId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      operation,
      metadata: options.metadata,
    })

    throw new TenantIsolationError(
      `Attempted ${operation} on ${options.resourceType} for tenant ${options.targetTenantId} without matching context`,
      context.tenantId,
      options.targetTenantId,
    )
  }
}

interface CrossTenantAttemptPayload {
  auditLogger?: TenantAuditLogger
  context: TenantContext | undefined
  targetTenantId: string
  resourceType: string
  resourceId?: string
  operation: TenantOperation
  metadata?: Record<string, unknown>
}

async function logCrossTenantAttemptSafe(payload: CrossTenantAttemptPayload): Promise<void> {
  const { auditLogger, context } = payload
  if (!auditLogger || !context) return

  try {
    await auditLogger.logCrossTenantAttempt({
      context,
      targetTenantId: payload.targetTenantId,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      operation: payload.operation,
      metadata: payload.metadata,
      outcome: 'blocked',
    })
  } catch (error) {
    console.warn('Failed to persist tenant audit log entry', error)
  }
}

