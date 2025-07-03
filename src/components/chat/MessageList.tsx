import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isCurrentUser = message.user_id === currentUserId;
        const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;
        
        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
          >
            <div className="flex-shrink-0">
              {showAvatar ? (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(message.username)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-8 w-8" />
              )}
            </div>
            
            <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'text-right' : ''}`}>
              {showAvatar && (
                <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                  <span className="text-sm font-medium">{message.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              )}
              
              <div
                className={`inline-block px-3 py-2 rounded-lg break-words ${
                  isCurrentUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}