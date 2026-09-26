import React from 'react';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-app, #f8fafc)',
          color: 'var(--text-primary, #0f172a)',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            border: '3.5px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: 'var(--primary, #10b981)',
            borderRadius: '50%',
            animation: 'agribiz-spin 0.8s linear infinite',
            marginBottom: '14px',
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
          Restoring Session...
        </span>
        <style>{`
          @keyframes agribiz-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isAuthOverrideRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/reset-password') ||
    window.location.pathname.startsWith('/reset-owner-pin') ||
    window.location.pathname.startsWith('/verify-email') ||
    searchParams?.get('view') === 'forgot' ||
    searchParams?.get('view') === 'reset-password' ||
    searchParams?.get('view') === 'reset-owner-pin' ||
    searchParams?.get('view') === 'verify' ||
    searchParams?.has('token') ||
    searchParams?.has('verifyToken')
  );

  if (!isAuthenticated || isAuthOverrideRoute) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
