import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { authService } from '../../auth/authService';
import api from '../../utils/api';
import {
  Smartphone, Lock, Eye, EyeOff, ArrowRight,
  ChevronLeft, KeyRound
} from 'lucide-react';
import type { User as UserType } from '../../types';

// 'create-pin' stage handles migration for existing users with no PIN set
type Stage = 'business-login' | 'staff-selection' | 'pin-entry' | 'create-pin';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

const ROLE_CONFIG = {
  Owner:    { emoji: '👑', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  Accounts: { emoji: '📊', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  Cashier:  { emoji: '💵', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSwitchToForgot }) => {
  const { login, staffLogin, currentCompany } = useAuth();

  const [stage, setStage] = useState<Stage>(() => {
    const savedCompany = authService.getCurrentCompany();
    const storedRefreshToken = typeof window !== 'undefined' ? sessionStorage.getItem('agribiz_refresh_token') : null;
    return (savedCompany || storedRefreshToken) ? 'staff-selection' : 'business-login';
  });

  // Business login
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Staff selection
  const [staffList, setStaffList] = useState<(UserType & { id: string })[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<(UserType & { id: string }) | null>(null);

  // PIN entry
  const [pin, setPin] = useState('');

  // Create PIN (migration)
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  // Shared
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot Owner PIN state
  const [forgotPinLoading, setForgotPinLoading] = useState(false);
  const [forgotPinSuccessMsg, setForgotPinSuccessMsg] = useState('');

  const handleForgotOwnerPin = async () => {
    if (!selectedStaff || selectedStaff.role !== 'Owner') return;
    const company = currentCompany || authService.getCurrentCompany();
    if (!company) {
      setErrorMsg('Business session not found. Please log in again.');
      return;
    }

    setForgotPinLoading(true);
    setErrorMsg('');
    setForgotPinSuccessMsg('');

    try {
      const res = await api.post('/auth/forgot-owner-pin', {
        companyId: company.id,
        userId: selectedStaff.id,
      });
      if (res.data.success) {
        setForgotPinSuccessMsg(res.data.message || 'Owner PIN reset link has been sent to your email.');
      } else {
        setErrorMsg(res.data.message || 'Failed to send PIN reset link.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to request Owner PIN reset. Please try again.');
    } finally {
      setForgotPinLoading(false);
    }
  };

  const loadStaffList = useCallback(async () => {
    const staff = await authService.getActiveStaff();
    setStaffList(staff as (UserType & { id: string })[]);
  }, []);

  // On mount: if company session exists, skip business login and go directly to Staff Selection
  useEffect(() => {
    const checkSession = async () => {
      const savedCompany = authService.getCurrentCompany();
      const storedRefreshToken = sessionStorage.getItem('agribiz_refresh_token');
      if (savedCompany || storedRefreshToken) {
        if (storedRefreshToken) {
          await authService.refreshSession();
        }
        await loadStaffList();
        setStage('staff-selection');
      }
    };
    checkSession();
  }, [loadStaffList]);

  // ── Stage 1: Business Login ─────────────────────────────────────────────
  const handleBusinessLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim()) { setErrorMsg('Please enter your mobile number.'); return; }
    if (!password)      { setErrorMsg('Please enter your password.'); return; }
    setErrorMsg('');
    setLoading(true);
    const res = await login(mobile, password, 'Owner', true);
    setLoading(false);
    if (res.success) {
      await loadStaffList();
      setStage('staff-selection');
    } else {
      setErrorMsg(res.message);
    }
  };

  // ── Stage 2: Select Staff ───────────────────────────────────────────────
  const handleSelectStaff = (staff: UserType & { id: string }) => {
    setSelectedStaff(staff);
    setPin('');
    setErrorMsg('');
    setStage('pin-entry');
  };

  // ── Stage 3: PIN Entry ──────────────────────────────────────────────────
  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => handlePinSubmit(newPin), 120);
      }
    }
  };

  const handlePinSubmit = async (pinValue: string) => {
    if (!selectedStaff || !currentCompany) return;
    setErrorMsg('');
    setLoading(true);
    const res = await staffLogin(currentCompany.id, selectedStaff.id, pinValue);
    setLoading(false);
    if (!res.success) {
      // Migration: if PIN not set, redirect to create-pin screen
      if (res.message && res.message.toLowerCase().includes('pin has not been set')) {
        setPin('');
        setNewPin('');
        setConfirmNewPin('');
        setErrorMsg('');
        setStage('create-pin');
      } else {
        setErrorMsg(res.message);
        setPin('');
      }
    }
  };

  // ── Physical Keyboard Handler for PIN Entry ─────────────────────────────
  useEffect(() => {
    if (stage !== 'pin-entry' || !selectedStaff || loading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow normal typing if active element is an explicit form input outside pin entry
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' && (document.activeElement as HTMLElement)?.id !== 'hidden-pin-input') {
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        setPin(p => p.slice(0, -1));
        setErrorMsg('');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setPin(currentPin => {
          if (currentPin.length === 4) {
            handlePinSubmit(currentPin);
          }
          return currentPin;
        });
      } else if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setPin(p => {
          if (p.length < 4) {
            const nextPin = p + e.key;
            if (nextPin.length === 4) {
              setTimeout(() => handlePinSubmit(nextPin), 120);
            }
            return nextPin;
          }
          return p;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, selectedStaff, loading]);

  // ── Stage 4: Create PIN (migration) ────────────────────────────────────
  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) { setErrorMsg('PIN must be exactly 4 digits.'); return; }
    if (newPin !== confirmNewPin) { setErrorMsg('PINs do not match.'); return; }
    if (!selectedStaff) return;
    setErrorMsg('');
    setLoading(true);
    try {
      await api.put('/users/pin', { newPin });
      const res = await staffLogin(currentCompany!.id, selectedStaff.id, newPin);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };  // ── Brand Header (Default fallback for Business Login) ─────────────────────
  const BrandHeader = () => (
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px',
        background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
        color: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 8px', boxShadow: '0 6px 18px rgba(16,185,129,0.28)', fontSize: '20px',
      }}>🌱</div>
      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary,#0f172a)', margin: 0 }}>
        AgriBiz Trader Suite
      </h2>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted,#64748b)', margin: '3px 0 0' }}>
        Manage Billing • Inventory • GST • Reports
      </p>
    </div>
  );

  // ── Business Brand Header (Displays company logo & name prominently) ───────
  const BusinessBrandHeader = () => {
    const company = currentCompany || authService.getCurrentCompany();

    // Multi-source fallback resolution for uploaded business logo
    let logoUrl: string | undefined = company?.logo;

    if (!logoUrl && company) {
      try {
        const savedSettings = typeof window !== 'undefined' ? sessionStorage.getItem('agribiz_settings') : null;
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if ((parsed.companyId === company.id || parsed.id === company.id) && parsed.logo && typeof parsed.logo === 'string' && parsed.logo.trim()) {
            logoUrl = parsed.logo.trim();
          }
        }
      } catch (e) {}
    }

    if (!logoUrl && company) {
      try {
        const cachedBranding = typeof window !== 'undefined' ? sessionStorage.getItem('agribiz_business_branding') : null;
        if (cachedBranding) {
          const parsed = JSON.parse(cachedBranding);
          if (parsed.businessId === company.id && parsed.logoUrl && typeof parsed.logoUrl === 'string' && parsed.logoUrl.trim()) {
            logoUrl = parsed.logoUrl.trim();
          }
        }
      } catch (e) {}
    }

    let businessName = company?.businessName;
    if (!businessName && company) {
      try {
        const savedSettings = typeof window !== 'undefined' ? sessionStorage.getItem('agribiz_settings') : null;
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if ((parsed.companyId === company.id || parsed.id === company.id) && parsed.businessName) {
            businessName = parsed.businessName;
          }
        }
      } catch (e) {}
    }
    if (!businessName) businessName = 'AgriBiz Trader Suite';

    return (
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '14px',
          background: logoUrl ? '#ffffff' : 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 6px',
          boxShadow: '0 6px 18px rgba(16,185,129,0.24)',
          border: logoUrl ? '1.5px solid var(--border-color, #e2e8f0)' : 'none',
          padding: logoUrl ? '3px' : '0',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '11px' }}
            />
          ) : (
            <span style={{ fontSize: '22px' }}>🌱</span>
          )}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--primary,#10b981)', marginBottom: '2px' }}>
          You are logging into
        </div>
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary,#0f172a)', margin: 0, lineHeight: 1.25 }}>
          {businessName}
        </h2>
      </div>
    );
  };

  const ErrorBanner = () => errorMsg ? (
    <div style={{
      padding: '8px 12px', borderRadius: '10px',
      backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
      color: '#EF4444', fontSize: '12px', fontWeight: 600, marginBottom: '12px',
    }}>
      {errorMsg}
    </div>
  ) : null;

  // ══════════════════════════════════════════════════════════════════════
  // STAGE 1 – Business Login
  // ══════════════════════════════════════════════════════════════════════
  if (stage === 'business-login') {
    return (
      <div>
        <BrandHeader />
        <ErrorBanner />
        <form onSubmit={handleBusinessLogin}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-secondary,#475569)' }}>
              Business Mobile Number *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute', left: '12px', color: 'var(--text-muted,#94a3b8)',
                fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center',
                gap: '4px', borderRight: '1px solid var(--border-color,#e2e8f0)',
                paddingRight: '8px', pointerEvents: 'none',
              }}>
                <Smartphone size={14} /> +91
              </span>
              <input type="tel" className="form-control" placeholder="Enter registered mobile"
                value={mobile} onChange={e => setMobile(e.target.value)}
                style={{ paddingLeft: '78px', height: '40px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
                maxLength={10} autoComplete="tel" autoFocus />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-secondary,#475569)' }}>
              Password *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted,#94a3b8)', pointerEvents: 'none' }}>
                <Lock size={16} />
              </span>
              <input type={showPassword ? 'text' : 'password'} className="form-control"
                placeholder="Enter your password" value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '40px', paddingRight: '40px', height: '40px', borderRadius: '10px', fontSize: '14px' }}
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted,#94a3b8)', cursor: 'pointer', padding: '4px' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginBottom: '14px' }}>
            <button type="button"
              style={{ background: 'none', border: 'none', color: 'var(--primary,#10b981)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              onClick={onSwitchToForgot}>
              Forgot Password?
            </button>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', height: '42px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, justifyContent: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
            {loading ? 'Verifying...' : <><span>Continue</span> <ArrowRight size={16} /></>}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color,#e2e8f0)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted,#64748b)', margin: '0 0 6px' }}>
            Don't have a business registered?
          </p>
          <button type="button" className="btn btn-secondary"
            style={{ width: '100%', borderRadius: '10px', height: '36px', justifyContent: 'center', fontWeight: 700 }}
            onClick={onSwitchToRegister}>
            Register Business
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STAGE 2 – Select Staff Member
  // ══════════════════════════════════════════════════════════════════════
  if (stage === 'staff-selection') {
    return (
      <div>
        <BusinessBrandHeader />
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--text-secondary,#475569)',
          textAlign: 'center',
          marginBottom: '12px',
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: '10px',
          padding: '6px 10px'
        }}>
          Select your staff profile to continue
        </div>
        <ErrorBanner />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
          {staffList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted,#94a3b8)', fontSize: '12px' }}>
              No active staff found. Please reconnect and try again.
            </div>
          ) : (
            [...staffList]
              .sort((a, b) => (a.role === 'Owner' ? -1 : b.role === 'Owner' ? 1 : 0))
              .map(staff => {
                const cfg = ROLE_CONFIG[staff.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.Cashier;
                return (
                  <button key={staff.id} type="button" onClick={() => handleSelectStaff(staff)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: '12px', textAlign: 'left',
                    border: '1.5px solid var(--border-color,#e2e8f0)',
                    background: 'var(--surface,#fff)', cursor: 'pointer', width: '100%',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = cfg.color;
                    (e.currentTarget as HTMLButtonElement).style.background = cfg.bg;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color,#e2e8f0)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface,#fff)';
                  }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: cfg.bg, border: `1.5px solid ${cfg.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0,
                  }}>
                    {cfg.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary,#0f172a)' }}>{staff.name}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: cfg.color, marginTop: '1px' }}>{staff.role}</div>
                  </div>
                  <ArrowRight size={15} style={{ color: 'var(--text-muted,#94a3b8)', flexShrink: 0 }} />
                </button>
              );
            })
          )}
        </div>
        <button type="button"
          onClick={() => {
            authService.logout();
            setStage('business-login');
            setStaffList([]);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
            width: '100%', background: 'none', border: '1px solid var(--border-color,#e2e8f0)',
            borderRadius: '10px', padding: '8px', fontSize: '12px', fontWeight: 700,
            color: 'var(--text-secondary,#475569)', cursor: 'pointer',
          }}>
          <ChevronLeft size={14} /> Switch Business Account
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STAGE 3 – 4-Digit PIN Entry
  // ══════════════════════════════════════════════════════════════════════
  if (stage === 'pin-entry' && selectedStaff) {
    const cfg = ROLE_CONFIG[selectedStaff.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.Cashier;
    const digits = [1,2,3,4,5,6,7,8,9,'⌫',0,'✓'];
    return (
      <div>
        <BusinessBrandHeader />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'center',
          background: cfg.bg,
          border: `1.5px solid ${cfg.color}33`,
          borderRadius: '12px',
          padding: '8px 14px',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>{cfg.emoji}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary,#0f172a)', lineHeight: 1.1 }}>{selectedStaff.name}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: cfg.color, marginTop: '2px' }}>{selectedStaff.role}</div>
          </div>
        </div>

        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary,#475569)', textAlign: 'center', marginBottom: '10px' }}>
          Enter 4-Digit PIN
        </div>
        <ErrorBanner />

        {/* Hidden Input for Mobile Virtual Keyboards */}
        <form onSubmit={(e) => { e.preventDefault(); if (pin.length === 4) handlePinSubmit(pin); }}>
          <input
            id="hidden-pin-input"
            name="pin"
            type="password"
            autoComplete="current-password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(val);
              if (val.length === 4) {
                setTimeout(() => handlePinSubmit(val), 120);
              }
            }}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            autoFocus
          />
        </form>

        {/* 4 Distinct PIN Input Digit Boxes */}
        <div
          style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '14px', cursor: 'pointer' }}
          onClick={() => {
            const el = document.getElementById('hidden-pin-input');
            if (el) el.focus();
          }}
        >
          {[0, 1, 2, 3].map(i => {
            const isFilled = pin.length > i;
            const isCurrent = pin.length === i;
            return (
              <div
                key={i}
                style={{
                  width: '44px',
                  height: '48px',
                  borderRadius: '12px',
                  border: isCurrent
                    ? `2.5px solid ${cfg.color}`
                    : isFilled
                    ? `2px solid ${cfg.color}88`
                    : '2px solid var(--border-color,#e2e8f0)',
                  background: isFilled
                    ? cfg.bg
                    : isCurrent
                    ? `${cfg.color}0a`
                    : 'var(--surface,#fff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 800,
                  color: cfg.color,
                  boxShadow: isCurrent ? `0 0 12px ${cfg.color}44` : 'none',
                  transition: 'all 0.15s ease',
                  transform: isCurrent ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                {isFilled ? '•' : ''}
              </div>
            );
          })}
        </div>
        {/* Numeric Keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
          {digits.map((d, i) => {
            const isBack = d === '⌫', isEnter = d === '✓';
            return (
              <button key={i} type="button" disabled={loading}
                onClick={() => {
                  if (isBack) { setPin(p => p.slice(0, -1)); setErrorMsg(''); }
                  else if (isEnter) { if (pin.length === 4) handlePinSubmit(pin); }
                  else handlePinDigit(d.toString());
                }}
                style={{
                  height: '44px', borderRadius: '12px',
                  fontSize: isBack || isEnter ? '17px' : '18px', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  border: isEnter ? 'none' : '1.5px solid var(--border-color,#e2e8f0)',
                  background: isEnter
                    ? (pin.length === 4 ? cfg.color : 'var(--border-color,#e2e8f0)')
                    : 'var(--surface,#fff)',
                  color: isEnter
                    ? (pin.length === 4 ? '#fff' : 'var(--text-muted,#94a3b8)')
                    : isBack ? '#ef4444' : 'var(--text-primary,#0f172a)',
                  boxShadow: isEnter && pin.length === 4 ? `0 4px 12px ${cfg.color}44` : 'none',
                }}>
                {loading && isEnter ? '...' : d}
              </button>
            );
          })}
        </div>

        {/* Forgot PIN button - STRICTLY ONLY for Owner role */}
        {selectedStaff.role === 'Owner' && (
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <button
              type="button"
              disabled={forgotPinLoading}
              onClick={handleForgotOwnerPin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary,#10b981)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: forgotPinLoading ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
              }}
            >
              {forgotPinLoading ? 'Sending Reset Link...' : 'Forgot PIN?'}
            </button>
          </div>
        )}

        {/* Success Banner for Forgot PIN */}
        {forgotPinSuccessMsg && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#065f46',
            fontSize: '12px',
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: '10px',
            lineHeight: 1.4,
          }}>
            {forgotPinSuccessMsg}
          </div>
        )}

        <button type="button"
          onClick={() => { setStage('staff-selection'); setPin(''); setErrorMsg(''); setForgotPinSuccessMsg(''); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
            width: '100%', background: 'none', border: '1px solid var(--border-color,#e2e8f0)',
            borderRadius: '10px', padding: '8px', fontSize: '12px', fontWeight: 700,
            color: 'var(--text-secondary,#475569)', cursor: 'pointer',
          }}>
          <ChevronLeft size={14} /> Back to Staff Selection
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STAGE 4 – Create PIN (migration for existing users without PIN)
  // ══════════════════════════════════════════════════════════════════════
  if (stage === 'create-pin' && selectedStaff) {
    const cfg = ROLE_CONFIG[selectedStaff.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.Cashier;
    return (
      <div>
        <BrandHeader />
        {/* Info banner */}
        <div style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
          marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <KeyRound size={16} style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary,#0f172a)', marginBottom: '3px' }}>
              Create Your Login PIN
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary,#475569)', lineHeight: '1.5' }}>
              No PIN was set for <strong>{selectedStaff.name}</strong>. Create a 4-digit PIN to use for future logins.
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 8px',
            background: cfg.bg, border: `2px solid ${cfg.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
          }}>{cfg.emoji}</div>
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary,#0f172a)' }}>{selectedStaff.name}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: cfg.color }}>{selectedStaff.role}</div>
        </div>

        <ErrorBanner />

        <form onSubmit={handleCreatePin}>
          {/* New PIN field */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--text-secondary,#475569)' }}>
              New 4-Digit PIN *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted,#94a3b8)', pointerEvents: 'none' }}>
                <KeyRound size={16} />
              </span>
              <input
                type="password" inputMode="numeric" className="form-control"
                placeholder="····" value={newPin} maxLength={4}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                style={{ paddingLeft: '40px', height: '48px', borderRadius: '10px', fontSize: '24px', letterSpacing: '10px', fontWeight: 800 }}
                autoFocus
              />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--text-secondary,#475569)' }}>
              Confirm PIN *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted,#94a3b8)', pointerEvents: 'none' }}>
                <KeyRound size={16} />
              </span>
              <input
                type="password" inputMode="numeric" className="form-control"
                placeholder="····" value={confirmNewPin} maxLength={4}
                onChange={e => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                style={{
                  paddingLeft: '40px', height: '48px', borderRadius: '10px', fontSize: '24px', letterSpacing: '10px', fontWeight: 800,
                  borderColor: confirmNewPin && confirmNewPin !== newPin ? '#EF4444' : undefined,
                }}
              />
            </div>
            {confirmNewPin && confirmNewPin !== newPin && (
              <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, marginTop: '4px', display: 'block' }}>PINs do not match</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', height: '44px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, justifyContent: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
            {loading ? 'Setting PIN...' : <><KeyRound size={15} /> Set PIN & Login</>}
          </button>
        </form>

        <button type="button"
          onClick={() => { setStage('staff-selection'); setErrorMsg(''); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '12px',
            width: '100%', background: 'none', border: '1px solid var(--border-color,#e2e8f0)',
            borderRadius: '10px', padding: '10px', fontSize: '12px', fontWeight: 700,
            color: 'var(--text-secondary,#475569)', cursor: 'pointer',
          }}>
          <ChevronLeft size={14} /> Back to Staff Selection
        </button>
      </div>
    );
  }

  return null;
};
