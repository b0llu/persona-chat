import { useState, useEffect, useRef } from 'react';
import { Plus, Send } from 'lucide-react';
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
}

const ChatArea = ({ chat, persona, user, isLoading, onSendMessage, onNewChat }: ChatAreaProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isChatActive, setIsChatActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
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
      </div>

      {/* Floating Input */}
      <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-xl shadow-lg p-2 lg:p-3">
              <div className="flex gap-2 lg:gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={`Message ${persona.name}...`}
                    className="w-full resize-none bg-transparent border-none px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[44px] max-h-[120px] leading-5"
                    rows={1}
                    style={{ height: '44px' }}
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