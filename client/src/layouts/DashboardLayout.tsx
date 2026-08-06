import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ActiveTimerBadge } from '../components/common/ActiveTimerBadge';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { useLogoutMutation, useGetMeQuery } from '../features/auth/auth.slice';
import { LayoutDashboard, Briefcase, Rocket, Users, BarChart3, Clock, Settings, LogOut, ChevronDown, DollarSign, ListTodo, Activity } from 'lucide-react';
import { Role } from '../types';
import { AppShell, Stack, Text, UnstyledButton, Group, Box, Menu, Badge } from '@mantine/core';
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

const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 420;
const DEFAULT_SIDEBAR_WIDTH = 240;

const getInitialSidebarWidth = (): number => {
  try {
    const saved = localStorage.getItem('sidebar_width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_SIDEBAR_WIDTH;
};

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
        { name: 'My Projects', href: '/projects', icon: Briefcase },
        { name: 'My Tasks', href: '/my-tasks', icon: ListTodo },
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
  const [sidebarWidth, setSidebarWidth] = useState<number>(getInitialSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [handleHovered, setHandleHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
      setSidebarWidth(newWidth);
      localStorage.setItem('sidebar_width', String(newWidth));
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    if (isResizing) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

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
                    backgroundColor: active ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
                    color: active ? '#ffffff' : '#64748b',
                    marginRight: 10,
                    flexShrink: 0,
                  }}
                >
                  <item.icon size={18} color={active ? '#ffffff' : undefined} />
                </div>
                <Text
                  size="sm"
                  fw={active ? 600 : 500}
                  style={{ color: active ? '#ffffff' : '#475569', fontSize: '0.875rem' }}
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
        width: sidebarWidth,
        breakpoint: 'sm',
      }}
      header={activeTimer ? { height: 56 } : undefined}
      padding={0}
      bg="transparent"
    >
      {activeTimer && (
        <AppShell.Header
          style={{
            left: sidebarWidth,
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
          width: `${sidebarWidth}px`,
          top: 0,
          left: 0,
          height: '100vh',
          position: 'fixed',
          borderRight: '1px solid #e8ecf4',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'none',
          zIndex: 101,
        }}
      >
        {/* Drag Resizable Handle */}
        <div
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setHandleHovered(true)}
          onMouseLeave={() => setHandleHovered(false)}
          onDoubleClick={() => {
            setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
            localStorage.setItem('sidebar_width', String(DEFAULT_SIDEBAR_WIDTH));
          }}
          title="Drag to resize sidebar (Double-click to reset)"
          style={{
            position: 'absolute',
            top: 0,
            right: -5,
            width: 10,
            height: '100%',
            cursor: 'col-resize',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: isResizing || handleHovered ? 4 : 2,
              height: '100%',
              backgroundColor: isResizing || handleHovered ? '#3b82f6' : '#e2e8f0',
              transition: 'background-color 0.15s ease, width 0.15s ease',
              borderRadius: '2px',
            }}
          />
        </div>
        {/* WebBlaze PMS Branding Header */}
        <Box px="md" pt="md" pb="xs">
          <BlazeLogo variant="dark" size="md" />
        </Box>

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

      <AppShell.Main style={{ paddingLeft: `${sidebarWidth}px` }}>
        <div style={{ width: '100%', maxWidth: '1920px', margin: '0 auto', padding: '36px 32px' }}>
          <Outlet />
        </div>
      </AppShell.Main>

      <GlobalSearchModal opened={searchModalOpened} onClose={() => setSearchModalOpened(false)} />
    </AppShell>
  );
};

export default DashboardLayout;
