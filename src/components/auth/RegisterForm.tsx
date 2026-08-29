import React, { useState, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import authService from '../../auth/authService';
import registrationSync, { type RegistrationSyncEvent } from '../../utils/registrationSync';
import { PasswordStrength } from './PasswordStrength';
import { Building2, User, Lock, Smartphone, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Mail, KeyRound, AlertCircle, Send } from 'lucide-react';

// ── 4-Box PIN Input Matching Login Behavior (Defined outside to preserve DOM focus) ──
const PinInput = ({
  value,
  onChange,
  label,
  inputId,
  nextInputId,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  inputId: string;
  nextInputId?: string;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="form-group" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label htmlFor={inputId} style={{ fontWeight: 700, fontSize: '13px', margin: 0, color: 'var(--text-primary,#0f172a)' }}>
          {label}
        </label>
        {value.length === 4 && (
          <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} /> Ready
          </span>
        )}
      </div>

      <div
        style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Overlay Input */}
        <input
          id={inputId}
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            onChange(val);
            if (val.length === 4 && nextInputId) {
              setTimeout(() => {
                const nextEl = document.getElementById(nextInputId);
                if (nextEl) nextEl.focus();
              }, 80);
            }
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 2,
          }}
        />

        {/* 4 Visual Digit Boxes */}
        {[0, 1, 2, 3].map((i) => {
          const isFilled = value.length > i;
          const isCurrent = value.length === i;
          return (
            <div
              key={i}
              style={{
                width: '50px',
                height: '56px',
                borderRadius: '14px',
                border: isCurrent
                  ? '2.5px solid var(--primary,#10b981)'
                  : isFilled
                  ? '2px solid rgba(16,185,129,0.5)'
                  : '2px solid var(--border-color,#cbd5e1)',
                background: isFilled
                  ? 'rgba(16,185,129,0.06)'
                  : isCurrent
                  ? 'rgba(16,185,129,0.04)'
                  : 'var(--card-bg,#ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                fontWeight: 800,
                color: 'var(--primary,#10b981)',
                boxShadow: isCurrent ? '0 0 14px rgba(16,185,129,0.25)' : 'none',
                transition: 'all 0.15s ease',
                transform: isCurrent ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              {isFilled ? '•' : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  initialStep?: 1 | 2 | 3;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, initialStep }) => {
  const { registerCompany } = useAuth();
  
  // Get or create temporary registration session ID for cross-tab matching
  const registrationSessionId = registrationSync.getOrCreateSessionId();

  // Load saved draft from localStorage
  const getSavedDraft = () => {
    try {
      const raw = localStorage.getItem('agribiz_reg_draft');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const draft = getSavedDraft();

  // Step 1: Business Details
  const [businessName, setBusinessName] = useState<string>(draft.businessName || '');
  const [gstin, setGstin] = useState<string>(draft.gstin || '');
  const [email, setEmail] = useState<string>(() => {
    const verifiedEmail = localStorage.getItem('agribiz_verified_email');
    return verifiedEmail ? verifiedEmail.trim() : (draft.email || '');
  });
  const [city, setCity] = useState<string>(draft.city || 'Pipariya');
  const [state, setState] = useState<string>(draft.state || 'Madhya Pradesh');

  // Step 2: Owner Details
  const [ownerName, setOwnerName] = useState<string>(draft.ownerName || '');
  const [mobile, setMobile] = useState<string>(draft.mobile || '');

  // Step 3: Password + PIN
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [step, setStep] = useState<1 | 2 | 3>(() => {
    if (initialStep) return initialStep;
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (stepParam === '3') return 3;
    if (stepParam === '2') return 2;
    return 1;
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredSuccessInfo, setRegisteredSuccessInfo] = useState<{ email: string; devVerificationLink?: string } | null>(null);

  // Email Verification UI State
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(() => {
    const verifiedEmail = localStorage.getItem('agribiz_verified_email');
    const cur = (verifiedEmail || draft.email || '').trim().toLowerCase();
    return Boolean(verifiedEmail && cur && verifiedEmail.trim().toLowerCase() === cur);
  });
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Save form draft to localStorage whenever fields change
  React.useEffect(() => {
    const regDraft = { registrationSessionId, businessName, gstin, email, city, state, ownerName, mobile };
    localStorage.setItem('agribiz_reg_draft', JSON.stringify(regDraft));
  }, [registrationSessionId, businessName, gstin, email, city, state, ownerName, mobile]);

  // Subscribe to registrationSync cross-tab events
  React.useEffect(() => {
    const unsubscribe = registrationSync.subscribe((evt: RegistrationSyncEvent) => {
      if (evt.registrationSessionId && evt.registrationSessionId !== registrationSessionId) {
        return; // Ignore events from unrelated registration sessions
      }

      if (evt.type === 'EMAIL_VERIFIED') {
        if (evt.email) {
          localStorage.setItem('agribiz_verified_email', evt.email.trim().toLowerCase());
          setEmail(evt.email.trim());
        }
        setIsEmailVerified(true);
        setStep(3);
      } else if (evt.type === 'REGISTRATION_COMPLETED') {
        registrationSync.clearSession();
        onSwitchToLogin();
      }
    });

    return unsubscribe;
  }, [registrationSessionId, onSwitchToLogin]);

  // Listen for verification event or storage changes
  React.useEffect(() => {
    const checkVerified = () => {
      const verifiedEmail = localStorage.getItem('agribiz_verified_email');
      const currentEmail = email.trim().toLowerCase();

      if (verifiedEmail && verifiedEmail.trim()) {
        if (!email.trim()) {
          setEmail(verifiedEmail.trim());
        }
        const vClean = verifiedEmail.trim().toLowerCase();
        if (!currentEmail || currentEmail === vClean) {
          setIsEmailVerified(true);
        } else {
          setIsEmailVerified(false);
        }
      } else if (currentEmail && verifiedEmail && currentEmail === verifiedEmail.trim().toLowerCase()) {
        setIsEmailVerified(true);
      } else {
        setIsEmailVerified(false);
      }
    };

    checkVerified();
    window.addEventListener('agribiz_email_verified', checkVerified);
    window.addEventListener('storage', checkVerified);
    const interval = setInterval(checkVerified, 1000);
    return () => {
      window.removeEventListener('agribiz_email_verified', checkVerified);
      window.removeEventListener('storage', checkVerified);
      clearInterval(interval);
    };
  }, [email]);

  const handleSendVerification = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid Email Address before sending verification email.');
      return;
    }
    setErrorMsg('');
    setSendingEmail(true);

    const res = await authService.resendVerification(email.trim());
    setSendingEmail(false);

    if (res.success) {
      setVerificationSent(true);
    } else {
      setErrorMsg(res.message || 'Failed to send verification email.');
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (step === 1) {
      if (!businessName.trim()) { setErrorMsg('Please enter your Business Name.'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!ownerName.trim()) { setErrorMsg('Please enter the Owner Name.'); return; }
      if (!mobile.trim() || mobile.replace(/\D/g, '').length < 10) {
        setErrorMsg('Please enter a valid 10-digit Mobile Number.'); return;
      }
      if (!email.trim()) { setErrorMsg('Please enter your Email Address.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMsg('Please enter a valid Email Address.'); return;
      }
      if (!isEmailVerified) {
        setErrorMsg('Please verify your email before continuing.');
        return;
      }
      setStep(3);
    }
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) { setErrorMsg('Please enter a password.'); return; }
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters long.'); return; }
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    if (!ownerPin || !/^\d{4}$/.test(ownerPin)) { setErrorMsg('Owner PIN must be exactly 4 digits.'); return; }
    if (ownerPin !== confirmPin) { setErrorMsg('PINs do not match. Please re-enter your PIN.'); return; }

    setLoading(true);
    const res = await registerCompany(
      { businessName, ownerName, mobile, email, gstin, city, state },
      password,
      ownerPin
    );
    setLoading(false);
    if (!res.success) {
      if (res.message && (res.message.includes('already exists') || res.message.includes('already completed'))) {
        registrationSync.broadcast({
          type: 'REGISTRATION_COMPLETED',
          registrationSessionId,
        });
        registrationSync.clearSession();
        onSwitchToLogin();
        return;
      }
      setErrorMsg(res.message);
    } else {
      registrationSync.broadcast({
        type: 'REGISTRATION_COMPLETED',
        registrationSessionId,
      });
      registrationSync.clearSession();
      localStorage.removeItem('agribiz_reg_draft');
      localStorage.removeItem('agribiz_verified_email');
      setRegisteredSuccessInfo({
        email: email.trim(),
        devVerificationLink: (res as any).devVerificationLink,
      });
    }
  };

  if (registeredSuccessInfo) {
    return (
      <div style={{ textAlign: 'center', padding: '10px 0', animation: 'fadeIn 0.25s ease-out' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'rgba(16,185,129,0.1)', color: '#10b981',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px', fontSize: '28px',
        }}>
          <CheckCircle2 size={36} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary,#0f172a)', margin: '0 0 6px' }}>
          Registration Successful!
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted,#64748b)', margin: '0 0 16px' }}>
          A verification link has been sent to your email address:
        </p>

        <div style={{
          padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
          color: 'var(--text-primary,#0f172a)', fontSize: '14px', fontWeight: 700,
          marginBottom: '16px', wordBreak: 'break-all',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <Mail size={18} style={{ color: '#10b981' }} />
          {registeredSuccessInfo.email}
        </div>

        {/* Development mode verification link prompt */}
        {registeredSuccessInfo.devVerificationLink && (
          <div style={{
            padding: '14px', borderRadius: '12px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            marginBottom: '18px', textAlign: 'left',
          }}>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#d97706', marginBottom: '4px' }}>
              🛠️ Local Dev Mode Verification Link
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary,#475569)', margin: '0 0 10px', lineHeight: 1.4 }}>
              Click below to verify your email directly in local testing:
            </p>
            <a
              href={registeredSuccessInfo.devVerificationLink}
              style={{
                display: 'inline-block',
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
              }}
            >
              🔗 Click Here to Verify Email
            </a>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
          style={{
            width: '100%', height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
          }}
        >
          🚀 Continue to AgriBiz Suite
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 10px', boxShadow: '0 8px 20px rgba(16,185,129,0.28)', fontSize: '20px',
        }}>🌱</div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary,#0f172a)', margin: 0 }}>
          Register Your Business
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted,#64748b)', margin: '4px 0 0' }}>
          Setup your company account with full enterprise access
        </p>
      </div>

      {/* Wizard Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '14px', left: '15%', right: '15%', height: '2px', backgroundColor: 'var(--border-color,#e2e8f0)', zIndex: 1 }} />
        {[1, 2, 3].map((s) => {
          const done = step > s, active = step === s;
          return (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: done || active ? 'var(--primary,#10b981)' : 'var(--card-bg,#ffffff)',
                color: done || active ? '#ffffff' : 'var(--text-muted,#94a3b8)',
                border: done || active ? 'none' : '2px solid var(--border-color,#cbd5e1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 800, transition: 'all 0.2s ease',
              }}>
                {done ? <CheckCircle2 size={16} /> : s}
              </div>
              <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500, color: active ? 'var(--text-primary,#0f172a)' : 'var(--text-muted,#94a3b8)', marginTop: '4px' }}>
                {s === 1 ? 'Business' : s === 2 ? 'Owner' : 'Security'}
              </span>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div style={{
          padding: '10px 14px', borderRadius: '10px',
          backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#EF4444', fontSize: '13px', fontWeight: 600, marginBottom: '16px',
        }}>
          {errorMsg}
        </div>
      )}

      {/* ── STEP 1: Business Details ─────────────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={handleNextStep} style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Business Name *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted,#94a3b8)', pointerEvents: 'none' }}><Building2 size={16} /></span>
              <input type="text" className="form-control" placeholder="e.g. Patel Seeds & Agriculture Store"
                value={businessName} onChange={e => setBusinessName(e.target.value)}
                style={{ paddingLeft: '40px', height: '44px', borderRadius: '10px', fontSize: '14px' }} autoFocus required />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              GSTIN <span style={{ fontWeight: 400, color: 'var(--text-muted,#94a3b8)' }}>(Optional)</span>
            </label>
            <input type="text" className="form-control" placeholder="e.g. 23AAACA9876C1Z9"
              value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())}
              style={{ height: '44px', borderRadius: '10px', fontSize: '14px', textTransform: 'uppercase' }} maxLength={15} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <div>
              <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>City / Town</label>
              <input type="text" className="form-control" placeholder="e.g. Pipariya"
                value={city} onChange={e => setCity(e.target.value)}
                style={{ height: '44px', borderRadius: '10px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>State</label>
              <input type="text" className="form-control" placeholder="e.g. Madhya Pradesh"
                value={state} onChange={e => setState(e.target.value)}
                style={{ height: '44px', borderRadius: '10px', fontSize: '14px' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center' }}>
            Continue to Owner Details <ArrowRight size={16} />
          </button>
        </form>
      )}

      {/* ── STEP 2: Owner Details ─────────────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleNextStep} style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Owner Name *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted,#94a3b8)', pointerEvents: 'none' }}><User size={16} /></span>
              <input type="text" className="form-control" placeholder="e.g. Vaibhav Patel"
                value={ownerName} onChange={e => setOwnerName(e.target.value)}
                style={{ paddingLeft: '40px', height: '44px', borderRadius: '10px', fontSize: '14px' }} autoFocus required />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Mobile Number (Login ID) *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute', left: '12px', color: 'var(--text-muted,#94a3b8)',
                fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px',
                borderRight: '1px solid var(--border-color,#e2e8f0)', paddingRight: '8px', pointerEvents: 'none',
              }}>
                <Smartphone size={14} /> +91
              </span>
              <input type="tel" className="form-control" placeholder="10-digit mobile number"
                value={mobile} onChange={e => setMobile(e.target.value)}
                style={{ paddingLeft: '78px', height: '44px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
                maxLength={10} required />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontWeight: 700, fontSize: '13px', margin: 0 }}>Email Address *</label>
              {isEmailVerified ? (
                <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> ✓ Email verified
                </span>
              ) : (
                <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> Email not verified
                </span>
              )}
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted,#94a3b8)', pointerEvents: 'none' }}><Mail size={16} /></span>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. vaibhav@agribizstore.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailVerified(false);
                  setVerificationSent(false);
                }}
                style={{
                  paddingLeft: '40px',
                  height: '44px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  borderColor: isEmailVerified ? '#10b981' : undefined,
                }}
                required
              />
            </div>

            {/* Send / Resend Verification Button */}
            {!isEmailVerified && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={sendingEmail}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(16,185,129,0.08)',
                    color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.25)',
                  }}
                >
                  {sendingEmail ? (
                    'Sending Email...'
                  ) : verificationSent ? (
                    <><Send size={14} /> Resend Verification Email</>
                  ) : (
                    <><Send size={14} /> Send Verification Email</>
                  )}
                </button>
              </div>
            )}

            {/* Verification Sent Notice */}
            {verificationSent && !isEmailVerified && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                fontSize: '12px',
                fontWeight: 600,
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <CheckCircle2 size={14} /> Verification email sent. Check your inbox.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary"
              style={{ flex: '0 0 90px', height: '44px', borderRadius: '10px', justifyContent: 'center' }}
              onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button type="submit" className="btn btn-primary"
              style={{ flex: 1, height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center' }}>
              Continue to Security <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 3: Password + Owner PIN ──────────────────────────────────── */}
      {step === 3 && (
        <form onSubmit={handleFinalRegister} style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {/* Password */}
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Create Password *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted,#94a3b8)', pointerEvents: 'none' }}><Lock size={16} /></span>
              <input type="password" className="form-control" placeholder="At least 6 characters"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '40px', height: '44px', borderRadius: '10px', fontSize: '14px' }} autoFocus required />
            </div>
            <PasswordStrength password={password} />
          </div>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Confirm Password *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted,#94a3b8)', pointerEvents: 'none' }}><ShieldCheck size={16} /></span>
              <input type="password" className="form-control" placeholder="Re-enter your password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                style={{
                  paddingLeft: '40px', height: '44px', borderRadius: '10px', fontSize: '14px',
                  borderColor: confirmPassword && confirmPassword !== password ? '#EF4444' : undefined,
                }} required />
            </div>
            {confirmPassword && confirmPassword !== password && (
              <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, marginTop: '4px', display: 'block' }}>Passwords do not match</span>
            )}
          </div>

          {/* PIN Section */}
          <div style={{
            padding: '14px', borderRadius: '12px',
            background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
            marginBottom: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <KeyRound size={15} style={{ color: '#10b981' }} />
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary,#0f172a)' }}>
                Owner Login PIN
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted,#64748b)', marginLeft: 'auto' }}>
                Used every time you log in
              </span>
            </div>

            <PinInput
              value={ownerPin}
              onChange={setOwnerPin}
              label="4-Digit Owner PIN *"
              inputId="owner-pin-input"
              nextInputId="confirm-pin-input"
            />
            <PinInput
              value={confirmPin}
              onChange={setConfirmPin}
              label="Confirm PIN *"
              inputId="confirm-pin-input"
            />

            {confirmPin.length === 4 && ownerPin.length === 4 && ownerPin !== confirmPin && (
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: '12px', fontWeight: 600 }}>
                PINs do not match
              </div>
            )}
            {confirmPin.length === 4 && ownerPin.length === 4 && ownerPin === confirmPin && (
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', color: '#10b981', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> PIN confirmed ✓
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary"
              style={{ flex: '0 0 90px', height: '44px', borderRadius: '10px', justifyContent: 'center' }}
              onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ flex: 1, height: '44px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
              {loading ? 'Registering...' : '🚀 Complete & Launch Suite'}
            </button>
          </div>
        </form>
      )}

      {/* Bottom Link */}
      <div style={{ textAlign: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-color,#e2e8f0)' }}>
        <button type="button"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary,#475569)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          onClick={onSwitchToLogin}>
          Already have an account? <strong style={{ color: 'var(--primary,#10b981)' }}>Sign In</strong>
        </button>
      </div>
    </div>
  );
};
