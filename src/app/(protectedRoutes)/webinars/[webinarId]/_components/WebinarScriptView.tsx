'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Edit, Copy, Check } from 'lucide-react'
import { type Webinar } from '@prisma/client'
import { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  webinar: Webinar
}

const WebinarScriptView = ({ webinar }: Props) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (webinar.sellingScript) {
      navigator.clipboard.writeText(webinar.sellingScript)
      setCopied(true)
      toast.success('Script copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!webinar.sellingScript) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Agent Script</CardTitle>
          <CardDescription>No script has been generated for this webinar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Scripts are generated during webinar creation. If you need to add or regenerate a script, please edit the
            webinar.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Agent Script
            </CardTitle>
            <CardDescription>
              The selling script used by your AI agent during the webinar
              {webinar.scriptVersion && (
                <Badge variant="outline" className="ml-2">
                  Version {webinar.scriptVersion}
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/50 p-4 max-h-[600px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm font-mono">{webinar.sellingScript}</pre>
        </div>
        {webinar.datasetId && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Generated from dataset: {webinar.datasetId}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WebinarScriptView

