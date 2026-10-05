import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

const getCompactAmount = (
  val: React.ReactNode,
  forceCompact = false
): { displayVal: React.ReactNode; fullValStr: string; isCompacted: boolean } => {
  let valStr = '';
  let numVal: number | null = null;
  let isCurrencyProp = true;

  if (typeof val === 'string' || typeof val === 'number') {
    valStr = String(val);
  } else if (React.isValidElement(val) && val.props) {
    const props = val.props as any;
    if (typeof props.value === 'number') {
      numVal = props.value;
      isCurrencyProp = props.isCurrency !== false;
      valStr = String(props.value);
    } else if (props.children) {
      if (typeof props.children === 'string' || typeof props.children === 'number') {
        valStr = String(props.children);
      }
    }
  }

  if (!valStr && numVal === null) {
    return { displayVal: val, fullValStr: '', isCompacted: false };
  }

  const isCurrency = isCurrencyProp && (valStr.includes('₹') || (numVal !== null ? true : !isNaN(parseFloat(valStr.replace(/[^0-9.-]/g, '')))));
  const cleaned = valStr.replace(/[^0-9.-]/g, '');
  const num = numVal !== null ? numVal : parseFloat(cleaned);
  
  if (isNaN(num)) {
    return { displayVal: val, fullValStr: valStr, isCompacted: false };
  }

  const fullValFormatted = formatFullINR(num);

  // Compact currency amounts if value >= 1,00,000 (1 Lakh / Crores) or if forced because digits reach the icon
  if (isCurrency && (forceCompact || Math.abs(num) >= 100000)) {
    let compactStr = '';
    if (Math.abs(num) >= 10000000) {
      // Crores - strictly maximum 2 decimal places (e.g. 1.22 Cr)
      const crVal = num / 10000000;
      const formatted = (Math.round(crVal * 100) / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      compactStr = `₹${formatted} Cr`;
    } else if (Math.abs(num) >= 100000) {
      // Lakhs - strictly maximum 2 decimal places (e.g. 12.34 L)
      const lVal = num / 100000;
      const formatted = (Math.round(lVal * 100) / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      compactStr = `₹${formatted} L`;
    } else {
      compactStr = fullValFormatted;
    }

    return {
      displayVal: compactStr,
      fullValStr: fullValFormatted,
      isCompacted: true
    };
  }

  return { displayVal: val, fullValStr: fullValFormatted, isCompacted: false };
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
  const { t } = useTranslation();
  const isClickable = typeof onClick === 'function';
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const iconWrapRef = useRef<HTMLDivElement>(null);

  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Compute compact value (either by large amount or because text overflows up to icon)
  const { displayVal, fullValStr, isCompacted } = getCompactAmount(value, isOverflowing);

  // Reset overflow state when value changes
  useLayoutEffect(() => {
    setAvailableWidth(null);
    setIsOverflowing(false);
  }, [value]);

  // Monitor size changes of the card
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new ResizeObserver(() => {
      setAvailableWidth(null);
      setIsOverflowing(false);
    });
    observer.observe(card);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Detect if amount text touches or hides behind icon
  useEffect(() => {
    const card = cardRef.current;
    const iconWrap = iconWrapRef.current;
    const text = textRef.current;
    if (!card || !iconWrap || !text) return;

    const W_card = card.offsetWidth || 0;
    const W_icon = iconWrap.offsetWidth || 0;

    if (W_card === 0 || W_icon === 0) return;

    const W_avail = Math.max(0, W_card - 44 - W_icon);
    const textWidth = text.offsetWidth || 0;
    const overflowing = textWidth > 0 && W_avail > 0 && textWidth > W_avail;

    setAvailableWidth((prev) => (prev === null || Math.abs(prev - W_avail) > 2 ? W_avail : prev));
    setIsOverflowing((prev) => (prev !== overflowing ? overflowing : prev));
  }, [value]);

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopupOpen(true);
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
          onClick={(e) => {
            if (isCompacted || isOverflowing) {
              e.stopPropagation();
              setIsPopupOpen(true);
            }
          }}
          style={{
            maxWidth: availableWidth ? `${availableWidth}px` : undefined,
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            position: 'relative',
            cursor: (isCompacted || isOverflowing) ? 'pointer' : undefined,
          }}
        >
          <span
            ref={textRef}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
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
        className={`stat-card-icon-wrap variant-${variant} cursor-pointer hover:scale-105 transition-transform`}
        onClick={handleIconClick}
        title={t('dashboard.viewFullAmount', 'Click to view full overall amount')}
      >
        {icon}
      </div>

      {/* Small Popup Modal on Icon Click to show exact overall amount */}
      {isPopupOpen && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsPopupOpen(false);
          }}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-card, #121824)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              maxWidth: '360px',
              width: '100%',
              position: 'relative',
              textAlign: 'center',
              animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              onClick={() => setIsPopupOpen(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                padding: '6px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted, #9ca3af)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={t('common.close', 'Close')}
            >
              <X size={16} />
            </button>

            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: 'var(--primary, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '24px'
            }}>
              {icon}
            </div>

            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted, #9ca3af)',
              marginBottom: '6px',
              fontFamily: 'var(--font-display)',
            }}>
              {label}
            </div>

            <div style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary, #ffffff)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
              margin: '8px 0 16px 0',
              wordBreak: 'break-all'
            }}>
              {fullValStr || formatFullINR(parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0)}
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: 'var(--primary, #10b981)',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              <Info size={14} />
              <span>{t('common.compactView', 'Compact View:')}</span>
              <strong style={{ fontWeight: 800 }}>{displayVal}</strong>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
