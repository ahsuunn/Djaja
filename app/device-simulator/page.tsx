'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, Heart, Droplet, Stethoscope, Zap, Play, Pause, Wifi, WifiOff, Thermometer, Search, UserPlus, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import io, { Socket } from 'socket.io-client';
import { DiagnosticResult, Patient, StreamingState, VitalHistory, VitalSigns } from './types';
import { generateRandomVitals, generatePartialVitals, addToHistory, generateECGPoint, getStatusColor } from './utils';

export default function DeviceSimulator() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [vitals, setVitals] = useState<VitalSigns>({
    bloodPressure: { systolic: 0, diastolic: 0 },
    heartRate: 0,
    spO2: 0,
    temperature: 0,
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
  
  // Patient state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

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

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Fetch patients error:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleGenerateRandomVitals = () => {
    setVitals(generateRandomVitals());
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
      patientId: selectedPatient?.patientId || 'demo-patient',
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

    // Stop all currently streaming vitals before starting the new one
    Object.keys(isStreaming).forEach((key) => {
      if (isStreaming[key as keyof StreamingState]) {
        stopVitalStreaming(key as keyof StreamingState);
      }
    });

    setIsStreaming((prev) => ({ ...prev, [vitalType]: true }));
    console.log(`▶️ Starting ${vitalType} stream...`);

    if (vitalType === 'ekg') {
      // Stream ECG waveform at higher frequency
      ecgIntervalRef.current = setInterval(() => {
        generateECGPoint(setVitalHistory);
      }, 16); // ~60 FPS
    } else {
      // Stream only the selected vital at specified interval (leave others unchanged)
      streamIntervalsRef.current[vitalType] = setInterval(() => {
        setVitals((prev) => {
          const updated = generatePartialVitals(vitalType, prev);

          // Update specific vital history based on updated values
          switch (vitalType) {
            case 'bloodPressure':
              addToHistory('bloodPressure', updated.bloodPressure.systolic, setVitalHistory);
              break;
            case 'heartRate':
              addToHistory('heartRate', updated.heartRate, setVitalHistory);
              break;
            case 'spO2':
              addToHistory('spO2', updated.spO2, setVitalHistory);
              break;
            case 'temperature':
              addToHistory('temperature', updated.temperature, setVitalHistory);
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

        {/* Patient Selection */}
        <Card className="mb-8 border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Selection
            </CardTitle>
            <CardDescription>
              Select a patient to associate with device readings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              <div className="flex-1 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients by name or ID..."
                    value={patientSearchTerm}
                    onChange={(e) => {
                      setPatientSearchTerm(e.target.value);
                      setShowPatientList(true);
                    }}
                    onFocus={() => setShowPatientList(true)}
                    className="pl-10"
                  />
                </div>
                
                {/* Patient Dropdown */}
                {showPatientList && patientSearchTerm && (
                  <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {patients
                      .filter((p) =>
                        p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
                        p.patientId.toLowerCase().includes(patientSearchTerm.toLowerCase())
                      )
                      .map((patient) => (
                        <div
                          key={patient._id}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setPatientSearchTerm('');
                            setShowPatientList(false);
                          }}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {patient.patientId} • {patient.gender} • {patient.bloodType}
                          </div>
                        </div>
                      ))}
                    {patients.filter((p) =>
                      p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
                      p.patientId.toLowerCase().includes(patientSearchTerm.toLowerCase())
                    ).length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        No patients found
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => window.open('/patients', '_blank')}
                variant="outline"
                className="flex-shrink-0"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </div>

            {/* Selected Patient Display */}
            {selectedPatient ? (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{selectedPatient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {selectedPatient.patientId} • {selectedPatient.gender} • Blood Type: {selectedPatient.bloodType}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-muted/50 border border-dashed rounded-lg text-center text-muted-foreground">
                No patient selected. Device readings will use demo patient ID.
              </div>
            )}
          </CardContent>
        </Card>

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
                  <Button onClick={handleGenerateRandomVitals} variant="outline" className="flex-1" disabled={anyStreaming}>
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
            <div className="space-y-4">
              {/* Blood Pressure */}
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Activity className="w-6 h-6 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-900">Blood Pressure</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {vitals.bloodPressure.systolic === 0 ? '--/--' : `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`} <span className="text-xs font-normal text-blue-600">mmHg</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalHistory.bloodPressure}>
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

                    {!isStreaming.bloodPressure ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('bloodPressure')}
                        disabled={!isConnected}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('bloodPressure')}
                        className="ml-4"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Heart Rate */}
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Heart className="w-6 h-6 text-red-600" />
                      <div>
                        <div className="font-medium text-red-900">Heart Rate</div>
                        <div className="text-2xl font-bold text-red-900">
                          {vitals.heartRate === 0 ? '--' : vitals.heartRate} <span className="text-xs font-normal text-red-600">bpm</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalHistory.heartRate}>
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

                    {!isStreaming.heartRate ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('heartRate')}
                        disabled={!isConnected}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('heartRate')}
                        className="ml-4"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SpO2 */}
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Droplet className="w-6 h-6 text-green-600" />
                      <div>
                        <div className="font-medium text-green-900">SpO2</div>
                        <div className="text-2xl font-bold text-green-900">
                          {vitals.spO2 === 0 ? '--' : vitals.spO2}% <span className="text-xs font-normal text-green-600">O₂</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalHistory.spO2}>
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

                    {!isStreaming.spO2 ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('spO2')}
                        disabled={!isConnected}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('spO2')}
                        className="ml-4"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Temperature */}
              <Card className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Thermometer className="w-6 h-6 text-orange-600" />
                      <div>
                        <div className="font-medium text-orange-900">Temperature</div>
                        <div className="text-2xl font-bold text-orange-900">
                          {vitals.temperature === 0 ? '--.-' : vitals.temperature}°C
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalHistory.temperature}>
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

                    {!isStreaming.temperature ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('temperature')}
                        disabled={!isConnected}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('temperature')}
                        className="ml-4"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* EKG */}
              <Card className="border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Zap className="w-6 h-6 text-purple-600" />
                      <div>
                        <div className="font-medium text-purple-900">EKG Rhythm</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {vitals.ekg.rhythm}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 h-24 bg-gray-900 rounded">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={vitalHistory.ecg}>
                          <defs>
                            <linearGradient id="ecgGradientSmall" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#ecgGradientSmall)"
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {!isStreaming.ekg ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('ekg')}
                        disabled={!isConnected}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('ekg')}
                        className="ml-4"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Real-Time Dashboard */}
          <div className="space-y-6">
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
