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
  const [scale, setScale] = useState(1);

  // Reset scale to 1 when value changes
  useLayoutEffect(() => {
    setScale(1);
  }, [value]);

  // Monitor size changes of the card to handle window/container resizing
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new ResizeObserver(() => {
      setScale(1);
    });
    observer.observe(card);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Calculate and apply scaling if text overflows the container width
  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const containerWidth = container.getBoundingClientRect().width;
    const textWidth = text.getBoundingClientRect().width;

    if (containerWidth > 0 && textWidth > 0) {
      // Calculate the unscaled width of the text
      const unscaledTextWidth = textWidth / scale;

      if (unscaledTextWidth > containerWidth) {
        const ratio = containerWidth / unscaledTextWidth;
        // Shrink the font size by the exact ratio needed to fit, with a 2% safety margin
        const newScale = Math.max(0.4, ratio * 0.98);
        if (Math.abs(newScale - scale) > 0.01) {
          setScale(newScale);
        }
      } else {
        // If it fits at full scale, restore the original font size
        if (scale < 0.99) {
          setScale(1);
        }
      }
    }
  }, [value, scale]);

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
        <div ref={containerRef} className="stat-card-amount">
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
        {subtext && <span className="stat-card-desc">{subtext}</span>}
      </div>
      <div className={`stat-card-icon-wrap variant-${variant}`}>
        {icon}
      </div>
    </div>
  );
};
