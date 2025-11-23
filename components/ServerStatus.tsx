'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Server, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { isTauri } from '@/lib/tauri-serial';

export default function ServerStatus() {
  const [status, setStatus] = useState<'running' | 'stopped' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTauriEnv, setIsTauriEnv] = useState(false);

  useEffect(() => {
    setIsTauriEnv(isTauri());
    if (isTauri()) {
      checkStatus();
      // Check status every 5 seconds
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const checkStatus = async () => {
    if (!isTauri()) return;
    
    try {
      const result = await invoke<string>('get_server_status');
      setStatus(result as 'running' | 'stopped');
      setError('');
    } catch (err) {
      console.error('Failed to check server status:', err);
      setStatus('unknown');
    }
  };

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await invoke<string>('start_backend_server');
      console.log(result);
      await checkStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await invoke<string>('stop_backend_server');
      console.log(result);
      await checkStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isTauriEnv) {
    return null; // Don't show in web version
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Server className="w-4 h-4" />
          Backend Server Status
        </CardTitle>
        <CardDescription className="text-xs">
          Auto-started on app launch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'running' ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Running</span>
              </>
            ) : status === 'stopped' ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600 font-medium">Stopped</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-gray-400 animate-pulse" />
                <span className="text-sm text-gray-600 font-medium">Checking...</span>
              </>
            )}
            <span className="text-xs text-muted-foreground">
              (http://localhost:5000)
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={checkStatus}
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {status !== 'running' ? (
              <Button
                size="sm"
                onClick={handleStart}
                disabled={loading}
              >
                Start Server
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStop}
                disabled={loading}
              >
                Stop Server
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
