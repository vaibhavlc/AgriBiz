import React, { useState } from 'react';

interface OTPInputProps {
  onComplete: (otp: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({ onComplete }) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    const fullOtp = newDigits.join('');
    if (fullOtp.length === 4) {
      onComplete(fullOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '20px 0' }}>
      {digits.map((digit, idx) => (
        <input
          key={idx}
          id={`otp-input-${idx}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          style={{
            width: '48px',
            height: '52px',
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 800,
            borderRadius: '12px',
            border: digit ? '2px solid var(--primary, #10b981)' : '1px solid var(--border-color, #e2e8f0)',
            backgroundColor: 'var(--bg-app, #f8fafc)',
            color: 'var(--text-primary, #0f172a)',
            outline: 'none',
            boxShadow: digit ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : 'none',
            transition: 'all 0.15s ease',
          }}
        />
      ))}
    </div>
  );
};
