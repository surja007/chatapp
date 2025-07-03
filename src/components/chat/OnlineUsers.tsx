import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';

interface OnlineUser {
  user_id: string;
  username: string;
  joined_at: string;
}

interface OnlineUsersProps {
  users: OnlineUser[];
}

export function OnlineUsers({ users }: OnlineUsersProps) {
  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4" />
        <h3 className="font-semibold">Online ({users.length})</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users online
            </p>
          ) : (
            users.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}