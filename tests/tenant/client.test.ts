import { beforeAll, describe, expect, it, vi } from 'vitest'
import { MissingTenantContextError } from '@/lib/tenant/context'

vi.mock('@prisma/client', () => {
  class PrismaClientMock {
    $use = vi.fn()
  }
  return { PrismaClient: PrismaClientMock }
})

let ensureTenantContext: typeof import('@/lib/tenant/client').ensureTenantContext
let runTenantScoped: typeof import('@/lib/tenant/client').runTenantScoped

beforeAll(async () => {
  const module = await import('@/lib/tenant/client')
  ensureTenantContext = module.ensureTenantContext
  runTenantScoped = module.runTenantScoped
})

describe('tenant client utilities', () => {
  it('exposes tenant context inside scoped execution', async () => {
    let observedTenantId: string | undefined

    await runTenantScoped(
      {
        tenantId: 'tenant-test',
        actorId: 'user-123',
        actorType: 'user',
      },
      async (_client, context) => {
        const activeContext = ensureTenantContext('read')
        observedTenantId = activeContext.tenantId
        expect(context.tenantId).toBe('tenant-test')
      },
    )

    expect(observedTenantId).toBe('tenant-test')
  })

  it('throws when attempting to read tenant context outside scoped execution', () => {
    expect(() => ensureTenantContext('read')).toThrow(MissingTenantContextError)
  })
})

