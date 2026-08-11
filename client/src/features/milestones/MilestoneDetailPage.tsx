import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Text, Card, Badge, Group, Stack, SimpleGrid, Table,
  Progress, Loader, Center, Button, Paper, Breadcrumbs, Anchor,
} from '@mantine/core';
import {
  ArrowLeft, Edit, Plus, Calendar, Clock, CheckCircle, Flag, Briefcase, ListTodo, AlertCircle
} from 'lucide-react';
import { useGetMilestoneByIdQuery } from './milestone.slice';
import { useGetTasksByMilestoneQuery } from '../tasks/task.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { formatDateDisplay, formatHoursDisplay } from '../../utils/dateUtils';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'green';
    case 'in_progress': return 'blue';
    case 'on_hold': return 'orange';
    case 'cancelled': return 'red';
    default: return 'gray';
  }
};

const getTaskStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'green';
    case 'in_review': return 'violet';
    case 'in_progress': return 'blue';
    default: return 'gray';
  }
};

export const MilestoneDetailPage: React.FC = () => {
  const { id, projectId: paramProjectId } = useParams<{ id: string; projectId?: string }>();
  const navigate = useNavigate();

  const { user } = useSelector((state: RootState) => state.auth);
  const canManageMilestones = user?.role === Role.ADMIN || user?.role === Role.PM;
  const canCreateTask = user?.role === Role.ADMIN || user?.role === Role.PM || user?.role === Role.TEAM_LEAD;

  const { data: milestoneData, isLoading: isMilestoneLoading } = useGetMilestoneByIdQuery(id!);
  const { data: tasksData, isLoading: isTasksLoading } = useGetTasksByMilestoneQuery(id!);
  const { data: projectsData } = useGetProjectsQuery();

  const milestone = milestoneData?.data;
  const tasks = tasksData?.data || [];

  const pId = paramProjectId || (typeof milestone?.project === 'object' ? (milestone?.project as any)?._id : milestone?.project);
  const project = projectsData?.data?.find(p => p._id === pId);

  if (isMilestoneLoading || isTasksLoading) {
    return <Center h={400}><Loader size="lg" color="blue" /></Center>;
  }

  if (!milestone) {
    return (
      <Center h={400}>
        <Stack align="center">
          <AlertCircle size={48} color="#ef4444" />
          <Text size="lg" fw={600}>Milestone not found</Text>
          <Button variant="subtle" leftSection={<ArrowLeft size={16} />} onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </Stack>
      </Center>
    );
  }

  const estHours = milestone.estimatedHours || 0;
  const spentHours = milestone.spentHours || 0;
  const progress = estHours > 0 ? Math.min(Math.round((spentHours / estHours) * 100), 100) : 0;

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs mb="lg" style={{ fontSize: '0.875rem' }}>
        <Anchor onClick={() => navigate('/projects')} c="blue">Projects</Anchor>
        {pId && (
          <Anchor onClick={() => navigate(`/projects/${pId}`)} c="blue">
            {project?.name || 'Project Details'}
          </Anchor>
        )}
        <Text color="dimmed">{milestone.title}</Text>
      </Breadcrumbs>

      {/* Top Action Bar */}
      <Group justify="space-between" align="center" mb="lg">
        <Button
          variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />}
          onClick={() => navigate(pId ? `/projects/${pId}` : '/projects')}
          style={{ paddingLeft: 0 }}
        >
          Back to Project
        </Button>

        <Group gap="sm">
          {canManageMilestones && (
            <Button
              variant="light"
              color="blue"
              leftSection={<Edit size={16} />}
              onClick={() => navigate(pId ? `/projects/${pId}/milestones/${milestone._id}/edit` : `/milestones/${milestone._id}/edit`)}
              radius="md"
            >
              Edit Milestone
            </Button>
          )}

          {canCreateTask && (
            <Button
              variant="filled"
              color="blue"
              leftSection={<Plus size={16} />}
              onClick={() => navigate(pId ? `/projects/${pId}/tasks/new` : `/tasks/new`)}
              radius="md"
            >
              Add Task
            </Button>
          )}
        </Group>
      </Group>

      {/* Header Card */}
      <Card withBorder shadow="sm" radius="xl" p="xl" mb="xl"
        style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderColor: '#bae6fd' }}>
        <Group align="flex-start" justify="space-between" wrap="wrap">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group gap="sm">
              <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: '#3b82f6', color: '#fff' }}>
                <Flag size={24} />
              </div>
              <div>
                <Title order={2} style={{ color: '#0f172a' }}>{milestone.title}</Title>
                {project && (
                  <Group gap="xs" mt={2}>
                    <Briefcase size={14} color="#64748b" />
                    <Text size="xs" c="dimmed" fw={600}>{project.name}</Text>
                  </Group>
                )}
              </div>
            </Group>

            {milestone.description && (
              <Text size="sm" style={{ color: '#334155', whiteSpace: 'pre-wrap', marginTop: 8 }}>
                {milestone.description}
              </Text>
            )}
          </Stack>

          <Stack align="flex-end" gap="xs">
            <Badge color={getStatusColor(milestone.status)} size="lg" variant="filled" radius="sm">
              {milestone.status?.replace('_', ' ').toUpperCase()}
            </Badge>

            <Group gap="md" mt="xs">
              <Group gap={4}>
                <Calendar size={14} color="#64748b" />
                <Text size="xs" c="dimmed">Start:</Text>
                <Text size="xs" fw={700}>{formatDateDisplay(milestone.startDate)}</Text>
              </Group>

              <Group gap={4}>
                <Calendar size={14} color="#64748b" />
                <Text size="xs" c="dimmed">End:</Text>
                <Text size="xs" fw={700}>{formatDateDisplay(milestone.endDate)}</Text>
              </Group>
            </Group>
          </Stack>
        </Group>
      </Card>

      {/* Stats Summary Grid */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="xl">
        <Paper withBorder p="md" radius="md" bg="#ffffff">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">Estimated Hours</Text>
              <Text size="xl" fw={800} style={{ color: '#0f172a' }}>{estHours}h</Text>
            </div>
            <Clock size={32} color="#3b82f6" style={{ opacity: 0.8 }} />
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md" bg="#ffffff">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">Spent Hours</Text>
              <Text size="xl" fw={800} style={{ color: spentHours > estHours ? '#dc2626' : '#16a34a' }}>
                {formatHoursDisplay(spentHours)}
              </Text>
            </div>
            <Clock size={32} color={spentHours > estHours ? '#ef4444' : '#22c55e'} style={{ opacity: 0.8 }} />
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md" bg="#ffffff">
          <Group justify="space-between" mb="xs">
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">Completion Progress</Text>
              <Text size="xl" fw={800} style={{ color: '#0f172a' }}>{progress}%</Text>
            </div>
            <CheckCircle size={32} color="#8b5cf6" style={{ opacity: 0.8 }} />
          </Group>
          <Progress value={progress} size="sm" radius="xl" color={progress === 100 ? 'green' : 'blue'} />
        </Paper>
      </SimpleGrid>

      {/* Milestone Tasks Table */}
      <Card withBorder radius="xl" p="xl" shadow="xs">
        <Group justify="space-between" align="center" mb="lg">
          <Group gap="xs">
            <ListTodo size={20} color="#2563eb" />
            <Title order={3} style={{ color: '#0f172a' }}>Milestone Tasks</Title>
            <Badge variant="light" color="blue" size="md">{tasks.length} tasks</Badge>
          </Group>

          {canCreateTask && (
            <Button
              size="xs"
              variant="light"
              leftSection={<Plus size={14} />}
              onClick={() => navigate(pId ? `/projects/${pId}/tasks/new` : `/tasks/new`)}
              radius="md"
            >
              New Task
            </Button>
          )}
        </Group>

        {tasks.length === 0 ? (
          <Center h={180}>
            <Stack align="center" gap="xs">
              <ListTodo size={36} color="#cbd5e1" />
              <Text c="dimmed" size="sm">No tasks assigned to this milestone yet.</Text>
            </Stack>
          </Center>
        ) : (
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead bg="#f8fafc">
              <Table.Tr>
                <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>TASK TITLE</Table.Th>
                <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>DEPARTMENT</Table.Th>
                <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>ASSIGNED TO</Table.Th>
                <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>EST. HOURS</Table.Th>
                <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>SPENT HOURS</Table.Th>
                <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>STATUS</Table.Th>
                <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>ACTION</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tasks.map((task: any) => {
                const assignee = typeof task.assignedTo === 'object' ? task.assignedTo : null;
                return (
                  <Table.Tr key={task._id}>
                    <Table.Td>
                      <Text fw={600} size="sm" style={{ cursor: 'pointer', color: '#2563eb' }} onClick={() => navigate(`/tasks/${task._id}`)}>
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text size="xs" c="dimmed" lineClamp={1}>{task.description}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="outline" color="gray" size="sm">{task.department || 'N/A'}</Badge>
                    </Table.Td>
                    <Table.Td>
                      {assignee ? (
                        <Group gap="xs" wrap="nowrap">
                          <UserAvatar name={assignee.name} email={assignee.email} avatarUrl={assignee.avatarUrl} size="sm" />
                          <Text size="sm">{assignee.name}</Text>
                        </Group>
                      ) : (
                        <Badge variant="light" color="orange" size="sm">Unassigned</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600}>{task.estimatedHours || 0}h</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600} c={(task.spentHours || 0) > task.estimatedHours ? 'red' : 'blue'}>
                        {formatHoursDisplay(task.spentHours)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getTaskStatusColor(task.status)} variant="light" size="sm">
                        {task.status?.replace('_', ' ')}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Button size="xs" variant="light" onClick={() => navigate(`/tasks/${task._id}`)}>
                        View Details
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
};
