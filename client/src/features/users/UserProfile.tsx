import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';
import { useForm } from '@mantine/form';
import {
  Container, Title, Text, Group, Badge, Stack, SimpleGrid,
  Tabs, Table, Progress, Loader, Center, Button, Paper,
  Modal, Textarea, Select, TextInput
} from '@mantine/core';
import {
  ArrowLeft, CheckCircle2, Clock, Briefcase, CheckSquare,
  Activity, AlertCircle, LogIn, LogOut, Send, Sparkles, Search
} from 'lucide-react';
import { useGetUserByIdQuery } from './user.slice';
import { useGetTasksByUserQuery } from '../tasks/task.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetTeamTimeLogsQuery } from '../timelogs/timeLog.slice';
import {
  useGetMyDailyStatusesQuery,
  useGetTeamDailyStatusesQuery,
  useSubmitDailyStatusMutation,
} from '../dailyStatus/dailyStatus.slice';
import { UserAvatar } from '../../components/common/UserAvatar';
import { formatDateDisplay } from '../../utils/dateUtils';

const roleColor = (role: string) => {
  if (role === 'admin') return 'red';
  if (role === 'pm') return 'violet';
  if (role === 'team_lead') return 'blue';
  if (role === 'team_member') return 'teal';
  return 'gray';
};

const statusColor = (s: string) => {
  if (s === 'completed') return 'green';
  if (s === 'in_progress') return 'blue';
  if (s === 'in_review') return 'orange';
  if (s === 'on_hold') return 'red';
  return 'gray';
};

const bgColors: Record<string, { bg: string; iconColor: string }> = {
  blue: { bg: '#eff6ff', iconColor: '#2563eb' },
  green: { bg: '#f0fdf4', iconColor: '#16a34a' },
  violet: { bg: '#faf5ff', iconColor: '#9333ea' },
  orange: { bg: '#fff7ed', iconColor: '#ea580c' },
};

const StatCard = ({
  label, value, sub, icon: Icon, color,
}: { label: string; value: string | number; sub?: string; icon: any; color: string }) => {
  const theme = bgColors[color] || { bg: '#f8fafc', iconColor: '#475569' };
  return (
    <Paper
      p="lg"
      radius="xl"
      withBorder
      style={{ borderColor: '#e8ecf4', background: '#ffffff' }}
    >
      <Group align="center" gap="xs" mb="xs" wrap="nowrap">
        <Paper p={8} radius="md" bg={theme.bg}>
          <Icon size={18} color={theme.iconColor} />
        </Paper>
        <Text size="xs" fw={700} style={{ color: '#0f172a', lineHeight: 1.2 }}>
          {label}
        </Text>
      </Group>
      <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1, marginTop: 4 }}>
        {value}
      </Text>
      {sub && <Text size="xs" style={{ color: '#94a3b8' }} mt={6}>{sub}</Text>}
    </Paper>
  );
};

