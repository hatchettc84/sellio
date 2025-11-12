#!/usr/bin/env node
import {
  PrismaClient,
  ProvisioningStatus,
} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [limitArg] = process.argv.slice(2)
  const limit = limitArg ? Number.parseInt(limitArg, 10) : 5

  const pendingJobs = await prisma.tenantProvisioningJob.findMany({
    where: { status: ProvisioningStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    take: Number.isNaN(limit) ? 5 : limit,
    include: {
      tenant: {
        select: { id: true, slug: true },
      },
    },
  })

  if (pendingJobs.length === 0) {
    console.log('No pending provisioning jobs found.')
    return
  }

  for (const job of pendingJobs) {
    await processJob(job)
  }
}

async function processJob(job) {
  const schemaName = resolveSchemaName(job)

  console.log(`Processing job ${job.id} for tenant ${job.tenantId} -> schema ${schemaName}`)

  try {
    await prisma.$transaction(async (tx) => {
      await tx.tenantProvisioningJob.update({
        where: { id: job.id },
        data: {
          status: ProvisioningStatus.EXECUTING,
          startedAt: new Date(),
        },
      })

      await tx.tenantProvisioningEvent.create({
        data: {
          jobId: job.id,
          tenantId: job.tenantId,
          action: 'executing',
          status: ProvisioningStatus.EXECUTING,
          payload: {
            schemaName,
          },
        },
      })

      await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)

      await tx.tenantRuntimeConfig.upsert({
        where: { tenantId: job.tenantId },
        update: {
          schemaName,
          lastVerifiedAt: new Date(),
        },
        create: {
          tenantId: job.tenantId,
          schemaName,
          lastVerifiedAt: new Date(),
        },
      })
    })

    await prisma.tenantProvisioningJob.update({
      where: { id: job.id },
      data: {
        status: ProvisioningStatus.COMPLETED,
        completedAt: new Date(),
      },
    })

    await prisma.tenantProvisioningEvent.create({
      data: {
        jobId: job.id,
        tenantId: job.tenantId,
        action: 'completed',
        status: ProvisioningStatus.COMPLETED,
        payload: {
          schemaName,
        },
      },
    })

    console.log(`Provisioning job ${job.id} completed.`)
  } catch (error) {
    console.error(`Provisioning job ${job.id} failed`, error)

    await prisma.tenantProvisioningJob.update({
      where: { id: job.id },
      data: {
        status: ProvisioningStatus.FAILED,
        completedAt: new Date(),
        errorDetails: {
          message: error instanceof Error ? error.message : String(error),
        },
      },
    })

    await prisma.tenantProvisioningEvent.create({
      data: {
        jobId: job.id,
        tenantId: job.tenantId,
        action: 'failed',
        status: ProvisioningStatus.FAILED,
        payload: {
          schemaName,
        },
      },
    })
  }
}

function resolveSchemaName(job) {
  if (job.targetSchema) {
    return job.targetSchema
  }

  const slugOrId = job.tenant.slug ?? job.tenantId
  return slugOrId.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
}

main()
  .catch((error) => {
    console.error('Provisioning processor failed', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


