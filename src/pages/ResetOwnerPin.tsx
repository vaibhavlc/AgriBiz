import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

interface ResetOwnerPinProps {
  onSwitchToLogin?: () => void;
}

export const ResetOwnerPin: React.FC<ResetOwnerPinProps> = ({ onSwitchToLogin }) => {
  const { t } = useTranslation();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage(t('resetOwnerPin.noToken', 'No valid PIN reset token found in URL link.'));
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setStatus('error');
      setMessage(t('resetOwnerPin.err4Digits', 'Owner PIN must be exactly 4 numeric digits.'));
      return;
    }

    if (newPin !== confirmPin) {
      setStatus('error');
      setMessage(t('resetOwnerPin.errMatch', 'PINs do not match.'));
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const res = await api.post('/auth/reset-owner-pin', { token, newPin });
      setLoading(false);
      if (res.data.success) {
        try {
          window.history.replaceState({}, document.title, '/');
        } catch (e) {}
        setStatus('success');
        setMessage(res.data.message || t('resetOwnerPin.successMsg', 'Owner PIN reset successfully!'));
      } else {
        setStatus('error');
        setMessage(res.data.message || t('resetOwnerPin.failedMsg', 'PIN reset failed.'));
      }
    } catch (err: any) {
      setLoading(false);
      setStatus('error');
      setMessage(err.response?.data?.message || t('resetOwnerPin.errExpired', 'Failed to reset Owner PIN. The link may be expired or already used.'));
    }
  };

  const handleBackToLogin = () => {
    try {
      window.history.replaceState({}, document.title, '/');
    } catch (e) {}
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      window.location.href = '/?view=login';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-gradient, linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--card-bg, #ffffff)',
        borderRadius: '20px',
        padding: '32px 24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        border: '1px solid var(--border-color, #e2e8f0)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: status === 'success' ? 'rgba(16,185,129,0.1)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: status === 'success' ? '#10b981' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: status === 'success' ? 'none' : '0 8px 20px rgba(16,185,129,0.25)',
          }}>
            {status === 'success' ? <CheckCircle2 size={32} /> : <KeyRound size={28} />}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0 }}>
            {status === 'success' ? t('resetOwnerPin.completeTitle', 'Owner PIN Reset Complete') : t('resetOwnerPin.createTitle', 'Create New Owner PIN')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: '4px 0 0' }}>
            {status === 'success'
              ? t('resetOwnerPin.completeSub', 'Your new Owner PIN has been saved securely.')
              : t('resetOwnerPin.createSub', 'Enter a 4-digit PIN for the Owner account.')}
          </p>
        </div>

        {/* Error Banner */}
        {status === 'error' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px',
            color: '#ef4444',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        )}

        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              padding: '16px',
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '12px',
              color: '#065f46',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '24px',
              lineHeight: 1.5,
            }}>
              {message}
            </div>
            <button
              type="button"
              onClick={handleBackToLogin}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
              }}
            >
              {t('resetOwnerPin.continueSignIn', 'Continue to Sign In →')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* New PIN Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary,#475569)', marginBottom: '6px' }}>
                {t('resetOwnerPin.newPin', 'New 4-Digit Owner PIN')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder={t('resetOwnerPin.placeholder', 'Enter 4 digits')}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border-color,#e2e8f0)',
                    padding: '0 40px 0 14px',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '4px',
                    textAlign: 'center',
                  }}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted,#94a3b8)', cursor: 'pointer', padding: '4px'
                  }}
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm PIN Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary,#475569)', marginBottom: '6px' }}>
                {t('resetOwnerPin.confirmPin', 'Confirm 4-Digit Owner PIN')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder={t('resetOwnerPin.reenterPlaceholder', 'Re-enter 4 digits')}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border-color,#e2e8f0)',
                    padding: '0 40px 0 14px',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '4px',
                    textAlign: 'center',
                  }}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
                opacity: (loading || newPin.length !== 4 || confirmPin.length !== 4) ? 0.6 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin-animation" />
                  {t('resetOwnerPin.updating', 'Updating PIN...')}
                </>
              ) : (
                t('resetOwnerPin.saveBtn', 'Save New Owner PIN')
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleBackToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeft size={14} /> {t('auth.backToSignIn', 'Back to Sign In')}
          </button>
        </div>
      </div>
    </div>
  );
};
