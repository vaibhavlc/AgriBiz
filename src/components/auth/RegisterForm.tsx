import React, { useState, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { PasswordStrength } from './PasswordStrength';
import { Building2, User, Lock, Smartphone, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Mail, KeyRound } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { registerCompany } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Business Details
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Pipariya');
  const [state, setState] = useState('Madhya Pradesh');

  // Step 2: Owner Details
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');

  // Step 3: Password + PIN
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const ownerPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    if (!res.success) setErrorMsg(res.message);
    // On success: AuthProvider auto-logs in → ProtectedRoute → Dashboard
  };

  // ── 4-Box Auto-Advancing Digit PIN Input ──────────────────────────────────
  const DigitPinInput = ({
    value,
    onChange,
    label,
    inputRefs,
    onCompleteNext,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
    inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    onCompleteNext?: () => void;
  }) => {
    const handleDigitChange = (index: number, rawVal: string) => {
      const cleanDigit = rawVal.replace(/\D/g, '').slice(-1);
      const chars = value.split('');
      chars[index] = cleanDigit;
      const nextVal = chars.join('').slice(0, 4);
      onChange(nextVal);

      if (cleanDigit && index < 3) {
        inputRefs.current[index + 1]?.focus();
      } else if (cleanDigit && index === 3 && onCompleteNext) {
        onCompleteNext();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!value[index] && index > 0) {
          e.preventDefault();
          inputRefs.current[index - 1]?.focus();
          const chars = value.split('');
          chars[index - 1] = '';
          onChange(chars.join(''));
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
      if (pasted) {
        onChange(pasted);
        const nextIdx = Math.min(pasted.length, 3);
        inputRefs.current[nextIdx]?.focus();
        if (pasted.length === 4 && onCompleteNext) {
          onCompleteNext();
        }
      }
    };

    return (
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '13px', margin: 0, color: 'var(--text-primary,#0f172a)' }}>
            {label}
          </label>
          {value.length === 4 && (
            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} /> Ready
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {[0, 1, 2, 3].map((i) => {
            const isFilled = !!value[i];
            return (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={value[i] || ''}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                style={{
                  width: '46px',
                  height: '50px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontSize: '22px',
                  fontWeight: 800,
                  border: isFilled
                    ? '2px solid var(--primary,#10b981)'
                    : '2px solid var(--border-color,#cbd5e1)',
                  backgroundColor: isFilled
                    ? 'rgba(16,185,129,0.06)'
                    : 'var(--card-bg,#ffffff)',
                  color: 'var(--text-primary,#0f172a)',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

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
            <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              Email Address <span style={{ fontWeight: 400, color: 'var(--text-muted,#94a3b8)' }}>(Optional)</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted,#94a3b8)', pointerEvents: 'none' }}><Mail size={16} /></span>
              <input type="email" className="form-control" placeholder="e.g. vaibhav@agribizstore.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '40px', height: '44px', borderRadius: '10px', fontSize: '14px' }} />
            </div>
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

            <DigitPinInput
              value={ownerPin}
              onChange={setOwnerPin}
              label="4-Digit Owner PIN *"
              inputRefs={ownerPinRefs}
              onCompleteNext={() => {
                confirmPinRefs.current[0]?.focus();
              }}
            />
            <DigitPinInput
              value={confirmPin}
              onChange={setConfirmPin}
              label="Confirm PIN *"
              inputRefs={confirmPinRefs}
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
