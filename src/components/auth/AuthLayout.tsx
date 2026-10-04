import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, Award, Globe } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const currentLang = i18n.language || 'en';

  const LANGUAGES = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsLangOpen(false);
  };

  return (
    <div className="auth-outer-container">
      <style>{`
        .auth-outer-container {
          min-height: 100vh;
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-app, #0b0f19);
          padding: 16px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        .auth-bg-glow-1 {
          position: absolute;
          top: -10%;
          left: -10%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .auth-bg-glow-2 {
          position: absolute;
          bottom: -10%;
          right: -10%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(0, 0, 0, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .auth-wrapper {
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-height: 98vh;
          box-sizing: border-box;
        }

        .auth-card-main {
          width: 100%;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 20px;
          box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.04);
          padding: 18px 24px;
          box-sizing: border-box;
          position: relative;
          z-index: 10;
          max-height: calc(98vh - 30px);
          overflow-y: auto;
          overflow-x: hidden;
          animation: authCardIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .auth-card-main::-webkit-scrollbar {
          width: 4px;
        }
        .auth-card-main::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 4px;
        }

        @keyframes authCardIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .auth-trust-footer {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--text-muted, #94a3b8);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .auth-trust-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        .auth-lang-btn {
          position: absolute;
          top: 16px;
          right: 20px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border-color, #cbd5e1);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          cursor: pointer;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.2s ease;
        }

        body.dark-theme .auth-lang-btn {
          background: rgba(17, 24, 39, 0.85);
          border-color: rgba(255, 255, 255, 0.1);
          color: #f3f4f6;
        }

        .auth-lang-dropdown {
          position: absolute;
          top: 50px;
          right: 20px;
          z-index: 101;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #cbd5e1);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 130px;
        }

        .auth-lang-option {
          padding: 10px 14px;
          border: none;
          background: none;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .auth-lang-option:hover {
          background: rgba(16, 185, 129, 0.08);
          color: var(--primary, #10b981);
        }

        .auth-lang-option.active {
          color: var(--primary, #10b981);
          font-weight: 700;
          background: rgba(16, 185, 129, 0.12);
        }

        @media (max-width: 480px) {
          .auth-card-main {
            padding: 16px 16px;
            border-radius: 16px;
          }
        }
      `}</style>

      {/* Language Selector in Top Right */}
      <button
        type="button"
        className="auth-lang-btn"
        onClick={() => setIsLangOpen(!isLangOpen)}
        title="Select Language"
      >
        <Globe size={15} style={{ color: 'var(--primary, #10b981)' }} />
        <span>{LANGUAGES.find(l => l.code === currentLang)?.nativeLabel || 'English'}</span>
      </button>

      {isLangOpen && (
        <div className="auth-lang-dropdown animate-fade-in-scale">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`auth-lang-option${lang.code === currentLang ? ' active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              style={{ fontFamily: lang.code !== 'en' ? "'Noto Sans Devanagari', sans-serif" : 'inherit' }}
            >
              {lang.nativeLabel}
            </button>
          ))}
        </div>
      )}

      <div className="auth-bg-glow-1" />
      <div className="auth-bg-glow-2" />

      <div className="auth-wrapper">
        <div className="auth-card-main">
          {children}
        </div>

        {/* Security & Trust Footer */}
        <div className="auth-trust-footer no-print">
          <span className="auth-trust-item">
            <ShieldCheck size={13} style={{ color: 'var(--primary, #10b981)' }} /> 256-Bit Encrypted
          </span>
          <span>•</span>
          <span className="auth-trust-item">
            <Lock size={13} style={{ color: 'var(--primary, #10b981)' }} /> Enterprise Security
          </span>
          <span>•</span>
          <span className="auth-trust-item">
            <Award size={13} style={{ color: 'var(--primary, #10b981)' }} /> Reliable
          </span>
        </div>
      </div>
    </div>
  );
};
