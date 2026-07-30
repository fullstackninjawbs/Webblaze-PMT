import React from 'react';
import { Rocket } from 'lucide-react';
import { Group, Text } from '@mantine/core';

interface Props {
  variant?: 'light' | 'dark' | 'transparent';
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export const BlazeLogo: React.FC<Props> = ({ variant = 'dark', size = 'md', style }) => {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 19;
  const badgeSize = size === 'sm' ? '32px' : size === 'lg' ? '42px' : '36px';
  const fontSize = size === 'sm' ? '1rem' : size === 'lg' ? '1.25rem' : '1.125rem';

  const isLightText = variant === 'light' || variant === 'transparent';
  const textColor = isLightText ? '#ffffff' : '#0f172a';
  const subTextColor = isLightText ? 'rgba(255, 255, 255, 0.85)' : '#64748b';

  return (
    <Group gap="10px" wrap="nowrap" style={{ ...style }}>
      <div
        style={{
          width: badgeSize,
          height: badgeSize,
          borderRadius: '10px',
          background: isLightText
            ? 'rgba(255, 255, 255, 0.2)'
            : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          backdropFilter: isLightText ? 'blur(10px)' : 'none',
          border: isLightText ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isLightText ? '0 4px 16px rgba(0,0,0,0.1)' : '0 4px 14px rgba(59, 130, 246, 0.35)',
          flexShrink: 0,
        }}
      >
        <Rocket size={iconSize} color="#ffffff" strokeWidth={2.5} />
      </div>
      <Text
        fw={800}
        style={{
          fontSize,
          letterSpacing: '-0.035em',
          color: textColor,
          lineHeight: 1.1,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        WebBlaze <span style={{ color: subTextColor, fontWeight: 700 }}>PMS</span>
      </Text>
    </Group>
  );
};

export default BlazeLogo;
