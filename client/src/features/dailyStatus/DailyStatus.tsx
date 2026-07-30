import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';
import { useForm } from '@mantine/form';
import {
  Container,
  Title,
  Text,
  Group,
  Tabs,
  Textarea,
  Button,
  Select,
  Stack,
  Loader,
  Center,
  Avatar,
  Badge,
  Paper,
  SimpleGrid,
  TextInput,
} from '@mantine/core';
import {
  ClipboardList,
  Calendar,
  Users,
  Send,
  AlertTriangle,
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useGetProjectsQuery } from '../projects/project.slice';
import {
  useGetMyDailyStatusesQuery,
  useGetTeamDailyStatusesQuery,
  useSubmitDailyStatusMutation,
} from './dailyStatus.slice';

export const DailyStatus: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<string | null>('my-status');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  const isManagement =
    user?.role === Role.ADMIN ||
    user?.role === Role.PM ||
    user?.role === Role.TEAM_LEAD;

  // API Queries & Mutations
  const { data: projectsData } = useGetProjectsQuery();
  const { data: myLogsData, isLoading: isMyLogsLoading } = useGetMyDailyStatusesQuery();
  const { data: teamLogsData, isLoading: isTeamLogsLoading } = useGetTeamDailyStatusesQuery(
    undefined,
    { skip: !isManagement }
  );
  const [submitDailyStatus, { isLoading: isSubmitting }] = useSubmitDailyStatusMutation();

  const projects = projectsData?.data || [];
  const myLogs = myLogsData?.data || [];
  const teamLogs = teamLogsData?.data || [];

  // Project options for dropdowns
  const projectOptions = projects.map((p) => ({ value: p._id, label: p.name }));

  // Form setup
  const form = useForm({
    initialValues: {
      project: '',
      workDone: '',
      plannedWork: '',
      blockers: '',
    },
    validate: {
      workDone: (value) =>
        value.trim().length === 0 ? 'Please describe the work done today' : null,
      plannedWork: (value) =>
        value.trim().length === 0 ? 'Please describe what you plan to work on next' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await submitDailyStatus({
        project: values.project || undefined,
        workDone: values.workDone,
        plannedWork: values.plannedWork,
        blockers: values.blockers || undefined,
      }).unwrap();

      form.reset();
      setActiveTab('my-status');
    } catch (err) {
      console.error('Failed to submit status:', err);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case Role.ADMIN:
        return 'red';
      case Role.PM:
        return 'indigo';
      case Role.TEAM_LEAD:
        return 'teal';
      default:
        return 'blue';
    }
  };

  // Filtered Team Logs
  const filteredTeamLogs = useMemo(() => {
    return teamLogs.filter((log) => {
      const userName = log.user?.name || '';
      const projectName = log.project?.name || '';
      const matchesQuery =
        userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.workDone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projectName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = !projectFilter || log.project?._id === projectFilter;
      return matchesQuery && matchesProject;
    });
  }, [teamLogs, searchQuery, projectFilter]);

  // Total Blockers Count across Team
  const totalBlockers = useMemo(() => {
    return teamLogs.filter((log) => log.blockers && log.blockers.trim().length > 0).length;
  }, [teamLogs]);

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* Header Banner */}
      <Group justify="space-between" align="center" mb="xl">
        <div>
          <Title
            order={1}
            style={{
              color: '#0f172a',
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            Daily Work Status
          </Title>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            Track daily accomplishments, upcoming goals, and team roadblocks in real-time.
          </Text>
        </div>

        <Button
          leftSection={<Send size={16} />}
          onClick={() => setActiveTab('new-status')}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
          }}
          size="md"
          radius="md"
        >
          Submit Check-in
        </Button>
      </Group>

      {/* KPI Metric Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="xl">
        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{ borderColor: '#e8ecf4', background: '#ffffff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              My Submissions
            </Text>
            <Paper p={8} radius="md" bg="#eff6ff">
              <Calendar size={18} color="#2563eb" />
            </Paper>
          </Group>
          <Group align="flex-end" gap="xs">
            <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
              {myLogs.length}
            </Text>
            <Text size="xs" style={{ color: '#64748b' }} mb={2}>
              Total logs submitted
            </Text>
          </Group>
        </Paper>

        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{ borderColor: '#e8ecf4', background: '#ffffff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Team Activity Today
            </Text>
            <Paper p={8} radius="md" bg="#f0fdf4">
              <Users size={18} color="#10b981" />
            </Paper>
          </Group>
          <Group align="flex-end" gap="xs">
            <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
              {teamLogs.length}
            </Text>
            <Text size="xs" style={{ color: '#64748b' }} mb={2}>
              Team check-ins
            </Text>
          </Group>
        </Paper>

        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{ borderColor: '#e8ecf4', background: '#ffffff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Reported Blockers
            </Text>
            <Paper p={8} radius="md" bg="#fffbeb">
              <AlertTriangle size={18} color="#f59e0b" />
            </Paper>
          </Group>
          <Group align="flex-end" gap="xs">
            <Text fw={800} style={{ fontSize: '1.75rem', color: totalBlockers > 0 ? '#d97706' : '#0f172a', lineHeight: 1 }}>
              {totalBlockers}
            </Text>
            <Text size="xs" style={{ color: '#64748b' }} mb={2}>
              Require attention
            </Text>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onChange={setActiveTab} radius="lg">
        <Tabs.List style={{ borderBottom: '1px solid #e8ecf4' }} mb="xl">
          <Tabs.Tab value="my-status" leftSection={<Calendar size={16} />}>
            My Status History
          </Tabs.Tab>
          <Tabs.Tab value="new-status" leftSection={<ClipboardList size={16} />}>
            Submit Daily Check-in
          </Tabs.Tab>
          {isManagement && (
            <Tabs.Tab value="team-status" leftSection={<Users size={16} />}>
              Team Updates Feed ({teamLogs.length})
            </Tabs.Tab>
          )}
        </Tabs.List>

        {/* Tab 1: Personal Status Logs */}
        <Tabs.Panel value="my-status">
          {isMyLogsLoading ? (
            <Center h={240}>
              <Loader color="blue" />
            </Center>
          ) : myLogs.length === 0 ? (
            <Paper
              p="xl"
              radius="xl"
              withBorder
              ta="center"
              style={{
                borderColor: '#e8ecf4',
                background: '#ffffff',
                borderStyle: 'dashed',
                borderWidth: '2px',
              }}
            >
              <Paper
                p="md"
                radius="full"
                bg="#eff6ff"
                style={{ display: 'inline-flex', marginBottom: '16px' }}
              >
                <Sparkles size={28} color="#2563eb" />
              </Paper>
              <Title order={3} style={{ color: '#0f172a' }} mb="xs">
                No Daily Statuses Logged Yet
              </Title>
              <Text size="sm" style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto' }} mb="lg">
                Submit your first daily work log to keep your team informed on your progress and goals.
              </Text>
              <Button
                variant="light"
                color="blue"
                leftSection={<Send size={16} />}
                onClick={() => setActiveTab('new-status')}
                radius="md"
                fw={600}
              >
                Submit Your First Check-in
              </Button>
            </Paper>
          ) : (
            <Stack gap="lg">
              {myLogs.map((log) => (
                <Paper
                  key={log._id}
                  p="xl"
                  radius="xl"
                  withBorder
                  style={{
                    borderColor: '#e8ecf4',
                    background: '#ffffff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  }}
                >
                  <Group justify="space-between" align="center" mb="lg">
                    <Group gap="xs">
                      <Paper p={6} radius="md" bg="#f1f5f9">
                        <Clock size={16} color="#64748b" />
                      </Paper>
                      <Text size="sm" fw={700} style={{ color: '#0f172a' }}>
                        {new Date(log.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </Group>
                    {log.project && (
                      <Badge
                        variant="light"
                        color="blue"
                        size="md"
                        radius="sm"
                        leftSection={<Briefcase size={12} />}
                      >
                        {log.project.name}
                      </Badge>
                    )}
                  </Group>

                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    <Paper p="md" radius="lg" bg="#f8fafc" style={{ border: '1px solid #f1f5f9' }}>
                      <Group gap="xs" mb={6}>
                        <CheckCircle2 size={16} color="#10b981" />
                        <Text size="xs" fw={700} tt="uppercase" style={{ color: '#059669', letterSpacing: '0.05em' }}>
                          Work Completed Today
                        </Text>
                      </Group>
                      <Text size="sm" style={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {log.workDone}
                      </Text>
                    </Paper>

                    <Paper p="md" radius="lg" bg="#f8fafc" style={{ border: '1px solid #f1f5f9' }}>
                      <Group gap="xs" mb={6}>
                        <Clock size={16} color="#3b82f6" />
                        <Text size="xs" fw={700} tt="uppercase" style={{ color: '#2563eb', letterSpacing: '0.05em' }}>
                          Planned for Next Session
                        </Text>
                      </Group>
                      <Text size="sm" style={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {log.plannedWork}
                      </Text>
                    </Paper>
                  </SimpleGrid>

                  {log.blockers && (
                    <Paper
                      p="md"
                      radius="lg"
                      bg="#fffbeb"
                      mt="md"
                      style={{ border: '1px solid #fde68a' }}
                    >
                      <Group gap="xs" mb={4}>
                        <AlertTriangle size={16} color="#d97706" />
                        <Text size="xs" fw={700} tt="uppercase" style={{ color: '#b45309', letterSpacing: '0.05em' }}>
                          Roadblocks & Impediments
                        </Text>
                      </Group>
                      <Text size="sm" style={{ color: '#92400e', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {log.blockers}
                      </Text>
                    </Paper>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        {/* Tab 2: Submit Daily Status */}
        <Tabs.Panel value="new-status">
          <Paper
            p="xl"
            radius="xl"
            withBorder
            style={{
              maxWidth: '720px',
              margin: '0 auto',
              borderColor: '#e8ecf4',
              background: '#ffffff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <Title order={3} style={{ color: '#0f172a' }} mb="xs">
              Submit Daily Check-in
            </Title>
            <Text size="sm" style={{ color: '#64748b' }} mb="xl">
              Fill out your daily work status update for your project lead and teammates.
            </Text>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="lg">
                <Select
                  label="Associated Project (Optional)"
                  placeholder="Select a project you worked on..."
                  data={projectOptions}
                  clearable
                  radius="md"
                  {...form.getInputProps('project')}
                />

                <Textarea
                  required
                  label="Work Completed Today"
                  placeholder="Describe key achievements, tasks finished, PRs created, or bugs resolved..."
                  minRows={4}
                  radius="md"
                  {...form.getInputProps('workDone')}
                  withAsterisk
                />

                <Textarea
                  required
                  label="Planned Work for Tomorrow / Next Session"
                  placeholder="Detail your goals for the upcoming session..."
                  minRows={3}
                  radius="md"
                  {...form.getInputProps('plannedWork')}
                  withAsterisk
                />

                <Textarea
                  label="Blockers or Obstacles (Optional)"
                  placeholder="List any impediments, pending approvals, or dependencies..."
                  minRows={2}
                  radius="md"
                  {...form.getInputProps('blockers')}
                />

                <Group justify="flex-end" mt="md">
                  <Button
                    type="submit"
                    leftSection={<Send size={16} />}
                    loading={isSubmitting}
                    size="md"
                    radius="md"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                      fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                    }}
                  >
                    Submit Check-in
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </Tabs.Panel>

        {/* Tab 3: Team Updates Feed */}
        {isManagement && (
          <Tabs.Panel value="team-status">
            {/* Search and Filter Bar */}
            <Paper p="md" radius="lg" withBorder mb="lg" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
              <Group justify="space-between">
                <TextInput
                  placeholder="Search teammate name, project, or task..."
                  leftSection={<Search size={16} color="#94a3b8" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 320 }}
                  radius="md"
                />
                <Group gap="sm">
                  <Filter size={16} color="#64748b" />
                  <Select
                    placeholder="All Projects"
                    value={projectFilter}
                    onChange={setProjectFilter}
                    data={[{ value: '', label: 'All Projects' }, ...projectOptions]}
                    clearable
                    style={{ width: 220 }}
                    radius="md"
                  />
                </Group>
              </Group>
            </Paper>

            {isTeamLogsLoading ? (
              <Center h={240}>
                <Loader color="blue" />
              </Center>
            ) : filteredTeamLogs.length === 0 ? (
              <Paper p="xl" radius="xl" withBorder ta="center" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
                <Text style={{ color: '#64748b' }} fw={500}>
                  No team daily status logs found matching criteria.
                </Text>
              </Paper>
            ) : (
              <Stack gap="lg">
                {filteredTeamLogs.map((log) => {
                  const memberName = log.user?.name || 'Unknown User';
                  return (
                    <Paper
                      key={log._id}
                      p="xl"
                      radius="xl"
                      withBorder
                      style={{
                        borderColor: '#e8ecf4',
                        background: '#ffffff',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                      }}
                    >
                      <Group justify="space-between" align="center" mb="lg">
                        <Group gap="md">
                          <Avatar src={log.user?.avatarUrl} size="md" radius="xl" color="blue">
                            {memberName.charAt(0)}
                          </Avatar>
                          <div>
                            <Group gap="xs">
                              <Text size="sm" fw={700} style={{ color: '#0f172a' }}>
                                {memberName}
                              </Text>
                              <Badge size="xs" color={getRoleColor(log.user?.role)} radius="sm" fw={600}>
                                {log.user?.role === Role.ADMIN ? 'Admin' : log.user?.role?.replace('_', ' ')}
                              </Badge>
                            </Group>
                            <Text size="xs" style={{ color: '#64748b' }}>
                              {new Date(log.date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </Text>
                          </div>
                        </Group>

                        {log.project ? (
                          <Badge
                            variant="light"
                            color="blue"
                            size="md"
                            radius="sm"
                            leftSection={<Briefcase size={12} />}
                          >
                            {log.project.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" color="gray" radius="sm">
                            General
                          </Badge>
                        )}
                      </Group>

                      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        <Paper p="md" radius="lg" bg="#f8fafc" style={{ border: '1px solid #f1f5f9' }}>
                          <Group gap="xs" mb={6}>
                            <CheckCircle2 size={16} color="#10b981" />
                            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#059669', letterSpacing: '0.05em' }}>
                              Done Today
                            </Text>
                          </Group>
                          <Text size="sm" style={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {log.workDone}
                          </Text>
                        </Paper>

                        <Paper p="md" radius="lg" bg="#f8fafc" style={{ border: '1px solid #f1f5f9' }}>
                          <Group gap="xs" mb={6}>
                            <Clock size={16} color="#3b82f6" />
                            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#2563eb', letterSpacing: '0.05em' }}>
                              Next Goals
                            </Text>
                          </Group>
                          <Text size="sm" style={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {log.plannedWork}
                          </Text>
                        </Paper>
                      </SimpleGrid>

                      {log.blockers && (
                        <Paper
                          p="md"
                          radius="lg"
                          bg="#fffbeb"
                          mt="md"
                          style={{ border: '1px solid #fde68a' }}
                        >
                          <Group gap="xs" mb={4}>
                            <AlertTriangle size={16} color="#d97706" />
                            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#b45309', letterSpacing: '0.05em' }}>
                              Blocker Reported
                            </Text>
                          </Group>
                          <Text size="sm" style={{ color: '#92400e', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {log.blockers}
                          </Text>
                        </Paper>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Tabs.Panel>
        )}
      </Tabs>
    </Container>
  );
};

export default DailyStatus;
