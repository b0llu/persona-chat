import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import AuthButton from './AuthButton';
import { ThemeToggle } from './ThemeToggle';
import { ChatSession } from '../types';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  chatSessions: ChatSession[];
  currentChatId: string | null;
  onNewChat: () => void;
  onChatSelect: (chat: ChatSession) => void;
  onDeleteChat: (chatId: string) => void;
  isMobile?: boolean;
}

const Sidebar = ({ 
  chatSessions, 
  currentChatId, 
  onNewChat, 
  onChatSelect, 
  onDeleteChat, 
  isMobile = false
}: SidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`${isMobile ? 'w-full h-full' : 'w-72'} bg-card border-r border-border flex flex-col h-full`}>
      {/* Header - Hide on mobile since it's handled by the overlay */}
      {!isMobile && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
            >
              Persona Chat
            </button>
            <ThemeToggle />
          </div>
          <Button
            onClick={onNewChat}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      )}

      {/* Mobile header with New Chat button */}
      {isMobile && (
        <div className="p-4 border-b border-border">
          <Button
            onClick={onNewChat}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {chatSessions.map((chat) => (
            <div
              key={chat.id}
              className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                currentChatId === chat.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => onChatSelect(chat)}
              onMouseEnter={() => setHoveredChatId(chat.id)}
              onMouseLeave={() => setHoveredChatId(null)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {chat.persona && (
                      <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">
                        {chat.persona.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {chat.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(chat.updatedAt)}
                  </p>
                  {chat.messages.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {chat.messages[chat.messages.length - 1].text}
                    </p>
                  )}
                </div>
                
                {(hoveredChatId === chat.id || currentChatId === chat.id) && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    variant="outline"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 text-muted-foreground hover:text-destructive bg-destructive/20 border-destructive/50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {chatSessions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No chats yet</p>
            <p className="text-muted-foreground text-xs mt-1">Start a new conversation</p>
          </div>
        )}
      </div>

      {/* User Profile - Only show on desktop */}
      {!isMobile && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <img
              src={user?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'}
              alt={user?.displayName || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <AuthButton />
          </div>
        </div>
      )}

      {/* Mobile User Profile */}
      {isMobile && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={user?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'}
                alt={user?.displayName || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 