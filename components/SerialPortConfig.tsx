'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SerialPortManager, PortInfo, isTauri } from '@/lib/tauri-serial';
import { Wifi, WifiOff, RefreshCw, Settings } from 'lucide-react';

export default function SerialPortConfig() {
  const [isTauriEnv, setIsTauriEnv] = useState(false);
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Serial configuration
  const [baudRate, setBaudRate] = useState(9600);
  const [dataBits, setDataBits] = useState(8);
  const [stopBits, setStopBits] = useState(1);
  const [parity, setParity] = useState<'none' | 'odd' | 'even'>('none');
  const [availableBaudRates, setAvailableBaudRates] = useState<number[]>([]);

  useEffect(() => {
    const checkTauri = async () => {
      const inTauri = isTauri();
      setIsTauriEnv(inTauri);
      
      if (inTauri) {
        await loadPorts();
        await loadBaudRates();
      }
    };
    
    checkTauri();
  }, []);

  const loadPorts = async () => {
    try {
      setLoading(true);
      setError('');
      const availablePorts = await SerialPortManager.listPorts();
      setPorts(availablePorts);
    } catch (err) {
      setError('Failed to list serial ports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBaudRates = async () => {
    try {
      const rates = await SerialPortManager.getAvailableBaudRates();
      setAvailableBaudRates(rates);
    } catch (err) {
      console.error('Failed to load baud rates:', err);
    }
  };

  const handleConnect = async () => {
    if (!selectedPort) {
      setError('Please select a port');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await SerialPortManager.openPort(selectedPort, {
        baud_rate: baudRate,
        data_bits: dataBits,
        stop_bits: stopBits,
        parity: parity,
      });
      
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedPort) return;

    try {
      setLoading(true);
      setError('');
      
      await SerialPortManager.closePort(selectedPort);
      setIsConnected(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isTauriEnv) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Serial Port Configuration
          </CardTitle>
          <CardDescription>
            Serial port support is only available in the desktop application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You are currently using the web version. To use serial port functionality for connecting real IoT devices, 
            please use the desktop application.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Serial Port Configuration
        </CardTitle>
        <CardDescription>
          Connect to physical IoT devices via serial port
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">Available Ports</label>
          <div className="flex gap-2">
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              disabled={isConnected || loading}
              className="flex-1 px-3 py-2 border rounded-lg"
            >
              <option value="">Select a port...</option>
              {ports.map((port) => (
                <option key={port.name} value={port.name}>
                  {port.name} ({port.port_type})
                  {port.description ? ` - ${port.description}` : ''}
                </option>
              ))}
            </select>
            <Button
              onClick={loadPorts}
              disabled={loading || isConnected}
              variant="outline"
              size="icon"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Baud Rate</label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={isConnected}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {availableBaudRates.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Data Bits</label>
            <select
              value={dataBits}
              onChange={(e) => setDataBits(Number(e.target.value))}
              disabled={isConnected}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value={5}>5</option>
              <option value={6}>6</option>
              <option value={7}>7</option>
              <option value={8}>8</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Stop Bits</label>
            <select
              value={stopBits}
              onChange={(e) => setStopBits(Number(e.target.value))}
              disabled={isConnected}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Parity</label>
            <select
              value={parity}
              onChange={(e) => setParity(e.target.value as 'none' | 'odd' | 'even')}
              disabled={isConnected}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="none">None</option>
              <option value="odd">Odd</option>
              <option value="even">Even</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {!isConnected ? (
            <Button onClick={handleConnect} disabled={loading || !selectedPort}>
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleDisconnect} disabled={loading} variant="destructive">
              <WifiOff className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
