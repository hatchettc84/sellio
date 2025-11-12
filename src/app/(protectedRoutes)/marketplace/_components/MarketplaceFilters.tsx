'use client'

import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMemo, useState } from 'react'
import { SlidersHorizontal, Wand2 } from 'lucide-react'

const categories = ['Automation', 'Data Services', 'Compliance', 'Analytics', 'Enablement']
const statuses = ['Published', 'Draft']

export interface MarketplaceFiltersState {
  search: string
  categories: string[]
  statuses: string[]
}

interface MarketplaceFiltersProps {
  onChange?: (state: MarketplaceFiltersState) => void
}

const MarketplaceFilters = ({ onChange }: MarketplaceFiltersProps) => {
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const toggleValue = (value: string, collection: string[], setter: (values: string[]) => void) => {
    setter(collection.includes(value) ? collection.filter((item) => item !== value) : [...collection, value])
  }

  useMemo(() => {
    onChange?.({ search, categories: selectedCategories, statuses: selectedStatuses })
  }, [search, selectedCategories, selectedStatuses, onChange])

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        Filter offerings
      </div>
      <div className="mt-3 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted-foreground">Search</p>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search offerings"
            className="max-w-sm"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted-foreground">Categories</p>
          <ScrollArea className="h-20 rounded-lg border bg-muted/30 p-2">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Chip
                  key={category}
                  selected={selectedCategories.includes(category)}
                  onClick={() => toggleValue(category, selectedCategories, setSelectedCategories)}
                >
                  {category}
                </Chip>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted-foreground">Status</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Chip
                key={status}
                selected={selectedStatuses.includes(status)}
                onClick={() => toggleValue(status, selectedStatuses, setSelectedStatuses)}
              >
                {status}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => onChange?.({ search: '', categories: [], statuses: [] })}>
            Clear filters
          </Button>
          <Button size="sm" variant="ghost" className="flex items-center gap-1">
            <Wand2 className="h-3 w-3" />
            Smart suggestions
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MarketplaceFilters
