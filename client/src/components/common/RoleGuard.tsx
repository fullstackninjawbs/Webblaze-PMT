import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';

interface RoleGuardProps {
  allowedRoles?: Role[];
  customCheck?: (user: any) => boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  customCheck,
  children,
  fallback = null,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return <>{fallback}</>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  if (customCheck && !customCheck(user)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
