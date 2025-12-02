import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
        content: `🇷🇼 Welcome to A Click to Rwanda AI Travel Planner!

I'm here to help you create your perfect Rwanda itinerary. To get started, please tell me:

1. **When** would you like to travel and for how many days?
2. **What interests** you most? (wildlife, gorillas, nature, culture, adventure)
3. **What's your budget level?** (budget, mid-range, luxury)
4. **Who's traveling?** (solo, couple, family, group)

Feel free to share any specific destinations or activities you'd like to include!`
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Bot className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Travel Planner</h2>
            <p className="text-muted-foreground mb-4">Please login to use the AI planner</p>
            <Button onClick={() => navigate('/login')}>Login to Continue</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="h-[calc(100vh-140px)]">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>AI Travel Planner</CardTitle>
                  <p className="text-sm text-muted-foreground">Let me help plan your perfect Rwanda trip</p>
                </div>
              </div>
              {messages.length > 1 && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.content === '' && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <p className="text-sm text-muted-foreground">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell me about your travel preferences..."
                  className="min-h-[60px] resize-none"
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
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIPlanner;
