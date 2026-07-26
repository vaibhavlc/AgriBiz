import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Smartphone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSwitchToForgot }) => {
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Owner' | 'Accounts' | 'Cashier'>('Owner');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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

    const res = await login(mobile, password, role, rememberMe);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  return (
    <div>
      {/* Top Header & Branding */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary, #10b981) 0%, #059669 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px auto',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
            fontSize: '22px',
            fontWeight: 800,
          }}
        >
          🌱
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0, letterSpacing: '-0.5px' }}>
          AgriBiz Trader Suite
        </h2>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #64748b)', margin: '4px 0 0 0' }}>
          Manage Billing • Inventory • GST • Reports
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
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit}>
        {/* Role Selection */}
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>
            Login Role *
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['Owner', 'Accounts', 'Cashier'] as const).map((r) => {
              const isActive = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isActive ? '1px solid var(--primary, #10b981)' : '1px solid var(--border-color, #e2e8f0)',
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    color: isActive ? 'var(--primary, #10b981)' : 'var(--text-secondary, #475569)',
                  }}
                >
                  {r === 'Owner' ? '👑 Owner' : r === 'Accounts' ? '📊 Accounts' : '💵 Cashier'}
                </button>
              );
            })}
          </div>
        </div>
        {/* Mobile Input */}
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '12px', marginBottom: '4px', display: 'block' }}>
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
              style={{ paddingLeft: '78px', height: '40px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
              maxLength={10}
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '12px', marginBottom: '4px', display: 'block' }}>
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
              style={{ paddingLeft: '40px', paddingRight: '40px', height: '40px', borderRadius: '10px', fontSize: '14px' }}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary, #475569)' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: '14px', height: '14px', borderRadius: '4px', cursor: 'pointer' }}
            />
            <span>Remember Me</span>
          </label>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--primary, #10b981)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
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
            height: '42px',
            borderRadius: '12px',
            fontSize: '14px',
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
      <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', margin: '0 0 6px 0' }}>
          Don't have a business registered?
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', borderRadius: '10px', height: '36px', justifyContent: 'center', fontWeight: 700 }}
          onClick={onSwitchToRegister}
        >
          Register Business
        </button>
      </div>
    </div>
  );
};
