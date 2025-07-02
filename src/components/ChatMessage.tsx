interface Message {
  id: string;
  text: string;
  sender: 'user' | 'persona';
  timestamp: Date;
}

interface Persona {
  id: string;
  name: string;
  description: string;
  avatar: string;
  category: string;
}

interface User {
  photoURL?: string | null;
  displayName?: string | null;
}

interface ChatMessageProps {
  message: Message;
  persona: Persona;
  user: User | null;
  isStreaming?: boolean;
}

import StreamingText from './StreamingText';

const ChatMessage = ({ message, persona, user, isStreaming = false }: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  
  // Don't render empty persona messages (they're waiting for streaming to start)
  if (!isUser && message.text === '' && !isStreaming) {
    return null;
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-1">
          {persona.name.charAt(0).toUpperCase()}
        </div>
      )}
      
      <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${isUser ? 'order-1' : ''}`}>
        <div
          className={`rounded-lg p-4 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-card-foreground border border-border'
          }`}
        >
          {!isUser && isStreaming ? (
            <StreamingText
              text={message.text}
              isComplete={false}
              className="text-sm leading-relaxed whitespace-pre-wrap"
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>{isUser ? (user?.displayName || 'You') : persona.name}</span>
          <span>•</span>
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {isUser && (
        <img
          src={user?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'}
          alt={user?.displayName || 'You'}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1 order-2"
        />
      )}
    </div>
  );
};

export default ChatMessage; 