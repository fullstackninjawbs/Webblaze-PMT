import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../features/auth/Login';
import { ForgotPassword } from '../features/auth/ForgotPassword';
import { ResetPassword } from '../features/auth/ResetPassword';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { DashboardShell } from '../features/dashboard/DashboardShell';
import { ClientsList } from '../features/clients/ClientsList';
import { ProjectsList } from '../features/projects/ProjectsList';
import { UsersList } from '../features/users/UsersList';
import { ProjectDetails } from '../features/projects/ProjectDetails';
import { TeamTasks } from '../features/tasks/TeamTasks';
import { MyTasks } from '../features/tasks/MyTasks';
import { TaskDetail } from '../features/tasks/TaskDetail';
import { TeamTimeTracking } from '../features/timelogs/TeamTimeTracking';
import { ReleasesPage } from '../features/releases/ReleasesPage';
import { InvoicesPage } from '../features/invoices/InvoicesPage';
import { DailyStatus } from '../features/dailyStatus/DailyStatus';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { ClientDetail } from '../features/clients/ClientDetail';
import { UserProfile } from '../features/users/UserProfile';
import { RoleGuard } from '../components/common/RoleGuard';
import { Role } from '../types';

import { MilestoneCreatePage } from '../features/milestones/MilestoneCreatePage';
import { MilestoneEditPage } from '../features/milestones/MilestoneEditPage';
import { MilestoneDetailPage } from '../features/milestones/MilestoneDetailPage';
import { TaskCreatePage } from '../features/tasks/TaskCreatePage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardShell />} />
        <Route path="/clients" element={<ClientsList />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />

        {/* Milestone Routes */}
        <Route 
          path="/projects/:projectId/milestones/new" 
          element={
            <RoleGuard allowedRoles={[Role.ADMIN, Role.PM]} fallback={<Navigate to="/dashboard" replace />}>
              <MilestoneCreatePage />
            </RoleGuard>
          } 
        />
        <Route path="/projects/:projectId/milestones/:id" element={<MilestoneDetailPage />} />
        <Route 
          path="/projects/:projectId/milestones/:id/edit" 
          element={
            <RoleGuard allowedRoles={[Role.ADMIN, Role.PM]} fallback={<Navigate to="/dashboard" replace />}>
              <MilestoneEditPage />
            </RoleGuard>
          } 
        />
        <Route path="/milestones/:id" element={<MilestoneDetailPage />} />
        <Route 
          path="/milestones/:id/edit" 
          element={
            <RoleGuard allowedRoles={[Role.ADMIN, Role.PM]} fallback={<Navigate to="/dashboard" replace />}>
              <MilestoneEditPage />
            </RoleGuard>
          } 
        />

        {/* Task Create Routes */}
        <Route 
          path="/projects/:projectId/tasks/new" 
          element={
            <RoleGuard allowedRoles={[Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER]} fallback={<Navigate to="/dashboard" replace />}>
              <TaskCreatePage />
            </RoleGuard>
          } 
        />
        <Route 
          path="/tasks/new" 
          element={
            <RoleGuard allowedRoles={[Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER]} fallback={<Navigate to="/dashboard" replace />}>
              <TaskCreatePage />
            </RoleGuard>
          } 
        />

        <Route path="/team" element={<UsersList />} />
        <Route path="/team/:id" element={<UserProfile />} />
        
        <Route path="/releases" element={<ReleasesPage />} />
        <Route 
          path="/invoices" 
          element={
            <RoleGuard allowedRoles={[Role.ADMIN, Role.PM]} fallback={<Navigate to="/dashboard" replace />}>
              <InvoicesPage />
            </RoleGuard>
          } 
        />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route 
          path="/team-tasks" 
          element={
            <RoleGuard allowedRoles={[Role.ADMIN, Role.PM, Role.TEAM_LEAD]} fallback={<Navigate to="/dashboard" replace />}>
              <TeamTasks />
            </RoleGuard>
          } 
        />
        <Route 
          path="/my-tasks" 
          element={
            <RoleGuard allowedRoles={[Role.TEAM_MEMBER, Role.TEAM_LEAD]} fallback={<Navigate to="/dashboard" replace />}>
              <MyTasks />
            </RoleGuard>
          } 
        />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        
        <Route path="/daily-status" element={<DailyStatus />} />

        <Route 
          path="/team-time" 
          element={
            <RoleGuard allowedRoles={[Role.ADMIN, Role.PM]} fallback={<Navigate to="/dashboard" replace />}>
              <TeamTimeTracking />
            </RoleGuard>
          } 
        />
      </Route>

      <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}>404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
