import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ActiveTimerBadge } from '../components/common/ActiveTimerBadge';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { useLogoutMutation } from '../features/auth/auth.slice';
import { LayoutDashboard, CheckSquare, Briefcase, Rocket, Users, BarChart3, Clock, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Role } from '../types';
import { AppShell, Stack, Avatar, Text, UnstyledButton, Group, Box, Menu, Divider } from '@mantine/core';

const coreNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER] },
  { name: 'Team To-Dos', href: '/todos', icon: CheckSquare, roles: [Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER] },
  { name: 'Projects', href: '/projects', icon: Briefcase, roles: [Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER] },
  { name: 'Releases', href: '/releases', icon: Rocket, roles: [Role.ADMIN, Role.PM] },
];

const mgmtNavigation = [
  { name: 'Clients', href: '/clients', icon: Users, roles: [Role.ADMIN, Role.PM] },
  { name: 'Team', href: '/team', icon: Users, roles: [Role.ADMIN, Role.PM] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: [Role.ADMIN, Role.PM] },
  { name: 'Time Tracking', href: '/time', icon: Clock, roles: [Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: [Role.ADMIN] },
];

export const DashboardLayout: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout({}).unwrap();
    navigate('/login');
  };

  const renderNavItems = (items: typeof coreNavigation) => {
    const visibleItems = items.filter((item) => user && item.roles.includes(user.role));
    
    return visibleItems.map((item) => {
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
      padding="xl"
      bg="#f8f9fa"
    >
      <AppShell.Navbar style={{ borderRight: '1px solid #e5e7eb', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
        
        {/* Branding */}
        <Box p="xl" pb="md">
          <Text fw={800} size="xl" style={{ letterSpacing: '-0.5px', color: '#111827' }}>
            <span style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WebBlaze</span> PMS
          </Text>
        </Box>

        <AppShell.Section grow p="md" pt={0}>
          <Stack gap="xs">
            {renderNavItems(coreNavigation)}
          </Stack>

          <Divider my="xl" color="#f3f4f6" />

          <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '1px' }} mb="md" pl="md">
            Management
          </Text>
          
          <Stack gap="xs">
            {renderNavItems(mgmtNavigation)}
          </Stack>
        </AppShell.Section>
        
        {/* User Profile at Bottom */}
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
                    <Text color="dimmed" size="xs" truncate>
                      {user?.role === Role.ADMIN ? 'Admin' : user?.role.replace('_', ' ')}
                    </Text>
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
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '10px 20px' }}>
          <Outlet />
        </div>
      </AppShell.Main>

      <ActiveTimerBadge />
    </AppShell>
  );
};

export default DashboardLayout;
