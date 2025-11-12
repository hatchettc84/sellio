/**
 * Base connector interface and abstract class for read-only data connectors
 * All connectors are read-only and used for data ingestion into datasets
 */

export interface ConnectorConfig {
  [key: string]: unknown
}

export interface ConnectorCredentials {
  [key: string]: unknown
}

export interface SyncResult {
  success: boolean
  recordsFetched: number
  recordsProcessed: number
  data: ConnectorData[]
  error?: string
  metadata?: Record<string, unknown>
}

export interface ConnectorData {
  id: string
  type: string
  content: string
  metadata: Record<string, unknown>
  source: string
  fetchedAt: Date
}

export interface ConnectorTestResult {
  success: boolean
  message: string
  metadata?: Record<string, unknown>
}

/**
 * Abstract base class for all connectors
 * All connectors must be read-only
 */
export abstract class BaseConnector {
  protected config: ConnectorConfig
  protected credentials: ConnectorCredentials | null
  protected tenantId: string

  constructor(
    config: ConnectorConfig,
    credentials: ConnectorCredentials | null,
    tenantId: string
  ) {
    this.config = config
    this.credentials = credentials
    this.tenantId = tenantId
  }

  /**
   * Test the connector connection
   * Should verify credentials and connectivity
   */
  abstract testConnection(): Promise<ConnectorTestResult>

  /**
   * Sync data from the connector
   * This is the main method that fetches read-only data
   */
  abstract sync(): Promise<SyncResult>

  /**
   * Get connector metadata
   */
  abstract getMetadata(): Promise<Record<string, unknown>>

  /**
   * Validate configuration
   */
  abstract validateConfig(config: ConnectorConfig): { valid: boolean; error?: string }

  /**
   * Get connector type name
   */
  abstract getType(): string

  /**
   * Get human-readable connector name
   */
  abstract getName(): string

  /**
   * Get connector description
   */
  abstract getDescription(): string

  /**
   * Transform raw data into standardized format
   * Override in subclasses if needed
   */
  protected transformData(_rawData: unknown): ConnectorData[] {
    // Default implementation - override in subclasses
    // Parameter is intentionally unused in base class
    void _rawData // Suppress unused variable warning
    return []
  }

  /**
   * Validate credentials format
   */
  protected validateCredentials(credentials: ConnectorCredentials | null): boolean {
    return credentials !== null
  }
}

