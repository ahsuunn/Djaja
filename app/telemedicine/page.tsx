'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, MessageSquare, Phone, PhoneOff, Mic, MicOff, VideoOff, Upload, Send } from 'lucide-react';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function TelemedicinePage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Jitsi Meet API script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
      }
      document.body.removeChild(script);
    };
  }, []);

  const startCall = () => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) {
      alert('Jitsi Meet is loading. Please try again in a moment.');
      return;
    }

    const domain = 'meet.jit.si';
    const options = {
      roomName: `DjajaConsultation${Date.now()}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
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
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    setJitsiApi(api);
    setIsCallActive(true);

    api.addEventListener('videoConferenceLeft', () => {
      endCall();
    });
  };

  const endCall = () => {
    if (jitsiApi) {
      jitsiApi.dispose();
      setJitsiApi(null);
    }
    setIsCallActive(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('toggleAudio');
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('toggleVideo');
      setIsVideoOff(!isVideoOff);
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
        </div>

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
                      Click the button below to start a secure video consultation with your patient
                    </p>
                    <Button onClick={startCall} size="lg" className="gap-2">
                      <Phone className="w-5 h-5" />
                      Start Video Call
                    </Button>
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
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">Budi Santoso</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Patient ID</div>
                  <div className="font-medium">PT-2025-001</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Age / Gender</div>
                  <div className="font-medium">40 years / Male</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Visit</div>
                  <div className="font-medium">2025-11-10</div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  View Full Medical Record
                </Button>
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
                  )}
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
