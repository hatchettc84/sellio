import { describe, expect, it, vi } from 'vitest'
import type { Prisma } from '@prisma/client'
import { enforceTenantIsolation } from '@/lib/tenant/isolation'
import { TenantAuditLogger } from '@/lib/tenant/audit'
import { MissingTenantContextError, TenantIsolationError, withTenantContext } from '@/lib/tenant/context'

function createAuditLoggerSpy() {
  const create = vi.fn<Parameters<PrismaClientLike['tenantAuditLog']['create']>, ReturnType<PrismaClientLike['tenantAuditLog']['create']>>(
    async (args) => args,
  )

  const prisma: PrismaClientLike = {
    tenantAuditLog: {
      create,
    },
  }

  return {
    auditLogger: new TenantAuditLogger(prisma),
    createSpy: create,
  }
}

interface PrismaClientLike {
  tenantAuditLog: {
    create: (args: Prisma.TenantAuditLogCreateArgs) => Promise<unknown>
  }
}

describe('tenant isolation enforcement', () => {
  it('allows operations within the same tenant without logging', async () => {
    const { auditLogger, createSpy } = createAuditLoggerSpy()

    await withTenantContext({ tenantId: 'tenant-a', actorId: 'user-1' }, async () => {
      await enforceTenantIsolation({
        targetTenantId: 'tenant-a',
        resourceType: 'dataset',
        resourceId: 'ds_123',
        operation: 'write',
        auditLogger,
      })
    })

    expect(createSpy).not.toHaveBeenCalled()
  })

  it('logs and blocks cross-tenant attempts', async () => {
    const { auditLogger, createSpy } = createAuditLoggerSpy()

    await expect(
      withTenantContext({ tenantId: 'tenant-a', actorId: 'user-2' }, async () =>
        enforceTenantIsolation({
          targetTenantId: 'tenant-b',
          resourceType: 'dataset',
          resourceId: 'ds_321',
          operation: 'delete',
          metadata: { reason: 'manual-cleanup' },
          auditLogger,
        }),
      ),
    ).rejects.toThrow(TenantIsolationError)

    expect(createSpy).toHaveBeenCalledTimes(1)
    const callArgs = createSpy.mock.calls[0][0]

    expect(callArgs?.data?.tenantId).toBe('tenant-b')
    expect(callArgs?.data?.actorId).toBe('user-2')
    expect(callArgs?.data?.action).toBe('cross-tenant-blocked')
    expect(callArgs?.data?.resourceType).toBe('dataset')
    expect(callArgs?.data?.resourceId).toBe('ds_321')
    expect(callArgs?.data?.metadata).toMatchObject({
      actorTenantId: 'tenant-a',
      requestedTenantId: 'tenant-b',
      operation: 'delete',
      outcome: 'blocked',
      reason: 'manual-cleanup',
    } satisfies Record<string, Prisma.JsonValue>)
  })

  it('throws when no tenant context is available', async () => {
    const { auditLogger, createSpy } = createAuditLoggerSpy()

    await expect(
      enforceTenantIsolation({
        targetTenantId: 'tenant-a',
        resourceType: 'dataset',
        auditLogger,
      }),
    ).rejects.toThrow(MissingTenantContextError)

    expect(createSpy).not.toHaveBeenCalled()
  })
})

