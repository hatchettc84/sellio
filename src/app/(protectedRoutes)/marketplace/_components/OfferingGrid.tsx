import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { MarketplaceOffering } from '@/hooks/useMarketplaceOfferings'
import { ArrowUpRight, Star } from 'lucide-react'
import Link from 'next/link'

interface OfferingGridProps {
  offerings: MarketplaceOffering[]
}

const statusVariantMap: Record<MarketplaceOffering['status'], 'default' | 'secondary'> = {
  published: 'default',
  draft: 'secondary',
}

const OfferingGrid = ({ offerings }: OfferingGridProps) => {
  if (offerings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>No offerings yet</CardTitle>
          <CardDescription>Create your first listing to showcase services to tenants.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/marketplace/create">Create offering</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {offerings.map((offering) => (
        <Card key={offering.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="line-clamp-1 text-lg font-semibold">{offering.title}</CardTitle>
              <CardDescription className="line-clamp-2 text-xs">
                {offering.description}
              </CardDescription>
            </div>
            <Badge variant={statusVariantMap[offering.status]} className="capitalize text-xs">
              {offering.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Category</span>
              <Badge variant="outline">{offering.category}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Price</span>
              <span className="text-base font-semibold">
                {offering.currency} {offering.price.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-amber-400" />
              <span>{offering.rating.toFixed(1)}</span>
              <span className="text-xs">({offering.reviews} reviews)</span>
            </div>
          </CardContent>
          <CardFooter className="mt-auto flex items-center justify-between">
            <Link
              href={`/marketplace/${offering.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              Manage
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/marketplace/${offering.id}/duplicate`}>Duplicate</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export default OfferingGrid
