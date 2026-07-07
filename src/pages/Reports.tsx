import React from 'react';

export const Reports: React.FC = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', animation: 'fadeIn 0.2s ease-out' }}>
      <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Reports Cleaned</h3>
      <p style={{ fontSize: '13px' }}>All calculations and templates removed. Waiting for your next command...</p>
    </div>
  );
};
