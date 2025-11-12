# Connector Background Sync Setup

This document explains how to set up and run the background sync system for connectors.

## Overview

The connector sync system automatically syncs data from configured connectors based on their `syncInterval` settings. Connectors with `autoSync: true` will be automatically synced when their sync interval has elapsed.

## How It Works

1. **Connector Configuration**: Each connector has:
   - `autoSync`: Boolean flag to enable/disable automatic syncing
   - `syncInterval`: Time in seconds between syncs (default: 3600 = 1 hour)
   - `lastSyncAt`: Timestamp of last successful sync

2. **Sync Detection**: The system finds connectors that need syncing by checking:
   - `autoSync === true`
   - `status === ACTIVE`
   - `lastSyncAt + syncInterval < now` (or never synced)

3. **Sync Process**:
   - Creates a sync record in `ConnectorSync` table
   - Updates connector status to `SYNCING`
   - Performs the actual data sync using the connector implementation
   - Creates a dataset from synced data
   - Updates connector status and sync record with results

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

If deploying to Vercel, the `vercel.json` file includes a cron job configuration:

```json
{
  "crons": [
    {
      "path": "/api/connectors/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

This runs every 15 minutes. Adjust the schedule as needed.

**Environment Variable Required:**
```bash
CRON_SECRET=your-secret-key-here
```

The API endpoint will check for this secret in the Authorization header.

### Option 2: Manual Script Execution

Run the sync processor script manually:

```bash
npm run connector:sync
```

Or with a limit:

```bash
node scripts/process-connector-syncs.mjs 5
```

### Option 3: System Cron (Linux/Mac)

Add to your crontab:

```bash
# Run every 15 minutes
*/15 * * * * cd /path/to/project && node scripts/process-connector-syncs.mjs >> /var/log/connector-sync.log 2>&1
```

### Option 4: GitHub Actions (CI/CD)

Create `.github/workflows/connector-sync.yml`:

```yaml
name: Connector Sync

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run connector:sync
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Option 5: Docker Container with Cron

Add to your `docker-compose.yml`:

```yaml
services:
  connector-sync:
    build: .
    command: sh -c "while true; do node scripts/process-connector-syncs.mjs; sleep 900; done"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db
```

## API Endpoint

### GET /api/connectors/sync

Returns connectors that need syncing (for monitoring):

```bash
curl http://localhost:3000/api/connectors/sync?limit=10
```

### POST /api/connectors/sync

Triggers sync for connectors that need it:

```bash
curl -X POST http://localhost:3000/api/connectors/sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

## Monitoring

### Check Sync Status

Query the database:

```sql
SELECT 
  c.name,
  c.type,
  c.status,
  c.lastSyncAt,
  c.lastSyncStatus,
  c.lastSyncError,
  cs.status as current_sync_status,
  cs.recordsFetched,
  cs.recordsProcessed
FROM "Connector" c
LEFT JOIN "ConnectorSync" cs ON cs."connectorId" = c.id 
  AND cs.status = 'IN_PROGRESS'
WHERE c."autoSync" = true
ORDER BY c."lastSyncAt" DESC;
```

### View Sync History

```sql
SELECT 
  cs.*,
  c.name as connector_name,
  c.type as connector_type
FROM "ConnectorSync" cs
JOIN "Connector" c ON c.id = cs."connectorId"
ORDER BY cs."startedAt" DESC
LIMIT 50;
```

## Troubleshooting

### Connectors Not Syncing

1. Check `autoSync` is enabled:
   ```sql
   SELECT id, name, "autoSync", status FROM "Connector";
   ```

2. Check connector status is `ACTIVE`:
   ```sql
   UPDATE "Connector" SET status = 'ACTIVE' WHERE id = 'connector-id';
   ```

3. Check sync interval:
   ```sql
   SELECT id, name, "syncInterval", "lastSyncAt" FROM "Connector";
   ```

### Sync Failures

1. Check sync history for errors:
   ```sql
   SELECT * FROM "ConnectorSync" WHERE status = 'FAILED' ORDER BY "startedAt" DESC;
   ```

2. Check connector error messages:
   ```sql
   SELECT id, name, "lastSyncError" FROM "Connector" WHERE "lastSyncError" IS NOT NULL;
   ```

3. Test connector manually:
   ```typescript
   import { testConnectorAction } from '@/action/connectors'
   await testConnectorAction(connectorId, tenantId)
   ```

### Performance

- Limit the number of connectors processed per run
- Adjust sync intervals based on data update frequency
- Monitor database load during sync operations
- Consider rate limiting for external API calls

## Best Practices

1. **Sync Intervals**: Set appropriate intervals based on data update frequency:
   - High-frequency data: 15-30 minutes
   - Medium-frequency: 1-4 hours
   - Low-frequency: 12-24 hours

2. **Error Handling**: Failed syncs are logged and don't block other connectors

3. **Resource Management**: The script processes connectors in sequence to avoid overwhelming the system

4. **Monitoring**: Set up alerts for:
   - Connectors with multiple consecutive failures
   - Syncs taking longer than expected
   - High error rates

