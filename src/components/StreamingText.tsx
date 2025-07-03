import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { ComponentProps } from 'react';

interface StreamingTextProps {
  text: string;
  isComplete: boolean;
  className?: string;
}

const StreamingText = ({ text, isComplete, className = '' }: StreamingTextProps) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (text.length > displayedText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, 15);
      return () => clearTimeout(timer);
    }
  }, [text, displayedText.length]);

  useEffect(() => {
    if (isComplete && displayedText !== text) {
      setDisplayedText(text);
    }
  }, [isComplete, text, displayedText]);

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
    <span className={className}>
      <Markdown components={markdownComponents}>{displayedText}</Markdown>
    </span>
  );
};

export default StreamingText; 