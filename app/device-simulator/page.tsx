'use client';

import { useState, useEffect } from 'react';
import { Activity, Heart, Droplet, Stethoscope, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const sendToCloud = () => {
    if (!socket || !isConnected) {
      alert('Not connected to server. Please ensure the backend is running.');
      return;
    }

    setIsSending(true);
    setResult(null);

    const deviceData = {
      deviceId: `SIM-${Date.now()}`,
      patientId: 'demo-patient',
      bloodPressure: vitals.bloodPressure,
      heartRate: vitals.heartRate,
      spO2: vitals.spO2,
      glucose: vitals.glucose,
      ekg: vitals.ekg,
      timestamp: new Date().toISOString(),
    };

    socket.emit('device-data', deviceData);
  };

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

            <div className="flex gap-4">
              <Button onClick={generateRandomVitals} variant="outline" className="flex-1">
                Generate Random
              </Button>
              <Button
                onClick={sendToCloud}
                disabled={!isConnected || isSending}
                className="flex-1"
              >
                {isSending ? 'Processing...' : 'Send to Cloud'}
              </Button>
            </div>
          </div>

          {/* Results Display */}
          <div>
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
