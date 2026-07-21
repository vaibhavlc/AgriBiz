import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Smartphone, Lock, Eye, EyeOff, ArrowRight, UserCheck } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSwitchToForgot }) => {
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim()) {
      setErrorMsg('Please enter your mobile number.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const res = login(mobile, password, rememberMe);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  const handleDemoLogin = (demoMobile: string, demoPass: string) => {
    setMobile(demoMobile);
    setPassword(demoPass);
    setErrorMsg('');
    setLoading(true);
    setTimeout(() => {
      login(demoMobile, demoPass, true);
      setLoading(false);
    }, 300);
  };

  return (
    <div>
      {/* Top Header & Branding */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary, #10b981) 0%, #059669 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
            fontSize: '24px',
            fontWeight: 800,
          }}
        >
          🌱
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0, letterSpacing: '-0.5px' }}>
          AgriBiz Trader Suite
        </h2>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #64748b)', margin: '6px 0 0 0' }}>
          Manage Billing • Inventory • GST • Reports
        </p>
      </div>

      {/* 1-Click Demo Login Chips */}
      <div style={{ marginBottom: '24px', padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--primary, #10b981)', marginBottom: '8px' }}>
          <UserCheck size={13} /> Quick Demo Login (Select Role):
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '8px', flex: 1, minWidth: '90px', justifyContent: 'center' }}
            onClick={() => handleDemoLogin('9425098765', 'owner123')}
          >
            👑 Owner
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '8px', flex: 1, minWidth: '90px', justifyContent: 'center' }}
            onClick={() => handleDemoLogin('9876543210', 'accounts123')}
          >
            📊 Accounts
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '8px', flex: 1, minWidth: '90px', justifyContent: 'center' }}
            onClick={() => handleDemoLogin('9123456789', 'cashier123')}
          >
            💵 Cashier
          </button>
        </div>
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
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit}>
        {/* Mobile Input */}
        <div className="form-group" style={{ marginBottom: '18px' }}>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
            Mobile Number *
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
              placeholder="Enter 10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              style={{ paddingLeft: '78px', height: '44px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
              maxLength={10}
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="form-group" style={{ marginBottom: '18px' }}>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
            Password *
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted, #94a3b8)', pointerEvents: 'none' }}>
              <Lock size={16} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '40px', paddingRight: '40px', height: '44px', borderRadius: '10px', fontSize: '14px' }}
              autoComplete="current-password"
            />
            <button
              type="button"
              style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '4px' }}
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary, #475569)' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer' }}
            />
            <span>Remember Me</span>
          </label>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--primary, #10b981)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            onClick={onSwitchToForgot}
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{
            width: '100%',
            height: '46px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
          }}
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              Sign In <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Bottom Switcher */}
      <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: '0 0 8px 0' }}>
          Don't have a business registered?
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', borderRadius: '10px', height: '40px', justifyContent: 'center', fontWeight: 700 }}
          onClick={onSwitchToRegister}
        >
          Register Business
        </button>
      </div>
    </div>
  );
};
