import React from 'react';
import { ShieldCheck, Lock, Award } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-outer-container">
      <style>{`
        .auth-outer-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-app, #0b0f19);
          padding: 24px 16px;
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

        .auth-card-main {
          width: 100%;
          max-width: 480px;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 20px;
          box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.04);
          padding: 36px 32px;
          box-sizing: border-box;
          position: relative;
          z-index: 10;
          animation: authCardIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes authCardIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .auth-trust-footer {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-muted, #94a3b8);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .auth-trust-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        @media (max-width: 480px) {
          .auth-card-main {
            padding: 28px 20px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="auth-bg-glow-1" />
      <div className="auth-bg-glow-2" />

      <div style={{ width: '100%', maxWidth: '480px' }}>
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
            <Award size={13} style={{ color: 'var(--primary, #10b981)' }} /> Reliable & Audit-Ready
          </span>
        </div>
      </div>
    </div>
  );
};
