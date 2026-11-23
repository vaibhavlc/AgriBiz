import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Loader2, QrCode, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import api from '../utils/api';
import { formatINR } from '../utils/dummyData';
import type { BusinessSettings } from '../types';

interface PaytmQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id?: string;
    invoiceNumber: string;
    grandTotal: number;
    customerName?: string;
  };
  settings: BusinessSettings;
  onPaymentSuccess: (utr: string) => void;
}

export const PaytmQrModal: React.FC<PaytmQrModalProps> = ({
  isOpen,
  onClose,
  invoice,
  settings,
  onPaymentSuccess,
}) => {
  const { t } = useTranslation();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [pollStatus, setPollStatus] = useState<'polling' | 'success' | 'failed'>('polling');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [verifiedUtr, setVerifiedUtr] = useState<string>('');

  const isPollingRef = useRef(false);
  const pollTimerRef = useRef<any>(null);

  const upiId = settings.paytmUpiId?.trim() || settings.upiId?.trim() || '';
  const payeeName = settings.businessName || 'AgriBiz Merchant';
  const amount = Number(invoice.grandTotal) || 0;

  // Generate UPI QR Code Data URL
  useEffect(() => {
    if (!isOpen || !upiId || amount <= 0) return;

    setIsGenerating(true);
    setPollStatus('polling');
    setVerifiedUtr('');
    setStatusMessage(t('sales.waitingForPayment', 'Waiting for customer to scan and pay...'));

    const upiParams = new URLSearchParams({
      pa: upiId,
      pn: payeeName,
      am: amount.toFixed(2),
      cu: 'INR',
      tr: invoice.invoiceNumber,
      tn: `Invoice ${invoice.invoiceNumber}`,
    });

    const upiUrl = `upi://pay?${upiParams.toString()}`;

    QRCode.toDataURL(upiUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        setIsGenerating(false);
      });
  }, [isOpen, upiId, payeeName, amount, invoice.invoiceNumber, t]);

  // Polling for auto-verification via Paytm
  useEffect(() => {
    if (!isOpen || pollStatus === 'success') {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    isPollingRef.current = true;

    const checkStatus = async () => {
      if (!isPollingRef.current) return;

      try {
        const res = await api.post('/payments/paytm/verify', {
          invoiceNo: invoice.invoiceNumber,
          invoiceId: invoice.id,
          amount: amount,
        });

        if (res.data?.verified) {
          isPollingRef.current = false;
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);

          const utr = res.data.utr || res.data.txnId || 'VERIFIED';
          setVerifiedUtr(utr);
          setPollStatus('success');
          setStatusMessage(t('sales.paymentSuccessMsg', 'Payment verified successfully!'));

          // Give 1.5s for cashier to see the success checkmark before proceeding
          setTimeout(() => {
            onPaymentSuccess(utr);
          }, 1500);
        }
      } catch (err: any) {
        // Non-blocking error, keep polling until manual dismiss or timeout
        console.debug('Polling check error:', err?.message);
      }
    };

    // Initial check after 2 seconds, then poll every 3 seconds
    const initialTimeout = setTimeout(checkStatus, 2000);
    pollTimerRef.current = setInterval(checkStatus, 3000);

    return () => {
      isPollingRef.current = false;
      clearTimeout(initialTimeout);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, invoice.invoiceNumber, invoice.id, amount, pollStatus, onPaymentSuccess, t]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      style={{
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pollStatus !== 'success') onClose();
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '90%',
          maxWidth: '430px',
          padding: '24px',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          position: 'relative',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                {t('sales.payViaUpiTitle', 'Online UPI Payment')}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                {invoice.invoiceNumber} {invoice.customerName ? `• ${invoice.customerName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #94a3b8)',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Amount Banner */}
        <div
          style={{
            backgroundColor: 'var(--bg-app, #f8fafc)',
            border: '1.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
            {t('sales.invoiceAmountToCollect', 'Amount to Pay')}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', letterSpacing: '-0.5px', marginTop: '2px' }}>
            {formatINR(amount)}
          </div>
        </div>

        {/* QR Code Container / Success Animation */}
        <div
          style={{
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: pollStatus === 'success' ? '2px solid #10b981' : '1.5px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            position: 'relative',
          }}
        >
          {pollStatus === 'success' ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: '#d1fae5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  animation: 'scaleIn 0.3s ease-out',
                }}
              >
                <Check size={40} strokeWidth={3} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', margin: '0 0 6px 0' }}>
                {t('sales.paymentReceived', 'Payment Received!')}
              </h4>
              <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 8px 0', fontWeight: 700 }}>
                {formatINR(amount)}
              </p>
              {verifiedUtr && (
                <div style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }}>
                  UTR / Ref: <b>{verifiedUtr}</b>
                </div>
              )}
            </div>
          ) : isGenerating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Loader2 className="animate-spin" size={32} color="#10b981" />
              <span style={{ fontSize: '12px', color: '#64748b' }}>{t('sales.generatingQr', 'Generating QR Code...')}</span>
            </div>
          ) : qrDataUrl ? (
            <>
              <img
                src={qrDataUrl}
                alt="UPI Payment QR Code"
                style={{ width: '220px', height: '220px', display: 'block', margin: '0 auto' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f3e8ff', color: '#7e22ce' }}>PhonePe</span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>Google Pay</span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#00b9f1' }}>Paytm</span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569' }}>BHIM</span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#047857' }}>Any UPI</span>
              </div>
            </>
          ) : (
            <div style={{ color: '#ef4444', fontSize: '12px', padding: '20px' }}>
              {t('sales.qrGenerateError', 'Failed to generate QR. Please check UPI ID in settings.')}
            </div>
          )}
        </div>

        {/* Live Auto-Verification Pulse Status */}
        {pollStatus !== 'success' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '10px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <Loader2 className="animate-spin" size={16} color="var(--primary, #10b981)" />
            <span style={{ fontSize: '12px', color: 'var(--primary, #047857)', fontWeight: 600 }}>
              {statusMessage}
            </span>
          </div>
        )}

        {/* Cashier Actions */}
        {pollStatus !== 'success' && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%',
                backgroundColor: 'var(--primary, #10b981)',
                borderColor: 'var(--primary, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px 16px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '8px',
              }}
              onClick={() => {
                onPaymentSuccess(`MANUAL-${Date.now()}`);
              }}
            >
              <CheckCircle2 size={16} />
              {t('sales.confirmManualPayment', 'Received via Soundbox / Cash (Skip Waiting)')}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '9px 16px', fontSize: '12px', borderRadius: '8px' }}
              onClick={onClose}
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
