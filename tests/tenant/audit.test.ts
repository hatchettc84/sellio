import { describe, expect, it, vi } from 'vitest'
import type { Prisma } from '@prisma/client'
import { TenantAuditLogger, withTenantIsolation } from '@/lib/tenant/audit'
import { withTenantContext } from '@/lib/tenant/context'
import { TenantIsolationError } from '@/lib/tenant/context'

interface PrismaClientLike {
  tenantAuditLog: {
    create: (args: Prisma.TenantAuditLogCreateArgs) => Promise<unknown>
  }
}

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

describe('tenant audit logging', () => {
  it('logs allowed operations when using withTenantIsolation', async () => {
    const { auditLogger, createSpy } = createAuditLoggerSpy()

    await withTenantIsolation(
      'tenant-a',
      {
        actorId: 'user-1',
        resourceType: 'dataset',
        operation: 'write',
        metadata: { reason: 'sync' },
        auditLogger,
        allowSameTenant: true,
      },
      async () => {
        // simulate operation
      },
    )

    expect(createSpy).toHaveBeenCalledTimes(1)
    const callArgs = createSpy.mock.calls[0][0]
    expect(callArgs?.data?.tenantId).toBe('tenant-a')
    expect(callArgs?.data?.action).toBe('cross-tenant-allowed')
    expect(callArgs?.data?.metadata).toMatchObject({
      outcome: 'allowed',
      reason: 'sync',
    } satisfies Record<string, Prisma.JsonValue>)
  })

  it('throws and logs blocked operations when tenants mismatch', async () => {
    const { auditLogger, createSpy } = createAuditLoggerSpy()

    await expect(
      withTenantContext({ tenantId: 'tenant-a', actorId: 'user-1' }, () =>
        withTenantIsolation(
          'tenant-b',
          {
            resourceType: 'dataset',
            operation: 'delete',
            metadata: { reason: 'cleanup' },
            auditLogger,
          },
          async () => {
            // should never reach
          },
        ),
      ),
    ).rejects.toThrow(TenantIsolationError)

    expect(createSpy).toHaveBeenCalledTimes(1)
    const callArgs = createSpy.mock.calls[0][0]
    expect(callArgs?.data?.tenantId).toBe('tenant-b')
    expect(callArgs?.data?.action).toBe('cross-tenant-blocked')
  })

  it('falls back to existing context when tenant matches', async () => {
    const { auditLogger, createSpy } = createAuditLoggerSpy()

    await withTenantContext({ tenantId: 'tenant-c', actorId: 'user-2' }, async () => {
      await withTenantIsolation(
        'tenant-c',
        {
          resourceType: 'dataset',
          operation: 'read',
          auditLogger,
          allowSameTenant: true,
        },
        async () => {},
      )
    })

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(createSpy.mock.calls[0][0]?.data?.tenantId).toBe('tenant-c')
  })
})


