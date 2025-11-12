'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTenantContext } from '@/hooks/useTenantContext'
import { createConnectorAction } from '@/action/connectors'
import { toast } from 'sonner'
import { ConnectorType } from '@prisma/client'
import { onAuthenticateUser } from '@/action/auth'

type CreateConnectorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CreateConnectorDialog({ open, onOpenChange, onSuccess }: CreateConnectorDialogProps) {
  const { tenantId } = useTenantContext()
  const [connectorType, setConnectorType] = useState<ConnectorType | ''>('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Azure config
  const [azureServiceType, setAzureServiceType] = useState<'blob' | 'files' | 'sql'>('blob')
  const [azureStorageAccount, setAzureStorageAccount] = useState('')
  const [azureContainer, setAzureContainer] = useState('')
  const [azureDatabase, setAzureDatabase] = useState('')
  const [azureTable, setAzureTable] = useState('')
  const [azureClientId, setAzureClientId] = useState('')
  const [azureClientSecret, setAzureClientSecret] = useState('')
  const [azureTenantId, setAzureTenantId] = useState('')

  // Google config
  const [googleServiceType, setGoogleServiceType] = useState<'drive' | 'sheets' | 'docs' | 'gcs'>('drive')
  const [googleFileId, setGoogleFileId] = useState('')
  const [googleSpreadsheetId, setGoogleSpreadsheetId] = useState('')
  const [googleAccessToken, setGoogleAccessToken] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')

  // CRM config
  const [crmType, setCrmType] = useState<'generic' | 'salesforce' | 'hubspot' | 'pipedrive'>('generic')
  const [crmBaseUrl, setCrmBaseUrl] = useState('')
  const [crmObjectTypes, setCrmObjectTypes] = useState('')
  const [crmApiKey, setCrmApiKey] = useState('')
  const [crmAccessToken, setCrmAccessToken] = useState('')

  // Product Catalog config
  const [catalogType, setCatalogType] = useState<'shopify' | 'woocommerce' | 'bigcommerce' | 'generic'>('shopify')
  const [catalogShopDomain, setCatalogShopDomain] = useState('')
  const [catalogAccessToken, setCatalogAccessToken] = useState('')
  const [catalogBaseUrl, setCatalogBaseUrl] = useState('')

  const handleSubmit = async () => {
    if (!tenantId || !connectorType || !name) {
      toast.error('Please fill in all required fields')
      return
    }

    const user = await onAuthenticateUser()
    if (!user.user?.id) {
      toast.error('Authentication required')
      return
    }

    setIsSubmitting(true)

    try {
      let config: Record<string, unknown> = {}
      let credentials: Record<string, unknown> | null = null

      switch (connectorType) {
        case 'AZURE':
          config = {
            serviceType: azureServiceType,
            ...(azureServiceType === 'blob' || azureServiceType === 'files'
              ? { storageAccount: azureStorageAccount, container: azureContainer }
              : {}),
            ...(azureServiceType === 'sql' ? { database: azureDatabase, table: azureTable } : {}),
          }
          credentials = {
            clientId: azureClientId,
            clientSecret: azureClientSecret,
            tenantId: azureTenantId,
          }
          break

        case 'GOOGLE':
          config = {
            serviceType: googleServiceType,
            ...(googleServiceType === 'sheets' ? { spreadsheetId: googleSpreadsheetId } : {}),
            ...(googleServiceType === 'docs' ? { fileId: googleFileId } : {}),
          }
          credentials = {
            accessToken: googleAccessToken,
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }
          break

        case 'CRM':
          config = {
            crmType,
            ...(crmType === 'generic' ? { baseUrl: crmBaseUrl } : {}),
            objectTypes: crmObjectTypes.split(',').map((s) => s.trim()),
          }
          credentials = {
            ...(crmApiKey ? { apiKey: crmApiKey } : {}),
            ...(crmAccessToken ? { accessToken: crmAccessToken } : {}),
          }
          break

        case 'PRODUCT_CATALOG':
          config = {
            catalogType,
            ...(catalogType === 'shopify' ? { shopDomain: catalogShopDomain } : {}),
            ...(catalogType === 'generic' ? { baseUrl: catalogBaseUrl } : {}),
          }
          credentials = {
            accessToken: catalogAccessToken,
          }
          break
      }

      const result = await createConnectorAction(tenantId, user.user.id, name, connectorType, config, credentials)

      if (result.success) {
        toast.success('Connector created successfully')
        onSuccess()
        onOpenChange(false)
        // Reset form
        setName('')
        setConnectorType('')
      } else {
        toast.error(result.error || 'Failed to create connector')
      }
    } catch {
      toast.error('Failed to create connector')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Connector</DialogTitle>
          <DialogDescription>
            Connect a data source to automatically ingest information. All connectors are read-only and safe to use.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connector Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Azure Storage"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Connector Type *</Label>
            <Select value={connectorType} onValueChange={(value) => setConnectorType(value as ConnectorType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select connector type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AZURE">Azure (Blob Storage, Files, SQL)</SelectItem>
                <SelectItem value="GOOGLE">Google (Drive, Sheets, Docs, Cloud Storage)</SelectItem>
                <SelectItem value="CRM">CRM (Salesforce, HubSpot, Pipedrive, Generic)</SelectItem>
                <SelectItem value="PRODUCT_CATALOG">Product Catalog (Shopify, WooCommerce, BigCommerce)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {connectorType && (
            <Tabs defaultValue="config" className="w-full">
              <TabsList>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="credentials">Credentials</TabsTrigger>
              </TabsList>

              {connectorType === 'AZURE' && (
                <>
                  <TabsContent value="config" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Service Type</Label>
                      <Select value={azureServiceType} onValueChange={(v) => setAzureServiceType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blob">Blob Storage</SelectItem>
                          <SelectItem value="files">Azure Files</SelectItem>
                          <SelectItem value="sql">SQL Database</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(azureServiceType === 'blob' || azureServiceType === 'files') && (
                      <>
                        <div className="space-y-2">
                          <Label>Storage Account</Label>
                          <Input value={azureStorageAccount} onChange={(e) => setAzureStorageAccount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Container</Label>
                          <Input value={azureContainer} onChange={(e) => setAzureContainer(e.target.value)} />
                        </div>
                      </>
                    )}

                    {azureServiceType === 'sql' && (
                      <>
                        <div className="space-y-2">
                          <Label>Database</Label>
                          <Input value={azureDatabase} onChange={(e) => setAzureDatabase(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Table</Label>
                          <Input value={azureTable} onChange={(e) => setAzureTable(e.target.value)} />
                        </div>
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="credentials" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <Input value={azureClientId} onChange={(e) => setAzureClientId(e.target.value)} type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Secret</Label>
                      <Input
                        value={azureClientSecret}
                        onChange={(e) => setAzureClientSecret(e.target.value)}
                        type="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tenant ID</Label>
                      <Input value={azureTenantId} onChange={(e) => setAzureTenantId(e.target.value)} />
                    </div>
                  </TabsContent>
                </>
              )}

              {connectorType === 'GOOGLE' && (
                <>
                  <TabsContent value="config" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Service Type</Label>
                      <Select value={googleServiceType} onValueChange={(v) => setGoogleServiceType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="drive">Google Drive</SelectItem>
                          <SelectItem value="sheets">Google Sheets</SelectItem>
                          <SelectItem value="docs">Google Docs</SelectItem>
                          <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {googleServiceType === 'sheets' && (
                      <div className="space-y-2">
                        <Label>Spreadsheet ID</Label>
                        <Input
                          value={googleSpreadsheetId}
                          onChange={(e) => setGoogleSpreadsheetId(e.target.value)}
                        />
                      </div>
                    )}
                    {googleServiceType === 'docs' && (
                      <div className="space-y-2">
                        <Label>File ID</Label>
                        <Input value={googleFileId} onChange={(e) => setGoogleFileId(e.target.value)} />
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="credentials" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Access Token</Label>
                      <Input
                        value={googleAccessToken}
                        onChange={(e) => setGoogleAccessToken(e.target.value)}
                        type="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <Input value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Secret</Label>
                      <Input
                        value={googleClientSecret}
                        onChange={(e) => setGoogleClientSecret(e.target.value)}
                        type="password"
                      />
                    </div>
                  </TabsContent>
                </>
              )}

              {connectorType === 'CRM' && (
                <>
                  <TabsContent value="config" className="space-y-4">
                    <div className="space-y-2">
                      <Label>CRM Type</Label>
                      <Select value={crmType} onValueChange={(v) => setCrmType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="generic">Generic REST API</SelectItem>
                          <SelectItem value="salesforce">Salesforce</SelectItem>
                          <SelectItem value="hubspot">HubSpot</SelectItem>
                          <SelectItem value="pipedrive">Pipedrive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {crmType === 'generic' && (
                      <div className="space-y-2">
                        <Label>Base URL</Label>
                        <Input value={crmBaseUrl} onChange={(e) => setCrmBaseUrl(e.target.value)} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Object Types (comma-separated)</Label>
                      <Input
                        value={crmObjectTypes}
                        onChange={(e) => setCrmObjectTypes(e.target.value)}
                        placeholder="contacts, deals, products"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="credentials" className="space-y-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input value={crmApiKey} onChange={(e) => setCrmApiKey(e.target.value)} type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label>Access Token (alternative)</Label>
                      <Input
                        value={crmAccessToken}
                        onChange={(e) => setCrmAccessToken(e.target.value)}
                        type="password"
                      />
                    </div>
                  </TabsContent>
                </>
              )}

              {connectorType === 'PRODUCT_CATALOG' && (
                <>
                  <TabsContent value="config" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Catalog Type</Label>
                      <Select value={catalogType} onValueChange={(v) => setCatalogType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shopify">Shopify</SelectItem>
                          <SelectItem value="woocommerce">WooCommerce</SelectItem>
                          <SelectItem value="bigcommerce">BigCommerce</SelectItem>
                          <SelectItem value="generic">Generic REST API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {catalogType === 'shopify' && (
                      <div className="space-y-2">
                        <Label>Shop Domain</Label>
                        <Input
                          value={catalogShopDomain}
                          onChange={(e) => setCatalogShopDomain(e.target.value)}
                          placeholder="yourshop.myshopify.com"
                        />
                      </div>
                    )}
                    {catalogType === 'generic' && (
                      <div className="space-y-2">
                        <Label>Base URL</Label>
                        <Input value={catalogBaseUrl} onChange={(e) => setCatalogBaseUrl(e.target.value)} />
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="credentials" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Access Token</Label>
                      <Input
                        value={catalogAccessToken}
                        onChange={(e) => setCatalogAccessToken(e.target.value)}
                        type="password"
                      />
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !connectorType || !name}>
            {isSubmitting ? 'Creating...' : 'Create Connector'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

