import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { RegisterForm } from '../components/auth/RegisterForm';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  initialStep?: 1 | 2 | 3;
}

export const Register: React.FC<RegisterPageProps> = ({ onSwitchToLogin, initialStep }) => {
  return (
    <AuthLayout>
      <RegisterForm onSwitchToLogin={onSwitchToLogin} initialStep={initialStep} />
    </AuthLayout>
  );
};
