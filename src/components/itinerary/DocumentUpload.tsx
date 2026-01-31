import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, Loader2, FileText, X, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ExtractedDay {
  date?: string;
  destination: string;
  hotel?: string;
  activity?: string;
  notes?: string;
}

interface DocumentUploadProps {
  userId: string;
  destinations: Array<{ id: string; name: string }>;
  hotels: Array<{ id: string; name: string; destination_id: string }>;
  activities: Array<{ id: string; name: string; destination_id: string }>;
  onClose?: () => void;
}

// Booking URLs for destinations
const getDestinationBookingUrl = (destinationName: string): string | null => {
  const name = destinationName.toLowerCase();
  
  if (name.includes('volcanoes') || name.includes('gorilla')) {
    return 'https://visitrwandabookings.rdb.rw/rdbportal/web/tourism/tourist-permit';
  }
  if (name.includes('akagera')) {
    return 'https://visitakagera.org/book-now/';
  }
  if (name.includes('nyungwe')) {
    return 'https://visitnyungwe.org/book-now/';
  }
  if (name.includes('kivu')) {
    return 'https://www.booking.com/region/rw/lake-kivu.html';
  }
  if (name.includes('museum') || name.includes('palace') || name.includes('genocide')) {
    return 'https://irembo.gov.rw/home/citizen/all_services';
  }
  if (name.includes('kigali')) {
    return 'https://www.booking.com/city/rw/kigali.html';
  }
  if (name.includes('musanze')) {
    return 'https://www.booking.com/city/rw/ruhengeri.html';
  }
  
  return null;
};

export const DocumentUpload = ({ 
  userId, 
  destinations, 
  hotels, 
  activities,
  onClose 
}: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedItinerary, setExtractedItinerary] = useState<ExtractedDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const acceptedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp'
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && acceptedTypes.includes(file.type)) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please upload a PDF, Word document, text file, or image');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (acceptedTypes.includes(file.type)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a PDF, Word document, text file, or image');
      }
    }
  };

  const processDocument = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just the base64 content
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Content = await base64Promise;

      // Call edge function to parse and extract itinerary
      const { data, error: fnError } = await supabase.functions.invoke('extract-itinerary', {
        body: {
          fileContent: base64Content,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          destinations: destinations.map(d => ({ id: d.id, name: d.name })),
          hotels: hotels.map(h => ({ id: h.id, name: h.name, destination_id: h.destination_id })),
          activities: activities.map(a => ({ id: a.id, name: a.name, destination_id: a.destination_id })),
        },
      });

      if (fnError) throw fnError;

      if (data.itinerary && data.itinerary.length > 0) {
        setExtractedItinerary(data.itinerary);
        toast.success(`Found ${data.itinerary.length} days in your itinerary!`);
      } else {
        setError('Could not extract itinerary information from this document. Please try a different file or format.');
      }
    } catch (err) {
      console.error('Error processing document:', err);
      setError('Failed to process document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const importItinerary = async () => {
    if (!extractedItinerary || !userId) return;

    setIsProcessing(true);

    try {
      // Get existing itinerary to determine start date
      const { data: existingItinerary } = await supabase
        .from('itineraries')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1);

      let startDate = new Date();
      if (existingItinerary && existingItinerary.length > 0) {
        startDate = new Date(existingItinerary[0].date);
        startDate.setDate(startDate.getDate() + 1);
      }

      // Insert each day
      for (let i = 0; i < extractedItinerary.length; i++) {
        const day = extractedItinerary[i];
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + i);

        // Find matching destination
        const matchedDestination = destinations.find(d => 
          d.name.toLowerCase().includes(day.destination.toLowerCase()) ||
          day.destination.toLowerCase().includes(d.name.toLowerCase())
        );

        if (!matchedDestination) {
          console.warn(`Could not match destination: ${day.destination}`);
          continue;
        }

        // Find matching hotel if provided
        let matchedHotel = null;
        if (day.hotel) {
          matchedHotel = hotels.find(h => 
            h.name.toLowerCase().includes(day.hotel!.toLowerCase()) ||
            day.hotel!.toLowerCase().includes(h.name.toLowerCase())
          );
        }

        // Find matching activity if provided
        let matchedActivity = null;
        if (day.activity) {
          matchedActivity = activities.find(a => 
            a.name.toLowerCase().includes(day.activity!.toLowerCase()) ||
            day.activity!.toLowerCase().includes(a.name.toLowerCase())
          );
        }

        const { error: insertError } = await supabase.from('itineraries').insert({
          user_id: userId,
          date: dayDate.toISOString().split('T')[0],
          destination_id: matchedDestination.id,
          hotel_id: matchedHotel?.id || null,
          activity_id: matchedActivity?.id || null,
          notes: day.notes || null,
          day_type: 'regular',
        });

        if (insertError) {
          console.error('Error inserting day:', insertError);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      toast.success('Itinerary imported successfully!');
      setExtractedItinerary(null);
      setSelectedFile(null);
      onClose?.();
    } catch (err) {
      console.error('Error importing itinerary:', err);
      toast.error('Failed to import itinerary');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setExtractedItinerary(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileUp className="w-5 h-5 text-primary" />
              Import Itinerary from Document
            </CardTitle>
            <CardDescription>
              Upload a PDF, Word doc, text file, or image of your itinerary
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!extractedItinerary ? (
          <>
            {/* Upload Area */}
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50",
                selectedFile && "border-primary bg-primary/5"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUpload();
                    }}
                  >
                    Choose different file
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileUp className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your document here</p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, Word, TXT, and images (PNG, JPG)
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Process Button */}
            {selectedFile && (
              <Button 
                onClick={processDocument} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing document...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Extract Itinerary
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Preview Extracted Itinerary */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Found {extractedItinerary.length} days</span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-3">
                {extractedItinerary.map((day, index) => {
                  const bookingUrl = getDestinationBookingUrl(day.destination);
                  
                  return (
                    <div 
                      key={index}
                      className="bg-muted/50 p-4 rounded-lg text-sm border border-border/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">Day {index + 1}: {day.destination}</div>
                          {day.hotel && (
                            <div className="text-muted-foreground flex items-center gap-1 mt-1">
                              🏨 {day.hotel}
                            </div>
                          )}
                          {day.activity && (
                            <div className="text-muted-foreground flex items-center gap-1">
                              🎯 {day.activity}
                            </div>
                          )}
                          {day.notes && (
                            <div className="text-muted-foreground text-xs mt-2 italic">{day.notes}</div>
                          )}
                        </div>
                        {bookingUrl && (
                          <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 h-7"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Book
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={importItinerary}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Import to Itinerary
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
