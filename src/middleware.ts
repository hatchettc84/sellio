import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { TENANT_ID_HEADER } from '@/lib/tenant/request'

const isPublicRoute = createRouteMatcher(['/','/sign-in(.*)', '/sign-up(.*)', "/api(.*)", "/live-webinar(.*)"])
const requiresTenantHeader = createRouteMatcher(['/api/tenants(.*)', '/api/tenant', '/api/datasets', '/api/offerings', '/api/marketplace'])

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that aren't public
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // Handle tenant context for specific routes
  // Note: Tenant context validation only - the actual context is set in API routes
  if (requiresTenantHeader(req)) {
    const tenantId =
      req.headers.get(TENANT_ID_HEADER) ?? req.headers.get(TENANT_ID_HEADER.toUpperCase())

    if (!tenantId) {
      return NextResponse.json({ message: 'Missing tenant context header' }, { status: 401 })
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
