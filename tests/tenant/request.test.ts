import { beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { MissingTenantContextError } from '@/lib/tenant/context'
import type { TenantRequestContext } from '@/lib/tenant/request'
import { TENANT_ID_HEADER } from '@/lib/tenant/request'

vi.mock('@prisma/client', () => {
  class PrismaClientMock {
    $use = vi.fn()
  }
  return { PrismaClient: PrismaClientMock }
})

let ensureTenantContext: typeof import('@/lib/tenant/client').ensureTenantContext
let getTenantIdFromHeaders: typeof import('@/lib/tenant/request').getTenantIdFromHeaders
let requireTenantIdFromRequest: typeof import('@/lib/tenant/request').requireTenantIdFromRequest
let withTenantFromRequest: typeof import('@/lib/tenant/request').withTenantFromRequest

beforeAll(async () => {
  const clientModule = await import('@/lib/tenant/client')
  ensureTenantContext = clientModule.ensureTenantContext

  const requestModule = await import('@/lib/tenant/request')
  getTenantIdFromHeaders = requestModule.getTenantIdFromHeaders
  requireTenantIdFromRequest = requestModule.requireTenantIdFromRequest
  withTenantFromRequest = requestModule.withTenantFromRequest
})

describe('tenant request helpers', () => {
  it('extracts tenant id from headers', () => {
    const headers = new Headers({ [TENANT_ID_HEADER]: 'tenant-xyz' })
    expect(getTenantIdFromHeaders(headers)).toBe('tenant-xyz')
  })

  it('throws when tenant header is missing', () => {
    const request = new NextRequest('http://localhost/test')
    expect(() => requireTenantIdFromRequest(request)).toThrow(MissingTenantContextError)
  })

  it('wraps callback with tenant context derived from request headers', async () => {
    const request = new NextRequest('http://localhost/test', {
      headers: new Headers({
        [TENANT_ID_HEADER]: 'tenant-ctx',
        'x-actor-id': 'user-777',
      }),
    })

    await withTenantFromRequest(request, async (context: TenantRequestContext) => {
      expect(context.tenantId).toBe('tenant-ctx')
      expect(context.actorId).toBe('user-777')
      const active = ensureTenantContext('read')
      expect(active.tenantId).toBe('tenant-ctx')
    })
  })
})

