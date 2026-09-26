import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { authService } from '../auth/authService';
import { Mail, ArrowLeft, CheckCircle2, KeyRound, Lock, AlertCircle, Loader2 } from 'lucide-react';

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
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid registered email address.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    const res = await authService.forgotPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setStep('sent');
    } else {
      setErrorMsg(res.message);
    }
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
    const res = await authService.resetPasswordByToken(tokenToUse, newPassword);
    setLoading(false);

    if (res.success) {
      setStep('success');
    } else {
      setErrorMsg(res.message);
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
            : 'Reset your password via registered email address'}
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

      {/* Step 1: Request Password Reset Link by Email */}
      {step === 'request' && (
        <form onSubmit={handleRequestResetLink}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              Registered Email Address *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: 'var(--text-muted, #94a3b8)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="form-control"
                placeholder="name@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '38px', height: '44px', borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !email.trim()}
            style={{ width: '100%', height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="spin-animation" /> Sending Link...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      )}

      {/* Step 2: Email Sent Confirmation */}
      {step === 'sent' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.2s ease-out' }}>
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
            {successMsg || `Password reset link has been sent to ${email}. Please check your email inbox.`}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginBottom: '20px' }}>
            Did not receive the email? Check your spam folder or try requesting again.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', height: '42px', borderRadius: '10px', fontWeight: 600, justifyContent: 'center' }}
            onClick={() => setStep('request')}
          >
            Try Another Email Address
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
            onClick={onSwitchToLogin}
          >
            Back to Sign In
          </button>
        </div>
      )}

      {step !== 'success' && (
        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted, #64748b)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={onSwitchToLogin}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>
      )}
    </AuthLayout>
  );
};