export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'daily-status';

  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const isManagement =
    currentUser?.role === Role.ADMIN ||
    currentUser?.role === Role.PM ||
    currentUser?.role === Role.TEAM_LEAD;

  const { data: userData, isLoading: isUserLoading } = useGetUserByIdQuery(id!);
  const { data: tasksData, isLoading: isTasksLoading } = useGetTasksByUserQuery(id!, { skip: !id });
  const { data: projectsData } = useGetProjectsQuery();
  const { data: timeLogsData } = useGetTeamTimeLogsQuery();

  const { data: myDailyLogsData, isLoading: isMyLogsLoading } = useGetMyDailyStatusesQuery();
  const { data: teamLogsData, isLoading: isTeamLogsLoading } = useGetTeamDailyStatusesQuery(
    undefined,
    { skip: !isManagement }
  );
  const [submitDailyStatus, { isLoading: isSubmittingStatus }] = useSubmitDailyStatusMutation();

  const [submitModalOpened, setSubmitModalOpened] = useState(false);
  const [dailyStatusSearchQuery, setDailyStatusSearchQuery] = useState('');
  const [dailyStatusProjectFilter, setDailyStatusProjectFilter] = useState<string | null>(null);
  const [dailyStatusSubTab, setDailyStatusSubTab] = useState<'my' | 'team'>('my');

  const member = userData?.data;
  const tasks = tasksData?.data || [];
  const allProjects = projectsData?.data || [];
  const timeLogs = timeLogsData?.data || [];
  const myDailyLogs = myDailyLogsData?.data || [];
  const teamDailyLogs = teamLogsData?.data || [];

  // Filter daily status logs for this user profile
  const memberDailyLogs = useMemo(() => {
    return myDailyLogs.filter((log: any) => {
      const logUserId = typeof log.user === 'object' ? log.user?._id : log.user;
      return logUserId === id || currentUser?._id === id;
    });
  }, [myDailyLogs, id, currentUser]);

  const projectOptions = useMemo(() => {
    return allProjects.map((p) => ({ value: p._id, label: p.name }));
  }, [allProjects]);

  const statusForm = useForm({
    initialValues: {
      project: '',
      workDone: '',
    },
    validate: {
      workDone: (val) => (val.trim().length === 0 ? 'Please enter a description' : null),
    },
  });

  const handleDailyStatusSubmit = async (values: typeof statusForm.values) => {
    try {
      await submitDailyStatus({
        project: values.project || undefined,
        workDone: values.workDone,
      }).unwrap();
      statusForm.reset();
      setSubmitModalOpened(false);
    } catch (err) {
      console.error('Failed to submit status', err);
    }
  };

  const filteredTeamLogs = useMemo(() => {
    return teamDailyLogs.filter((log: any) => {
      const userName = log.user?.name || '';
      const projectName = log.project?.name || '';
      const matchesQuery =
        userName.toLowerCase().includes(dailyStatusSearchQuery.toLowerCase()) ||
        log.workDone.toLowerCase().includes(dailyStatusSearchQuery.toLowerCase()) ||
        projectName.toLowerCase().includes(dailyStatusSearchQuery.toLowerCase());
      const matchesProject = !dailyStatusProjectFilter || log.project?._id === dailyStatusProjectFilter;
      return matchesQuery && matchesProject;
    });
  }, [teamDailyLogs, dailyStatusSearchQuery, dailyStatusProjectFilter]);

  // Filter time logs for this user
  const userTimeLogs = useMemo(() =>
    timeLogs.filter((log) => {
      const logUserId = typeof log.user === 'object' ? (log.user as any)?._id : log.user;
      return logUserId === id;
    }).slice(0, 20),
    [timeLogs, id]
  );

  // Projects this member is part of
  const memberProjects = useMemo(() =>
    allProjects.filter(p =>
      p.team?.some((t: any) => (typeof t === 'object' ? t._id : t) === id)
    ),
    [allProjects, id]
  );

  // Stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalLoggedSeconds = userTimeLogs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0);
  const totalLoggedHours = Math.round((totalLoggedSeconds / 3600) * 10) / 10;

  if (isUserLoading || isTasksLoading) {
    return <Center h={400}><Loader size="lg" color="blue" /></Center>;
  }

  if (!member) {
    return (
      <Center h={400}>
        <Stack align="center">
          <AlertCircle size={48} color="#ef4444" />
          <Text size="lg" fw={600}>User not found</Text>
          <Button variant="subtle" leftSection={<ArrowLeft size={16} />} onClick={() => navigate('/team')}>Back to Team</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Container size="xl">
      {/* Top Header Row: Back Button on Left, User Profile Pill on Right */}
      <Group justify="space-between" align="center" mb="xl">
        <Button
          variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />}
          onClick={() => navigate('/team')} style={{ paddingLeft: 0 }}
        >
          Back to Team
        </Button>

        {/* User Profile Pill Widget */}
        <Paper
          style={{
            padding: '6px 14px 6px 8px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'default',
          }}
        >
          <Group wrap="nowrap" gap="sm" align="center">
            <UserAvatar name={member.name} avatarUrl={member.avatarUrl} size={36} />
            <div style={{ textAlign: 'left' }}>
              <Text size="xs" fw={700} style={{ color: '#0f172a', lineHeight: 1.2 }}>
                {member.name}
              </Text>
              <Badge
                size="xs"
                variant="filled"
                color={roleColor(member.role)}
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  height: 16,
                  padding: '0 6px',
                  marginTop: 2,
                }}
              >
                {member.role?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </Group>
        </Paper>
      </Group>

      {/* Stats Row */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="xl">
            <StatCard label="Projects" value={memberProjects.length} sub="member of" icon={Briefcase} color="orange" />
            <StatCard label="Tasks Assigned" value={tasks.length} sub="total tasks" icon={CheckSquare} color="blue" />
            <StatCard label="Tasks Completed" value={completedTasks} sub={`${tasks.length - completedTasks} remaining`} icon={CheckCircle2} color="green" />
            <StatCard label="Hours Logged" value={`${totalLoggedHours}h`} sub="total tracked time" icon={Clock} color="violet" />
          </SimpleGrid>

          {/* Tabs */}
          <Tabs value={currentTab} onChange={(val) => setSearchParams({ tab: val || 'daily-status' })} radius="md">
            <Tabs.List mb="lg">
              <Tabs.Tab value="daily-status" leftSection={<Activity size={16} />}>
                Daily Status <Badge variant="light" size="xs" ml={4}>{memberDailyLogs.length}</Badge>
              </Tabs.Tab>
              <Tabs.Tab value="projects" leftSection={<Briefcase size={16} />}>
                Projects <Badge variant="light" size="xs" ml={4}>{memberProjects.length}</Badge>
              </Tabs.Tab>
              <Tabs.Tab value="tasks" leftSection={<CheckSquare size={16} />}>
                Tasks <Badge variant="light" size="xs" ml={4}>{tasks.length}</Badge>
              </Tabs.Tab>
              <Tabs.Tab value="timelogs" leftSection={<Clock size={16} />}>
                Time Logs <Badge variant="light" size="xs" ml={4}>{userTimeLogs.length}</Badge>
              </Tabs.Tab>
            </Tabs.List>

        {/* Tasks Tab */}
        <Tabs.Panel value="tasks">
          <Paper withBorder radius="xl" p={0} style={{ borderColor: '#e8ecf4', overflow: 'hidden', background: '#ffffff' }}>
            {tasks.length === 0 ? (
              <Center h={200}>
                <Stack align="center">
                  <CheckSquare size={40} color="#cbd5e1" />
                  <Text c="dimmed">No tasks assigned to this member.</Text>
                </Stack>
              </Center>
            ) : (
              <Table verticalSpacing="md" horizontalSpacing="lg">
                <Table.Thead bg="#f8fafc">
                  <Table.Tr>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>TASK</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>STATUS</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>DEPT</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>HOURS</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>PROGRESS</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>DUE DATE</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {tasks.map((task) => {
                    const spent = task.spentHours ? Number(task.spentHours.toFixed(1)) : 0;
                    const estimated = task.estimatedHours || 1;
                    const progress = Math.min((spent / estimated) * 100, 100);
                    const isOverdue = task.endDate && new Date(task.endDate) < new Date() && task.status !== 'completed';
                    return (
                      <Table.Tr key={task._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks/${task._id}`)}>
                        <Table.Td>
                          <Text fw={600} size="sm" c="blue">{task.title}</Text>
                          {task.description && (
                            <Text size="xs" c="dimmed" lineClamp={1}>{task.description}</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge color={statusColor(task.status)} variant="light" size="sm">
                            {task.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="outline" color="gray" size="sm">{task.department ? task.department.toUpperCase() : 'N/A'}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} style={{ color: '#0f172a' }}>{spent}h / {estimated}h</Text>
                        </Table.Td>
                        <Table.Td style={{ minWidth: 120 }}>
                          <Progress value={progress} size="sm" radius="xl"
                            color={task.status === 'completed' ? 'green' : 'blue'} />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c={isOverdue ? 'red' : 'inherit'} fw={isOverdue ? 700 : 400}>
                            {task.endDate ? formatDateDisplay(task.endDate) : '—'}
                            {isOverdue && ' ⚠'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Time Logs Tab */}
        <Tabs.Panel value="timelogs">
          <Paper withBorder radius="xl" p="xl" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
            {userTimeLogs.length === 0 ? (
              <Center h={200}>
                <Stack align="center">
                  <Clock size={40} color="#cbd5e1" />
                  <Text c="dimmed">No time logs recorded for this member.</Text>
                </Stack>
              </Center>
            ) : (
              <Stack gap="md">
                {userTimeLogs.map((log) => {
                  const taskTitle = log.task && typeof log.task === 'object' ? (log.task as any).title : 'Unknown Task';
                  const milestoneObj = log.task && typeof log.task === 'object' ? (log.task as any).milestone : null;
                  const projectName = milestoneObj && typeof milestoneObj === 'object' && (milestoneObj as any).project
                    ? ((milestoneObj as any).project && typeof (milestoneObj as any).project === 'object' ? (milestoneObj as any).project.name : '')
                    : '';

                  const isActive = !log.endTime;
                  const durationFormatted = log.durationSeconds
                    ? `${Math.floor(log.durationSeconds / 3600)}h ${Math.floor((log.durationSeconds % 3600) / 60)}m`
                    : 'Active';

                  const startFormatted = new Date(log.startTime).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
                  });

                  const endFormatted = log.endTime
                    ? new Date(log.endTime).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
                    })
                    : 'Currently Working (Active Session)';

                  return (
                    <Paper key={log._id} withBorder radius="md" p="md" bg="#ffffff" style={{ borderColor: isActive ? '#93c5fd' : '#e2e8f0' }}>
                      <Group justify="space-between" mb="xs">
                        <div>
                          <Group gap="xs">
                            <Text fw={700} size="sm" c="blue">{taskTitle}</Text>
                            {projectName && <Badge size="xs" variant="outline" color="gray">{projectName}</Badge>}
                          </Group>
                        </div>
                        <Badge color={isActive ? 'blue' : 'green'} variant="light" size="sm">
                          {isActive ? '● Live Session' : `Duration: ${durationFormatted}`}
                        </Badge>
                      </Group>

                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mt="sm">
                        <Paper p="xs" radius="sm" bg="#f0fdf4" style={{ border: '1px solid #bbf7d0' }}>
                          <Group gap="xs">
                            <LogIn size={14} color="#16a34a" />
                            <div>
                              <Text size="xs" fw={700} c="green">Logged In (Start Time)</Text>
                              <Text size="xs" c="dimmed">{startFormatted}</Text>
                            </div>
                          </Group>
                        </Paper>

                        <Paper p="xs" radius="sm" bg={isActive ? '#eff6ff' : '#fef2f2'} style={{ border: isActive ? '1px solid #bfdbfe' : '1px solid #fecaca' }}>
                          <Group gap="xs">
                            <LogOut size={14} color={isActive ? '#2563eb' : '#dc2626'} />
                            <div>
                              <Text size="xs" fw={700} c={isActive ? 'blue' : 'red'}>Logged Out (End Time)</Text>
                              <Text size="xs" c="dimmed">{endFormatted}</Text>
                            </div>
                          </Group>
                        </Paper>
                      </SimpleGrid>

                      {log.description && (
                        <Text size="xs" mt="xs" p="xs" bg="#f8fafc" style={{ borderRadius: 6, color: '#475569', border: '1px solid #f1f5f9' }}>
                          <strong>Session Note:</strong> {log.description}
                        </Text>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Projects Tab */}
        <Tabs.Panel value="projects">
          <Paper withBorder radius="xl" p={0} style={{ borderColor: '#e8ecf4', overflow: 'hidden', background: '#ffffff' }}>
            {memberProjects.length === 0 ? (
              <Center h={200}>
                <Stack align="center">
                  <Briefcase size={40} color="#cbd5e1" />
                  <Text c="dimmed">Not assigned to any projects.</Text>
                </Stack>
              </Center>
            ) : (
              <Table verticalSpacing="md" horizontalSpacing="lg">
                <Table.Thead bg="#f8fafc">
                  <Table.Tr>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>PROJECT</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>CLIENT</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>STATUS</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>TOTAL AMOUNT</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>TEAM SIZE</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>ACTION</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {memberProjects.map((project) => (
                    <Table.Tr key={project._id}>
                      <Table.Td>
                        <Text fw={600} size="sm">{project.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {typeof project.client === 'object' ? (project.client as any)?.name : 'Inhouse'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={project.status === 'active' ? 'green' : project.status === 'completed' ? 'blue' : 'gray'} variant="light" size="sm">
                          {project.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600}>${(project.totalBudget || 0).toLocaleString()}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" color="gray" size="sm">{project.team?.length || 0} members</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Button size="xs" variant="light" onClick={() => navigate(`/projects/${project._id}`)}>
                          View
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Daily Status Tab Panel */}
        <Tabs.Panel value="daily-status">
          <Paper withBorder radius="xl" p="lg" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
            <Group justify="space-between" align="center" mb="lg">
              <div>
                <Title order={3} style={{ color: '#0f172a', fontWeight: 800 }}>Daily Work Status</Title>
                <Text size="sm" style={{ color: '#64748b' }}>
                  Track daily accomplishments, upcoming goals, and team roadblocks in real-time.
                </Text>
              </div>
              <Button
                leftSection={<Send size={16} />}
                onClick={() => setSubmitModalOpened(true)}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                }}
                size="sm"
                radius="md"
              >
                Submit EOD Report
              </Button>
            </Group>

            {isManagement && (
              <Group mb="lg">
                <Button
                  size="xs"
                  variant={dailyStatusSubTab === 'my' ? 'filled' : 'light'}
                  onClick={() => setDailyStatusSubTab('my')}
                >
                  Member History ({memberDailyLogs.length})
                </Button>
                <Button
                  size="xs"
                  variant={dailyStatusSubTab === 'team' ? 'filled' : 'light'}
                  onClick={() => setDailyStatusSubTab('team')}
                >
                  Team Updates Feed ({teamDailyLogs.length})
                </Button>
              </Group>
            )}

            {dailyStatusSubTab === 'my' ? (
              isMyLogsLoading ? (
                <Center h={200}><Loader color="blue" /></Center>
              ) : memberDailyLogs.length === 0 ? (
                <Paper p="xl" radius="xl" withBorder ta="center" style={{ borderColor: '#e8ecf4', background: '#ffffff', borderStyle: 'dashed' }}>
                  <Paper p="md" radius="full" bg="#eff6ff" style={{ display: 'inline-flex', marginBottom: '12px' }}>
                    <Sparkles size={24} color="#2563eb" />
                  </Paper>
                  <Text fw={700} style={{ color: '#0f172a' }} mb="xs">No Daily Status Reports Logged Yet</Text>
                  <Text size="sm" c="dimmed" style={{ maxWidth: 400, margin: '0 auto' }} mb="lg">
                    Submit end-of-day summary to keep project lead and team updated.
                  </Text>
                  <Button variant="light" color="blue" leftSection={<Send size={16} />} onClick={() => setSubmitModalOpened(true)}>
                    Submit First EOD Report
                  </Button>
                </Paper>
              ) : (
                <Stack gap="lg">
                  {memberDailyLogs.map((log: any) => (
                    <Paper key={log._id} p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
                      <Group justify="space-between" align="center" mb="sm">
                        <Group gap="xs">
                          <Paper p={6} radius="md" bg="#f1f5f9">
                            <Clock size={16} color="#64748b" />
                          </Paper>
                          <Text size="sm" fw={700} style={{ color: '#0f172a' }}>{formatDateDisplay(log.date)}</Text>
                        </Group>
                        {log.project && (
                          <Badge variant="light" color="blue" size="md" radius="sm" leftSection={<Briefcase size={12} />}>
                            {log.project.name}
                          </Badge>
                        )}
                      </Group>
                      <Paper p="md" radius="lg" bg="#f8fafc" style={{ border: '1px solid #f1f5f9' }}>
                        <Group gap="xs" mb={4}>
                          <CheckCircle2 size={16} color="#10b981" />
                          <Text size="xs" fw={700} tt="uppercase" style={{ color: '#059669', letterSpacing: '0.05em' }}>Description</Text>
                        </Group>
                        <Text size="sm" style={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{log.workDone}</Text>
                      </Paper>
                    </Paper>
                  ))}
                </Stack>
              )
            ) : (
              <div>
                <Paper p="md" radius="lg" withBorder mb="lg" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
                  <Group justify="space-between">
                    <TextInput
                      placeholder="Search teammate, project, task..."
                      leftSection={<Search size={16} color="#94a3b8" />}
                      value={dailyStatusSearchQuery}
                      onChange={(e) => setDailyStatusSearchQuery(e.target.value)}
                      style={{ width: 300 }}
                      radius="md"
                    />
                    <Select
                      placeholder="All Projects"
                      value={dailyStatusProjectFilter}
                      onChange={setDailyStatusProjectFilter}
                      data={[{ value: '', label: 'All Projects' }, ...projectOptions]}
                      clearable
                      style={{ width: 220 }}
                      radius="md"
                    />
                  </Group>
                </Paper>

                {isTeamLogsLoading ? (
                  <Center h={200}><Loader color="blue" /></Center>
                ) : filteredTeamLogs.length === 0 ? (
                  <Paper p="xl" radius="xl" withBorder ta="center">
                    <Text color="dimmed" size="sm">No team daily status logs match search criteria.</Text>
                  </Paper>
                ) : (
                  <Stack gap="lg">
                    {filteredTeamLogs.map((log: any) => (
                      <Paper key={log._id} p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
                        <Group justify="space-between" align="center" mb="sm">
                          <Group gap="md">
                            <UserAvatar name={log.user?.name} avatarUrl={log.user?.avatarUrl} size="md" />
                            <div>
                              <Text size="sm" fw={700} style={{ color: '#0f172a' }}>{log.user?.name}</Text>
                              <Text size="xs" style={{ color: '#64748b' }}>{formatDateDisplay(log.date)}</Text>
                            </div>
                          </Group>
                          {log.project && (
                            <Badge variant="light" color="blue" size="md" leftSection={<Briefcase size={12} />}>
                              {log.project.name}
                            </Badge>
                          )}
                        </Group>
                        <Paper p="md" radius="lg" bg="#f8fafc" style={{ border: '1px solid #f1f5f9' }}>
                          <Text size="xs" fw={700} tt="uppercase" style={{ color: '#059669' }}>Description</Text>
                          <Text size="sm" mt={4} style={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{log.workDone}</Text>
                        </Paper>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </div>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Modal: Submit Daily Status EOD Report */}
      <Modal
        opened={submitModalOpened}
        onClose={() => setSubmitModalOpened(false)}
        title={
          <Group gap="xs">
            <Paper p={6} radius="md" bg="#eff6ff">
              <Sparkles size={18} color="#2563eb" />
            </Paper>
            <Title order={4} style={{ color: '#0f172a', fontWeight: 800 }}>
              Submit Daily Status Report
            </Title>
          </Group>
        }
        size="lg"
        radius="xl"
        centered
      >
        <Text size="sm" style={{ color: '#64748b' }} mb="lg">
          Select a project and enter your status description below.
        </Text>

        <form onSubmit={statusForm.onSubmit(handleDailyStatusSubmit)}>
          <Stack gap="md">
            <Select
              label="Select Project (Optional)"
              placeholder="Select a project you worked on today..."
              data={projectOptions}
              clearable
              radius="md"
              {...statusForm.getInputProps('project')}
            />

            <Textarea
              required
              label="Description"
              placeholder="Describe key accomplishments, tasks finished, PRs merged, or bugs resolved today..."
              minRows={5}
              radius="md"
              {...statusForm.getInputProps('workDone')}
              withAsterisk
            />

            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={() => setSubmitModalOpened(false)} radius="md">
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<Send size={16} />}
                loading={isSubmittingStatus}
                size="md"
                radius="md"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                }}
              >
                Submit Status Report
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
};
