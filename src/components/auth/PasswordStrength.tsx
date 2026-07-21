import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  if (!password) return null;

  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasLetter) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let label = 'Weak';
  let color = '#EF4444';
  let widthPercent = '33%';

  if (score >= 3 && hasMinLength) {
    label = 'Strong';
    color = '#10B981';
    widthPercent = '100%';
  } else if (score >= 2 && hasMinLength) {
    label = 'Medium';
    color = '#F59E0B';
    widthPercent = '66%';
  }

  return (
    <div style={{ marginTop: '8px', animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Password Strength</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color }}>{label}</span>
      </div>

      <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(148, 163, 184, 0.2)', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: widthPercent,
            backgroundColor: color,
            transition: 'width 0.3s ease, background-color 0.3s ease',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: hasMinLength ? '#10B981' : 'var(--text-muted, #94a3b8)' }}>
          {hasMinLength ? <Check size={10} /> : <X size={10} />} 6+ Characters
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: hasNumber ? '#10B981' : 'var(--text-muted, #94a3b8)' }}>
          {hasNumber ? <Check size={10} /> : <X size={10} />} Contains Numbers
        </div>
      </div>
    </div>
  );
};
