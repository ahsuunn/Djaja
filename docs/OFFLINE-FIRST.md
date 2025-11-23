# Offline-First Implementation Guide

## Overview

The Djaja Diagnostics application now supports **offline-first functionality**, allowing users to continue working without an internet connection. All data is cached locally using IndexedDB and automatically synchronized with the server when connectivity is restored.

## Features

### ✅ Offline Capabilities

1. **Patient Management**
   - View cached patient list offline
   - Add new patients locally
   - Automatic sync when online

2. **Device Simulator**
   - Generate and stream vital signs offline
   - Perform diagnostic analysis using offline algorithms
   - Save observations locally
   - All features work without WiFi

3. **Observations**
   - View patient observation history from cache
   - Create new observations offline
   - Automatic sync to server when online

4. **Background Sync**
   - Automatic synchronization on network reconnection
   - Periodic sync every 30 seconds when online
   - Retry mechanism for failed sync attempts
   - Visual sync status indicators

## Technical Architecture

### Data Storage

**IndexedDB Stores:**
- `patients` - Patient demographics and medical records
- `observations` - FHIR-compliant observation data
- `diagnostics` - Diagnostic analysis results
- `syncQueue` - Pending operations to sync
- `metadata` - App metadata and settings

### Sync Status

Each record has a `syncStatus` field:
- `synced` - Successfully saved to server
- `pending` - Waiting to sync
- `failed` - Sync failed after max retries

### API Client

The `lib/api-client.ts` provides offline-first wrappers:
- `getPatients()` - Returns cached data immediately, fetches fresh data in background
- `createPatient()` - Saves locally first, syncs to server when online
- `getPatientObservations()` - Returns cached observations, updates from server
- `createObservation()` - Saves locally, queues for sync
- `analyzeDiagnostics()` - Uses server analysis or falls back to offline algorithm

## Usage

### For Developers

#### Import Offline-First Functions

```typescript
import {
  getPatients,
  createPatient,
  getPatientObservations,
  createObservation,
  analyzeDiagnostics
} from '@/lib/api-client';
```

#### Initialize Sync Service

```typescript
import { initAutoSync, startPeriodicSync } from '@/lib/sync';

useEffect(() => {
  initAutoSync(); // Listen for online/offline events
  startPeriodicSync(); // Start periodic background sync
}, []);
```

#### Check Online Status

```typescript
import { isOnline } from '@/lib/db';

const online = isOnline();
```

#### Get Sync Status

```typescript
import { getSyncStatus } from '@/lib/db';

const status = await getSyncStatus();
console.log('Pending items:', status.totalPending);
console.log('Online:', status.isOnline);
```

#### Manual Sync

```typescript
import { performFullSync } from '@/lib/sync';

await performFullSync();
```

### For Users

#### Visual Indicators

1. **Connection Status Badge**
   - 🟢 **Online** - Connected to server
   - 🔴 **Offline** - No internet connection

2. **Sync Status Badge**
   - 🟡 **X pending** - Number of items waiting to sync
   - 🔵 **All synced** - All data synchronized
   - ⟳ **Sync button** - Manual sync trigger

3. **Data Source Indicator**
   - 📦 **Showing cached data** - Data from local cache

#### Offline Workflow

1. **Normal Operation**
   - Work as usual
   - All changes are immediately saved locally
   - Data syncs automatically in the background

2. **When Offline**
   - Continue working normally
   - All features remain functional
   - Data is saved to local IndexedDB
   - "Offline" badge appears in UI
   - Toast notification: "Saved locally. Will sync when online."

3. **When Reconnected**
   - Automatic notification: "Back online! Syncing data..."
   - Background sync starts immediately
   - Success notification: "Synced X items to server"
   - Sync status updates automatically

## Data Sync Logic

### Priority Queue

Sync operations are processed in order:
1. **Patients** - Synced first (required for observations)
2. **Observations** - Synced after patients
3. **Diagnostics** - Synced last

### Retry Mechanism

- **Max retries**: 3 attempts
- **Retry delay**: 5 seconds between attempts
- **Failed items**: Marked as `failed` after max retries
- **Manual retry**: Use sync button to retry failed items

### Conflict Resolution

- **Server wins**: Server data always takes precedence
- **Local IDs**: Generated with `local-` prefix
- **ID replacement**: Local IDs replaced with server IDs after sync

## Best Practices

### For Development

1. **Always use offline-first API**
   ```typescript
   // ❌ Don't use direct fetch
   const response = await fetch('/api/patients');
   
   // ✅ Use offline-first API
   const result = await getPatients(token);
   ```

2. **Check for offline mode**
   ```typescript
   if (result.offline) {
     // Handle offline scenario
     toast.info('Working offline');
   }
   ```

3. **Provide feedback**
   ```typescript
   if (result.fromCache) {
     // Show cache indicator
     console.log('Data from cache');
   }
   ```

4. **Handle sync errors gracefully**
   ```typescript
   try {
     await performFullSync();
   } catch (error) {
     console.error('Sync failed:', error);
     // App continues to work offline
   }
   ```

### For Testing

1. **Simulate Offline Mode**
   - Chrome DevTools → Network → Offline
   - Or disable WiFi

2. **Test Scenarios**
   - ✅ Add patient offline
   - ✅ Create observation offline
   - ✅ Run diagnostic analysis offline
   - ✅ View cached data
   - ✅ Reconnect and verify sync
   - ✅ Check sync status indicators

3. **Verify Data Integrity**
   - Check IndexedDB in Chrome DevTools → Application
   - Verify sync queue is processed
   - Confirm server receives all data

## Troubleshooting

### Sync Not Working

1. **Check online status**
   ```typescript
   console.log('Online:', isOnline());
   ```

2. **Check sync queue**
   ```typescript
   const queue = await getSyncQueue();
   console.log('Queue:', queue);
   ```

3. **Check pending items**
   ```typescript
   const status = await getSyncStatus();
   console.log('Pending:', status);
   ```

4. **Manual sync**
   ```typescript
   await performFullSync();
   ```

### Clear All Data

```typescript
import { clearAllData } from '@/lib/db';

await clearAllData(); // Clears all IndexedDB data
```

### Reset Sync Queue

```typescript
import { getDB } from '@/lib/db';

const db = await getDB();
await db.clear('syncQueue');
```

## Performance Considerations

### Storage Limits

- **IndexedDB**: ~50MB per origin (varies by browser)
- **Monitor usage**: Check browser's IndexedDB size
- **Cleanup**: Implement data retention policies

### Sync Performance

- **Batch size**: Process 10 items per sync cycle
- **Frequency**: Every 30 seconds when online
- **Throttling**: Prevent multiple concurrent syncs

### Network Efficiency

- **Cache-first**: Always return cached data first
- **Background fetch**: Update cache in background
- **Minimal requests**: Only sync changed data

## Security Considerations

1. **Token storage**: Auth token stored in localStorage
2. **Encrypted storage**: IndexedDB not encrypted by default
3. **Data sanitization**: Validate all data before sync
4. **Authentication**: Sync requires valid auth token

## Future Enhancements

- [ ] Service Worker for true offline PWA
- [ ] Differential sync (only changed fields)
- [ ] Conflict resolution UI
- [ ] Data compression
- [ ] Selective sync (choose what to sync)
- [ ] Export/import offline data
- [ ] Offline analytics
- [ ] Background sync API integration

## Dependencies

```json
{
  "idb": "^8.0.0" // IndexedDB wrapper with TypeScript support
}
```

## License

This offline-first implementation is part of the Djaja Diagnostics project.
