#!/usr/bin/env node
import { PrismaClient, ProvisioningStatus, ProvisioningTrigger } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, slug: true, runtimeConfig: true },
  })

  for (const tenant of tenants) {
    const schemaName = (tenant.slug ?? tenant.id).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()

    if (!tenant.runtimeConfig) {
      await prisma.tenantRuntimeConfig.create({
        data: {
          tenantId: tenant.id,
          schemaName,
        },
      })
    }

    const pendingJob = await prisma.tenantProvisioningJob.findFirst({
      where: { tenantId: tenant.id, status: ProvisioningStatus.PENDING },
    })

    if (!pendingJob) {
      const job = await prisma.tenantProvisioningJob.create({
        data: {
          tenantId: tenant.id,
          trigger: ProvisioningTrigger.MANUAL_OVERRIDE,
          status: ProvisioningStatus.PENDING,
          targetSchema: schemaName,
          metadata: {
            seeded: true,
            seededAt: new Date().toISOString(),
          },
        },
      })

      await prisma.tenantProvisioningEvent.create({
        data: {
          jobId: job.id,
          tenantId: tenant.id,
          action: 'seeded',
          status: ProvisioningStatus.PENDING,
          payload: {
            message: 'Seeded pending provisioning job for tenant',
          },
        },
      })
    }
  }
}

main()
  .catch((error) => {
    console.error('Seeding failed', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

