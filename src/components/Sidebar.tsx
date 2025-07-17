import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, PanelLeft } from 'lucide-react';
import { Button } from './ui/button';
import AuthButton from './AuthButton';
import { ThemeToggle } from './ThemeToggle';
import { ChatSession } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip } from './ui/tooltip';

// Custom hook to blur active element on tab visibility change
function useTooltipVisibilityFix() {
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
}

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
  useTooltipVisibilityFix();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const groupChatsByPeriod = (sessions: ChatSession[]) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfLastWeek = new Date(startOfToday);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const startOfLastMonth = new Date(startOfToday);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    const startOfLastYear = new Date(startOfToday);
    startOfLastYear.setFullYear(startOfLastYear.getFullYear() - 1);

    const groups: { [key: string]: ChatSession[] } = {
      'Today': [],
      'Yesterday': [],
      'Last week': [],
      'Last month': [],
      'Last year': [],
      'Older': [],
    };

    sessions.forEach((chat) => {
      const updated = new Date(chat.updatedAt);
      if (updated >= startOfToday) {
        groups['Today'].push(chat);
      } else if (updated >= startOfYesterday) {
        groups['Yesterday'].push(chat);
      } else if (updated >= startOfLastWeek) {
        groups['Last week'].push(chat);
      } else if (updated >= startOfLastMonth) {
        groups['Last month'].push(chat);
      } else if (updated >= startOfLastYear) {
        groups['Last year'].push(chat);
      } else {
        groups['Older'].push(chat);
      }
    });
    return groups;
  };

  return (
    <div className={`${isMobile ? 'w-full h-full' : collapsed ? 'w-16' : 'w-72'} bg-card border-r border-border flex flex-col h-full transition-all duration-300`}>
      {/* Header - Hide on mobile since it's handled by the overlay */}
      {!isMobile && (
        <div className={`p-4 border-b border-border ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <div className={`flex items-center justify-between mb-3 ${collapsed ? 'w-full' : ''}`}>
            <button 
              onClick={() => navigate('/dashboard')}
              className={`text-lg font-semibold text-foreground hover:text-primary transition-colors duration-200 cursor-pointer ${collapsed ? 'hidden' : ''} text-nowrap`}
            >
              Persona Chat
            </button>
            <div className="flex items-center gap-2">
              <Tooltip
                content={collapsed ? (
                  <span className="flex items-center gap-1">
                    <span>Open sidebar</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span>Close sidebar</span>
                  </span>
                )}
                side={collapsed ? 'right' : 'bottom'}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCollapsed((c) => !c)}
                  className={`ml-auto`}
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <PanelLeft className="w-4 h-4" />
                </Button>
              </Tooltip>
              {!collapsed && <ThemeToggle />}
            </div>
          </div>
          {!collapsed && (
            <Button
              onClick={onNewChat}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          )}
          {collapsed && (
            <Button
              onClick={onNewChat}
              variant="outline"
              size="icon"
              className="mt-2"
              aria-label="New Chat"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
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
          {!collapsed && (() => {
            const grouped = groupChatsByPeriod(chatSessions);
            const order = ['Today', 'Yesterday', 'Last week', 'Last month', 'Last year', 'Older'];
            return order.map((period, idx) =>
              grouped[period].length > 0 ? (
                <div key={period} className={`mb-4${idx !== 0 ? ' pt-4 border-t border-border' : ''}`}>
                  <div className={`text-xs font-semibold text-muted-foreground px-2 uppercase tracking-wide py-2${idx !== 0 ? ' mt-2' : ''} mb-2`}>{period}</div>
                  {grouped[period].map((chat) => (
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
                              chat.persona.avatar ? (
                                <img
                                  src={chat.persona.avatar}
                                  alt={chat.persona.name}
                                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                  {chat.persona.name.charAt(0).toUpperCase()}
                                </div>
                              )
                            )}
                            <h3 className="text-sm font-medium text-foreground truncate">
                              {chat.title}
                            </h3>
                          </div>
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
              ) : null
            );
          })()}
        </div>
        {chatSessions.length === 0 && !collapsed && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No chats yet</p>
            <p className="text-muted-foreground text-xs mt-1">Start a new conversation</p>
          </div>
        )}
      </div>

      {/* User Profile - Only show on desktop */}
      {!isMobile && (
        <div className={`p-4 border-t border-border ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'flex-col gap-2' : ''}`}>
            <img
              src={user?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'}
              alt={user?.displayName || 'User'}
              className={`rounded-full object-cover ${collapsed ? 'w-8 h-8' : 'w-8 h-8'}`}
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.displayName || 'User'}
             </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            )}
            <AuthButton />
          </div>
        </div>
      )}

      {/* Mobile User Profile */}
      {isMobile && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex itementer gap-3 flex-1 min-w-0">
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