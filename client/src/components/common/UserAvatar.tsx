import React from 'react';
import { Avatar, AvatarProps } from '@mantine/core';

export interface UserAvatarProps extends Omit<AvatarProps, 'src'> {
  name?: string;
  avatarUrl?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  email,
  size = 'md',
  className,
  style,
  ...props
}) => {
  const getInitials = () => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <Avatar
      src={avatarUrl || undefined}
      size={size}
      radius="xl"
      variant="gradient"
      gradient={{ from: 'blue', to: 'indigo', deg: 135 }}
      className={`user-avatar-badge ${className || ''}`.trim()}
      style={{
        fontWeight: 700,
        color: '#ffffff',
        ...style,
      }}
      {...props}
    >
      {getInitials()}
    </Avatar>
  );
};
