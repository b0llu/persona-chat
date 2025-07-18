import { Message, Persona, User } from '../../types';
import StreamingText from './StreamingText';
import Markdown from 'react-markdown';
import { ComponentProps } from 'react';

interface ChatMessageProps {
  message: Message;
  persona: Persona;
  user: User | null;
  isStreaming?: boolean;
  shouldStream?: boolean;
}

const ChatMessage = ({ message, persona, user, isStreaming = false, shouldStream = false }: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  
  // Don't render empty persona messages (they're waiting for streaming to start)
  if (!isUser && message.text === '' && !isStreaming) {
    return null;
  }

  const markdownComponents = {
    // Override paragraph to remove default margins for better spacing
    p: ({ children }: ComponentProps<'p'>) => <p className="mb-2 last:mb-0">{children}</p>,
    // Style code blocks
    code: ({ children, className }: ComponentProps<'code'>) => {
      const isInline = !className;
      return isInline ? (
        <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>
      ) : (
        <code className="block bg-muted p-2 rounded text-sm font-mono overflow-x-auto">{children}</code>
      );
    },
    // Style pre blocks
    pre: ({ children }: ComponentProps<'pre'>) => <pre className="bg-muted p-2 rounded text-sm font-mono overflow-x-auto">{children}</pre>,
    // Style links
    a: ({ href, children }: ComponentProps<'a'>) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {children}
      </a>
    ),
    // Style headings with appropriate sizes
    h1: ({ children }: ComponentProps<'h1'>) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
    h2: ({ children }: ComponentProps<'h2'>) => <h2 className="text-base font-bold mb-2">{children}</h2>,
    h3: ({ children }: ComponentProps<'h3'>) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
    // Style lists
    ul: ({ children }: ComponentProps<'ul'>) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    ol: ({ children }: ComponentProps<'ol'>) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    li: ({ children }: ComponentProps<'li'>) => <li className="text-sm">{children}</li>,
    // Style blockquotes
    blockquote: ({ children }: ComponentProps<'blockquote'>) => (
      <blockquote className="border-l-4 border-muted-foreground pl-4 italic my-2">{children}</blockquote>
    ),
  };

  return (
    <div className={`flex gap-2 lg:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        persona.avatar ? (
          <img
            src={persona.avatar}
            alt={persona.name}
            className="w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover flex-shrink-0 mt-1"
          />
        ) : (
          <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs lg:text-sm flex-shrink-0 mt-1">
            {persona.name.charAt(0).toUpperCase()}
          </div>
        )
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-1' : ''}`}>
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
              shouldStream={shouldStream}
              className="text-base lg:text-base leading-loose"
            />
          ) : (
            <div className="text-base lg:text-base leading-loose prose prose-sm max-w-none prose-headings:text-current prose-p:text-current prose-strong:text-current prose-em:text-current prose-code:text-current prose-pre:text-current prose-blockquote:text-current prose-li:text-current">
              <Markdown components={markdownComponents}>{message.text}</Markdown>
            </div>
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
        user && user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover flex-shrink-0 mt-1"
          />
        ) : (
          <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-semibold text-xs lg:text-sm flex-shrink-0 mt-1">
            {(user?.displayName || 'You').charAt(0).toUpperCase()}
          </div>
        )
      )}
    </div>
  );
};

export default ChatMessage; 