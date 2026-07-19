import React, { useState, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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

const formatFullINR = (num: number): string => {
  const formattedValue = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `₹${formattedValue}`;
};

const getCompactAmount = (val: React.ReactNode): { displayVal: React.ReactNode; fullValStr: string; isCompacted: boolean } => {
  let valStr = '';
  if (typeof val === 'string' || typeof val === 'number') {
    valStr = String(val);
  } else {
    return { displayVal: val, fullValStr: '', isCompacted: false };
  }

  const isCurrency = valStr.includes('₹');
  const cleaned = valStr.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) {
    return { displayVal: val, fullValStr: valStr, isCompacted: false };
  }

  // Only compact currency amounts exceeding 6 digits (absolute value >= 10,00,000)
  if (isCurrency && Math.abs(num) >= 1000000) {
    let compactStr = '';
    if (Math.abs(num) >= 10000000) {
      // Crores
      const crVal = num / 10000000;
      const formatted = parseFloat(crVal.toFixed(5));
      compactStr = `₹${formatted}Cr`;
    } else {
      // Lakhs
      const lVal = num / 100000;
      const formatted = parseFloat(lVal.toFixed(5));
      compactStr = `₹${formatted}L`;
    }

    const fullValFormatted = formatFullINR(num);
    return {
      displayVal: compactStr,
      fullValStr: fullValFormatted,
      isCompacted: true
    };
  }

  return { displayVal: val, fullValStr: valStr, isCompacted: false };
};

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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const { displayVal, fullValStr, isCompacted } = getCompactAmount(value);

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
      const unscaledTextWidth = textWidth / scale;

      if (unscaledTextWidth > W_avail) {
        const ratio = W_avail / unscaledTextWidth;
        const newScale = ratio * 0.95;
        if (Math.abs(newScale - scale) > 0.005) {
          setScale(newScale);
        }
      } else {
        if (scale < 0.99) {
          setScale(1);
        }
      }
    }
  }, [value, scale, availableWidth]);

  const handleShowTooltip = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isCompacted) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      top: rect.top + window.scrollY - 8,
      left: rect.left + rect.width / 2
    });
    setShowTooltip(true);
  };

  const handleHideTooltip = () => {
    setShowTooltip(false);
  };

  return (
    <div
      ref={cardRef}
      className={`stat-card-premium variant-${variant} ${isClickable ? 'clickable' : ''} ${className}`}
      onClick={onClick}
      style={{
        ...(isClickable ? { cursor: 'pointer' } : { cursor: 'default' }),
        ...style
      }}
    >
      <div className="stat-card-body">
        <span className="stat-card-title">{label}</span>
        <div 
          ref={containerRef} 
          className="stat-card-amount"
          onMouseEnter={handleShowTooltip}
          onMouseLeave={handleHideTooltip}
          onTouchStart={(e) => {
            if (isCompacted) {
              e.stopPropagation();
              handleShowTooltip(e);
            }
          }}
          onTouchEnd={handleHideTooltip}
          onTouchCancel={handleHideTooltip}
          style={{
            maxWidth: availableWidth ? `${availableWidth}px` : undefined,
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'clip',
            whiteSpace: 'nowrap',
            position: 'relative',
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
            {displayVal}
          </span>
        </div>
        {subtext && <span className="stat-card-desc">{subtext}</span>}
      </div>
      <div 
        ref={iconWrapRef}
        className={`stat-card-icon-wrap variant-${variant}`}
      >
        {icon}
      </div>

      {isCompacted && showTooltip && tooltipPos && createPortal(
        <div
          style={{
            position: 'absolute',
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            whiteSpace: 'nowrap',
            zIndex: 99999,
            pointerEvents: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'fadeIn 0.1s ease-out',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {fullValStr}
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1e293b',
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
};
