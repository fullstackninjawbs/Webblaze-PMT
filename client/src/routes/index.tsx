import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../features/auth/Login';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { DashboardShell } from '../features/dashboard/DashboardShell';
import { ClientsList } from '../features/clients/ClientsList';
import { ProjectsList } from '../features/projects/ProjectsList';
import { UsersList } from '../features/users/UsersList';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardShell />} />
        <Route path="/clients" element={<ClientsList />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/team" element={<UsersList />} />
      </Route>

      <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}>404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
