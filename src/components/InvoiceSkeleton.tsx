import React from 'react';
import { Skeleton } from './Skeleton';

export const InvoiceA5Skeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      {/* Top Header */}
      <div>
        <div className="invoice-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Skeleton width="48px" height="48px" borderRadius="8px" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Skeleton width="180px" height="20px" borderRadius="4px" />
              <Skeleton width="220px" height="12px" borderRadius="4px" />
              <Skeleton width="150px" height="11px" borderRadius="4px" />
              <Skeleton width="130px" height="11px" borderRadius="4px" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <Skeleton width="110px" height="24px" borderRadius="4px" />
            <Skeleton width="90px" height="14px" borderRadius="4px" />
            <Skeleton width="80px" height="12px" borderRadius="4px" />
          </div>
        </div>

        {/* Customer / Billing details card */}
        <div className="invoice-billing-details" style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="70px" height="10px" borderRadius="3px" />
            <Skeleton width="140px" height="16px" borderRadius="4px" />
            <Skeleton width="180px" height="11px" borderRadius="3px" />
            <Skeleton width="110px" height="11px" borderRadius="3px" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <Skeleton width="80px" height="10px" borderRadius="3px" />
            <Skeleton width="65px" height="20px" borderRadius="12px" />
            <Skeleton width="95px" height="11px" borderRadius="3px" />
          </div>
        </div>

        {/* Table */}
        <table className="invoice-table" style={{ marginTop: '14px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}><Skeleton width="20px" height="12px" /></th>
              <th style={{ textAlign: 'left' }}><Skeleton width="120px" height="12px" /></th>
              <th style={{ width: '80px', textAlign: 'center' }}><Skeleton width="40px" height="12px" /></th>
              <th style={{ width: '90px', textAlign: 'right' }}><Skeleton width="50px" height="12px" /></th>
              <th style={{ width: '60px', textAlign: 'center' }}><Skeleton width="30px" height="12px" /></th>
              <th style={{ width: '70px', textAlign: 'right' }}><Skeleton width="40px" height="12px" /></th>
              <th style={{ width: '100px', textAlign: 'right' }}><Skeleton width="60px" height="12px" /></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((r) => (
              <tr key={r}>
                <td style={{ textAlign: 'center' }}><Skeleton width="16px" height="12px" /></td>
                <td><Skeleton width={`${85 - r * 10}%`} height="13px" /></td>
                <td style={{ textAlign: 'center' }}><Skeleton width="35px" height="12px" /></td>
                <td style={{ textAlign: 'right' }}><Skeleton width="55px" height="12px" /></td>
                <td style={{ textAlign: 'center' }}><Skeleton width="25px" height="12px" /></td>
                <td style={{ textAlign: 'right' }}><Skeleton width="35px" height="12px" /></td>
                <td style={{ textAlign: 'right' }}><Skeleton width="65px" height="12px" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Summary, Terms and Signatures */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '10px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton width="120px" height="12px" />
            <Skeleton width="90%" height="10px" />
            <Skeleton width="75%" height="10px" />
            <Skeleton width="60%" height="10px" />
          </div>
          <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="90px" height="11px" />
              <Skeleton width="60px" height="11px" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="75px" height="11px" />
              <Skeleton width="50px" height="11px" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="75px" height="11px" />
              <Skeleton width="50px" height="11px" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed var(--border-color, #eee)' }}>
              <Skeleton width="100px" height="16px" />
              <Skeleton width="80px" height="16px" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
          <Skeleton width="140px" height="12px" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <Skeleton width="80px" height="22px" />
            <Skeleton width="130px" height="12px" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const InvoiceThermalSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <Skeleton width="140px" height="18px" />
        <Skeleton width="170px" height="11px" />
        <Skeleton width="120px" height="10px" />
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width="80px" height="11px" />
        <Skeleton width="70px" height="11px" />
      </div>
      <Skeleton width="110px" height="11px" />
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width="50%" height="12px" />
            <Skeleton width="15%" height="12px" />
            <Skeleton width="20%" height="12px" />
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width="70px" height="11px" />
          <Skeleton width="50px" height="11px" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width="90px" height="14px" />
          <Skeleton width="60px" height="14px" />
        </div>
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <Skeleton width="130px" height="10px" />
        <Skeleton width="100px" height="9px" />
      </div>
    </div>
  );
};

export const ensureFontsReady = async (lang: 'mr' | 'en') => {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      if (lang === 'mr') {
        await Promise.allSettled([
          document.fonts.load('600 14px Mukta'),
          document.fonts.load('700 16px Mukta'),
          document.fonts.load('400 12px "Noto Sans Devanagari"'),
          document.fonts.ready,
        ]);
      } else {
        await document.fonts.ready;
      }
    } catch {
      // Font loading failure fallback
    }
  }
};
