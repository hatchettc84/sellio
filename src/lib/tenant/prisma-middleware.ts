import type { Prisma, PrismaClient } from '@prisma/client'
import {
  MissingTenantContextError,
  TenantIsolationError,
  getTenantContext,
} from './context'

type TenantScopedModel = keyof typeof TENANT_MODEL_FIELD_MAP

const TENANT_MODEL_FIELD_MAP = {
  Dataset: 'tenantId',
  MarketplaceOffering: 'tenantId',
  TenantMembership: 'tenantId',
  TenantProvisioningJob: 'tenantId',
  TenantProvisioningEvent: 'tenantId',
  TenantRuntimeConfig: 'tenantId',
  TenantAuditLog: 'tenantId',
  AiAgents: 'tenantId',
  Webinar: 'tenantId',
  Connector: 'tenantId',
  // ConnectorSync doesn't have tenantId directly - it's linked through connector
  // We'll handle it separately if needed
} as const

const WRITE_ACTIONS = new Set<Prisma.PrismaAction>([
  'create',
  'update',
  'upsert',
  'delete',
  'deleteMany',
  'updateMany',
  'createMany',
])

const READ_ACTIONS = new Set<Prisma.PrismaAction>([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'aggregate',
  'count',
  'groupBy',
])

export function registerTenantIsolationMiddleware(prisma: PrismaClient): void {
  prisma.$use(async (params, next) => {
    const model = params.model as TenantScopedModel | undefined

    if (!model || !(model in TENANT_MODEL_FIELD_MAP)) {
      return next(params)
    }

    const tenantField = TENANT_MODEL_FIELD_MAP[model]
    const context = getTenantContext()

    if (!context) {
      throw new MissingTenantContextError(
        `Tenant context is required before accessing ${model}.${params.action}`,
      )
    }

    const tenantId = context.tenantId

    if (READ_ACTIONS.has(params.action)) {
      params.args = params.args ?? {}
      params.args.where = enforceTenantConstraintInWhere(
        params.args.where,
        tenantField,
        tenantId,
        params.action,
        model,
      )
    }

    if (WRITE_ACTIONS.has(params.action)) {
      params.args = params.args ?? {}
      applyTenantConstraintToWriteArgs(params.args, tenantField, tenantId, params.action, model)
    }

    return next(params)
  })
}

function enforceTenantConstraintInWhere(
  where: Record<string, unknown> | undefined,
  tenantField: string,
  tenantId: string,
  action: Prisma.PrismaAction,
  model: string,
) {
  const constraint = { [tenantField]: tenantId }

  if (!where || Object.keys(where).length === 0) {
    return constraint
  }

  const existingValue = (where as Record<string, unknown>)[tenantField]
  if (existingValue) {
    if (typeof existingValue === 'string' && existingValue !== tenantId) {
      throw crossTenantError(model, action, tenantId, String(existingValue))
    }

    if (
      typeof existingValue === 'object' &&
      existingValue !== null &&
      'equals' in (existingValue as Record<string, unknown>) &&
      (existingValue as Record<string, unknown>).equals !== tenantId
    ) {
      throw crossTenantError(
        model,
        action,
        tenantId,
        String((existingValue as Record<string, unknown>).equals),
      )
    }
  }

  return {
    AND: [constraint, where],
  }
}

function applyTenantConstraintToWriteArgs(
  args: Record<string, unknown>,
  tenantField: string,
  tenantId: string,
  action: Prisma.PrismaAction,
  model: string,
) {
  if ('data' in args) {
    args.data = applyTenantFieldToData(args.data, tenantField, tenantId, action, model)
  }

  if ('where' in args) {
    args.where = enforceTenantConstraintInWhere(
      args.where as Record<string, unknown> | undefined,
      tenantField,
      tenantId,
      action,
      model,
    )
  }
}

function applyTenantFieldToData(
  data: unknown,
  tenantField: string,
  tenantId: string,
  action: Prisma.PrismaAction,
  model: string,
): unknown {
  if (Array.isArray(data)) {
    return data.map((entry) => enforceTenantField(entry, tenantField, tenantId, action, model))
  }

  if (typeof data === 'object' && data !== null) {
    return enforceTenantField(data, tenantField, tenantId, action, model)
  }

  return data
}

function enforceTenantField(
  entry: unknown,
  tenantField: string,
  tenantId: string,
  action: Prisma.PrismaAction,
  model: string,
) {
  if (typeof entry !== 'object' || entry === null) {
    return entry
  }

  const record = { ...(entry as Record<string, unknown>) }
  const existing = record[tenantField]

  if (existing && typeof existing === 'string' && existing !== tenantId) {
    throw crossTenantError(model, action, tenantId, String(existing))
  }

  if (
    existing &&
    typeof existing === 'object' &&
    'connect' in (existing as Record<string, unknown>) &&
    (existing as Record<string, unknown>).connect
  ) {
    const connectValue = (existing as Record<string, unknown>).connect as Record<string, unknown>
    if (
      'id' in connectValue &&
      typeof connectValue.id === 'string' &&
      connectValue.id !== tenantId
    ) {
      throw crossTenantError(model, action, tenantId, String(connectValue.id))
    }
  }

  record[tenantField] = tenantId
  return record
}

function crossTenantError(
  model: string,
  action: Prisma.PrismaAction,
  tenantId: string,
  targetTenantId: string,
) {
  return new TenantIsolationError(
    `Attempted ${model}.${action} targeting tenant ${targetTenantId} with context tenant ${tenantId}`,
    tenantId,
    targetTenantId,
  )
}

// Commented out - reserved for future use
// function mapActionToOperation(action: Prisma.PrismaAction): TenantOperation {
//   switch (action) {
//     case 'create':
//     case 'createMany':
//       return 'create'
//     case 'update':
//     case 'updateMany':
//     case 'upsert':
//       return 'write'
//     case 'delete':
//     case 'deleteMany':
//       return 'delete'
//     case 'findMany':
//     case 'findUnique':
//     case 'findUniqueOrThrow':
//     case 'findFirst':
//     case 'findFirstOrThrow':
//     case 'aggregate':
//     case 'count':
//     case 'groupBy':
//       return 'read'
//     default:
//       return action
//   }
// }

