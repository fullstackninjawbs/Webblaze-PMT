import React from 'react';

interface Props {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | number;
  height?: number;
  style?: React.CSSProperties;
}

export const BlazeLogo: React.FC<Props> = ({ variant = 'light', style }) => {
  // Clean minimal Project Checkmark Icon
  const LogoSymbol = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#cyanGrad)" />
      <path d="M7.5 12L10.5 15L16.5 9" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="cyanGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (variant === 'dark') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
        <LogoSymbol />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Project Management
          </span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>
            System
          </span>
        </div>
      </div>
    );
  }

  // Light Variant (Minimalist Professional Badge for Sidebar Header)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '12px 16px',
        borderRadius: '0px 12px 12px 0px',
        backgroundColor: '#0f172a',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <LogoSymbol />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Project Management
        </span>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: '#38bdf8',
            letterSpacing: '0.06em',
            marginTop: '1px',
          }}
        >
          System
        </span>
      </div>
    </div>
  );
};

export default BlazeLogo;
