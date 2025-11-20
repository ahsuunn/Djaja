'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, Heart, Droplet, Stethoscope, Zap, Play, Pause, Wifi, WifiOff, Thermometer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import io, { Socket } from 'socket.io-client';

interface VitalSigns {
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number;
  spO2: number;
  temperature: number;
  ekg: {
    rhythm: 'regular' | 'irregular';
  };
}

interface DiagnosticResult {
  analysis: {
    bloodPressure?: { status: string; message: string };
    heartRate?: { status: string; message: string };
    spO2?: { status: string; message: string };
    temperature?: { status: string; message: string };
    ekg?: { status: string; message: string };
  };
  processedAt: string;
}

interface DataPoint {
  timestamp: number;
  value: number;
}

interface VitalHistory {
  bloodPressure: DataPoint[];
  heartRate: DataPoint[];
  spO2: DataPoint[];
  temperature: DataPoint[];
  ecg: DataPoint[];
}

interface StreamingState {
  bloodPressure: boolean;
  heartRate: boolean;
  spO2: boolean;
  temperature: boolean;
  ekg: boolean;
}

export default function DeviceSimulator() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [vitals, setVitals] = useState<VitalSigns>({
    bloodPressure: { systolic: 120, diastolic: 80 },
    heartRate: 75,
    spO2: 98,
    temperature: 36.8,
    ekg: { rhythm: 'regular' },
  });
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState<StreamingState>({
    bloodPressure: false,
    heartRate: false,
    spO2: false,
    temperature: false,
    ekg: false,
  });
  const [streamInterval, setStreamInterval] = useState(2000); // ms
  const [vitalHistory, setVitalHistory] = useState<VitalHistory>({
    bloodPressure: [],
    heartRate: [],
    spO2: [],
    temperature: [],
    ecg: [],
  });
  const streamIntervalsRef = useRef<Record<string, NodeJS.Timeout | null>>({
    bloodPressure: null,
    heartRate: null,
    spO2: null,
    temperature: null,
    ekg: null,
  });
  const ecgIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';
    const newSocket = io(wsUrl);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('diagnostic-result', (data: DiagnosticResult) => {
      setResult(data);
      setIsSending(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const generateRandomVitals = () => {
    const scenarios = [
      // Normal
      { bp: { systolic: 120, diastolic: 80 }, hr: 75, spo2: 98, temp: 36.8, ekg: 'regular' },
      // Hypertension
      { bp: { systolic: 145, diastolic: 95 }, hr: 88, spo2: 96, temp: 37.2, ekg: 'regular' },
      // Critical
      { bp: { systolic: 185, diastolic: 115 }, hr: 110, spo2: 89, temp: 38.5, ekg: 'irregular' },
      // Hypotension
      { bp: { systolic: 95, diastolic: 60 }, hr: 58, spo2: 94, temp: 35.8, ekg: 'regular' },
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    setVitals({
      bloodPressure: scenario.bp,
      heartRate: scenario.hr,
      spO2: scenario.spo2,
      temperature: scenario.temp,
      ekg: { rhythm: scenario.ekg as 'regular' | 'irregular' },
    });
  };

  // Helper randomization helpers
  const vary = (value: number, range: number) => Math.round(value + (Math.random() - 0.5) * range);
  const varyDecimal = (value: number, range: number) => Math.round((value + (Math.random() - 0.5) * range) * 10) / 10;

  // Generate realistic vital variations for all vitals (keeps existing behaviour)
  const generateRealisticVitals = (baseVitals: VitalSigns): VitalSigns => ({
    bloodPressure: {
      systolic: vary(baseVitals.bloodPressure.systolic, 5),
      diastolic: vary(baseVitals.bloodPressure.diastolic, 3),
    },
    heartRate: vary(baseVitals.heartRate, 3),
    spO2: Math.min(100, vary(baseVitals.spO2, 1)),
    temperature: varyDecimal(baseVitals.temperature, 0.2),
    ekg: baseVitals.ekg,
  });

  // Generate realistic changes only for a single vital while leaving others unchanged
  const generatePartialVitals = (vitalType: keyof StreamingState, baseVitals: VitalSigns): VitalSigns => {
    const bp = { ...baseVitals.bloodPressure };
    let hr = baseVitals.heartRate;
    let spo2 = baseVitals.spO2;
    let temp = baseVitals.temperature;
    const ekg = baseVitals.ekg;

    switch (vitalType) {
      case 'bloodPressure':
        bp.systolic = vary(bp.systolic, 5);
        bp.diastolic = vary(bp.diastolic, 3);
        break;
      case 'heartRate':
        hr = vary(hr, 3);
        break;
      case 'spO2':
        spo2 = Math.min(100, vary(spo2, 1));
        break;
      case 'temperature':
        temp = varyDecimal(temp, 0.2);
        break;
      default:
        break;
    }

    return {
      bloodPressure: bp,
      heartRate: hr,
      spO2: spo2,
      temperature: temp,
      ekg,
    };
  };

  // Add data point to history
  const addToHistory = (vitalType: keyof VitalHistory, value: number) => {
    const timestamp = Date.now();
    const maxPoints = 30;

    setVitalHistory((prev) => ({
      ...prev,
      [vitalType]: [
        ...prev[vitalType].slice(-maxPoints + 1),
        { timestamp, value },
      ],
    }));
  };

  // Generate ECG waveform data
  const generateECGPoint = () => {
    const timestamp = Date.now();
    const phase = (timestamp % 1000) / 1000;
    let value = 0;

    if (phase < 0.1) {
      value = Math.sin(phase * Math.PI * 10) * 0.2;
    } else if (phase < 0.2) {
      value = 0;
    } else if (phase < 0.35) {
      if (phase < 0.25) value = -0.3;
      else if (phase < 0.3) value = 1.0;
      else value = -0.2;
    } else if (phase < 0.5) {
      value = 0;
    } else if (phase < 0.7) {
      value = Math.sin((phase - 0.5) * Math.PI * 5) * 0.3;
    }

    value += (Math.random() - 0.5) * 0.05;

    setVitalHistory((prev) => ({
      ...prev,
      ecg: [...prev.ecg.slice(-100), { timestamp, value }],
    }));
  };

  const sendToCloud = (vitalData?: VitalSigns) => {
    if (!socket || !isConnected) {
      alert('Not connected to server. Please ensure the backend is running.');
      return;
    }

    const dataToSend = vitalData || vitals;
    setIsSending(true);
    setResult(null);

    const deviceData = {
      deviceId: `SIM-${Date.now()}`,
      patientId: 'demo-patient',
      bloodPressure: dataToSend.bloodPressure,
      heartRate: dataToSend.heartRate,
      spO2: dataToSend.spO2,
      temperature: dataToSend.temperature,
      ekg: dataToSend.ekg,
      timestamp: new Date().toISOString(),
    };

    socket.emit('device-data', deviceData);
    console.log('📡 Sending data:', deviceData);
  };

  // Start streaming individual vital
  const startVitalStreaming = (vitalType: keyof StreamingState) => {
    if (!isConnected) {
      alert('Not connected to server. Please ensure the backend is running.');
      return;
    }

    setIsStreaming((prev) => ({ ...prev, [vitalType]: true }));
    console.log(`▶️ Starting ${vitalType} stream...`);

    if (vitalType === 'ekg') {
      // Stream ECG waveform at higher frequency
      ecgIntervalRef.current = setInterval(() => {
        generateECGPoint();
      }, 16); // ~60 FPS
    } else {
      // Stream only the selected vital at specified interval (leave others unchanged)
      streamIntervalsRef.current[vitalType] = setInterval(() => {
        setVitals((prev) => {
          const updated = generatePartialVitals(vitalType, prev);

          // Update specific vital history based on updated values
          switch (vitalType) {
            case 'bloodPressure':
              addToHistory('bloodPressure', updated.bloodPressure.systolic);
              break;
            case 'heartRate':
              addToHistory('heartRate', updated.heartRate);
              break;
            case 'spO2':
              addToHistory('spO2', updated.spO2);
              break;
            case 'temperature':
              addToHistory('temperature', updated.temperature);
              break;
          }

          // Send only the updated vitals snapshot to cloud
          sendToCloud(updated);
          return updated;
        });
      }, streamInterval);
    }
  };

  // Stop streaming individual vital
  const stopVitalStreaming = (vitalType: keyof StreamingState) => {
    setIsStreaming((prev) => ({ ...prev, [vitalType]: false }));
    console.log(`⏸️ Stopping ${vitalType} stream...`);

    if (vitalType === 'ekg') {
      if (ecgIntervalRef.current) {
        clearInterval(ecgIntervalRef.current);
        ecgIntervalRef.current = null;
      }
    } else {
      if (streamIntervalsRef.current[vitalType]) {
        clearInterval(streamIntervalsRef.current[vitalType]!);
        streamIntervalsRef.current[vitalType] = null;
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.keys(streamIntervalsRef.current).forEach((key) => {
        if (streamIntervalsRef.current[key]) {
          clearInterval(streamIntervalsRef.current[key]!);
        }
      });
      if (ecgIntervalRef.current) {
        clearInterval(ecgIntervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50';
      case 'caution':
        return 'text-yellow-600 bg-yellow-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const anyStreaming = Object.values(isStreaming).some((s) => s);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">IoT Device Simulator</h1>
          <p className="text-muted-foreground">
            Simulate medical device readings and see real-time AI analysis
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              {isConnected ? 'Connected to Cloud' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Device Controls */}
          <div className="space-y-6">
            {/* Global Controls */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Global Settings
                </CardTitle>
                <CardDescription>Configure streaming interval and generate test data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Stream Interval (ms)</label>
                  <Input
                    type="number"
                    value={streamInterval}
                    onChange={(e) => setStreamInterval(Number(e.target.value))}
                    min="500"
                    max="10000"
                    step="500"
                    disabled={anyStreaming}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Data sent every {streamInterval / 1000} seconds
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateRandomVitals} variant="outline" className="flex-1" disabled={anyStreaming}>
                    Generate Random
                  </Button>
                  <Button
                    onClick={() => sendToCloud()}
                    disabled={!isConnected || isSending || anyStreaming}
                    className="flex-1"
                  >
                    {isSending ? 'Processing...' : 'Send Single'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Individual Vital Streaming Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Individual Vital Controls</CardTitle>
                <CardDescription>Start/stop streaming for each vital sign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {/* Blood Pressure */}
                  <div className="flex flex-col p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <div className="font-medium text-blue-900">Blood Pressure</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900 mb-1">
                      {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
                    </div>
                    <div className="text-xs text-blue-600 mb-3">mmHg</div>
                    {!isStreaming.bloodPressure ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('bloodPressure')}
                        disabled={!isConnected}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('bloodPressure')}
                        className="w-full"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* Heart Rate */}
                  <div className="flex flex-col p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-5 h-5 text-red-600" />
                      <div className="font-medium text-red-900">Heart Rate</div>
                    </div>
                    <div className="text-2xl font-bold text-red-900 mb-1">{vitals.heartRate}</div>
                    <div className="text-xs text-red-600 mb-3">bpm</div>
                    {!isStreaming.heartRate ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('heartRate')}
                        disabled={!isConnected}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('heartRate')}
                        className="w-full"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* SpO2 */}
                  <div className="flex flex-col p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Droplet className="w-5 h-5 text-green-600" />
                      <div className="font-medium text-green-900">SpO2</div>
                    </div>
                    <div className="text-2xl font-bold text-green-900 mb-1">{vitals.spO2}%</div>
                    <div className="text-xs text-green-600 mb-3">Oxygen Saturation</div>
                    {!isStreaming.spO2 ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('spO2')}
                        disabled={!isConnected}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('spO2')}
                        className="w-full"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* Temperature */}
                  <div className="flex flex-col p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Thermometer className="w-5 h-5 text-orange-600" />
                      <div className="font-medium text-orange-900">Temperature</div>
                    </div>
                    <div className="text-2xl font-bold text-orange-900 mb-1">{vitals.temperature}°C</div>
                    <div className="text-xs text-orange-600 mb-3">Body Temperature</div>
                    {!isStreaming.temperature ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('temperature')}
                        disabled={!isConnected}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('temperature')}
                        className="w-full"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* EKG */}
                  <div className="flex flex-col p-4 bg-purple-50 rounded-lg border border-purple-200 col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <div className="font-medium text-purple-900">EKG Rhythm</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-900 mb-1">{vitals.ekg.rhythm}</div>
                    <div className="text-xs text-purple-600 mb-3">Electrocardiogram</div>
                    {!isStreaming.ekg ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('ekg')}
                        disabled={!isConnected}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('ekg')}
                        className="w-full"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-Time Dashboard */}
          <div className="space-y-6">

            {/* ECG Waveform */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  ECG Waveform
                  {isStreaming.ekg && (
                    <span className="ml-auto text-xs text-red-600 font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      LIVE
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Real-time electrocardiogram</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gray-900 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vitalHistory.ecg}>
                      <defs>
                        <linearGradient id="ecgGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#9ca3af"
                        tick={false}
                        axisLine={{ stroke: '#374151' }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        domain={[-0.5, 1.2]}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#ecgGradient)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  Rhythm: {vitals.ekg.rhythm.toUpperCase()} | Rate: {vitals.heartRate} BPM
                </div>
              </CardContent>
            </Card>

            {/* Vital Trends Charts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Vital Trends
                </CardTitle>
                <CardDescription>Historical data from streaming session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Heart Rate Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Heart Rate</h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalHistory.heartRate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tick={false}
                          stroke="#9ca3af"
                        />
                        <YAxis
                          domain={[40, 150]}
                          stroke="#9ca3af"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                        />
                        <Tooltip
                          labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                          formatter={(value: number) => [`${value} bpm`, 'HR']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* SpO2 Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Oxygen Saturation (SpO2)</h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalHistory.spO2}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tick={false}
                          stroke="#9ca3af"
                        />
                        <YAxis
                          domain={[85, 100]}
                          stroke="#9ca3af"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                        />
                        <Tooltip
                          labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                          formatter={(value: number) => [`${value}%`, 'SpO2']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Blood Pressure Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Blood Pressure (Systolic)</h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalHistory.bloodPressure}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tick={false}
                          stroke="#9ca3af"
                        />
                        <YAxis
                          domain={[80, 180]}
                          stroke="#9ca3af"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                        />
                        <Tooltip
                          labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                          formatter={(value: number) => [`${value} mmHg`, 'Systolic']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Temperature Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Body Temperature</h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalHistory.temperature}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tick={false}
                          stroke="#9ca3af"
                        />
                        <YAxis
                          domain={[35, 40]}
                          stroke="#9ca3af"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                        />
                        <Tooltip
                          labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                          formatter={(value: number) => [`${value}°C`, 'Temp']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Diagnostic Analysis */}
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  AI Diagnostic Analysis
                </CardTitle>
                <CardDescription>Real-time analysis results</CardDescription>
              </CardHeader>
              <CardContent>
                {isSending && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Analyzing vitals...</p>
                  </div>
                )}

                {result && !isSending && (
                  <div className="space-y-4">
                    <div className="text-xs text-muted-foreground mb-4">
                      Processed at: {new Date(result.processedAt).toLocaleString()}
                    </div>

                    {result.analysis.bloodPressure && (
                      <div className={`p-4 rounded-lg ${getStatusColor(result.analysis.bloodPressure.status)}`}>
                        <div className="font-semibold">Blood Pressure</div>
                        <div className="text-sm mt-1">{result.analysis.bloodPressure.message}</div>
                        <div className="text-xs mt-2 opacity-75">
                          {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic} mmHg
                        </div>
                      </div>
                    )}

                    {result.analysis.heartRate && (
                      <div className={`p-4 rounded-lg ${getStatusColor(result.analysis.heartRate.status)}`}>
                        <div className="font-semibold">Heart Rate</div>
                        <div className="text-sm mt-1">{result.analysis.heartRate.message}</div>
                        <div className="text-xs mt-2 opacity-75">{vitals.heartRate} bpm</div>
                      </div>
                    )}

                    {result.analysis.spO2 && (
                      <div className={`p-4 rounded-lg ${getStatusColor(result.analysis.spO2.status)}`}>
                        <div className="font-semibold">Oxygen Saturation</div>
                        <div className="text-sm mt-1">{result.analysis.spO2.message}</div>
                        <div className="text-xs mt-2 opacity-75">{vitals.spO2}%</div>
                      </div>
                    )}

                    {result.analysis.temperature && (
                      <div className={`p-4 rounded-lg ${getStatusColor(result.analysis.temperature.status)}`}>
                        <div className="font-semibold">Body Temperature</div>
                        <div className="text-sm mt-1">{result.analysis.temperature.message}</div>
                        <div className="text-xs mt-2 opacity-75">{vitals.temperature}°C</div>
                      </div>
                    )}

                    {result.analysis.ekg && (
                      <div className={`p-4 rounded-lg ${getStatusColor(result.analysis.ekg.status)}`}>
                        <div className="font-semibold">EKG Rhythm</div>
                        <div className="text-sm mt-1">{result.analysis.ekg.message}</div>
                        <div className="text-xs mt-2 opacity-75">{vitals.ekg.rhythm}</div>
                      </div>
                    )}
                  </div>
                )}

                {!result && !isSending && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Stethoscope className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Set vital signs and click &quot;Send Single&quot; to see analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
