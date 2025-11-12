import { PrismaClient } from '@prisma/client'
import { registerTenantIsolationMiddleware } from './tenant/prisma-middleware'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prismaInstance = globalThis.prisma || new PrismaClient()

const prismaWithIsolation = ensureTenantIsolationMiddleware(prismaInstance)

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismaWithIsolation

export const prismaClient = prismaWithIsolation

function ensureTenantIsolationMiddleware(prisma: PrismaClient): PrismaClient {
  const marker = Symbol.for('tenantIsolationMiddlewareRegistered')

  const registry = prisma as unknown as Record<string | symbol, boolean>
  const hasRegistered = Boolean(registry[marker])
  if (!hasRegistered) {
    registerTenantIsolationMiddleware(prisma)
    registry[marker] = true
  }

  return prisma
}
