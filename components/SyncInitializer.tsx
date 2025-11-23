'use client';

import { useEffect } from 'react';
import { initAutoSync, startPeriodicSync } from '@/lib/sync';

/**
 * Global sync initializer component
 * Initializes offline-first sync service once for the entire app
 * Must be used only once in the root layout
 */
export function SyncInitializer() {
  useEffect(() => {
    // Initialize auto-sync on network events
    initAutoSync();
    
    // Start periodic sync every 30 seconds
    startPeriodicSync();

    // Cleanup is handled within the sync service
  }, []);

  return null; // This component doesn't render anything
}
