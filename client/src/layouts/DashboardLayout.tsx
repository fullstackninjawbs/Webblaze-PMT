import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ActiveTimerBadge } from '../components/common/ActiveTimerBadge';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { useLogoutMutation } from '../features/auth/auth.slice';
import { LayoutDashboard, CheckSquare, Briefcase, Rocket, Users, BarChart3, Clock, Settings, LogOut, ChevronDown, DollarSign, ListTodo, Activity } from 'lucide-react';
import { Role } from '../types';
import { AppShell, Stack, Avatar, Text, UnstyledButton, Group, Box, Menu, Badge } from '@mantine/core';
import { useGetActiveTimerQuery } from '../features/timelogs/timeLog.slice';

// Distinct sidebars based on user role as specified in Phase 1 requirements
const sidebarNavigation = {
  [Role.ADMIN]: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'All Projects', href: '/projects', icon: Briefcase },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Team Todos', href: '/todos/team', icon: ListTodo },
    { name: 'Releases', href: '/releases', icon: Rocket },
    { name: 'Time Tracking', href: '/team-time', icon: Clock },
    { name: 'Invoices', href: '/invoices', icon: DollarSign },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  [Role.PM]: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Team Todos', href: '/todos/team', icon: ListTodo },
    { name: 'Releases', href: '/releases', icon: Rocket },
    { name: 'Time Tracking', href: '/team-time', icon: Clock },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ],
  [Role.TEAM_LEAD]: [
    { name: 'My Projects', href: '/projects', icon: Briefcase },
    { name: 'Team Tasks', href: '/team-tasks', icon: ListTodo },
    { name: 'Team Todos', href: '/todos/team', icon: CheckSquare },
    { name: 'Releases', href: '/releases', icon: Rocket },
  ],
  [Role.TEAM_MEMBER]: [
    { name: 'My Tasks', href: '/my-tasks', icon: ListTodo },
    { name: 'My Todos', href: '/todos/me', icon: CheckSquare },
    { name: 'Daily Status', href: '/daily-status', icon: Activity },
  ]
};

export const DashboardLayout: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const activeTimer = activeTimerData?.data;

  const handleLogout = async () => {
    await logout({}).unwrap();
    navigate('/login');
  };

  const navItems = user?.role ? sidebarNavigation[user.role] : [];

  const renderNavItems = () => {
    return navItems.map((item) => {
      // Default to /dashboard if clicking a link that's just a placeholder, 
      // but the requirement says to redirect to /dashboard for unauthorized access.
      const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
      return (
        <UnstyledButton
          key={item.name}
          onClick={() => navigate(item.href)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: active ? 'transparent' : 'transparent',
            backgroundImage: active ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'none',
            color: active ? '#ffffff' : '#4b5563',
            fontWeight: active ? 600 : 500,
            transition: 'all 0.2s ease',
            boxShadow: active ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
            borderLeft: 'none',
          }}
          onMouseEnter={(e) => {
            if (!active) e.currentTarget.style.backgroundColor = '#f0f9ff';
          }}
          onMouseLeave={(e) => {
            if (!active) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <item.icon size={18} strokeWidth={active ? 2.5 : 2} style={{ marginRight: '12px' }} />
          <Text size="sm">{item.name}</Text>
        </UnstyledButton>
      );
    });
  };

  return (
    <AppShell
      navbar={{
        width: 260,
        breakpoint: 'sm',
      }}
      header={activeTimer ? { height: 60 } : undefined}
      padding="xl"
      bg="#f8f9fa"
    >
      {activeTimer && (
        <AppShell.Header style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
          <ActiveTimerBadge />
        </AppShell.Header>
      )}

      <AppShell.Navbar style={{ borderRight: '1px solid #e5e7eb', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
        
        {/* Branding */}
        <Box p="xl" pb="md">
          <Text fw={800} size="xl" style={{ letterSpacing: '-0.5px', color: '#111827' }}>
            <span style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WebBlaze</span> PMS
          </Text>
        </Box>

        <AppShell.Section grow p="md" pt={0}>
          <Stack gap="xs">
            {renderNavItems()}
          </Stack>
        </AppShell.Section>
        
        {/* User Profile at Bottom with Role explicitly visible */}
        <AppShell.Section p="md" style={{ borderTop: '1px solid #f3f4f6' }}>
          <Menu position="top-start" shadow="sm" width={220}>
            <Menu.Target>
              <UnstyledButton 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Group wrap="nowrap" style={{ flex: 1 }}>
                  <Avatar src={user?.avatarUrl} radius="xl" size="md" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: '#fff', fontWeight: 600, border: 'none' }}>
                    {user?.name?.charAt(0).toUpperCase()}{user?.name?.split(' ')?.[1]?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Text size="sm" fw={600} truncate color="#111827">
                      {user?.name}
                    </Text>
                    <Badge size="xs" variant="light" color="blue" mt={2}>
                      Role: {user?.role === Role.ADMIN ? 'Admin' : user?.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <ChevronDown size={16} color="#9ca3af" />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<Settings size={14} />}>Profile Settings</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<LogOut size={14} />} onClick={handleLogout}>
                Log out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <div style={{ maxWidth: '1920px', margin: '0 auto', padding: '10px 20px' }}>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
};

export default DashboardLayout;
