import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface RoomListProps {
  rooms: Room[];
  selectedRoom: Room | null;
  onJoinRoom: (room: Room) => void;
}

export function RoomList({ rooms, selectedRoom, onJoinRoom }: RoomListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="space-y-2">
        {rooms.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No rooms available. Create one to get started!
          </p>
        ) : (
          rooms.map((room) => (
            <Button
              key={room.id}
              variant={selectedRoom?.id === room.id ? "default" : "ghost"}
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => onJoinRoom(room)}
            >
              <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{room.name}</div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(room.created_at).toLocaleDateString()}
                </div>
              </div>
            </Button>
          ))
        )}
      </div>
    </ScrollArea>
  );
}