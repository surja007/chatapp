import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RoomList } from './chat/RoomList';
import { ChatRoom } from './chat/ChatRoom';
import { CreateRoomDialog } from './chat/CreateRoomDialog';
import { LogOut, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Room {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export function ChatApp() {
  const { user, signOut } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [loading, setLoading] = useState(true);

  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';

  useEffect(() => {
    fetchRooms();
    
    // Subscribe to room changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch chat rooms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (roomName: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert([{
          name: roomName,
          created_by: user!.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Room "${roomName}" created successfully!`
      });
      
      setShowCreateRoom(false);
      setSelectedRoom(data);
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: error.message.includes('duplicate') 
          ? "A room with this name already exists" 
          : "Failed to create room",
        variant: "destructive"
      });
    }
  };

  const handleJoinRoom = (room: Room) => {
    setSelectedRoom(room);
  };

  const handleLeaveRoom = () => {
    setSelectedRoom(null);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">ChatApp</h1>
          {selectedRoom && (
            <span className="text-muted-foreground">
              / {selectedRoom.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Welcome, {username}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 border-r bg-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Chat Rooms</h2>
            <Button
              size="sm"
              onClick={() => setShowCreateRoom(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Room
            </Button>
          </div>
          
          <RoomList
            rooms={rooms}
            selectedRoom={selectedRoom}
            onJoinRoom={handleJoinRoom}
          />
        </div>

        {/* Main content */}
        <div className="flex-1">
          {selectedRoom ? (
            <ChatRoom
              room={selectedRoom}
              user={user!}
              username={username}
              onLeaveRoom={handleLeaveRoom}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-background">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No room selected</h3>
                <p className="text-muted-foreground">
                  Choose a room from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateRoomDialog
        open={showCreateRoom}
        onOpenChange={setShowCreateRoom}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}