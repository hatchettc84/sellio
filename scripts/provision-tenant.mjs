#!/usr/bin/env node
import { PrismaClient, ProvisioningStatus, ProvisioningTrigger } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [tenantId, tenantSlug, triggerArg] = process.argv.slice(2)

  if (!tenantId) {
    console.error('Usage: node scripts/provision-tenant.mjs <tenantId> [tenantSlug] [trigger]')
    process.exit(1)
  }

  const trigger =
    (triggerArg && ProvisioningTrigger[triggerArg.toUpperCase()]) || ProvisioningTrigger.MANUAL_OVERRIDE

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, runtimeConfig: true },
  })

  if (!tenant) {
    console.error(`Tenant ${tenantId} not found.`)
    process.exit(1)
  }

  const schemaName = (tenantSlug ?? tenant.slug ?? tenantId).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()

  const job = await prisma.$transaction(async (tx) => {
    const createdJob = await tx.tenantProvisioningJob.create({
      data: {
        tenantId,
        trigger,
        status: ProvisioningStatus.PENDING,
        targetSchema: schemaName,
        metadata: {
          requestedBy: 'provision-tenant-script',
          requestedAt: new Date().toISOString(),
        },
      },
    })

    await tx.tenantProvisioningEvent.create({
      data: {
        jobId: createdJob.id,
        tenantId,
        action: 'queued',
        status: ProvisioningStatus.PENDING,
        payload: {
          schemaName,
          trigger,
        },
      },
    })

    if (!tenant.runtimeConfig) {
      await tx.tenantRuntimeConfig.create({
        data: {
          tenantId,
          schemaName,
        },
      })
    }

    return createdJob
  })

  console.log(`Provisioning job ${job.id} created for tenant ${tenantId}`)
}

main()
  .catch((error) => {
    console.error('Failed to create provisioning job', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

