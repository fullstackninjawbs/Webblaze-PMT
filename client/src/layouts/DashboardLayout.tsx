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
    { name: 'Daily Status', href: '/daily-status', icon: Activity },
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
    { name: 'Daily Status', href: '/daily-status', icon: Activity },
    { name: 'Releases', href: '/releases', icon: Rocket },
    { name: 'Time Tracking', href: '/team-time', icon: Clock },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ],
  [Role.TEAM_LEAD]: [
    { name: 'My Projects', href: '/projects', icon: Briefcase },
    { name: 'Team Tasks', href: '/team-tasks', icon: ListTodo },
    { name: 'Team Todos', href: '/todos/team', icon: CheckSquare },
    { name: 'Daily Status', href: '/daily-status', icon: Activity },
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
      const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
      return (
        <UnstyledButton
          key={item.name}
          onClick={() => navigate(item.href)}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '9px 14px',
            borderRadius: '10px',
            backgroundColor: active ? 'transparent' : 'transparent',
            backgroundImage: active ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'none',
            color: active ? '#ffffff' : '#64748b',
            fontWeight: active ? 600 : 500,
            fontSize: '0.875rem',
            letterSpacing: '-0.01em',
            transition: 'all 0.18s ease',
            boxShadow: active ? '0 4px 14px rgba(59, 130, 246, 0.35)' : 'none',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (!active) {
              e.currentTarget.style.backgroundColor = '#f0f5ff';
              e.currentTarget.style.color = '#3b82f6';
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'transparent',
            marginRight: '10px',
            flexShrink: 0,
            transition: 'all 0.18s ease',
          }}>
            <item.icon size={17} strokeWidth={active ? 2.5 : 2} />
          </div>
          <Text
            size="sm"
            style={{
                fontWeight: active ? 600 : 500,
              fontSize: '0.875rem',
              letterSpacing: '-0.01em',
            }}
          >
            {item.name}
          </Text>
        </UnstyledButton>
      );
    });
  };

  return (
    <AppShell
      navbar={{
        width: 264,
        breakpoint: 'sm',
      }}
      header={activeTimer ? { height: 56 } : undefined}
      padding={0}
      bg="#f4f6fb"
    >
      {activeTimer && (
        <AppShell.Header style={{
          borderBottom: '1px solid #e8ecf4',
          backgroundColor: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(59,130,246,0.08)',
        }}>
          <ActiveTimerBadge />
        </AppShell.Header>
      )}

      <AppShell.Navbar style={{
        borderRight: '1px solid #eef0f8',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 20px rgba(0,0,0,0.03)',
      }}>

        {/* Branding */}
        <Box px="xl" pt="xl" pb="md">
          {/* Logo Mark */}
          <Group gap="sm" mb={4}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
              flexShrink: 0,
            }}>
              <Rocket size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <Text
                fw={800}
                style={{
                  fontSize: '1.0625rem',
                  letterSpacing: '-0.04em',
                  lineHeight: 1.2,
                        color: '#0f172a',
                }}
              >
                <span style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  WebBlaze
                </span>
                <span style={{ color: '#0f172a' }}> PMS</span>
              </Text>
              <Text
                size="xs"
                style={{
                  color: '#94a3b8',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  letterSpacing: '0.03em',
                      }}
              >
                Project Management
              </Text>
            </div>
          </Group>
        </Box>

        {/* Separator */}
        <div style={{ height: '1px', background: '#f1f4f9', margin: '0 20px 12px' }} />

        {/* Nav Items */}
        <AppShell.Section grow px="md" pb="md" style={{ overflowY: 'auto' }}>
          {/* Section label */}
          <Text
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#94a3b8',
              padding: '8px 14px 4px',
              }}
          >
            Main Menu
          </Text>
          <Stack gap={3}>
            {renderNavItems()}
          </Stack>
        </AppShell.Section>

        {/* User Profile at Bottom */}
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f1f4f9' }}>
          <Menu position="top-start" shadow="lg" width={230} offset={8}>
            <Menu.Target>
              <UnstyledButton
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  transition: 'background-color 0.18s ease',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8faff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Group wrap="nowrap" style={{ flex: 1, gap: '10px' }}>
                  <Avatar
                    src={user?.avatarUrl}
                    radius="xl"
                    size={38}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      border: '2px solid #e8ecf4',
                      fontSize: '0.875rem',
                      flexShrink: 0,
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}{user?.name?.split(' ')?.[1]?.charAt(0).toUpperCase()}
                  </Avatar>
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
                      color="blue"
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
        <div style={{ maxWidth: '1920px', width: '100%', margin: '0 auto', padding: '40px 28px' }}>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
};

export default DashboardLayout;
