import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../../app/store';

export const DailyStatusRedirect: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user?._id) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/team/${user._id}?tab=daily-status`} replace />;
};

export default DailyStatusRedirect;
