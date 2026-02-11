import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const UserMessaging = () => {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['user-conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && isOpen,
    refetchInterval: isOpen ? 10000 : false,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['user-messages', activeConvoId],
    queryFn: async () => {
      if (!activeConvoId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConvoId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!activeConvoId,
    refetchInterval: activeConvoId ? 5000 : false,
  });

  // Realtime
  useEffect(() => {
    if (!activeConvoId) return;
    const channel = supabase
      .channel(`user-msgs-${activeConvoId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConvoId}`,
      }, () => refetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvoId, refetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createConvoMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not logged in');
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, subject: subject || 'General Inquiry' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setActiveConvoId(data.id);
      setShowNewConvo(false);
      setSubject('');
      queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!user || !activeConvoId) throw new Error('Missing data');
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConvoId,
          sender_id: user.id,
          sender_type: 'user',
          content: newMessage,
        });
      if (error) throw error;
      // Update convo timestamp
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', activeConvoId);
    },
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:scale-110 transition-transform z-50"
        aria-label="Open messages"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-6 w-80 max-h-[500px] bg-card border rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Messages
            </h3>
            <div className="flex gap-1">
              {activeConvoId && (
                <Button variant="ghost" size="sm" onClick={() => setActiveConvoId(null)} className="h-6 w-6 p-0 text-xs">
                  ←
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Conversation list */}
          {!activeConvoId && !showNewConvo && (
            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[350px]">
              <Button size="sm" variant="outline" className="w-full mb-2" onClick={() => setShowNewConvo(true)}>
                <Plus className="w-3 h-3 mr-1" /> New Conversation
              </Button>
              {conversations.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">No conversations yet</p>
              ) : conversations.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvoId(c.id)}
                  className="w-full text-left p-2 rounded hover:bg-muted/50 text-xs border"
                >
                  <p className="font-medium">{c.subject}</p>
                  <p className="text-muted-foreground">{format(new Date(c.updated_at), 'PP')}</p>
                </button>
              ))}
            </div>
          )}

          {/* New conversation form */}
          {showNewConvo && (
            <div className="p-3 space-y-2">
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject (e.g. Booking help)"
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowNewConvo(false)}>Cancel</Button>
                <Button size="sm" onClick={() => createConvoMutation.mutate()} disabled={createConvoMutation.isPending}>
                  Start Chat
                </Button>
              </div>
            </div>
          )}

          {/* Message thread */}
          {activeConvoId && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[350px]">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">Send a message to start the conversation</p>
                )}
                {messages.map((msg: any) => (
                  <div key={msg.id} className={cn("flex", msg.sender_type === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      "max-w-[75%] rounded-lg px-3 py-1.5 text-xs",
                      msg.sender_type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}>
                      <p>{msg.content}</p>
                      <p className={cn("text-[9px] mt-0.5", msg.sender_type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {format(new Date(msg.created_at), 'p')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); if (newMessage.trim()) sendMutation.mutate(); }}
                className="p-2 border-t flex gap-1"
              >
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="text-xs h-8"
                />
                <Button type="submit" size="sm" className="h-8 w-8 p-0" disabled={!newMessage.trim() || sendMutation.isPending}>
                  <Send className="w-3 h-3" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default UserMessaging;
