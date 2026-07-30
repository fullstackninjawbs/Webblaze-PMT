import React from 'react';
import { Container, Title, Text, Card, Group, SimpleGrid, Badge, Progress, RingProgress, Table, Paper, Stack, Loader, Center, Box } from '@mantine/core';
import { TrendingUp, DollarSign, Clock, CheckCircle2, Briefcase, Users, PieChart } from 'lucide-react';
import { useGetProjectsQuery } from '../projects/project.slice';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useGetAllTasksQuery } from '../tasks/task.slice';
import { useGetTeamTimeLogsQuery } from '../timelogs/timeLog.slice';
import { useGetUsersQuery } from '../users/user.slice';

export const ReportsPage: React.FC = () => {

  // Queries
  const { data: projectsData, isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: tasksData, isLoading: tasksLoading } = useGetAllTasksQuery();
  const { data: timeLogsData, isLoading: logsLoading } = useGetTeamTimeLogsQuery();
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery();

  const projects = projectsData?.data || [];
  const tasks = tasksData?.data || [];
  const logs = timeLogsData?.data || [];
  const users = usersData?.data || [];

  const isLoading = projectsLoading || tasksLoading || logsLoading || usersLoading;

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" color="blue" />
      </Center>
    );
  }

  // 1. Financial aggregates
  const totalBudget = projects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
  const totalReceived = projects.reduce((sum, p) => sum + (p.receivedAmount || 0), 0);

  // 2. Task Completion Rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 3. Logged Hours Aggregate
  const totalSeconds = logs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0);
  const totalHoursLogged = Math.round((totalSeconds / 3600) * 10) / 10;

  // 4. Team Workload (Hours per user)
  const userHours = users.map((u) => {
    const userLogs = logs.filter((log) => {
      const logUserId = typeof log.user === 'object' ? log.user?._id : log.user;
      return logUserId === u._id;
    });
    const loggedSeconds = userLogs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0);
    const loggedHours = Math.round((loggedSeconds / 3600) * 10) / 10;
    return {
      _id: u._id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      role: u.role,
      department: u.department,
      hours: loggedHours,
    };
  }).sort((a, b) => b.hours - a.hours);

  // 5. Department Hour Distribution
  const depts = ['design', 'development', 'seo'] as const;
  const deptMetrics = depts.map((dept) => {
    const deptTasks = tasks.filter((t) => t.department === dept);
    const estimated = deptTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const spent = deptTasks.reduce((sum, t) => sum + (t.spentHours || 0), 0);
    return {
      dept,
      estimated,
      spent,
    };
  });

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* Header Bar */}
      <div style={{ marginBottom: '28px' }}>
        <Title
          order={2}
          style={{
            color: '#0f172a',
            fontSize: '1.625rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.25,
          }}
        >
          Reports & Analytics Workspace
        </Title>
        <Text
          size="sm"
          mt={4}
          style={{ color: '#64748b', letterSpacing: '-0.01em' }}
        >
          Consolidated performance metrics, team velocity, and project financial analytics.
        </Text>
      </div>

      {/* Top 4 KPI Summary Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
        {/* Total Budget */}
        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{
            borderColor: '#e8ecf4',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            background: '#ffffff',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Portfolio Budget
            </Text>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#f0f5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <DollarSign size={20} color="#3b82f6" />
            </div>
          </Group>
          <Text fw={800} style={{ fontSize: '1.625rem', color: '#0f172a', letterSpacing: '-0.03em' }}>
            ${totalBudget.toLocaleString()}
          </Text>
          <Text size="xs" mt={4} style={{ color: '#64748b' }}>
            Across {projects.length} active engagements
          </Text>
        </Paper>

        {/* Total Received */}
        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{
            borderColor: '#e8ecf4',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            background: '#ffffff',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Invoiced & Collected
            </Text>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={20} color="#10b981" />
            </div>
          </Group>
          <Text fw={800} style={{ fontSize: '1.625rem', color: '#059669', letterSpacing: '-0.03em' }}>
            ${totalReceived.toLocaleString()}
          </Text>
          <Group gap="xs" mt={6}>
            <Progress value={totalBudget > 0 ? (totalReceived / totalBudget) * 100 : 0} color="teal" size="xs" style={{ flex: 1 }} radius="xl" />
            <Text size="xs" fw={700} style={{ color: '#059669' }}>
              {totalBudget > 0 ? Math.round((totalReceived / totalBudget) * 100) : 0}%
            </Text>
          </Group>
        </Paper>

        {/* Logged Hours */}
        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{
            borderColor: '#e8ecf4',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            background: '#ffffff',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Tracked Hours
            </Text>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={20} color="#f59e0b" />
            </div>
          </Group>
          <Text fw={800} style={{ fontSize: '1.625rem', color: '#d97706', letterSpacing: '-0.03em' }}>
            {totalHoursLogged} Hrs
          </Text>
          <Text size="xs" mt={4} style={{ color: '#64748b' }}>
            Logged via automatic live task timers
          </Text>
        </Paper>

        {/* Task Completion Rate */}
        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{
            borderColor: '#e8ecf4',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            background: '#ffffff',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Task Completion
            </Text>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#f0f5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle2 size={20} color="#3b82f6" />
            </div>
          </Group>
          <Text fw={800} style={{ fontSize: '1.625rem', color: '#2563eb', letterSpacing: '-0.03em' }}>
            {taskCompletionRate}%
          </Text>
          <Text size="xs" mt={4} style={{ color: '#64748b' }}>
            {completedTasks} of {totalTasks} tasks completed
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Main Graphs Grid */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl" mb="xl">
        {/* Project Financial Stacked Breakdown */}
        <Card
          p="xl"
          radius="xl"
          withBorder
          style={{
            borderColor: '#e8ecf4',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            background: '#ffffff',
          }}
        >
          <Group justify="space-between" mb="lg">
            <Group gap="xs">
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: '#f0f5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Briefcase size={18} color="#3b82f6" />
              </div>
              <Title order={4} style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                Financial Breakdown by Project
              </Title>
            </Group>
            <Badge variant="light" color="blue" radius="md">Budget Progress</Badge>
          </Group>

          <Stack gap="lg">
            {projects.map((proj) => {
              const budget = proj.totalBudget || 0;
              const received = proj.receivedAmount || 0;
              const pending = Math.max(budget - received, 0);
              const paidPercent = budget > 0 ? (received / budget) * 100 : 0;
              const pendingPercent = budget > 0 ? (pending / budget) * 100 : 0;

              return (
                <Box key={proj._id}>
                  <Group justify="space-between" mb={8}>
                    <Text size="sm" fw={700} style={{ color: '#0f172a' }}>{proj.name}</Text>
                    <Text size="xs" fw={700} style={{ color: '#64748b' }}>
                      Budget: ${budget.toLocaleString()}
                    </Text>
                  </Group>
                  <Progress.Root size="md" radius="xl" style={{ backgroundColor: '#f1f5f9' }}>
                    <Progress.Section value={paidPercent} color="#10b981" />
                    <Progress.Section value={pendingPercent} color="#6366f1" />
                  </Progress.Root>
                  <Group justify="space-between" mt={8}>
                    <Group gap={6}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <Text size="xs" fw={600} style={{ color: '#059669' }}>
                        Paid: ${received.toLocaleString()} ({Math.round(paidPercent)}%)
                      </Text>
                    </Group>
                    <Group gap={6}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366f1' }} />
                      <Text size="xs" fw={600} style={{ color: '#4f46e5' }}>
                        Pending: ${pending.toLocaleString()} ({Math.round(pendingPercent)}%)
                      </Text>
                    </Group>
                  </Group>
                </Box>
              );
            })}
            {projects.length === 0 && (
              <Text size="sm" color="dimmed" ta="center" py="lg">No project data available.</Text>
            )}
          </Stack>
        </Card>

        {/* Task Completion Rate Wheel & Department metrics */}
        <Card
          p="xl"
          radius="xl"
          withBorder
          style={{
            borderColor: '#e8ecf4',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            background: '#ffffff',
          }}
        >
          <Group justify="space-between" mb="lg">
            <Group gap="xs">
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: '#f0f5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <PieChart size={18} color="#2563eb" />
              </div>
              <Title order={4} style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                Department Distribution & Velocity
              </Title>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {/* Completion ring wheel */}
            <Paper withBorder p="lg" radius="lg" ta="center" style={{ borderColor: '#e8ecf4', background: '#f8faff' }}>
              <Text size="xs" fw={700} style={{ color: '#64748b', letterSpacing: '0.05em' }} mb="md" tt="uppercase">
                Overall Work Velocity
              </Text>
              <Center>
                <RingProgress
                  size={140}
                  roundCaps
                  thickness={12}
                  sections={[{ value: taskCompletionRate, color: '#3b82f6' }]}
                  label={
                    <Text ta="center" fw={800} style={{ fontSize: '1.5rem', color: '#0f172a' }}>
                      {taskCompletionRate}%
                    </Text>
                  }
                />
              </Center>
              <Text size="xs" style={{ color: '#64748b' }} mt="md">
                Tasks completed successfully across all departments
              </Text>
            </Paper>

            {/* Department progress cards */}
            <Stack gap="sm">
              {deptMetrics.map((dm) => (
                <Paper key={dm.dept} withBorder p="md" radius="md" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
                  <Group justify="space-between" mb={6}>
                    <Badge variant="light" color={dm.dept === 'design' ? 'indigo' : dm.dept === 'seo' ? 'cyan' : 'blue'} radius="sm">
                      {dm.dept.toUpperCase()}
                    </Badge>
                    <Text size="xs" fw={600} style={{ color: '#64748b' }}>
                      Spent: {dm.spent}h / Est: {dm.estimated}h
                    </Text>
                  </Group>
                  <Progress 
                    value={dm.estimated > 0 ? Math.min((dm.spent / dm.estimated) * 100, 100) : 0} 
                    color={dm.dept === 'design' ? 'indigo' : dm.dept === 'seo' ? 'cyan' : 'blue'}
                    size="sm" 
                    radius="xl" 
                  />
                </Paper>
              ))}
            </Stack>
          </SimpleGrid>
        </Card>
      </SimpleGrid>

      {/* Team Hours Logged Leaderboard */}
      <Card
        p="xl"
        radius="xl"
        withBorder
        style={{
          borderColor: '#e8ecf4',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          background: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <Group justify="space-between" mb="lg">
          <Group gap="xs">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: '#f0f5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={18} color="#3b82f6" />
            </div>
            <Title order={4} style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
              Team Hours & Workload Leaderboard
            </Title>
          </Group>
          <Badge variant="light" color="blue" radius="md">Tracked Contribution</Badge>
        </Group>

        <Table verticalSpacing="md" horizontalSpacing="lg">
          <Table.Thead style={{ backgroundColor: '#f8faff' }}>
            <Table.Tr>
              <Table.Th>Member</Table.Th>
              <Table.Th>Role / Department</Table.Th>
              <Table.Th>Hours Tracked</Table.Th>
              <Table.Th style={{ width: '260px' }}>Workload Distribution</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {userHours.map((u) => (
              <Table.Tr key={u._id}>
                <Table.Td>
                  <Group gap="xs">
                    <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                    <Text size="sm" fw={600} style={{ color: '#0f172a' }}>{u.name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={6}>
                    <Text size="xs" fw={600} style={{ color: '#64748b' }}>{u.role.replace('_', ' ')}</Text>
                    {u.department && (
                      <Badge size="xs" variant="outline" color="blue" radius="sm">
                        {u.department}
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td fw={700} style={{ color: '#0f172a' }}>{u.hours} hrs</Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Progress
                      value={Math.min((u.hours / 40) * 100, 100)}
                      color={u.hours > 40 ? 'red' : u.hours > 20 ? 'blue' : 'gray'}
                      size="xs"
                      style={{ flex: 1 }}
                      radius="xl"
                    />
                    <Badge size="xs" variant="light" color={u.hours > 40 ? 'red' : u.hours > 20 ? 'blue' : 'gray'} radius="sm">
                      {u.hours > 40 ? 'Overload' : u.hours > 20 ? 'Optimal' : 'Light'}
                    </Badge>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {userHours.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} ta="center" py="xl">
                  <Text color="dimmed">No team member logs available.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Container>
  );
};

export default ReportsPage;
