/**
 * Connector Factory - Creates connector instances based on type
 */

import { BaseConnector, type ConnectorConfig, type ConnectorCredentials } from './base'
import { AzureConnector } from './azure'
import { GoogleConnector } from './google'
import { CrmConnector } from './crm'
import { ProductCatalogConnector } from './product-catalog'
import { ConnectorType } from '@prisma/client'

export function createConnector(
  type: ConnectorType,
  config: ConnectorConfig,
  credentials: ConnectorCredentials | null,
  tenantId: string
): BaseConnector {
  switch (type) {
    case 'AZURE':
      return new AzureConnector(config, credentials, tenantId)
    case 'GOOGLE':
      return new GoogleConnector(config, credentials, tenantId)
    case 'CRM':
      return new CrmConnector(config, credentials, tenantId)
    case 'PRODUCT_CATALOG':
      return new ProductCatalogConnector(config, credentials, tenantId)
    default:
      throw new Error(`Unsupported connector type: ${type}`)
  }
}

export function getConnectorInfo(type: ConnectorType): {
  name: string
  description: string
  icon?: string
} {
  const connector = createConnector(type, {}, null, '')
  return {
    name: connector.getName(),
    description: connector.getDescription()
  }
}

