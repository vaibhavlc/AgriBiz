import React, { useState } from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { OTPInput } from '../components/auth/OTPInput';
import { authService } from '../auth/authService';
import { Smartphone, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin }) => {
  const [step, setStep] = useState<'request' | 'otp' | 'reset' | 'success'>('request');
  const [mobile, setMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || mobile.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit registered mobile number.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 400);
  };

  const handleOTPComplete = (_otp: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('reset');
    }, 400);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = authService.resetPasswordByMobile(mobile, newPassword);
      setLoading(false);
      if (res.success) {
        setStep('success');
      } else {
        setErrorMsg(res.message);
      }
    }, 500);
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
          Password Recovery
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', margin: '4px 0 0 0' }}>
          Reset your credentials via registered mobile number
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
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
          {errorMsg}
        </div>
      )}

      {/* Step 1: Mobile Request */}
      {step === 'request' && (
        <form onSubmit={handleRequestOTP}>
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
                onChange={(e) => setMobile(e.target.value)}
                style={{ paddingLeft: '78px', height: '44px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
                maxLength={10}
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center' }}
          >
            {loading ? 'Sending Security Code...' : 'Send Reset Code'}
          </button>
        </form>
      )}

      {/* Step 2: OTP Verification */}
      {step === 'otp' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)', marginBottom: '4px' }}>
            Enter 4-digit code sent to <strong>+91 {mobile}</strong>
          </p>
          <span style={{ fontSize: '11px', color: 'var(--primary, #10b981)', fontWeight: 700 }}>[Demo Mode: Enter any 4 digits]</span>

          <OTPInput onComplete={handleOTPComplete} />

          {loading && <p style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Verifying OTP...</p>}
        </div>
      )}

      {/* Step 3: New Password */}
      {step === 'reset' && (
        <form onSubmit={handleResetPassword} style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              New Password *
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter at least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ height: '44px', borderRadius: '10px', fontSize: '14px' }}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              Confirm New Password *
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ height: '44px', borderRadius: '10px', fontSize: '14px' }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center' }}
          >
            {loading ? 'Updating Password...' : 'Reset Password & Update'}
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
            Your account password has been updated. You can now sign in with your new credentials.
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
