import React, { useState, useEffect, useRef } from 'react';
import authService from '../auth/authService';
import { CheckCircle2, AlertCircle, Mail, Send, ArrowLeft, Loader2 } from 'lucide-react';
import registrationSync from '../utils/registrationSync';

interface VerifyEmailProps {
  onSwitchToLogin?: () => void;
  onSwitchToRegisterStep3?: () => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({ onSwitchToLogin, onSwitchToRegisterStep3 }) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  
  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendStatus, setResendStatus] = useState<'success' | 'error' | null>(null);

  const hasCalledRef = useRef(false);

  // Subscribe to REGISTRATION_COMPLETED cross-tab event
  useEffect(() => {
    const currentSid = registrationSync.getOrCreateSessionId();
    const unsubscribe = registrationSync.subscribe((evt) => {
      if (evt.type === 'REGISTRATION_COMPLETED' && evt.registrationSessionId === currentSid) {
        registrationSync.clearSession();
        if (onSwitchToLogin) {
          onSwitchToLogin();
        } else {
          window.location.href = '/?view=login';
        }
      }
    });
    return unsubscribe;
  }, [onSwitchToLogin]);

  useEffect(() => {
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('verifyToken');

    if (!token) {
      setLoading(false);
      setStatus('error');
      setMessage('No verification token provided in URL link.');
      return;
    }

    const verify = async () => {
      setLoading(true);
      const res = await authService.verifyEmail(token);
      setLoading(false);

      const currentSid = registrationSync.getOrCreateSessionId();

      if (res.success) {
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
        if (res.email) {
          localStorage.setItem('agribiz_verified_email', res.email.trim().toLowerCase());
        }
        registrationSync.broadcast({
          type: 'EMAIL_VERIFIED',
          registrationSessionId: currentSid,
          email: res.email,
        });
      } else {
        const verifiedEmail = localStorage.getItem('agribiz_verified_email');
        if (verifiedEmail) {
          setStatus('success');
          setMessage('Your email address has already been verified!');
          registrationSync.broadcast({
            type: 'EMAIL_VERIFIED',
            registrationSessionId: currentSid,
            email: verifiedEmail,
          });
        } else {
          setStatus('error');
          setMessage(res.message || 'Invalid, expired, or already-used verification link.');
        }
      }
    };

    verify();
  }, []);

  const handleContinueToStep3 = () => {
    if (onSwitchToRegisterStep3) {
      onSwitchToRegisterStep3();
    } else {
      window.location.href = '/?view=register&step=3';
    }
  };

  const handleNavigateBackToLogin = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      window.location.href = '/?view=login';
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setResendStatus('error');
      setResendMessage('Please enter your registered email address.');
      return;
    }

    setResendLoading(true);
    setResendStatus(null);
    setResendMessage('');

    const res = await authService.resendVerification(resendEmail.trim());
    setResendLoading(false);

    if (res.success) {
      setResendStatus('success');
      setResendMessage(res.message || 'A new verification link has been sent to your email.');
    } else {
      setResendStatus('error');
      setResendMessage(res.message || 'Failed to resend verification email.');
    }
  };

  const handleNavigateBack = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg-main, #f8fafc)',
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: 'var(--card-bg, #ffffff)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        border: '1px solid var(--border-color, #e2e8f0)',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '24px',
          boxShadow: '0 10px 25px rgba(16,185,129,0.3)',
        }}>
          🌱
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '0 0 8px' }}>
          Owner Email Verification
        </h2>

        {/* Loading state */}
        {loading && (
          <div style={{ padding: '30px 0' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: '#10b981', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              Verifying your email address... Please wait.
            </p>
          </div>
        )}

        {/* Success state */}
        {!loading && status === 'success' && (
          <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', color: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '20px auto 16px',
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', margin: '0 0 10px' }}>
              Email Verified Successfully!
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #475569)', lineHeight: 1.5, marginBottom: '24px' }}>
              {message || 'Thank you! Your email address has been verified.'}
            </p>

            <button
              onClick={handleContinueToStep3}
              className="btn btn-primary"
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
                marginBottom: '12px',
              }}
            >
              Continue to Registration (Step 3: Create Password & PIN) →
            </button>

            <button
              onClick={handleNavigateBackToLogin}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Already registered? Sign In to Existing Account
            </button>
          </div>
        )}

        {/* Error state */}
        {!loading && status === 'error' && (
          <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', color: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '20px auto 16px',
            }}>
              <AlertCircle size={36} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#EF4444', margin: '0 0 10px' }}>
              Verification Failed
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #475569)', lineHeight: 1.5, marginBottom: '20px' }}>
              {message}
            </p>

            {/* Resend Verification Email Section */}
            <div style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'var(--bg-card-subtle, #f1f5f9)',
              textAlign: 'left',
              marginBottom: '20px',
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary, #0f172a)' }}>
                Request a new verification link:
              </h4>

              {resendMessage && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  backgroundColor: resendStatus === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: resendStatus === 'success' ? '#10b981' : '#EF4444',
                  border: `1px solid ${resendStatus === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {resendMessage}
                </div>
              )}

              <form onSubmit={handleResend}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted, #94a3b8)', pointerEvents: 'none' }}>
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter registered email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      style={{ paddingLeft: '38px', height: '42px', borderRadius: '8px', fontSize: '13px' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resendLoading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {resendLoading ? 'Resending...' : <><Send size={14} /> Resend Verification Email</>}
                </button>
              </form>
            </div>

            <button
              onClick={handleNavigateBack}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #64748b)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
