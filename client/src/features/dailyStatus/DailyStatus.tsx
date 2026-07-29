import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';
import { useForm } from '@mantine/form';
import { Container, Title, Text, Card, Group, Tabs, Textarea, Button, Select, Stack, Loader, Center, Table, Avatar, Badge, Paper } from '@mantine/core';
import { ClipboardList, Calendar, Users, Send, AlertTriangle, Briefcase } from 'lucide-react';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetMyDailyStatusesQuery, useGetTeamDailyStatusesQuery, useSubmitDailyStatusMutation } from './dailyStatus.slice';

export const DailyStatus: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<string | null>('my-status');
  
  const isManagement = user?.role === Role.ADMIN || user?.role === Role.PM || user?.role === Role.TEAM_LEAD;

  // API Queries & Mutations
  const { data: projectsData } = useGetProjectsQuery();
  const { data: myLogsData, isLoading: isMyLogsLoading } = useGetMyDailyStatusesQuery();
  const { data: teamLogsData, isLoading: isTeamLogsLoading } = useGetTeamDailyStatusesQuery(undefined, { skip: !isManagement });
  const [submitDailyStatus, { isLoading: isSubmitting }] = useSubmitDailyStatusMutation();

  const projects = projectsData?.data || [];
  const myLogs = myLogsData?.data || [];
  const teamLogs = teamLogsData?.data || [];

  // Project options for dropdown
  const projectOptions = projects.map(p => ({ value: p._id, label: p.name }));

  // Form setup
  const form = useForm({
    initialValues: {
      project: '',
      workDone: '',
      plannedWork: '',
      blockers: '',
    },
    validate: {
      workDone: (value) => (value.trim().length === 0 ? 'Please describe the work done today' : null),
      plannedWork: (value) => (value.trim().length === 0 ? 'Please describe what you plan to work on next' : null),
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
      setActiveTab('my-status'); // Navigate to history feed
    } catch (err) {
      console.error('Failed to submit status:', err);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case Role.ADMIN: return 'red';
      case Role.PM: return 'indigo';
      case Role.TEAM_LEAD: return 'teal';
      default: return 'blue';
    }
  };

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <Group justify="space-between" mb="xl" style={{ marginBottom: '28px' }}>
        <div>
          <Title
            order={2}
            style={{
              color: '#0f172a',
              fontSize: '1.875rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.2,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Daily Work Status
          </Title>
          <Text
            size="sm"
            mt={6}
            style={{ color: '#94a3b8', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}
          >
            Log your daily progress and keep the team updated on milestones.
          </Text>
        </div>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} radius="md">
        <Tabs.List style={{ borderBottom: '1px solid #e5e7eb' }} mb="xl">
          <Tabs.Tab value="my-status" leftSection={<Calendar size={16} />}>My Status History</Tabs.Tab>
          <Tabs.Tab value="new-status" leftSection={<ClipboardList size={16} />}>Submit Daily Status</Tabs.Tab>
          {isManagement && (
            <Tabs.Tab value="team-status" leftSection={<Users size={16} />}>Team Updates Feed</Tabs.Tab>
          )}
        </Tabs.List>

        {/* Tab 1: Personal Status Logs */}
        <Tabs.Panel value="my-status">
          {isMyLogsLoading ? (
            <Center h={200}><Loader color="blue" /></Center>
          ) : myLogs.length === 0 ? (
            <Card withBorder p="xl" radius="md" ta="center" style={{ borderStyle: 'dashed' }}>
              <Text c="dimmed">You haven't submitted any daily status updates yet.</Text>
              <Button mt="md" variant="light" onClick={() => setActiveTab('new-status')}>Submit Your First Update</Button>
            </Card>
          ) : (
            <Stack gap="md">
              {myLogs.map((log) => (
                <Paper key={log._id} withBorder p="lg" radius="lg" shadow="xs">
                  <Group justify="space-between" mb="md">
                    <Group gap="xs">
                      <Calendar size={16} color="#6b7280" />
                      <Text size="sm" fw={600} color="dimmed">
                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </Text>
                    </Group>
                    {log.project && (
                      <Badge variant="light" color="blue" leftSection={<Briefcase size={10} />}>
                        Project: {log.project.name}
                      </Badge>
                    )}
                  </Group>

                  <Stack gap="xs">
                    <div>
                      <Text size="xs" fw={700} tt="uppercase" color="blue" mb={4}>Work Completed Today:</Text>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{log.workDone}</Text>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <Text size="xs" fw={700} tt="uppercase" color="teal" mb={4}>Planned for Next Session:</Text>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{log.plannedWork}</Text>
                    </div>

                    {log.blockers && (
                      <Paper p="xs" radius="md" bg="#fffbeb" style={{ border: '1px solid #fde68a', marginTop: '12px' }}>
                        <Group gap="xs" mb={4}>
                          <AlertTriangle size={14} color="#d97706" />
                          <Text size="xs" fw={700} color="#b45309" tt="uppercase">Blockers / Roadblocks:</Text>
                        </Group>
                        <Text size="sm" color="#92400e" style={{ whiteSpace: 'pre-wrap' }}>{log.blockers}</Text>
                      </Paper>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        {/* Tab 2: Submit Daily Status */}
        <Tabs.Panel value="new-status">
          <Card withBorder shadow="sm" p="xl" radius="lg" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <Title order={3} mb="lg">Submit Daily Check-in</Title>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <Select
                  label="Associated Project (Optional)"
                  placeholder="Select a project you worked on..."
                  data={projectOptions}
                  clearable
                  {...form.getInputProps('project')}
                />

                <Textarea
                  required
                  label="Work Completed Today"
                  placeholder="E.g., Designed responsive navigation bar, created auth slice, resolved compiler warnings..."
                  minRows={4}
                  {...form.getInputProps('workDone')}
                />

                <Textarea
                  required
                  label="Planned Work for Tomorrow / Next Session"
                  placeholder="E.g., Integrate file upload endpoint, add layout styles to tasks board..."
                  minRows={3}
                  {...form.getInputProps('plannedWork')}
                />

                <Textarea
                  label="Blockers or Obstacles (Optional)"
                  placeholder="E.g., Waiting for S3 bucket credentials, API returns 500 when creating release..."
                  minRows={2}
                  {...form.getInputProps('blockers')}
                />

                <Group justify="flex-end" mt="md">
                  <Button type="submit" leftSection={<Send size={16} />} loading={isSubmitting}>
                    Submit Status
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        {/* Tab 3: Team Updates Feed */}
        {isManagement && (
          <Tabs.Panel value="team-status">
            {isTeamLogsLoading ? (
              <Center h={200}><Loader color="blue" /></Center>
            ) : teamLogs.length === 0 ? (
              <Card withBorder p="xl" radius="md" ta="center">
                <Text c="dimmed">No team logs submitted today.</Text>
              </Card>
            ) : (
              <Table verticalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Team Member</Table.Th>
                    <Table.Th>Date & Project</Table.Th>
                    <Table.Th>Work Done & Roadblocks</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {teamLogs.map((log) => {
                    const memberName = log.user?.name || 'Unknown';
                    return (
                      <Table.Tr key={log._id}>
                        <Table.Td style={{ verticalAlign: 'top', width: '220px' }}>
                          <Group gap="sm" wrap="nowrap">
                            <Avatar src={log.user?.avatarUrl} size="md" color="blue">
                              {memberName.charAt(0)}
                            </Avatar>
                            <div>
                              <Text size="sm" fw={600}>{memberName}</Text>
                              <Badge size="xs" color={getRoleColor(log.user?.role)} mt={2}>
                                {log.user?.role === Role.ADMIN ? 'Admin' : log.user?.role?.replace('_', ' ')}
                              </Badge>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ verticalAlign: 'top', width: '250px' }}>
                          <Text size="sm" fw={500}>
                            {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                          {log.project ? (
                            <Badge variant="light" color="blue" mt={6} leftSection={<Briefcase size={10} />}>
                              {log.project.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" color="gray" mt={6}>General</Badge>
                          )}
                        </Table.Td>
                        <Table.Td style={{ verticalAlign: 'top' }}>
                          <Stack gap="xs">
                            <div>
                              <Text size="xs" fw={700} color="dimmed" tt="uppercase">Done:</Text>
                              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{log.workDone}</Text>
                            </div>
                            <div>
                              <Text size="xs" fw={700} color="dimmed" tt="uppercase">Next Up:</Text>
                              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{log.plannedWork}</Text>
                            </div>
                            {log.blockers && (
                              <Paper p="xs" radius="md" bg="#fffbeb" style={{ border: '1px solid #fde68a' }}>
                                <Group gap="xs" mb={4}>
                                  <AlertTriangle size={12} color="#d97706" />
                                  <Text size="xs" fw={700} color="#b45309" tt="uppercase">Blockers:</Text>
                                </Group>
                                <Text size="sm" color="#92400e" style={{ whiteSpace: 'pre-wrap' }}>{log.blockers}</Text>
                              </Paper>
                            )}
                          </Stack>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Tabs.Panel>
        )}
      </Tabs>
    </Container>
  );
};

export default DailyStatus;
