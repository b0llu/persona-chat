import { useState, useEffect, useRef } from 'react';
import { Plus, Send } from 'lucide-react';
import { Button } from './ui/button';
import ChatMessage from './ChatMessage';
import BouncingDots from './BouncingDots';
import { Persona, ChatSession, User } from '../types';

interface ChatAreaProps {
  chat: ChatSession | null;
  persona: Persona;
  user: User | null;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onNewChat: () => void;
}

const ChatArea = ({ chat, persona, user, isLoading, onSendMessage, onNewChat }: ChatAreaProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header - Hidden on mobile since we have top nav */}
      <div className="hidden lg:block bg-card/80 backdrop-blur-md border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
              {persona.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{persona.name}</h1>
              <p className="text-sm text-muted-foreground capitalize">{persona.category}</p>
            </div>
          </div>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 lg:space-y-4">
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
            />
          );
        })}
        
        {isLoading && (
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
              {persona.name.charAt(0).toUpperCase()}
            </div>
            <div className="bg-card rounded-lg p-4 border border-border">
              <BouncingDots />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 lg:p-6">
        <div className="flex gap-2 lg:gap-3 items-start">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Message ${persona.name}...`}
              className="w-full resize-none bg-muted border border-input rounded-lg px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-h-[44px] max-h-[120px] leading-5"
              rows={1}
              style={{ height: '44px' }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            variant="outline"
            className="h-[44px] lg:h-auto lg:px-4 lg:py-3 flex-shrink-0 w-[44px] lg:w-auto"
            size="icon"
          >
            <Send className="w-4 h-4" />
            <span className="hidden lg:inline lg:ml-2">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea; 