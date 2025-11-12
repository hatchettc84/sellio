import type { NextRequest } from 'next/server'
import { MissingTenantContextError, withTenantContext } from './context'
import type { TenantScopedOptions } from './client'

export const TENANT_ID_HEADER = 'x-tenant-id'
export const TENANT_SLUG_HEADER = 'x-tenant-slug'
export const TENANT_ACTOR_HEADER = 'x-actor-id'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TenantRequestContext extends TenantScopedOptions {}

export function getTenantIdFromHeaders(headers: Headers | Record<string, unknown>): string | undefined {
  const normalized = headers instanceof Headers ? headers : new Headers(Object.entries(headers) as [string, string][])
  const tenantId = normalized.get(TENANT_ID_HEADER) ?? normalized.get(TENANT_ID_HEADER.toUpperCase())
  return tenantId?.trim() || undefined
}

export function resolveTenantContextFromRequest(request: NextRequest): TenantRequestContext {
  const tenantId = getTenantIdFromHeaders(request.headers)
  if (!tenantId) {
    throw new MissingTenantContextError('Request is missing tenant identifier header')
  }

  const tenantSlug = request.headers.get(TENANT_SLUG_HEADER) ?? undefined
  const actorId = request.headers.get(TENANT_ACTOR_HEADER) ?? undefined

  return {
    tenantId,
    tenantSlug,
    actorId,
    actorType: actorId ? 'user' : 'system',
  }
}

export function requireTenantIdFromRequest(request: NextRequest): string {
  return resolveTenantContextFromRequest(request).tenantId
}

export async function withTenantFromRequest<T>(
  request: NextRequest,
  callback: (context: TenantRequestContext) => Promise<T>,
): Promise<T> {
  const context = resolveTenantContextFromRequest(request)
  return withTenantContext(context, () => callback(context))
}

