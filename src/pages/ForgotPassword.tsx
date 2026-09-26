import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { authService } from '../auth/authService';
import { Smartphone, Mail, ArrowLeft, CheckCircle2, KeyRound, Lock, AlertCircle, Loader2 } from 'lucide-react';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
  token?: string | null;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin, token: propToken }) => {
  const [urlToken, setUrlToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = propToken || params.get('token');
    if (t) {
      setUrlToken(t);
      setStep('reset');
    }
  }, [propToken]);

  const [step, setStep] = useState<'request' | 'sent' | 'reset' | 'success'>('request');
  const [mobile, setMobile] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit registered mobile number.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(cleanMobile);
      if (res.success) {
        setSuccessMsg(res.message);
        if (res.maskedEmail) {
          setMaskedEmail(res.maskedEmail);
        }
        setStep('sent');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    try {
      window.history.replaceState({}, document.title, '/');
    } catch (e) {}
    onSwitchToLogin();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokenToUse = urlToken || new URLSearchParams(window.location.search).get('token');

    if (!tokenToUse) {
      setErrorMsg('Password reset token is missing or expired. Please request a new link.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await authService.resetPasswordByToken(tokenToUse, newPassword);
      if (res.success) {
        try {
          window.history.replaceState({}, document.title, '/');
        } catch (e) {}
        setStep('success');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--primary, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
          }}
        >
          <KeyRound size={24} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0 }}>
          {step === 'reset' ? 'Create New Password' : 'Password Recovery'}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', margin: '4px 0 0 0' }}>
          {step === 'reset'
            ? 'Enter a secure new password for your AgriBiz account'
            : 'Reset link will be sent to the verified email linked to your mobile'}
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#EF4444',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Request Password Reset Link by Registered Mobile Number */}
      {step === 'request' && (
        <form onSubmit={handleRequestResetLink}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              Registered Mobile Number *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: 'var(--text-muted, #94a3b8)',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRight: '1px solid var(--border-color, #e2e8f0)',
                  paddingRight: '8px',
                  pointerEvents: 'none',
                }}
              >
                <Smartphone size={14} /> +91
              </span>
              <input
                type="tel"
                className="form-control"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={{ paddingLeft: '78px', height: '44px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
                maxLength={10}
                required
                autoFocus
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '6px', display: 'block' }}>
              The password reset link will be sent to the verified email address linked to this account.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || mobile.replace(/\D/g, '').length !== 10}
            style={{ width: '100%', height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="spin-animation" /> Finding Account & Sending Link...
              </span>
            ) : (
              'Send Reset Link to Linked Email'
            )}
          </button>
        </form>
      )}

      {/* Step 2: Email Sent Confirmation */}
      {step === 'sent' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--primary, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <Mail size={24} />
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#065f46',
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.5,
              marginBottom: '20px',
            }}
          >
            {successMsg || `Password reset link has been sent to your registered email address (${maskedEmail || 'linked email'}) for mobile +91 ${mobile}.`}
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginBottom: '20px' }}>
            Please check your email inbox and click the reset link to create a new password. If you don't see it, check your spam folder.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center' }}
            onClick={handleBackToLogin}
          >
            Back to Sign In
          </button>
        </div>
      )}

      {/* Step 3: Enter New Password (Token Mode) */}
      {step === 'reset' && (
        <form onSubmit={handleResetPassword} style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              New Password *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted, #94a3b8)', pointerEvents: 'none' }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                className="form-control"
                placeholder="Enter at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ paddingLeft: '38px', height: '44px', borderRadius: '10px', fontSize: '14px' }}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              Confirm New Password *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted, #94a3b8)', pointerEvents: 'none' }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: '38px', height: '44px', borderRadius: '10px', fontSize: '14px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
            style={{ width: '100%', height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="spin-animation" /> Updating Password...
              </span>
            ) : (
              'Reset Password & Update'
            )}
          </button>
        </form>
      )}

      {/* Step 4: Success Message */}
      {step === 'success' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ color: 'var(--primary, #10b981)', marginBottom: '12px' }}>
            <CheckCircle2 size={48} style={{ margin: '0 auto' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
            Password Reset Successful!
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: '6px 0 20px 0' }}>
            Your account password has been updated successfully. You can now sign in with your new password.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center' }}
            onClick={handleBackToLogin}
          >
            Back to Sign In
          </button>
        </div>
      )}

      {step !== 'success' && step !== 'sent' && (
        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted, #64748b)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={handleBackToLogin}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>
      )}
    </AuthLayout>
  );
};
