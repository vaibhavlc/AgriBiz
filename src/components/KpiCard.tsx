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
  const [isFullWidth, setIsFullWidth] = useState(false);

  // Reset scale to 1 when value changes
  useLayoutEffect(() => {
    setScale(1);
  }, [value]);

  // Monitor size changes of the card to handle layout/window resizing
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

  // Calculate and apply grid column spanning if the text is too long to fit even with scaling
  useLayoutEffect(() => {
    const card = cardRef.current;
    const container = containerRef.current;
    const text = textRef.current;
    if (!card || !container || !text) return;

    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      setIsFullWidth(false);
      return;
    }

    const W_card = card.getBoundingClientRect().width;
    const W_container = container.getBoundingClientRect().width;
    const W_text = text.getBoundingClientRect().width;

    if (W_card === 0 || W_text === 0) return;

    // Estimate unscaled text width
    const W_text_unscaled = W_text / scale;

    // Find space taken by card padding, icon wrapper, and internal flex gap
    const W_overhead = W_card - W_container;

    // Standard grid gap for mobile KPI cards (from index.css)
    const G_gap = 8;

    let W_avail_half = 0;
    if (isFullWidth) {
      // Calculate what the card width and available container width would be in a 2-col cell
      const W_card_half = (W_card - G_gap) / 2;
      W_avail_half = W_card_half - W_overhead;
    } else {
      W_avail_half = W_container;
    }

    // Set the threshold for minimum font size scale allowed in a 2-column layout (e.g. 75%)
    const MIN_SCALE = 0.75;

    // If the unscaled value at minimum allowed scale is wider than a half-width card's content area,
    // make this card span full width of the row.
    const shouldBeFullWidth = W_text_unscaled * MIN_SCALE > W_avail_half;

    if (shouldBeFullWidth !== isFullWidth) {
      setIsFullWidth(shouldBeFullWidth);
    }
  }, [value, scale, isFullWidth]);

  // Calculate and apply scaling if text overflows the container width
  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const containerWidth = container.getBoundingClientRect().width;
    const textWidth = text.getBoundingClientRect().width;

    if (textWidth > containerWidth && containerWidth > 0) {
      const ratio = containerWidth / textWidth;
      const newScale = Math.max(0.4, scale * ratio * 0.98);
      if (Math.abs(newScale - scale) > 0.01) {
        setScale(newScale);
      }
    }
  }, [value, scale, isFullWidth]);

  return (
    <div
      ref={cardRef}
      className={`stat-card-premium variant-${variant} ${isClickable ? 'clickable' : ''} ${className}`}
      onClick={onClick}
      style={{
        ...(isClickable ? { cursor: 'pointer' } : { cursor: 'default' }),
        ...(isFullWidth ? { gridColumn: '1 / -1' } : {}),
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
