// Background sync service for offline-first functionality
import {
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueItem,
  getPendingItems,
  savePatientLocally,
  saveObservationLocally,
  saveDiagnosticLocally,
  isOnline,
} from './db';
import { toast } from 'sonner';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds

let syncInProgress = false;
let onlineListenerAttached = false;

// Sync a single queue item
async function syncQueueItem(item: any): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  if (!token) {
    console.warn('No auth token available for sync');
    return false;
  }

  try {
    const response = await fetch(`${apiUrl}${item.endpoint}`, {
      method: item.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Update local data with server response
    if (item.type === 'patient' && result.patient) {
      await savePatientLocally(result.patient, 'synced');
    } else if (item.type === 'observation' && result.observation) {
      await saveObservationLocally(result.observation, 'synced');
    } else if (item.type === 'diagnostic' && result.diagnostic) {
      await saveDiagnosticLocally(result.diagnostic, 'synced');
    }

    // Remove from sync queue
    await removeSyncQueueItem(item.id);
    return true;
  } catch (error) {
    console.error(`Sync failed for ${item.type}:`, error);
    
    // Update retry count
    const newRetryCount = (item.retryCount || 0) + 1;
    if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
      // Mark as failed after max retries
      await updateSyncQueueItem(item.id, {
        retryCount: newRetryCount,
        lastAttempt: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    } else {
      // Schedule retry
      await updateSyncQueueItem(item.id, {
        retryCount: newRetryCount,
        lastAttempt: Date.now(),
      });
      return false;
    }
  }
}

// Process sync queue
export async function processSyncQueue(): Promise<void> {
  if (syncInProgress || !isOnline()) {
    return;
  }

  syncInProgress = true;

  try {
    const queue = await getSyncQueue();
    const itemsToSync = queue.filter(item => {
      // Only sync items that haven't exceeded retry attempts
      return (item.retryCount || 0) < MAX_RETRY_ATTEMPTS;
    });

    if (itemsToSync.length === 0) {
      return;
    }

    console.log(`Processing ${itemsToSync.length} items in sync queue`);

    let successCount = 0;
    let failCount = 0;

    for (const item of itemsToSync) {
      const success = await syncQueueItem(item);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Synced ${successCount} item(s) to server`, {
        duration: 3000,
      });
    }

    if (failCount > 0) {
      console.warn(`Failed to sync ${failCount} item(s)`);
    }
  } catch (error) {
    console.error('Sync queue processing error:', error);
  } finally {
    syncInProgress = false;
  }
}

// Sync pending patients
export async function syncPendingPatients(): Promise<void> {
  if (!isOnline()) return;

  const pendingPatients = await getPendingItems('patients');
  console.log(`Syncing ${pendingPatients.length} pending patients`);

  for (const patient of pendingPatients) {
    if ((patient as any).localOnly) {
      // Create new patient on server
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      if (!token) continue;

      try {
        const response = await fetch(`${apiUrl}/api/patients`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patient),
        });

        if (response.ok) {
          const result = await response.json();
          await savePatientLocally({ ...result.patient, syncStatus: 'synced' }, 'synced');
        }
      } catch (error) {
        console.error('Failed to sync patient:', error);
      }
    }
  }
}

// Sync pending observations
export async function syncPendingObservations(): Promise<void> {
  if (!isOnline()) return;

  const pendingObservations = await getPendingItems('observations');
  console.log(`Syncing ${pendingObservations.length} pending observations`);

  for (const observation of pendingObservations) {
    if ((observation as any).localOnly) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      if (!token) continue;

      try {
        const response = await fetch(`${apiUrl}/api/observations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(observation),
        });

        if (response.ok) {
          const result = await response.json();
          await saveObservationLocally({ ...result.observation, syncStatus: 'synced' }, 'synced');
        }
      } catch (error) {
        console.error('Failed to sync observation:', error);
      }
    }
  }
}

// Full sync - process everything
export async function performFullSync(): Promise<void> {
  if (!isOnline()) {
    toast.error('Cannot sync while offline', { duration: 3000 });
    return;
  }

  toast.loading('Syncing with server...', { id: 'full-sync' });

  try {
    await syncPendingPatients();
    await syncPendingObservations();
    await processSyncQueue();

    toast.success('Sync completed successfully', {
      id: 'full-sync',
      duration: 3000,
    });
  } catch (error) {
    console.error('Full sync error:', error);
    toast.error('Sync failed. Will retry automatically.', {
      id: 'full-sync',
      duration: 4000,
    });
  }
}

// Auto-sync on network reconnection
export function initAutoSync(): void {
  if (onlineListenerAttached) return;

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('Network reconnected - starting sync');
      toast.info('Back online! Syncing data...', { duration: 2000 });
      setTimeout(() => {
        performFullSync();
      }, 1000);
    });

    window.addEventListener('offline', () => {
      console.log('Network disconnected - offline mode active');
      toast.warning('You are now offline. Changes will sync when reconnected.', {
        duration: 4000,
      });
    });

    onlineListenerAttached = true;

    // Initial sync if online
    if (isOnline()) {
      setTimeout(() => {
        processSyncQueue();
      }, 2000);
    }
  }
}

// Periodic sync (every 30 seconds when online)
let syncInterval: NodeJS.Timeout | null = null;

export function startPeriodicSync(intervalMs: number = 30000): void {
  if (syncInterval) return;

  syncInterval = setInterval(() => {
    if (isOnline()) {
      processSyncQueue();
    }
  }, intervalMs);
}

export function stopPeriodicSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
