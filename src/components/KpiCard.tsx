import React, { useState, useLayoutEffect, useRef } from 'react';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string | React.ReactNode;
  icon: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'primary',
  onClick,
  className = '',
  style,
}) => {
  const isClickable = typeof onClick === 'function';
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const iconWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);

  // Reset scale to 1 when value changes
  useLayoutEffect(() => {
    setScale(1);
    setAvailableWidth(null);
  }, [value]);

  // Monitor size changes of the card to handle window/container resizing
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new ResizeObserver(() => {
      setScale(1);
      setAvailableWidth(null);
    });
    observer.observe(card);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Calculate remaining width and apply scaling if text overflows the available width
  useLayoutEffect(() => {
    const card = cardRef.current;
    const iconWrap = iconWrapRef.current;
    const text = textRef.current;
    if (!card || !iconWrap || !text) return;

    const W_card = card.getBoundingClientRect().width;
    const W_icon = iconWrap.getBoundingClientRect().width;

    if (W_card === 0 || W_icon === 0) return;

    // Get exact computed styles for padding and gap
    const cardStyle = window.getComputedStyle(card);
    const paddingLeft = parseFloat(cardStyle.paddingLeft) || 16;
    const paddingRight = parseFloat(cardStyle.paddingRight) || 16;
    const gap = parseFloat(cardStyle.gap) || 12;

    // Calculate the remaining space up to the icon
    const W_avail = W_card - paddingLeft - paddingRight - W_icon - gap;
    
    if (Math.abs((availableWidth || 0) - W_avail) > 1) {
      setAvailableWidth(W_avail);
    }

    const textWidth = text.getBoundingClientRect().width;
    if (textWidth > 0 && W_avail > 0) {
      // Calculate the unscaled width of the text
      const unscaledTextWidth = textWidth / scale;

      if (unscaledTextWidth > W_avail) {
        const ratio = W_avail / unscaledTextWidth;
        // Shrink the font size by the exact ratio needed to fit, with a 5% safety margin
        const newScale = ratio * 0.95;
        if (Math.abs(newScale - scale) > 0.005) {
          setScale(newScale);
        }
      } else {
        // If it fits at full scale, restore the original font size
        if (scale < 0.99) {
          setScale(1);
        }
      }
    }
  }, [value, scale, availableWidth]);

  return (
    <div
      ref={cardRef}
      className={`stat-card-premium variant-${variant} ${isClickable ? 'clickable' : ''} ${className}`}
      onClick={onClick}
      style={{
        ...(isClickable ? { cursor: 'pointer' } : { cursor: 'default' }),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        ...style
      }}
    >
      <span className="stat-card-title" style={{ width: '100%' }}>{label}</span>
      
      <div 
        className="stat-card-row-content" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%', 
          gap: '12px',
          marginTop: '4px',
          minWidth: 0
        }}
      >
        <div 
          className="stat-card-amount-container" 
          style={{ 
            flex: 1, 
            minWidth: 0, 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div 
            ref={containerRef} 
            className="stat-card-amount"
            style={{
              maxWidth: availableWidth ? `${availableWidth}px` : undefined,
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'clip',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              ref={textRef}
              style={{
                fontSize: scale < 0.99 ? `${scale * 100}%` : 'inherit',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </span>
          </div>
          {subtext && <span className="stat-card-desc" style={{ marginTop: '2px' }}>{subtext}</span>}
        </div>

        <div 
          ref={iconWrapRef}
          className={`stat-card-icon-wrap variant-${variant}`}
          style={{
            flexShrink: 0
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
