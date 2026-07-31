import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Text, Group, Badge, Stack, SimpleGrid,
  Tabs, Table, Progress, Loader, Center, Button, Paper,
  RingProgress,
} from '@mantine/core';
import {
  ArrowLeft, Mail, CheckCircle2, Clock, Briefcase, CheckSquare,
  Activity, AlertCircle, LogIn, LogOut,
} from 'lucide-react';
import { useGetUserByIdQuery } from './user.slice';
import { useGetTasksByUserQuery } from '../tasks/task.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetTeamTimeLogsQuery } from '../timelogs/timeLog.slice';
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
      <Group justify="space-between" mb="xs" align="flex-start">
        <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
          {label}
        </Text>
        <Paper p={8} radius="md" bg={theme.bg}>
          <Icon size={18} color={theme.iconColor} />
        </Paper>
      </Group>
      <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
        {value}
      </Text>
      {sub && <Text size="xs" style={{ color: '#94a3b8' }} mt={6}>{sub}</Text>}
    </Paper>
  );
};

export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: userData, isLoading: isUserLoading } = useGetUserByIdQuery(id!);
  const { data: tasksData, isLoading: isTasksLoading } = useGetTasksByUserQuery(id!, { skip: !id });
  const { data: projectsData } = useGetProjectsQuery();
  const { data: timeLogsData } = useGetTeamTimeLogsQuery();

  const member = userData?.data;
  const tasks = tasksData?.data || [];
  const allProjects = projectsData?.data || [];
  const timeLogs = timeLogsData?.data || [];

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
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
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
      {/* Back Button */}
      <Button
        variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />}
        onClick={() => navigate('/team')} mb="lg" style={{ paddingLeft: 0 }}
      >
        Back to Team
      </Button>

      {/* Header Card */}
      <Paper withBorder radius="xl" p="xl" mb="xl"
        style={{ background: '#ffffff', borderColor: '#e8ecf4', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <Group align="center" gap="xl">
          <UserAvatar name={member.name} avatarUrl={member.avatarUrl} size={76} />
          <div style={{ flex: 1 }}>
            <Group gap="sm" mb={6} align="center">
              <Title order={2} style={{ color: '#0f172a', fontWeight: 800 }}>{member.name}</Title>
              <Badge variant="filled" color={roleColor(member.role)} size="md" radius="sm">
                {member.role?.replace('_', ' ').toUpperCase()}
              </Badge>
              {member.department && (
                <Badge variant="light" color="blue" size="md" radius="sm">{member.department.toUpperCase()}</Badge>
              )}
            </Group>
            <Group gap="xl" wrap="wrap">
              <Group gap="xs">
                <Mail size={15} color="#64748b" />
                <Text size="sm" style={{ color: '#64748b' }}>{member.email}</Text>
              </Group>
              <Group gap="xs">
                <Activity size={15} color="#64748b" />
                <Text size="sm" style={{ color: '#64748b' }}>{tasks.length} tasks assigned</Text>
              </Group>
              <Group gap="xs">
                <Briefcase size={15} color="#64748b" />
                <Text size="sm" style={{ color: '#64748b' }}>{memberProjects.length} active projects</Text>
              </Group>
            </Group>
          </div>

          {/* Completion Ring */}
          <Stack align="center" gap={4}>
            <RingProgress
              size={84}
              thickness={7}
              roundCaps
              sections={[{ value: completionRate, color: completionRate >= 80 ? 'green' : completionRate >= 50 ? 'blue' : 'orange' }]}
              label={<Text ta="center" fw={800} size="sm" style={{ color: '#0f172a' }}>{completionRate}%</Text>}
            />
            <Text size="xs" fw={700} style={{ color: '#64748b', letterSpacing: '0.02em' }}>Completion Rate</Text>
          </Stack>
        </Group>
      </Paper>

      {/* Stats Row */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="xl">
        <StatCard label="Tasks Assigned" value={tasks.length} sub="total tasks" icon={CheckSquare} color="blue" />
        <StatCard label="Tasks Completed" value={completedTasks} sub={`${tasks.length - completedTasks} remaining`} icon={CheckCircle2} color="green" />
        <StatCard label="Hours Logged" value={`${totalLoggedHours}h`} sub="total tracked time" icon={Clock} color="violet" />
        <StatCard label="Projects" value={memberProjects.length} sub="member of" icon={Briefcase} color="orange" />
      </SimpleGrid>

      {/* Tabs */}
      <Tabs defaultValue="tasks" radius="md">
        <Tabs.List mb="lg">
          <Tabs.Tab value="tasks" leftSection={<CheckSquare size={16} />}>
            Tasks <Badge variant="light" size="xs" ml={4}>{tasks.length}</Badge>
          </Tabs.Tab>
          <Tabs.Tab value="timelogs" leftSection={<Clock size={16} />}>
            Time Logs <Badge variant="light" size="xs" ml={4}>{userTimeLogs.length}</Badge>
          </Tabs.Tab>
          <Tabs.Tab value="projects" leftSection={<Briefcase size={16} />}>
            Projects <Badge variant="light" size="xs" ml={4}>{memberProjects.length}</Badge>
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
                  const taskTitle = typeof log.task === 'object' ? (log.task as any).title : 'Unknown Task';
                  const milestoneObj = typeof log.task === 'object' ? (log.task as any).milestone : null;
                  const projectName = milestoneObj && typeof milestoneObj === 'object' && (milestoneObj as any).project
                    ? (typeof (milestoneObj as any).project === 'object' ? (milestoneObj as any).project.name : '')
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
      </Tabs>
    </Container>
  );
};
