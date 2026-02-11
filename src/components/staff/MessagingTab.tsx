import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, ArrowLeft, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const callStaffApi = async (body: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/staff-management`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed');
  }
  return res.json();
};

const MessagingTab = () => {
  const queryClient = useQueryClient();
  const [selectedConvo, setSelectedConvo] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['staff-conversations'],
    queryFn: () => callStaffApi({ entity: 'conversation', action: 'list' }),
    refetchInterval: 10000,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['staff-messages', selectedConvo?.id],
    queryFn: () => callStaffApi({ entity: 'message', action: 'list', conversation_id: selectedConvo.id }),
    enabled: !!selectedConvo,
    refetchInterval: 5000,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!selectedConvo) return;
    const channel = supabase
      .channel(`messages-${selectedConvo.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConvo.id}`,
      }, () => {
        refetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo, refetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (selectedConvo) {
      callStaffApi({ entity: 'message', action: 'mark_read', conversation_id: selectedConvo.id }).catch(() => {});
    }
  }, [selectedConvo]);

  const sendMutation = useMutation({
    mutationFn: () => callStaffApi({
      entity: 'message',
      action: 'send',
      conversation_id: selectedConvo.id,
      content: newMessage,
    }),
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['staff-conversations'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (selectedConvo) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedConvo(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-base">{selectedConvo.subject}</CardTitle>
            <p className="text-xs text-muted-foreground">User: {selectedConvo.user_id.slice(0, 8)}...</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] overflow-y-auto border rounded-lg p-4 mb-4 space-y-3 bg-muted/20">
            {messages.map((msg: any) => (
              <div key={msg.id} className={cn("flex", msg.sender_type === 'staff' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                  msg.sender_type === 'staff'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border'
                )}>
                  <p>{msg.content}</p>
                  <p className={cn("text-[10px] mt-1", msg.sender_type === 'staff' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {format(new Date(msg.created_at), 'p')}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (newMessage.trim()) sendMutation.mutate(); }} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a reply..."
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!newMessage.trim() || sendMutation.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Messages ({conversations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No conversations yet</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setSelectedConvo(c)}
                className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-sm">{c.subject}</p>
                  <p className="text-xs text-muted-foreground">User: {c.user_id.slice(0, 8)}...</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(c.updated_at), 'PPp')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.status === 'open' ? 'default' : 'secondary'}>{c.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessagingTab;
