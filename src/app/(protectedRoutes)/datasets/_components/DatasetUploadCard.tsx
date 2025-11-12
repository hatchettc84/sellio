import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { UploadCloud } from 'lucide-react'

const DatasetUploadCard = () => {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Upload new training data</CardTitle>
          <CardDescription>
            Add PDFs, knowledge bases, or CSV exports to power tenant-specific AI workflows.
          </CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/datasets/history">View history</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 rounded-xl border border-dashed bg-muted/40 p-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-full border border-dashed border-primary/50 bg-primary/10 text-primary">
            <UploadCloud className="mx-auto mt-3 h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Drag and drop files or use a data source connector</p>
            <p className="text-xs text-muted-foreground">
              Supported: PDF, Markdown, plain text, CSV. Max 200MB per upload.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Preserved per-tenant with encryption at rest</span>
            <Separator orientation="vertical" className="hidden h-3 sm:block" />
            <span>Automatic cleanup for expired datasets</span>
            <Separator orientation="vertical" className="hidden h-3 sm:block" />
            <span>Mappable to marketplace offerings</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-3">
        <Button size="sm" variant="secondary" asChild>
          <Link href="/integrations">Manage connectors</Link>
        </Button>
        <Button size="sm">Start upload</Button>
      </CardFooter>
    </Card>
  )
}

export default DatasetUploadCard
