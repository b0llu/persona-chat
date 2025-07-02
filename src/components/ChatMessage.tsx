import { Message, Persona, User } from '../types';

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
    <div className={`flex gap-2 lg:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs lg:text-sm flex-shrink-0 mt-1">
          {persona.name.charAt(0).toUpperCase()}
        </div>
      )}
      
      <div className={`max-w-[85%] sm:max-w-[75%] lg:max-w-xs xl:max-w-md 2xl:max-w-lg ${isUser ? 'order-1' : ''}`}>
        <div
          className={`rounded-lg p-3 lg:p-4 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-card-foreground border border-border'
          }`}
        >
          {!isUser && isStreaming && message.id !== '1' ? (
            <StreamingText
              text={message.text}
              isComplete={false}
              className="text-sm lg:text-sm leading-relaxed whitespace-pre-wrap"
            />
          ) : (
            <p className="text-sm lg:text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
        
        <div className={`flex items-center gap-1 lg:gap-2 mt-1 text-xs text-muted-foreground ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>{isUser ? (user?.displayName || 'You') : persona.name}</span>
          <span>•</span>
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      
      {isUser && (
        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-semibold text-xs lg:text-sm flex-shrink-0 mt-1">
          {(user?.displayName || 'You').charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default ChatMessage; 