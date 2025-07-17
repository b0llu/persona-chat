import React, { useState, useRef } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  offset?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  offset = 8,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const showTooltip = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0, left = 0;
      switch (side) {
        case 'top':
          top = rect.top - offset;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + offset;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - offset;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + offset;
          break;
      }
      setCoords({ top, left });
    }
    setVisible(true);
  };

  const hideTooltip = () => {
    setVisible(false);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {children}
      {visible && coords && (
        <div
          className={`pointer-events-none fixed z-50 transition-opacity duration-150 opacity-100 ${className}`}
          style={{
            top: side === 'top' || side === 'bottom' ? coords.top : coords.top,
            left: side === 'top' || side === 'bottom' ? coords.left : coords.left,
            transform:
              side === 'top' ? 'translate(-50%, -100%)' :
              side === 'bottom' ? 'translate(-50%, 0)' :
              side === 'left' ? 'translate(-100%, -50%)' :
              'translate(0, -50%)',
            background: 'black',
            color: 'white',
            borderRadius: '0.5rem',
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
