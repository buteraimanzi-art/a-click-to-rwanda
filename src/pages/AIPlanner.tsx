import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, Download, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ChatMessage from '@/components/ai-planner/ChatMessage';
import logoImage from '@/assets/logo-click-to-rwanda.png';

type Message = { role: 'user' | 'assistant'; content: string };

const AIPlanner = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `🇷🇼 Muraho! Welcome to your Rwanda adventure planner!

I'm so excited to help you discover the Land of a Thousand Hills. Rwanda is absolutely magical - from mountain gorillas in misty forests to golden savannas teeming with wildlife.

So tell me, what's drawing you to Rwanda? Are you dreaming of coming face-to-face with gorillas, exploring pristine rainforests, or maybe a bit of everything? 🦍🌿`
      }]);
    }
  }, []);

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
  <title>Rwanda AI Itinerary</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    h1 { color: #145833; border-bottom: 3px solid #145833; padding-bottom: 15px; }
    .content { white-space: pre-wrap; line-height: 1.8; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🇷🇼 Your Rwanda Itinerary</h1>
    <div class="content">${itineraryContent.replace(/\n/g, '<br>')}</div>
    <div class="footer">Generated by A Click to Rwanda AI Planner</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rwanda-ai-itinerary.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Itinerary downloaded!');
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
          <div className="flex items-center justify-between">
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
            {messages.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleDownload} className="shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                Save Itinerary
              </Button>
            )}
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
