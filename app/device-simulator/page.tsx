'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, Heart, Droplet, Stethoscope, Zap, Play, Pause, Wifi, WifiOff } from 'lucide-react';
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
  glucose: number;
  ekg: {
    rhythm: 'regular' | 'irregular';
  };
}

interface DiagnosticResult {
  analysis: {
    bloodPressure?: { status: string; message: string };
    heartRate?: { status: string; message: string };
    spO2?: { status: string; message: string };
    glucose?: { status: string; message: string };
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
  glucose: DataPoint[];
  ecg: DataPoint[];
}

export default function DeviceSimulator() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [vitals, setVitals] = useState<VitalSigns>({
    bloodPressure: { systolic: 120, diastolic: 80 },
    heartRate: 75,
    spO2: 98,
    glucose: 95,
    ekg: { rhythm: 'regular' },
  });
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamInterval, setStreamInterval] = useState(2000); // ms
  const [vitalHistory, setVitalHistory] = useState<VitalHistory>({
    bloodPressure: [],
    heartRate: [],
    spO2: [],
    glucose: [],
    ecg: [],
  });
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
      { bp: { systolic: 120, diastolic: 80 }, hr: 75, spo2: 98, glucose: 95, ekg: 'regular' },
      // Hypertension
      { bp: { systolic: 145, diastolic: 95 }, hr: 88, spo2: 96, glucose: 110, ekg: 'regular' },
      // Critical
      { bp: { systolic: 185, diastolic: 115 }, hr: 110, spo2: 89, glucose: 220, ekg: 'irregular' },
      // Hypotension
      { bp: { systolic: 95, diastolic: 60 }, hr: 58, spo2: 94, glucose: 68, ekg: 'regular' },
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    setVitals({
      bloodPressure: scenario.bp,
      heartRate: scenario.hr,
      spO2: scenario.spo2,
      glucose: scenario.glucose,
      ekg: { rhythm: scenario.ekg as 'regular' | 'irregular' },
    });
  };

  // Generate realistic vital variations (simulates natural body fluctuations)
  const generateRealisticVitals = (baseVitals: VitalSigns): VitalSigns => {
    const vary = (value: number, range: number) => {
      return Math.round(value + (Math.random() - 0.5) * range);
    };

    return {
      bloodPressure: {
        systolic: vary(baseVitals.bloodPressure.systolic, 5),
        diastolic: vary(baseVitals.bloodPressure.diastolic, 3),
      },
      heartRate: vary(baseVitals.heartRate, 3),
      spO2: Math.min(100, vary(baseVitals.spO2, 1)),
      glucose: vary(baseVitals.glucose, 5),
      ekg: baseVitals.ekg,
    };
  };

  // Add data point to history (keep last 30 points)
  const addToHistory = (newVitals: VitalSigns) => {
    const timestamp = Date.now();
    const maxPoints = 30;

    setVitalHistory((prev) => ({
      bloodPressure: [
        ...prev.bloodPressure.slice(-maxPoints + 1),
        { timestamp, value: newVitals.bloodPressure.systolic },
      ],
      heartRate: [
        ...prev.heartRate.slice(-maxPoints + 1),
        { timestamp, value: newVitals.heartRate },
      ],
      spO2: [
        ...prev.spO2.slice(-maxPoints + 1),
        { timestamp, value: newVitals.spO2 },
      ],
      glucose: [
        ...prev.glucose.slice(-maxPoints + 1),
        { timestamp, value: newVitals.glucose },
      ],
      ecg: prev.ecg, // ECG updated separately at higher frequency
    }));
  };

  // Generate ECG waveform data (simulates heart electrical activity)
  const generateECGPoint = () => {
    const timestamp = Date.now();
    // Simulate ECG waveform: P wave, QRS complex, T wave
    const phase = (timestamp % 1000) / 1000; // 0 to 1 cycle per second
    let value = 0;

    if (phase < 0.1) {
      // P wave
      value = Math.sin(phase * Math.PI * 10) * 0.2;
    } else if (phase < 0.2) {
      // PR segment
      value = 0;
    } else if (phase < 0.35) {
      // QRS complex
      if (phase < 0.25) value = -0.3;
      else if (phase < 0.3) value = 1.0;
      else value = -0.2;
    } else if (phase < 0.5) {
      // ST segment
      value = 0;
    } else if (phase < 0.7) {
      // T wave
      value = Math.sin((phase - 0.5) * Math.PI * 5) * 0.3;
    }

    // Add noise for realism
    value += (Math.random() - 0.5) * 0.05;

    setVitalHistory((prev) => ({
      ...prev,
      ecg: [...prev.ecg.slice(-100), { timestamp, value }],
    }));
  };

  const sendToCloud = (vitalData?: VitalSigns) => {
    if (!socket || !isConnected) {
      if (!isStreaming) {
        alert('Not connected to server. Please ensure the backend is running.');
      }
      return;
    }

    const dataToSend = vitalData || vitals;
    if (!isStreaming) {
      setIsSending(true);
      setResult(null);
    }

    const deviceData = {
      deviceId: `SIM-${Date.now()}`,
      patientId: 'demo-patient',
      bloodPressure: dataToSend.bloodPressure,
      heartRate: dataToSend.heartRate,
      spO2: dataToSend.spO2,
      glucose: dataToSend.glucose,
      ekg: dataToSend.ekg,
      timestamp: new Date().toISOString(),
    };

    socket.emit('device-data', deviceData);
    console.log('📡 Streaming data:', deviceData);
  };

  // Start continuous streaming
  const startStreaming = () => {
    if (!isConnected) {
      alert('Not connected to server. Please ensure the backend is running.');
      return;
    }

    setIsStreaming(true);
    console.log('▶️ Starting continuous stream...');

    // Stream vital signs at specified interval
    streamIntervalRef.current = setInterval(() => {
      const newVitals = generateRealisticVitals(vitals);
      setVitals(newVitals);
      addToHistory(newVitals);
      sendToCloud(newVitals);
    }, streamInterval);

    // Stream ECG waveform at higher frequency (60 Hz for smooth waveform)
    ecgIntervalRef.current = setInterval(() => {
      generateECGPoint();
    }, 16); // ~60 FPS
  };

  // Stop streaming
  const stopStreaming = () => {
    setIsStreaming(false);
    console.log('⏸️ Stopping stream...');

    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    if (ecgIntervalRef.current) {
      clearInterval(ecgIntervalRef.current);
      ecgIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Blood Pressure Monitor
                </CardTitle>
                <CardDescription>Systolic and Diastolic readings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Systolic (mmHg)</label>
                  <Input
                    type="number"
                    value={vitals.bloodPressure.systolic}
                    onChange={(e) =>
                      setVitals({
                        ...vitals,
                        bloodPressure: { ...vitals.bloodPressure, systolic: Number(e.target.value) },
                      })
                    }
                    min="60"
                    max="250"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Diastolic (mmHg)</label>
                  <Input
                    type="number"
                    value={vitals.bloodPressure.diastolic}
                    onChange={(e) =>
                      setVitals({
                        ...vitals,
                        bloodPressure: { ...vitals.bloodPressure, diastolic: Number(e.target.value) },
                      })
                    }
                    min="40"
                    max="150"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Heart Rate & SpO2
                </CardTitle>
                <CardDescription>Pulse and oxygen saturation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Heart Rate (bpm)</label>
                  <Input
                    type="number"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                    min="40"
                    max="200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">SpO2 (%)</label>
                  <Input
                    type="number"
                    value={vitals.spO2}
                    onChange={(e) => setVitals({ ...vitals, spO2: Number(e.target.value) })}
                    min="70"
                    max="100"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="w-5 h-5" />
                  Glucose Monitor
                </CardTitle>
                <CardDescription>Blood glucose level</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium">Glucose (mg/dL)</label>
                  <Input
                    type="number"
                    value={vitals.glucose}
                    onChange={(e) => setVitals({ ...vitals, glucose: Number(e.target.value) })}
                    min="40"
                    max="400"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  EKG Monitor
                </CardTitle>
                <CardDescription>Heart rhythm analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={vitals.ekg.rhythm === 'regular'}
                      onChange={() => setVitals({ ...vitals, ekg: { rhythm: 'regular' } })}
                    />
                    Regular
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={vitals.ekg.rhythm === 'irregular'}
                      onChange={() => setVitals({ ...vitals, ekg: { rhythm: 'irregular' } })}
                    />
                    Irregular
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Streaming Controls */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Streaming Controls
                </CardTitle>
                <CardDescription>Simulate continuous IoT device data stream</CardDescription>
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
                    disabled={isStreaming}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Data sent every {streamInterval / 1000} seconds
                  </p>
                </div>

                <div className="flex gap-2">
                  {!isStreaming ? (
                    <Button
                      onClick={startStreaming}
                      disabled={!isConnected}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Streaming
                    </Button>
                  ) : (
                    <Button
                      onClick={stopStreaming}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Stop Streaming
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={generateRandomVitals} variant="outline" className="flex-1" disabled={isStreaming}>
                Generate Random
              </Button>
              <Button
                onClick={() => sendToCloud()}
                disabled={!isConnected || isSending || isStreaming}
                className="flex-1"
              >
                {isSending ? 'Processing...' : 'Send Single'}
              </Button>
            </div>
          </div>

          {/* Real-Time Dashboard */}
          <div className="space-y-6">
            {/* Live Vitals Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Live Vitals Monitor
                  </div>
                  {isStreaming && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-red-600 font-medium">STREAMING</span>
                    </div>
                  )}
                </CardTitle>
                <CardDescription>Real-time vital signs display</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium mb-1">Blood Pressure</div>
                    <div className="text-3xl font-bold text-blue-900">
                      {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">mmHg</div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm text-red-600 font-medium mb-1">Heart Rate</div>
                    <div className="text-3xl font-bold text-red-900">{vitals.heartRate}</div>
                    <div className="text-xs text-red-600 mt-1">bpm</div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 font-medium mb-1">SpO2</div>
                    <div className="text-3xl font-bold text-green-900">{vitals.spO2}%</div>
                    <div className="text-xs text-green-600 mt-1">Oxygen Saturation</div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium mb-1">Glucose</div>
                    <div className="text-3xl font-bold text-purple-900">{vitals.glucose}</div>
                    <div className="text-xs text-purple-600 mt-1">mg/dL</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ECG Waveform */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  ECG Waveform
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

                    {result.analysis.glucose && (
                      <div className={`p-4 rounded-lg ${getStatusColor(result.analysis.glucose.status)}`}>
                        <div className="font-semibold">Blood Glucose</div>
                        <div className="text-sm mt-1">{result.analysis.glucose.message}</div>
                        <div className="text-xs mt-2 opacity-75">{vitals.glucose} mg/dL</div>
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
                    <p>Set vital signs and click &quot;Send to Cloud&quot; to see analysis</p>
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
