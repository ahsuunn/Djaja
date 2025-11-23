'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { getSyncStatus } from '@/lib/db';
import { performFullSync } from '@/lib/sync';
import { toast } from 'sonner';

export function SyncStatusIndicator() {
  const [online, setOnline] = useState(true);
  const [syncInfo, setSyncInfo] = useState({
    pending: 0,
    syncing: false,
  });

  const updateStatus = async () => {
    const status = await getSyncStatus();
    setOnline(status.isOnline);
    setSyncInfo({
      pending: status.totalPending,
      syncing: false,
    });
  };

  useEffect(() => {
    updateStatus();

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!online) {
      toast.error('Cannot sync while offline', { duration: 3000 });
      return;
    }

    setSyncInfo((prev) => ({ ...prev, syncing: true }));
    try {
      await performFullSync();
      await updateStatus();
    } finally {
      setSyncInfo((prev) => ({ ...prev, syncing: false }));
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
          online
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}
      >
        {online ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Sync Status */}
      {syncInfo.pending > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
          <span>{syncInfo.pending} pending</span>
          {online && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSync}
              disabled={syncInfo.syncing}
              className="h-6 w-6 p-0 hover:bg-yellow-200"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncInfo.syncing ? 'animate-spin' : ''}`}
              />
            </Button>
          )}
        </div>
      )}

      {/* All Synced Indicator */}
      {syncInfo.pending === 0 && online && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>All synced</span>
        </div>
      )}
    </div>
  );
}
