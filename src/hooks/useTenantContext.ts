'use client'

import { useOrganization, useUser } from '@clerk/nextjs'

export interface TenantContext {
  tenantId: string | null
  tenantName: string | null
  isLoaded: boolean
  isOrganization: boolean
}

/**
 * Hook to get tenant context with fallback to user ID
 * Follows the same logic as runTenantOperation in src/lib/tenant/auth.ts
 *
 * - If user is in an organization, uses orgId as tenantId
 * - If user is not in an organization, uses userId as tenantId (single-tenant mode)
 * - Returns null if neither is available (loading or unauthenticated)
 */
export function useTenantContext(): TenantContext {
  const { organization, isLoaded: orgLoaded } = useOrganization()
  const { user, isLoaded: userLoaded } = useUser()

  const isLoaded = orgLoaded && userLoaded

  if (!isLoaded) {
    return {
      tenantId: null,
      tenantName: null,
      isLoaded: false,
      isOrganization: false,
    }
  }

  // Use orgId if available, otherwise fall back to userId (same as backend logic)
  const tenantId = organization?.id || user?.id || null
  const tenantName = organization?.name || user?.fullName || user?.primaryEmailAddress?.emailAddress || null
  const isOrganization = !!organization

  return {
    tenantId,
    tenantName,
    isLoaded,
    isOrganization,
  }
}
