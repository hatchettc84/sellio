import type { NextFunction, Request, Response } from 'express';
import { findTenantByIdentifier, type TenantMetadata } from '../config/tenant-registry.js';

const TENANT_HEADER = 'x-tenant-id';
const TENANT_SLUG_HEADER = 'x-tenant-slug';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantMetadata;
    }
  }
}

export function tenantContext() {
  return (req: Request, res: Response, next: NextFunction) => {
    const headerIdentifier = req.header(TENANT_HEADER) ?? req.header(TENANT_SLUG_HEADER);

    if (!headerIdentifier) {
      return res.status(400).json({
        error: 'TENANT_NOT_RESOLVED',
        message: `Unable to resolve tenant from headers ${TENANT_HEADER} or ${TENANT_SLUG_HEADER}.`,
      });
    }

    // Try to find tenant in registry, otherwise create a dynamic tenant
    let tenant = findTenantByIdentifier(headerIdentifier);

    if (!tenant) {
      // Allow dynamic tenants for authenticated users (userId or orgId from Clerk)
      tenant = {
        id: headerIdentifier,
        slug: headerIdentifier,
        name: `Tenant ${headerIdentifier.substring(0, 8)}`,
        tier: 'LAUNCH',
      };
    }

    req.tenant = tenant;
    next();
  };
}
