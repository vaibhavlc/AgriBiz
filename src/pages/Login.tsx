import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export const Login: React.FC<LoginPageProps> = ({ onSwitchToRegister, onSwitchToForgot }) => {
  return (
    <AuthLayout>
      <LoginForm onSwitchToRegister={onSwitchToRegister} onSwitchToForgot={onSwitchToForgot} />
    </AuthLayout>
  );
};
