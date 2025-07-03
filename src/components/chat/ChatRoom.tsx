import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './MessageList';
import { OnlineUsers } from './OnlineUsers';
import { Send, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Room {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface OnlineUser {
  user_id: string;
  username: string;
  joined_at: string;
}

interface ChatRoomProps {
  room: Room;
  user: User;
  username: string;
  onLeaveRoom: () => void;
}

export function ChatRoom({ room, user, username, onLeaveRoom }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presenceChannel = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    joinRoom();
    fetchMessages();
    setupRealtimeSubscriptions();

    return () => {
      leaveRoom();
      cleanup();
    };
  }, [room.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const joinRoom = async () => {
    try {
      // Add user to room participants
      const { error } = await supabase
        .from('room_participants')
        .upsert({
          room_id: room.id,
          user_id: user.id,
          username: username
        });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }

      // Set up presence channel for real-time user tracking
      presenceChannel.current = supabase.channel(`room_${room.id}`)
        .on('presence', { event: 'sync' }, () => {
          const presenceState = presenceChannel.current.presenceState();
          const users = Object.values(presenceState).flat() as OnlineUser[];
          setOnlineUsers(users);
        })
        .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: OnlineUser[] }) => {
          console.log('User joined:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: OnlineUser[] }) => {
          console.log('User left:', leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.current.track({
              user_id: user.id,
              username: username,
              joined_at: new Date().toISOString()
            });
          }
        });

    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const leaveRoom = async () => {
    try {
      if (presenceChannel.current) {
        await presenceChannel.current.untrack();
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const cleanup = () => {
    if (presenceChannel.current) {
      supabase.removeChannel(presenceChannel.current);
      presenceChannel.current = null;
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(current => [...current, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          room_id: room.id,
          user_id: user.id,
          username: username,
          content: newMessage.trim()
        }]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Room header */}
        <div className="border-b p-4 flex items-center gap-4 bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLeaveRoom}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-semibold"># {room.name}</h2>
            <p className="text-sm text-muted-foreground">
              {onlineUsers.length} {onlineUsers.length === 1 ? 'user' : 'users'} online
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <MessageList messages={messages} currentUserId={user.id} />
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Message input */}
        <div className="border-t p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              placeholder={`Message #${room.name}`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              maxLength={500}
              disabled={sending}
            />
            <Button type="submit" disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Online users sidebar */}
      <div className="w-64 border-l bg-card p-4 hidden lg:block">
        <OnlineUsers users={onlineUsers} />
      </div>
    </div>
  );
}