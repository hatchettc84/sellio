import type { Application, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'

const demoOfferings = [
  {
    id: 'offer-001',
    title: 'AI Powered Customer Success Agent',
    description: 'Deploy a trained assistant that triages support and escalates complex cases.',
    price: 499,
    currency: 'USD',
    category: 'Automation',
    rating: 4.8,
    reviews: 42,
    status: 'published',
    createdAt: '2025-10-02',
  },
  {
    id: 'offer-002',
    title: 'Knowledge Base Transformation',
    description: 'Convert legacy PDFs and docs into conversational-ready embeddings.',
    price: 899,
    currency: 'USD',
    category: 'Data Services',
    rating: 4.6,
    reviews: 18,
    status: 'draft',
    createdAt: '2025-10-24',
  },
  {
    id: 'offer-003',
    title: 'Compliance Monitoring Bundle',
    description: 'Continuous audit checks, alerting, and reporting for regulated industries.',
    price: 1299,
    currency: 'USD',
    category: 'Compliance',
    rating: 4.9,
    reviews: 9,
    status: 'published',
    createdAt: '2025-11-01',
  },
]

const offeringSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  category: z.string().min(2),
})

export function registerMarketplaceRoutes(app: Application) {
  const router = Router()

  router.get('/offerings', (_req: Request, res: Response) => {
    res.json({ offerings: demoOfferings })
  })

  router.post('/offerings', (req: Request, res: Response) => {
    const parsed = offeringSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({ error: 'INVALID_OFFERING', issues: parsed.error.format() })
    }

    const createdOffering = {
      id: `offer_${Math.random().toString(36).slice(2, 10)}`,
      ...parsed.data,
      rating: 0,
      reviews: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }

    return res.status(201).json(createdOffering)
  })

  app.use('/v1/marketplace', router)
}
