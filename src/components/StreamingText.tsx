import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreamingTextProps {
  text: string;
  isComplete: boolean;
  className?: string;
}

const StreamingText = ({ text, isComplete, className = '' }: StreamingTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isStreamingComplete, setIsStreamingComplete] = useState(false);

  useEffect(() => {
    if (text.length > displayedText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, 15);
      return () => clearTimeout(timer);
    } else if (text.length === displayedText.length && text.length > 0) {
      setIsStreamingComplete(true);
    }
  }, [text, displayedText.length]);

  useEffect(() => {
    if (isComplete && displayedText !== text) {
      setDisplayedText(text);
      setIsStreamingComplete(true);
    }
  }, [isComplete, text, displayedText]);

  return (
    <span className={className}>
      {displayedText}
      
      <AnimatePresence>
        {!isStreamingComplete && !isComplete && (
          <motion.span
            className="inline-block w-0.5 h-4 bg-current ml-0.5"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              transition: {
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </span>
  );
};

export default StreamingText; 