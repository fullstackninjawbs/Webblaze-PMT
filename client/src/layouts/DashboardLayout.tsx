import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ActiveTimerBadge } from '../components/common/ActiveTimerBadge';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { useLogoutMutation, useGetMeQuery } from '../features/auth/auth.slice';
import { LayoutDashboard, CheckSquare, Briefcase, Rocket, Users, BarChart3, Clock, Settings, LogOut, ChevronDown, DollarSign, ListTodo, Activity, Search } from 'lucide-react';
import { Role } from '../types';
import { AppShell, Stack, Text, UnstyledButton, Group, Box, Menu, Badge, Kbd } from '@mantine/core';
import { useGetActiveTimerQuery } from '../features/timelogs/timeLog.slice';
import { BlazeLogo } from '../components/common/BlazeLogo';
import { UserAvatar } from '../components/common/UserAvatar';
import { GlobalSearchModal } from '../components/common/GlobalSearchModal';

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Categorized sidebar navigation divided into clear module sections
const categorizedSidebarNavigation: Record<Role, NavSection[]> = {
  [Role.ADMIN]: [
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'All Projects', href: '/projects', icon: Briefcase },
      ],
    },
    {
      title: 'EXECUTION & TASKS',
      items: [
        { name: 'Team Todos', href: '/todos/team', icon: ListTodo },
        { name: 'Daily Status', href: '/daily-status', icon: Activity },
        { name: 'Releases', href: '/releases', icon: Rocket },
        { name: 'Time Tracking', href: '/team-time', icon: Clock },
      ],
    },
    {
      title: 'PEOPLE & CLIENTS',
      items: [
        { name: 'Clients', href: '/clients', icon: Users },
        { name: 'Team Directory', href: '/team', icon: Users },
      ],
    },
    {
      title: 'FINANCE & REPORTS',
      items: [
        { name: 'Invoices', href: '/invoices', icon: DollarSign },
        { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
      ],
    },
  ],
  [Role.PM]: [
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: Briefcase },
      ],
    },
    {
      title: 'EXECUTION & TASKS',
      items: [
        { name: 'Team Todos', href: '/todos/team', icon: ListTodo },
        { name: 'Daily Status', href: '/daily-status', icon: Activity },
        { name: 'Releases', href: '/releases', icon: Rocket },
        { name: 'Time Tracking', href: '/team-time', icon: Clock },
      ],
    },
    {
      title: 'PEOPLE & CLIENTS',
      items: [
        { name: 'Clients', href: '/clients', icon: Users },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
      ],
    },
  ],
  [Role.TEAM_LEAD]: [
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Projects', href: '/projects', icon: Briefcase },
      ],
    },
    {
      title: 'EXECUTION & TASKS',
      items: [
        { name: 'Team Tasks', href: '/team-tasks', icon: ListTodo },
        { name: 'Team Todos', href: '/todos/team', icon: CheckSquare },
        { name: 'Daily Status', href: '/daily-status', icon: Activity },
        { name: 'Releases', href: '/releases', icon: Rocket },
      ],
    },
  ],
  [Role.TEAM_MEMBER]: [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MY WORK',
      items: [
        { name: 'My Tasks', href: '/my-tasks', icon: ListTodo },
        { name: 'My Todos', href: '/todos/me', icon: CheckSquare },
      ],
    },
    {
      title: 'DAILY ACTIVITY',
      items: [
        { name: 'Daily Status', href: '/daily-status', icon: Activity },
      ],
    },
  ],
};

