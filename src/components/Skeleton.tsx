import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1em',
  borderRadius = '6px',
  className = '',
  style,
}) => {
  return (
    <span
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export const SkeletonCardList: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <Skeleton width="40%" height="12px" />
          <Skeleton width="70%" height="24px" />
          <Skeleton width="50%" height="10px" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonTableRows: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={c === 0 ? '30%' : c === cols - 1 ? '15%' : '20%'} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
};
