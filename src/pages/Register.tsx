import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { RegisterForm } from '../components/auth/RegisterForm';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  return (
    <AuthLayout>
      <RegisterForm onSwitchToLogin={onSwitchToLogin} />
    </AuthLayout>
  );
};