export const DashboardLayout: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  useGetMeQuery(undefined, { pollingInterval: 10000, skip: !user });
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const activeTimer = activeTimerData?.data;

  const [searchModalOpened, setSearchModalOpened] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpened((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout({}).unwrap();
    navigate('/login');
  };

  const navSections = user?.role ? categorizedSidebarNavigation[user.role] : [];

  const renderSectionedNavItems = () => {
    return navSections.map((section, idx) => (
      <Box key={section.title || idx} mb="md">
        <Text
          style={{
            fontSize: '0.6875rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: '#94a3b8',
            padding: '6px 14px 6px',
          }}
        >
          {section.title}
        </Text>
        <Stack gap={3}>
          {section.items.map((item) => {
            const isExactMatch = location.pathname === item.href;
            const isSubRouteMatch = item.href !== '/' && item.href !== '/dashboard' && location.pathname.startsWith(`${item.href}/`);
            const active = isExactMatch || isSubRouteMatch;

            return (
              <UnstyledButton
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`sidebar-nav-btn ${active ? 'active' : ''}`}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    backgroundColor: active ? '#eff6ff' : 'transparent',
                    color: active ? '#2563eb' : '#64748b',
                    marginRight: 10,
                  }}
                >
                  <item.icon size={18} />
                </div>
                <Text
                  size="sm"
                  fw={active ? 700 : 500}
                  style={{ color: active ? '#1e40af' : '#475569', fontSize: '0.875rem' }}
                >
                  {item.name}
                </Text>
              </UnstyledButton>
            );
          })}
        </Stack>
      </Box>
    ));
  };

  return (
    <AppShell
      navbar={{
        width: 264,
        breakpoint: 'sm',
      }}
      header={activeTimer ? { height: 56 } : undefined}
      padding={0}
      bg="transparent"
    >
      {activeTimer && (
        <AppShell.Header
          style={{
            left: 264,
            borderBottom: '1px solid #bae6fd',
            backgroundColor: '#f0f9ff',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            boxShadow: '0 2px 8px rgba(14,165,233,0.08)',
          }}
        >
          <ActiveTimerBadge />
        </AppShell.Header>
      )}

      <AppShell.Navbar
        style={{
          top: 0,
          height: '100vh',
          borderRight: '1px solid #e8ecf4',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'none',
          zIndex: 101,
        }}
      >
        {/* WebBlaze PMS Branding Header */}
        <Box px="md" pt="md" pb="xs">
          <BlazeLogo variant="dark" size="md" />
        </Box>

        {/* Global Search Bar Quick Trigger */}
        <UnstyledButton
          onClick={() => setSearchModalOpened(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            margin: '4px 16px 8px',
            cursor: 'pointer',
          }}
        >
          <Group gap="xs">
            <Search size={15} color="#64748b" />
            <Text size="xs" fw={500} style={{ color: '#64748b' }}>Search PMT...</Text>
          </Group>
          <Kbd size="xs">Ctrl K</Kbd>
        </UnstyledButton>

        {/* Separator */}
        <div style={{ height: '1px', background: '#f1f4f9', margin: '4px 20px 12px' }} />

        {/* Nav Items grouped by Section */}
        <AppShell.Section grow px="md" pb="md" style={{ overflowY: 'auto' }}>
          {renderSectionedNavItems()}
        </AppShell.Section>

        {/* User Profile at Bottom */}
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f1f4f9' }}>
          <Menu position="top-start" shadow="lg" width={230} offset={8}>
            <Menu.Target>
              <UnstyledButton className="user-menu-btn">
                <Group wrap="nowrap" style={{ flex: 1, gap: '10px' }}>
                  <UserAvatar
                    name={user?.name}
                    avatarUrl={user?.avatarUrl}
                    email={user?.email}
                    size={38}
                  />
                  <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <Text
                      size="sm"
                      fw={600}
                      truncate
                      style={{
                        color: '#0f172a',
                        fontSize: '0.875rem',
                        letterSpacing: '-0.015em',
                        lineHeight: 1.3,
                      }}
                    >
                      {user?.name}
                    </Text>
                    <Badge
                      size="xs"
                      variant="light"
                      color="cyan"
                      mt={3}
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {user?.role === Role.ADMIN ? 'Admin' : user?.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <ChevronDown size={14} color="#94a3b8" />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<Users size={14} />}
                onClick={() => user?._id && navigate(`/team/${user._id}`)}
                style={{ fontWeight: 500, fontSize: '0.875rem' }}
              >
                View My Profile
              </Menu.Item>
              <Menu.Item
                leftSection={<Settings size={14} />}
                onClick={() => navigate('/settings')}
                style={{ fontWeight: 500, fontSize: '0.875rem' }}
              >
                Profile Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<LogOut size={14} />}
                onClick={handleLogout}
                style={{ fontWeight: 500, fontSize: '0.875rem' }}
              >
                Log out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <div style={{ width: '100%', maxWidth: '1920px', margin: '0 auto', padding: '36px 32px' }}>
          <Outlet />
        </div>
      </AppShell.Main>

      <GlobalSearchModal opened={searchModalOpened} onClose={() => setSearchModalOpened(false)} />
    </AppShell>
  );
};

export default DashboardLayout;
