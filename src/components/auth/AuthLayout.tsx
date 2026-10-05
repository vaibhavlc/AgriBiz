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

        @media (max-width: 480px) {
          .auth-card-main {
            padding: 16px 16px;
            border-radius: 16px;
          }
        }
      `}</style>

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
