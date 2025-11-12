import type { PrismaClient } from '@prisma/client'
import { prismaClient } from '@/lib/prismaClient'
import {
  MissingTenantContextError,
  type TenantContext,
  type TenantOperation,
  requireTenantContext,
  withTenantContext,
} from './context'

export interface TenantScopedOptions extends TenantContext {
  tenantId: string
}

export type TenantScopedCallback<T> = (client: PrismaClient, context: TenantScopedOptions) => Promise<T>

export async function runTenantScoped<T>(
  options: TenantScopedOptions,
  callback: TenantScopedCallback<T>,
): Promise<T> {
  return withTenantContext(options, () => callback(prismaClient, options))
}

export function getTenantScopedPrisma(options: TenantScopedOptions): {
  prisma: PrismaClient
  context: TenantScopedOptions
  run<T>(callback: TenantScopedCallback<T>): Promise<T>
} {
  return {
    prisma: prismaClient,
    context: options,
    run: (callback) => runTenantScoped(options, callback),
  }
}

export function ensureTenantContext(operation?: TenantOperation): TenantScopedOptions {
  const context = requireTenantContext()
  if (!context.tenantId) {
    throw new MissingTenantContextError(
      operation ? `Tenant context missing for ${operation}` : 'Tenant context missing',
    )
  }
  return context as TenantScopedOptions
}

