import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Download, Loader2, Sparkles, Save, FolderOpen, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ChatMessage from '@/components/ai-planner/ChatMessage';
import logoImage from '@/assets/logo-click-to-rwanda.png';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Message = { role: 'user' | 'assistant'; content: string };
type SavedPackage = { id: string; title: string; conversation_history: Message[]; created_at: string };

const AIPlanner = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: destinations } = useQuery({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data } = await supabase.from('destinations').select('*');
      return data || [];
    },
  });

  const { data: hotels } = useQuery({
    queryKey: ['hotels'],
    queryFn: async () => {
      const { data } = await supabase.from('hotels').select('*');
      return data || [];
    },
  });

  const { data: activities } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data } = await supabase.from('activities').select('*');
      return data || [];
    },
  });

  const { data: savedPackages, refetch: refetchPackages } = useQuery({
    queryKey: ['saved-tour-packages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_tour_packages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        conversation_history: item.conversation_history as unknown as Message[]
      })) as SavedPackage[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getWelcomeMessage = (): Message => ({
    role: 'assistant',
    content: `🇷🇼 Muraho! Welcome to your Rwanda adventure planner!

I'm so excited to help you discover the Land of a Thousand Hills. Rwanda is absolutely magical - from mountain gorillas in misty forests to golden savannas teeming with wildlife.

So tell me, what's drawing you to Rwanda? Are you dreaming of coming face-to-face with gorillas, exploring pristine rainforests, or maybe a bit of everything? 🦍🌿`
  });

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([getWelcomeMessage()]);
    }
  }, []);

  const handleSavePackage = async () => {
    if (!user || messages.length <= 1) return;
    setIsSaving(true);
    try {
      const title = saveTitle.trim() || `Rwanda Trip - ${new Date().toLocaleDateString()}`;
      const { error } = await supabase.from('saved_tour_packages').insert({
        user_id: user.id,
        title,
        conversation_history: messages,
      });
      if (error) throw error;

      // Send email notification
      const packageContent = messages
        .filter(m => m.role === 'assistant')
        .map(m => m.content)
        .join('\n\n---\n\n');

      const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Traveler';

      await supabase.functions.invoke('send-package-email', {
        body: {
          email: user.email,
          userName,
          packageTitle: title,
          packageContent,
          packageType: 'ai-planner',
        },
      });

      toast.success('Tour package saved and emailed to you!');
      setSaveDialogOpen(false);
      setSaveTitle('');
      refetchPackages();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save package');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadPackage = (pkg: SavedPackage) => {
    setMessages(pkg.conversation_history);
    toast.success(`Loaded: ${pkg.title}`);
  };

  const handleDeletePackage = async (id: string) => {
    try {
      const { error } = await supabase.from('saved_tour_packages').delete().eq('id', id);
      if (error) throw error;
      toast.success('Package deleted');
      refetchPackages();
    } catch (error) {
      toast.error('Failed to delete package');
    }
  };

  const handleNewConversation = () => {
    setMessages([getWelcomeMessage()]);
    toast.success('Started new conversation');
  };

  const streamChat = async (userMessages: Message[]) => {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-planner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: userMessages,
        destinations,
        hotels,
        activities,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get AI response');
    }

    return response;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await streamChat(newMessages);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get response');
      setMessages(prev => prev.filter(m => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const itineraryContent = messages
      .filter(m => m.role === 'assistant')
      .map(m => m.content)
      .join('\n\n---\n\n');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rwanda Tour Package - A Click to Rwanda</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 40px 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #145833 0%, #1a7a45 100%); color: white; padding: 40px; border-radius: 20px 20px 0 0; text-align: center; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 1.1em; }
    .logo { font-size: 3em; margin-bottom: 15px; }
    .main-content { background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
    .section { margin-bottom: 30px; padding-bottom: 30px; border-bottom: 2px dashed #e0e0e0; }
    .section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .section-title { color: #145833; font-size: 1.4em; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
    .content { white-space: pre-wrap; line-height: 1.9; font-size: 1.05em; color: #333; }
    .highlight-box { background: linear-gradient(135deg, #f0f9f4 0%, #e8f5ec 100%); border-left: 4px solid #145833; padding: 20px; border-radius: 0 12px 12px 0; margin: 20px 0; }
    .booking-section { background: linear-gradient(135deg, #145833 0%, #1a7a45 100%); color: white; padding: 30px; border-radius: 15px; margin-top: 30px; }
    .booking-section h3 { margin-bottom: 20px; font-size: 1.3em; }
    .booking-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
    .booking-link { background: rgba(255,255,255,0.15); padding: 15px 20px; border-radius: 10px; color: white; text-decoration: none; display: flex; align-items: center; gap: 10px; transition: all 0.3s ease; }
    .booking-link:hover { background: rgba(255,255,255,0.25); transform: translateY(-2px); }
    .footer { text-align: center; padding: 30px; color: #666; font-size: 0.95em; }
    .footer a { color: #145833; text-decoration: none; font-weight: 600; }
    .badge { display: inline-block; background: #145833; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.85em; margin-right: 10px; }
    @media (max-width: 600px) {
      .header h1 { font-size: 1.8em; }
      .main-content { padding: 25px; }
      body { padding: 20px 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🇷🇼</div>
      <h1>Your Rwanda Adventure</h1>
      <p>Custom Tour Package by A Click to Rwanda</p>
    </div>
    <div class="main-content">
      <div class="section">
        <div class="content">${itineraryContent.replace(/\n/g, '<br>').replace(/═/g, '').replace(/───/g, '<hr style="border: 1px dashed #ccc; margin: 20px 0;">')}</div>
      </div>
      
      <div class="booking-section">
        <h3>📞 Ready to Book Your Adventure?</h3>
        <div class="booking-links">
          <a href="https://visitrwandabookings.rdb.rw/rdbportal/mountain-gorilla-tracking" target="_blank" class="booking-link">🦍 Gorilla Trekking</a>
          <a href="https://visitakagera.org/book-now/" target="_blank" class="booking-link">🦁 Akagera Safari</a>
          <a href="https://visitnyungwe.org/book-now/" target="_blank" class="booking-link">🐒 Nyungwe Forest</a>
          <a href="https://irembo.gov.rw" target="_blank" class="booking-link">🏛️ Museums</a>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p style="margin-top: 10px;">🌍 <a href="https://aclicktorwanda.com">A Click to Rwanda</a> - Your Gateway to the Land of a Thousand Hills</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rwanda-tour-package.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tour package downloaded!');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <img src={logoImage} alt="Click to Rwanda" className="h-32 w-auto mx-auto" />
          <div>
            <h2 className="text-3xl font-bold text-foreground">AI Travel Planner</h2>
            <p className="text-muted-foreground mt-2">Your personal Rwanda journey awaits</p>
          </div>
          <Button onClick={() => navigate('/login')} size="lg" className="shadow-lg">
            <Sparkles className="w-4 h-4 mr-2" />
            Login to Start Planning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="max-w-5xl mx-auto p-4 md:p-6 h-screen flex flex-col">
        {/* Header */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <img src={logoImage} alt="Click to Rwanda" className="h-14 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  AI Travel Planner
                  <Sparkles className="w-4 h-4 text-primary" />
                </h1>
                <p className="text-sm text-muted-foreground">Let's craft your perfect Rwanda adventure together</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleNewConversation}>
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <FolderOpen className="w-4 h-4 mr-1" />
                    Saved
                    {savedPackages && savedPackages.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {savedPackages.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Saved Tour Packages</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-3">
                    {savedPackages && savedPackages.length > 0 ? (
                      savedPackages.map((pkg) => (
                        <div key={pkg.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => handleLoadPackage(pkg)}
                              className="flex-1 text-left"
                            >
                              <p className="font-medium text-foreground">{pkg.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(pkg.created_at).toLocaleDateString()}
                              </p>
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeletePackage(pkg.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No saved packages yet</p>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {messages.length > 1 && (
                <>
                  <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Tour Package</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          placeholder="Enter a name for this package..."
                          value={saveTitle}
                          onChange={(e) => setSaveTitle(e.target.value)}
                        />
                        <Button onClick={handleSavePackage} disabled={isSaving} className="w-full">
                          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Package
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((message, index) => (
                <ChatMessage key={index} role={message.role} content={message.content} />
              ))}
              {isLoading && messages[messages.length - 1]?.content === '' && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                    <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl px-4 py-3 shadow-md">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="animate-pulse">Planning your adventure</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border/50 bg-card/80">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me about your dream Rwanda trip..."
                className="min-h-[50px] max-h-[150px] resize-none bg-background/50 border-border/50 focus:border-primary/50 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="lg"
                className="self-end rounded-xl shadow-md px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPlanner;
