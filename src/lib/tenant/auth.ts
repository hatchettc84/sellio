import { auth } from '@clerk/nextjs/server'
import { runTenantScoped, type TenantScopedCallback } from './client'
import { MissingTenantContextError } from './context'

export async function runTenantOperation<T>(callback: TenantScopedCallback<T>): Promise<T> {
  const { userId, orgId } = await auth()

  if (!userId) {
    throw new MissingTenantContextError('User authentication required')
  }

  // Use orgId if available, otherwise use userId as tenant (for single-tenant users)
  const tenantId = orgId || userId

  return runTenantScoped(
    {
      tenantId,
      tenantSlug: undefined,
      actorId: userId,
      actorType: 'user',
    },
    callback,
  )
}

