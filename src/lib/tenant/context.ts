import { AsyncLocalStorage } from 'node:async_hooks'

export interface TenantContext {
  tenantId: string
  actorId?: string
  tenantSlug?: string
  actorType?: 'user' | 'service' | 'system'
  metadata?: Record<string, unknown>
}

export class MissingTenantContextError extends Error {
  constructor(message = 'Tenant context is required for this operation') {
    super(message)
    this.name = 'MissingTenantContextError'
  }
}

export class TenantIsolationError extends Error {
  readonly tenantId: string
  readonly targetTenantId: string

  constructor(message: string, tenantId: string, targetTenantId: string) {
    super(message)
    this.name = 'TenantIsolationError'
    this.tenantId = tenantId
    this.targetTenantId = targetTenantId
  }
}

const tenantContextStorage = new AsyncLocalStorage<TenantContext>()

export function withTenantContext<T>(context: TenantContext, callback: () => Promise<T>): Promise<T>
export function withTenantContext<T>(context: TenantContext, callback: () => T): T
export function withTenantContext<T>(context: TenantContext, callback: () => T | Promise<T>): T | Promise<T> {
  const frozenContext = Object.freeze({ ...context })
  return tenantContextStorage.run(frozenContext, callback)
}

export function getTenantContext(): TenantContext | undefined {
  return tenantContextStorage.getStore()
}

export function requireTenantContext(): TenantContext {
  const context = getTenantContext()
  if (!context) {
    throw new MissingTenantContextError()
  }
  return context
}

export type TenantOperation = 'read' | 'write' | 'delete' | 'list' | string

export interface TenantAccessDescriptor {
  targetTenantId: string
  resourceType: string
  resourceId?: string
  operation?: TenantOperation
  metadata?: Record<string, unknown>
}

