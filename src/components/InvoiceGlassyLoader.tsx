import React from 'react';
import { Languages, Loader2 } from 'lucide-react';

interface InvoiceGlassyLoaderProps {
  isSwitching: boolean;
  targetLanguage?: 'mr' | 'en';
}

export const InvoiceGlassyLoader: React.FC<InvoiceGlassyLoaderProps> = ({ isSwitching, targetLanguage }) => {
  if (!isSwitching) return null;

  return (
    <div className="invoice-glassy-skeleton-overlay no-print" aria-live="polite" aria-busy="true">
      <div className="invoice-glassy-loading-bar" />

      {/* Background skeleton shimmer placeholder blocks */}
      <div className="invoice-skeleton-shimmer-lines">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="skeleton-box" style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
            <div>
              <div className="skeleton-box" style={{ width: '180px', height: '20px', marginBottom: '6px' }} />
              <div className="skeleton-box" style={{ width: '120px', height: '12px' }} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="skeleton-box" style={{ width: '110px', height: '24px', marginBottom: '6px' }} />
            <div className="skeleton-box" style={{ width: '80px', height: '12px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
          <div className="skeleton-box" style={{ width: '160px', height: '40px', borderRadius: '6px' }} />
          <div className="skeleton-box" style={{ width: '120px', height: '36px', borderRadius: '6px' }} />
        </div>

        <div style={{ marginTop: '16px' }}>
          <div className="skeleton-box" style={{ width: '100%', height: '32px', marginBottom: '8px' }} />
          <div className="skeleton-box" style={{ width: '100%', height: '28px', marginBottom: '8px' }} />
          <div className="skeleton-box" style={{ width: '100%', height: '28px', marginBottom: '8px' }} />
          <div className="skeleton-box" style={{ width: '100%', height: '28px' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <div className="skeleton-box" style={{ width: '220px', height: '80px', borderRadius: '8px' }} />
        </div>
      </div>

      {/* Centered Floating Glassy Badge */}
      <div className="invoice-glassy-badge">
        <Loader2 size={16} className="spinner-icon" />
        <Languages size={15} style={{ opacity: 0.75 }} />
        <span>
          {targetLanguage === 'mr' ? 'मराठी भाषा लागू होत आहे...' : 'Applying English Language...'}
        </span>
      </div>
    </div>
  );
};
