import React from 'react';
import { Container, Title, Text, Card, Group, SimpleGrid, Badge, Progress, RingProgress, Table, Avatar, Paper, Stack, Loader, Center } from '@mantine/core';
import { TrendingUp, DollarSign, Clock, CheckCircle, Briefcase, Users, PieChart } from 'lucide-react';
import { useGetProjectsQuery } from '../projects/project.slice';
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
    <Container size="xl" py="xl" style={{ animation: 'fade-in 0.4s ease-out' }}>
      <div style={{ marginBottom: '30px' }}>
        <Title order={2} style={{ color: '#111827', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          Reports & Analytics
        </Title>
        <Text color="dimmed" size="sm">Consolidated workspace performance and financial highlights.</Text>
      </div>

      {/* KPI Section */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
        {/* Total Budget */}
        <Card shadow="sm" p="lg" radius="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} color="dimmed" tt="uppercase">Total Budget</Text>
            <DollarSign size={20} color="#3b82f6" />
          </Group>
          <Text size="xl" fw={800}>${totalBudget.toLocaleString()}</Text>
          <Text size="xs" c="dimmed" mt={4}>Across {projects.length} active engagements</Text>
        </Card>

        {/* Total Received */}
        <Card shadow="sm" p="lg" radius="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} color="dimmed" tt="uppercase">Invoiced & Paid</Text>
            <TrendingUp size={20} color="#10b981" />
          </Group>
          <Text size="xl" fw={800} color="green">${totalReceived.toLocaleString()}</Text>
          <Group gap="xs" mt={4}>
            <Progress value={totalBudget > 0 ? (totalReceived / totalBudget) * 100 : 0} color="green" size="xs" style={{ flex: 1 }} />
            <Text size="xs" fw={600} color="green">{totalBudget > 0 ? Math.round((totalReceived / totalBudget) * 100) : 0}%</Text>
          </Group>
        </Card>

        {/* Logged Hours */}
        <Card shadow="sm" p="lg" radius="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} color="dimmed" tt="uppercase">Logged Hours</Text>
            <Clock size={20} color="#f59e0b" />
          </Group>
          <Text size="xl" fw={800}>{totalHoursLogged} Hrs</Text>
          <Text size="xs" c="dimmed" mt={4}>Tracked via automatic timers</Text>
        </Card>

        {/* Task Completion */}
        <Card shadow="sm" p="lg" radius="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} color="dimmed" tt="uppercase">Task Completion</Text>
            <CheckCircle size={20} color="#3b82f6" />
          </Group>
          <Text size="xl" fw={800}>{taskCompletionRate}%</Text>
          <Text size="xs" c="dimmed" mt={4}>{completedTasks} of {totalTasks} tasks completed</Text>
        </Card>
      </SimpleGrid>

      {/* Main Graphs Grid */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl" mb="xl">
        {/* Project Financial Stacked Breakdown */}
        <Card shadow="sm" p="xl" radius="lg" withBorder>
          <Group gap="xs" mb="lg">
            <Briefcase size={20} color="#3b82f6" />
            <Title order={4}>Financial Breakdown by Project</Title>
          </Group>
          <Stack gap="lg">
            {projects.map((proj) => {
              const budget = proj.totalBudget || 0;
              const received = proj.receivedAmount || 0;
              const pending = Math.max(budget - received, 0);
              const paidPercent = budget > 0 ? (received / budget) * 100 : 0;
              const pendingPercent = budget > 0 ? (pending / budget) * 100 : 0;

              return (
                <div key={proj._id}>
                  <Group justify="space-between" mb={8}>
                    <Text size="sm" fw={700} style={{ color: '#1f2937' }}>{proj.name}</Text>
                    <Badge variant="outline" color="gray" size="sm">Budget: ${budget.toLocaleString()}</Badge>
                  </Group>
                  <Progress.Root size="lg" radius="xl" style={{ backgroundColor: '#f1f5f9' }}>
                    <Progress.Section value={paidPercent} color="teal" />
                    <Progress.Section value={pendingPercent} color="orange" />
                  </Progress.Root>
                  <Group justify="space-between" mt={6}>
                    <Group gap="xs">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0ca678' }} />
                      <Text size="xs" color="dimmed" fw={500}>Paid: ${received.toLocaleString()} ({Math.round(paidPercent)}%)</Text>
                    </Group>
                    <Group gap="xs">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f76707' }} />
                      <Text size="xs" color="dimmed" fw={500}>Pending: ${pending.toLocaleString()} ({Math.round(pendingPercent)}%)</Text>
                    </Group>
                  </Group>
                </div>
              );
            })}
          </Stack>
        </Card>

        {/* Task Completion Rate Wheel & Department metrics */}
        <Card shadow="sm" p="xl" radius="lg" withBorder>
          <Group gap="xs" mb="lg">
            <PieChart size={20} color="#2563eb" />
            <Title order={4}>Department Hour Distributions</Title>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {/* Completion circle */}
            <Paper withBorder p="md" radius="md" ta="center">
              <Text size="sm" fw={700} color="dimmed" mb="md" tt="uppercase">Overall Progress</Text>
              <Center>
                <RingProgress
                  size={140}
                  roundCaps
                  thickness={12}
                  sections={[{ value: taskCompletionRate, color: 'blue' }]}
                  label={
                    <Text ta="center" fw={700} size="xl">
                      {taskCompletionRate}%
                    </Text>
                  }
                />
              </Center>
              <Text size="xs" color="dimmed" mt="xs">Tasks completed successfully</Text>
            </Paper>

            {/* Department bar chart cards */}
            <Stack gap="xs">
              {deptMetrics.map((dm) => (
                <Paper key={dm.dept} withBorder p="xs" radius="md">
                  <Group justify="space-between" mb={4}>
                    <Badge variant="light" color={dm.dept === 'design' ? 'pink' : dm.dept === 'seo' ? 'green' : 'blue'}>
                      {dm.dept.toUpperCase()}
                    </Badge>
                    <Text size="xs" color="dimmed">Spent: {dm.spent}h / Est: {dm.estimated}h</Text>
                  </Group>
                  <Progress 
                    value={dm.estimated > 0 ? Math.min((dm.spent / dm.estimated) * 100, 100) : 0} 
                    color={dm.dept === 'design' ? 'pink' : dm.dept === 'seo' ? 'green' : 'blue'}
                    size="sm" 
                    radius="xl" 
                  />
                </Paper>
              ))}
            </Stack>
          </SimpleGrid>
        </Card>
      </SimpleGrid>

      {/* Team Hours Logged Ranking Panel */}
      <Card shadow="sm" p="xl" radius="lg" withBorder>
        <Group gap="xs" mb="lg">
          <Users size={20} color="#3b82f6" />
          <Title order={4}>Team Hours Contributed</Title>
        </Group>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Member</Table.Th>
              <Table.Th>Role / Department</Table.Th>
              <Table.Th>Hours Tracked</Table.Th>
              <Table.Th>Workload Indicator</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {userHours.map((u) => (
              <Table.Tr key={u._id}>
                <Table.Td>
                  <Group gap="xs">
                    <Avatar src={u.avatarUrl} size="sm" color="blue">{u.name.charAt(0)}</Avatar>
                    <Text size="sm" fw={600}>{u.name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{u.role.replace('_', ' ')}</Text>
                  {u.department && <Badge size="xs" variant="outline" color="gray">{u.department}</Badge>}
                </Table.Td>
                <Table.Td fw={700}>{u.hours} hrs</Table.Td>
                <Table.Td style={{ width: '250px' }}>
                  <Group gap="xs" wrap="nowrap">
                    <Progress value={Math.min((u.hours / 40) * 100, 100)} color={u.hours > 40 ? 'red' : u.hours > 20 ? 'blue' : 'gray'} size="xs" style={{ flex: 1 }} />
                    <Badge size="xs" color={u.hours > 40 ? 'red' : u.hours > 20 ? 'blue' : 'gray'}>
                      {u.hours > 40 ? 'Overload' : u.hours > 20 ? 'Optimal' : 'Light'}
                    </Badge>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Container>
  );
};

export default ReportsPage;
