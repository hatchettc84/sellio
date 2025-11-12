export type TenantTier = 'LAUNCH' | 'GROWTH' | 'ENTERPRISE';

export interface TenantMetadata {
  id: string;
  slug: string;
  name: string;
  tier: TenantTier;
}

const tenants: TenantMetadata[] = [
  {
    id: 'demo-tenant-001',
    slug: 'demo',
    name: 'Demo Tenant',
    tier: 'LAUNCH',
  },
];

export function findTenantByIdentifier(identifier: string | undefined): TenantMetadata | undefined {
  if (!identifier) {
    return undefined;
  }

  return tenants.find((tenant) => tenant.id === identifier || tenant.slug === identifier);
}
