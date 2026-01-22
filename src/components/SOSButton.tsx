import { AlertCircle, Loader2, Mic, MicOff, Square, Phone, MessageSquare } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const SOSButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const sendSOSAlert = async (
    latitude: number | null, 
    longitude: number | null, 
    locationAvailable: boolean,
    phone: string,
    desc: string,
    audio: string | null
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in to use the emergency SOS feature');
        return;
      }

      const response = await supabase.functions.invoke('send-sos-alert', {
        body: { 
          latitude, 
          longitude, 
          locationAvailable,
          phoneNumber: phone,
          description: desc,
          voiceRecording: audio
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('🚨 SOS alert sent! Click to Rwanda has been notified and will contact you shortly.', {
        duration: 8000,
      });
      
      // Reset form
      setShowDialog(false);
      setPhoneNumber('');
      setDescription('');
      clearRecording();
      
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      toast.error('Failed to send SOS alert. Please try calling emergency services directly.');
    }
  };

  const handleSOSClick = () => {
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!description.trim() && !audioBlob) {
      toast.error('Please provide a description or voice recording');
      return;
    }

    setIsLoading(true);
    
    let audioBase64: string | null = null;
    if (audioBlob) {
      audioBase64 = await blobToBase64(audioBlob);
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await sendSOSAlert(latitude, longitude, true, phoneNumber, description, audioBase64);
        setIsLoading(false);
      },
      async (error) => {
        console.error('Error getting location:', error);
        await sendSOSAlert(null, null, false, phoneNumber, description, audioBase64);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <button
        onClick={handleSOSClick}
        disabled={isLoading}
        className="fixed bottom-6 right-6 bg-destructive text-destructive-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform z-50 animate-pulse disabled:animate-none disabled:opacity-80"
        aria-label="Emergency SOS button"
      >
        {isLoading ? <Loader2 size={32} className="animate-spin" /> : <AlertCircle size={32} />}
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Emergency SOS Alert
            </DialogTitle>
            <DialogDescription>
              Provide your contact details and describe your emergency. We will reach out immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+250 7XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            {/* Description / Voice Recording Tabs */}
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-2">
                <Label htmlFor="description">Describe your emergency</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe what happened and what help you need..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </TabsContent>

              <TabsContent value="voice" className="space-y-4">
                <Label>Record a voice message (max 60 seconds)</Label>
                
                <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  {!isRecording && !audioUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={startRecording}
                      className="flex items-center gap-2"
                    >
                      <Mic className="h-5 w-5 text-destructive" />
                      Start Recording
                    </Button>
                  )}

                  {isRecording && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 text-destructive">
                        <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                        Recording... {formatTime(recordingTime)}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="lg"
                        onClick={stopRecording}
                        className="flex items-center gap-2"
                      >
                        <Square className="h-5 w-5" />
                        Stop Recording
                      </Button>
                    </div>
                  )}

                  {audioUrl && !isRecording && (
                    <div className="flex flex-col items-center gap-3 w-full">
                      <audio controls src={audioUrl} className="w-full" />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearRecording}
                        >
                          <MicOff className="h-4 w-4 mr-2" />
                          Clear & Re-record
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Send SOS Alert
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
