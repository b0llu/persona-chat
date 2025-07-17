import { useState, useEffect, useRef } from 'react';
import { Plus, Send } from 'lucide-react';
import { MessageCircleDashed, Info } from 'lucide-react';
import { Button } from './ui/button';
import ChatMessage from './ChatMessage';
import BouncingDots from './BouncingDots';
import { Persona, ChatSession, User } from '../types';
import { Textarea } from './ui/textarea';

interface ChatAreaProps {
  chat: ChatSession | null;
  persona: Persona;
  user: User | null;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onNewChat: () => void;
  isTemporaryChat?: boolean;
  onToggleTemporaryChat?: (toTemporary: boolean) => void;
}

const ChatArea = ({ chat, persona, user, isLoading, onSendMessage, onNewChat, isTemporaryChat, onToggleTemporaryChat }: ChatAreaProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isChatActive, setIsChatActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [chat?.messages]);


  const handleSend = () => {
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage);
    setInputMessage('');
    setIsChatActive(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full relative">
      {/* Header - Hidden on mobile since we have top nav */}
      <div className="hidden lg:block bg-card/80 backdrop-blur-md border-b border-border p-4">
        <div className="flex items-center justify-between">
          {/* Left: Persona info */}
          <div className="flex items-center gap-3 min-w-0">
            {persona.avatar ? (
              <img
                src={persona.avatar}
                alt={persona.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg flex-shrink-0">
                {persona.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">{persona.name}</h1>
              <p className="text-sm text-muted-foreground capitalize truncate">{persona.category}</p>
            </div>
          </div>
          {/* Center: Temporary Chat label if chat is temporary */}
          <div className="flex-1 flex justify-center">
            {isTemporaryChat && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2">
                  <MessageCircleDashed className="w-5 h-5 text-foreground" />
                  <span className="text-base font-semibold text-foreground">Temporary Chat</span>
                  <span className="relative group">
                    <Info className="w-4 h-4 text-foreground/70 cursor-pointer" />
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 hidden group-hover:block group-focus:block bg-black text-white text-sm font-semibold rounded-xl px-4 py-2 whitespace-pre-line shadow-lg min-w-max max-w-xs text-center" style={{top: '100%'}}>
                      Temporary Chats won't appear in your history,<br />and we won't remember anything you talk about.
                    </div>
                  </span>
                </span>
              </div>
            )}
          </div>
          {/* Right side: toggle and New Chat button */}
          <div className="flex items-center gap-2">
            {/* Show toggle for temporary chat if eligible */}
            {onToggleTemporaryChat && chat && chat.persona && chat.messages.length === 1 && chat.messages[0].sender === 'persona' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleTemporaryChat(!isTemporaryChat)}
                className="flex items-center justify-center relative rounded-full"
                title={isTemporaryChat ? 'Switch to Normal Chat' : 'Switch to Temporary Chat'}
              >
                <MessageCircleDashed className="w-10 h-10 text-foreground" />
                {isTemporaryChat && (
                  <svg
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-100"
                    width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M5 9.5L8 12.5L13 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="!text-foreground"/>
                  </svg>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onNewChat}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-col items-center overflow-y-auto pb-24 lg:pb-32">
        <div className="max-w-4xl mx-3 py-3 lg:py-6 lg:mx-6 space-y-3 lg:space-y-4">
          {chat.messages.map((message, index) => {
            const isLastMessage = index === chat.messages.length - 1;
            const isStreaming = isLastMessage && message.sender === 'persona' && !isLoading && message.text.length > 0;

            return (
              <ChatMessage
                key={message.id}
                message={message}
                persona={persona}
                user={user}
                isStreaming={isStreaming}
                shouldStream={isChatActive}
              />
            );
          })}
          
          {isLoading && (
            <div className="flex items-center gap-3 p-4">
              {persona.avatar ? (
                <img
                  src={persona.avatar}
                  alt={persona.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {persona.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="bg-card rounded-lg p-4 border border-border">
                <BouncingDots />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Input */}
      <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-xl shadow-lg p-2 lg:p-3">
              <div className="flex gap-2 lg:gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={`Message ${persona.name}...`}
                    className="w-full resize-none bg-transparent border-none px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[44px] max-h-[250px] leading-5"
                    rows={1}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!inputMessage.trim() || isLoading}
                  variant="outline"
                  className="h-[44px] px-4 py-3 flex-shrink-0 w-[44px] lg:w-auto"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden lg:inline lg:ml-2">Send</span>
                </Button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea; 