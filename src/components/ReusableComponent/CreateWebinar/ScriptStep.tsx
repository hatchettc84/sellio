'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, Info } from 'lucide-react'
import { useWebinarStore } from '@/store/useWebinarStore'
import { generateWebinarScript } from '@/action/script-generation'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTenantDatasets } from '@/hooks/useTenantDatasets'
import { useTenantContext } from '@/hooks/useTenantContext'
import { Checkbox } from '@/components/ui/checkbox'

const ScriptStep = () => {
  const { formData, updateScriptField, getStepValidationErrors } = useWebinarStore()
  const { tenantId } = useTenantContext()
  const { datasets } = useTenantDatasets(tenantId)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([])

  const errors = getStepValidationErrors('script')
  const scriptContent = formData.script?.content || ''

  // Note: Script generation is manual - user clicks "Generate Script" button

  const handleGenerateScript = async () => {
    if (!formData.basicInfo.webinarName) {
      toast.error('Please complete basic information first')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateWebinarScript(formData, selectedDatasets.length > 0 ? selectedDatasets : undefined)

      if (result.success && result.script) {
        updateScriptField('content', result.script)
        updateScriptField('isGenerated', true)
        if (result.datasetIds) {
          updateScriptField('datasetIds', result.datasetIds)
        }
        toast.success(result.message || 'Script generated successfully')
      } else {
        toast.error(result.message || 'Failed to generate script')
      }
    } catch (error) {
      console.error('Error generating script:', error)
      toast.error('Failed to generate script. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleScriptChange = (value: string) => {
    updateScriptField('content', value)
  }

  const handleDatasetToggle = (datasetId: string, checked: boolean) => {
    if (checked) {
      setSelectedDatasets([...selectedDatasets, datasetId])
    } else {
      setSelectedDatasets(selectedDatasets.filter((id) => id !== datasetId))
    }
  }

  const readyDatasets = datasets.filter((ds) => ds.status === 'READY')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="script" className="text-lg font-semibold">
            AI Agent Selling Script
          </Label>
          <div className="flex items-center gap-2">
            {readyDatasets.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {readyDatasets.length} dataset{readyDatasets.length !== 1 ? 's' : ''} available
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateScript}
              disabled={isGenerating || !formData.basicInfo.webinarName}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {scriptContent ? 'Regenerate' : 'Generate Script'}
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          This script will be used to train your AI agent (Vapi) for the webinar. The LLM generates it based on your
          webinar information and available datasets. You can edit it before launching.
        </p>
      </div>

      {readyDatasets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select Datasets (Optional)</Label>
          <p className="text-xs text-muted-foreground">
            Choose which datasets to use for script generation. Leave empty to use all available datasets.
          </p>
          <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-3">
            {readyDatasets.map((dataset) => (
              <div key={dataset.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`dataset-${dataset.id}`}
                  checked={selectedDatasets.includes(dataset.id)}
                  onCheckedChange={(checked) => handleDatasetToggle(dataset.id, checked as boolean)}
                />
                <label
                  htmlFor={`dataset-${dataset.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {dataset.name}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({dataset.documentsCount} documents)
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {readyDatasets.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No datasets available. Upload documents or connect data sources in the{' '}
            <a href="/datasets" className="underline">
              Datasets
            </a>{' '}
            section to generate more personalized scripts.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="script-content">Script Content</Label>
          {scriptContent && (
            <span className="text-xs text-muted-foreground">
              {scriptContent.split('\n').length} lines • {scriptContent.length} characters
            </span>
          )}
        </div>
        <Textarea
          id="script-content"
          value={scriptContent}
          onChange={(e) => handleScriptChange(e.target.value)}
          placeholder="Click 'Generate Script' to create a selling script based on your webinar information and datasets..."
          className="min-h-[400px] max-h-[600px] font-mono text-sm bg-background/50 border-input resize-y"
        />
        {errors.content && <p className="text-sm text-red-400">{errors.content}</p>}
        <p className="text-xs text-muted-foreground">
          Edit the script to customize it for your needs. This script will be used to train your AI agent for the
          webinar presentation.
        </p>
      </div>

      {scriptContent && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Script Preview:</strong> This script will be used by your AI agent during the webinar. Make sure it
            accurately reflects your webinar content, value proposition, and call-to-action.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default ScriptStep

