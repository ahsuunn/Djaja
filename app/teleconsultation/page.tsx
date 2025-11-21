'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, MessageSquare, Phone, PhoneOff, Mic, MicOff, VideoOff, Upload, Send, User, Search, UserPlus, CheckCircle2, X } from 'lucide-react';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  gender: string;
  bloodType?: string;
  contactNumber?: string;
}

export default function TelemedicinePage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [isJitsiLoaded, setIsJitsiLoaded] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  
  // Patient state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (window.JitsiMeetExternalAPI) {
      setIsJitsiLoaded(true);
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src="https://meet.jit.si/external_api.js"]');
    if (existingScript) {
      setIsJitsiLoaded(true);
      return;
    }

    // Load Jitsi Meet API script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    scriptRef.current = script;
    
    script.onload = () => {
      console.log('Jitsi Meet API loaded successfully');
      setIsJitsiLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Jitsi Meet API:', error);
      setIsJitsiLoaded(false);
    };
    
    document.body.appendChild(script);

    return () => {
      // Cleanup Jitsi API instance
      if (jitsiApi) {
        try {
          jitsiApi.dispose();
        } catch (e) {
          console.error('Error disposing Jitsi API:', e);
        }
      }
      
      // Only remove script if it exists and we created it
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        try {
          document.body.removeChild(scriptRef.current);
        } catch (e) {
          console.error('Error removing script:', e);
        }
      }
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

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      p.patientId.toLowerCase().includes(patientSearchTerm.toLowerCase())
  );

  const startCall = () => {
    if (!selectedPatient) {
      alert('Please select a patient before starting a consultation.');
      return;
    }
    
    if (!isJitsiLoaded || !window.JitsiMeetExternalAPI) {
      alert('Jitsi Meet is still loading. Please wait a moment and try again.');
      return;
    }

    // Set call active first to render the container
    setIsCallActive(true);

    // Wait for container to be rendered, then initialize Jitsi
    setTimeout(() => {
      if (!jitsiContainerRef.current) {
        alert('Video container not ready. Please try again.');
        setIsCallActive(false);
        return;
      }

      initializeJitsiCall();
    }, 100);
  };

  const initializeJitsiCall = () => {
    if (!jitsiContainerRef.current || !selectedPatient) return;

    try {
      const domain = '8x8.vc';
      const roomName = `Djaja${Date.now()}`;
      
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          // Disable lobby/waiting room - allow anyone to join
          lobbyEnabled: false,
          enableLobbyChat: false,
          // Require display name but no authentication
          requireDisplayName: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'settings',
            'videoquality',
            'filmstrip',
            'stats',
            'shortcuts',
            'tileview',
          ],
          ENABLE_LOBBY_MODE: false,
        },
        userInfo: {
          displayName: `Dr. ${localStorage.getItem('userName') || 'Doctor'}`,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      
      api.addEventListener('videoConferenceJoined', () => {
        console.log('Successfully joined conference:', roomName);
      });
      
      api.addEventListener('videoConferenceLeft', () => {
        console.log('Left conference');
        endCall();
      });

      api.addEventListener('readyToClose', () => {
        endCall();
      });

      setJitsiApi(api);
      console.log('Jitsi API initialized successfully');
    } catch (error) {
      console.error('Error starting Jitsi call:', error);
      alert('Failed to start video call. Please try again.');
      setIsCallActive(false);
    }
  };

  const endCall = () => {
    if (jitsiApi) {
      try {
        jitsiApi.dispose();
      } catch (e) {
        console.error('Error disposing Jitsi API:', e);
      }
      setJitsiApi(null);
    }
    setIsCallActive(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (jitsiApi) {
      try {
        jitsiApi.executeCommand('toggleAudio');
        setIsMuted(!isMuted);
      } catch (e) {
        console.error('Error toggling mute:', e);
      }
    }
  };

  const toggleVideo = () => {
    if (jitsiApi) {
      try {
        jitsiApi.executeCommand('toggleVideo');
        setIsVideoOff(!isVideoOff);
      } catch (e) {
        console.error('Error toggling video:', e);
      }
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        sender: 'You',
        text: newMessage,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, message]);
      setNewMessage('');

      // Simulate patient response after 2 seconds
      setTimeout(() => {
        const response = {
          sender: 'Patient',
          text: 'Thank you doctor, I understand.',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, response]);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Telemedicine Consultation</h1>
          <p className="text-muted-foreground">Remote patient consultation with video conferencing</p>
          {!isJitsiLoaded && (
            <p className="text-sm text-amber-600 mt-2">⏳ Loading video conferencing system...</p>
          )}
        </div>

        {/* Patient Selection */}
        <Card className="mb-8 border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Selection
            </CardTitle>
            <CardDescription>
              Select a patient for the telemedicine consultation
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
                
                {showPatientList && patientSearchTerm && (
                  <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {loadingPatients ? (
                      <div className="p-4 text-center text-muted-foreground">Loading patients...</div>
                    ) : filteredPatients.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">No patients found</div>
                    ) : (
                      filteredPatients.map((patient) => (
                        <button
                          key={patient._id}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setPatientSearchTerm('');
                            setShowPatientList(false);
                          }}
                          className="w-full p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                        >
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {patient.patientId} | {patient.gender} | {patient.bloodType || 'N/A'}
                          </div>
                        </button>
                      ))
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
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-semibold">{selectedPatient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {selectedPatient.patientId} | {selectedPatient.gender} | {selectedPatient.bloodType || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedPatient(null)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-muted/50 border border-dashed rounded-lg text-center text-muted-foreground">
                ⚠️ Please select a patient before starting a consultation
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Call Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Video Consultation
                </CardTitle>
                <CardDescription>
                  {isCallActive ? 'Call in progress' : 'Start a video call with patient'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-100px)]">
                {!isCallActive ? (
                  <div className="h-full flex flex-col items-center justify-center bg-muted rounded-lg">
                    <Video className="w-24 h-24 mb-6 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">Ready to Start Consultation</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-md">
                      {selectedPatient 
                        ? 'Click the button below to start a secure video consultation with your patient'
                        : 'Please select a patient first to start a consultation'}
                    </p>
                    <Button 
                      onClick={startCall} 
                      size="lg" 
                      className="gap-2" 
                      disabled={!selectedPatient || !isJitsiLoaded}
                    >
                      <Phone className="w-5 h-5" />
                      {isJitsiLoaded ? 'Start Video Call' : 'Loading...'}
                    </Button>
                    {!selectedPatient && (
                      <p className="text-sm text-amber-600 mt-4">⚠️ Patient selection is required</p>
                    )}
                    {!isJitsiLoaded && selectedPatient && (
                      <p className="text-sm text-amber-600 mt-4">⏳ Please wait for video system to load</p>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div
                      ref={jitsiContainerRef}
                      className="flex-1 bg-black rounded-lg overflow-hidden"
                    />
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <Button
                        onClick={toggleMute}
                        variant={isMuted ? 'destructive' : 'outline'}
                        size="lg"
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </Button>
                      <Button
                        onClick={toggleVideo}
                        variant={isVideoOff ? 'destructive' : 'outline'}
                        size="lg"
                      >
                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </Button>
                      <Button onClick={endCall} variant="destructive" size="lg" className="gap-2">
                        <PhoneOff className="w-5 h-5" />
                        End Call
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat & Info Sidebar */}
          <div className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedPatient ? (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="font-medium">{selectedPatient.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Patient ID</div>
                      <div className="font-medium">{selectedPatient.patientId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Gender</div>
                      <div className="font-medium">{selectedPatient.gender}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Blood Type</div>
                      <div className="font-medium">{selectedPatient.bloodType || 'N/A'}</div>
                    </div>
                    {selectedPatient.contactNumber && (
                      <div>
                        <div className="text-sm text-muted-foreground">Contact</div>
                        <div className="font-medium">{selectedPatient.contactNumber}</div>
                      </div>
                    )}
                    <Button className="w-full mt-4" variant="outline">
                      View Full Medical Record
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No patient selected</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="h-[380px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto px-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No messages yet
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.sender === 'You'
                              ? 'bg-primary text-white'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="text-sm">{msg.text}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{msg.time}</div>
                      </div>
                    ))
                  )
                  }
                </div>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Share Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  PDF, Images (Max 10MB)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
