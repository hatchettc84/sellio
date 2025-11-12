import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { TenantSummaryDataset } from '@/lib/types/tenant'
import { ArrowUpRight, Clock, FileText } from 'lucide-react'
import Link from 'next/link'

interface DatasetTableProps {
  datasets: TenantSummaryDataset[]
}

const DatasetTable = ({ datasets }: DatasetTableProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Datasets</CardTitle>
          <CardDescription>Preview ingestion status, document counts, and freshness.</CardDescription>
        </div>
        <Badge variant="outline" className="gap-1 text-xs font-medium">
          <FileText className="h-3 w-3" />
          {datasets.length} total
        </Badge>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[220px]">Dataset</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => (
                <TableRow key={dataset.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <Link href={`/datasets/${dataset.id}`} className="hover:underline">
                        {dataset.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{dataset.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={dataset.badgeVariant ?? 'outline'}>{dataset.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dataset.documents ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {dataset.lastUpdated ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/datasets/${dataset.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Open
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default DatasetTable
