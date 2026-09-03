import { useMemo, useState } from 'react';
import { 
  Container, Title, Text, Card, Group, Badge, Stack, Button, Progress, Loader, 
  Center, Grid, TextInput, Select, SegmentedControl, Table
} from '@mantine/core';
import { 
  Play, Square, Eye, Clock, AlertCircle, Search, Calendar, MessageSquare, 
  Paperclip, LayoutGrid, List as ListIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { formatHours } from '../../utils/formatHours';
import { PaginatedTable, usePagination } from '../../components/common/PaginatedTable';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetTasksByUserQuery } from './task.slice';
import { useGetActiveTimerQuery, useStartTimerMutation, useStopTimerMutation } from '../timelogs/timeLog.slice';

export const MyTasks = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { page, limit, setPage, setLimit, resetPage } = usePagination();
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  const { data: tasksData, isLoading } = useGetTasksByUserQuery({
    userId: (user as any)?._id || (user as any)?.id || '',
    page,
    limit,
    search: searchQuery,
  });
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const [startTimer] = useStartTimerMutation();
  const [stopTimer] = useStopTimerMutation();

  // View state
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const { data: projectsData } = useGetProjectsQuery({ limit: 1000 });

  const activeTimer = activeTimerData?.data;
  const activeTimerTaskId = activeTimer
    ? (typeof activeTimer.task === 'string' ? activeTimer.task : activeTimer.task?._id)
    : null;

  const tasks = tasksData?.data || [];
  const meta = tasksData?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 };

  // Unique project list for filter from all projects
  const projectOptions = useMemo(() => {
    const allProjects = projectsData?.data || [];
    return allProjects.map((proj: any) => ({ value: proj._id, label: proj.name }));
  }, [projectsData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.currentTarget.value);
    resetPage();
  };

  const handleProjectFilterChange = (val: string | null) => {
    setProjectFilter(val);
    resetPage();
  };

  // Filtered tasks based on search & project dropdown
  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      const matchesSearch = searchQuery.trim() === '' || 
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.milestone?.project?.name || t.project?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const projId = (t.milestone?.project?._id || t.project?._id || t.project);
      const matchesProject = !projectFilter || projId === projectFilter;

      return matchesSearch && matchesProject;
    });
  }, [tasks, searchQuery, projectFilter]);

  const groupedTasks = useMemo(() => {
    return {
      active: filteredTasks.filter((t: any) => t.status === 'assigned' || t.status === 'in_progress'),
      review: filteredTasks.filter((t: any) => t.status === 'in_review'),
      completed: filteredTasks.filter((t: any) => t.status === 'completed'),
    };
  }, [filteredTasks]);

  const handleStartTimer = async (taskId: string) => {
    if (activeTimer) {
      alert('You already have an active timer. Please stop it first.');
      return;
    }
    
    try {
      await startTimer({ taskId }).unwrap();
      navigate(`/tasks/${taskId}`);
    } catch (err: any) {
      alert(err.data?.message || 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer({}).unwrap();
    } catch (err: any) {
      alert(err.data?.message || 'Failed to stop timer');
    }
  };

  const renderTaskCard = (task: any) => {
    const rawStatus = (task.status || '').toLowerCase();
    const isCompleted = rawStatus === 'completed';
    const isOverdue = !isCompleted && task.endDate && new Date(task.endDate) < new Date();
    const isDueSoon = !isCompleted && task.endDate && new Date(task.endDate) < new Date(Date.now() + 48 * 60 * 60 * 1000) && !isOverdue;
    
    const isTimerRunningOnThisTask = activeTimerTaskId === task._id;

    const spentHours = task.spentHours || 0;
    const estHours = task.estimatedHours || 1;
    const isOverBudget = spentHours > estHours;
    const progressPercent = Math.min((spentHours / estHours) * 100, 100);

    const formattedDueDate = task.endDate 
      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(task.endDate))
      : null;

    const commentCount = Array.isArray(task.comments) ? task.comments.length : (task.commentCount || 0);
    const attachmentCount = Array.isArray(task.attachments) ? task.attachments.length : (task.attachmentCount || 0);

    return (
      <Card key={task._id} shadow="sm" p="md" radius="md" withBorder style={{ 
        borderColor: isOverdue ? '#fca5a5' : isDueSoon ? '#fcd34d' : isTimerRunningOnThisTask ? '#60a5fa' : '#e5e7eb',
        borderLeftWidth: '4px',
        backgroundColor: isTimerRunningOnThisTask ? '#f0f9ff' : '#ffffff'
      }}>
        <Group justify="space-between" mb="xs">
          <Badge color={isCompleted ? 'green' : rawStatus === 'in_review' ? 'orange' : isTimerRunningOnThisTask ? 'blue' : 'gray'} variant="light">
            {isTimerRunningOnThisTask ? '⏱ Running' : (task.status || 'ASSIGNED').replace('_', ' ')}
          </Badge>

          <Group gap={6}>
            {isOverdue && <Badge color="red" leftSection={<AlertCircle size={10} />}>Overdue</Badge>}
            {isDueSoon && <Badge color="orange" leftSection={<Clock size={10} />}>Due Soon</Badge>}
            {isOverBudget && <Badge color="red" variant="outline" size="xs">+{formatHours(spentHours - estHours)} Over</Badge>}
          </Group>
        </Group>

        <Text fw={700} mb={4} lineClamp={1}>{task.title}</Text>
        <Text size="xs" c="dimmed" mb={8} lineClamp={1}>
          Project: {task.milestone?.project?.name || task.project?.name || 'General Project'}
        </Text>

        {/* Due Date Display */}
        {formattedDueDate && (
          <Group gap={4} mb={10}>
            <Calendar size={12} color="#64748b" />
            <Text size="xs" c="dimmed" fw={500}>Due {formattedDueDate}</Text>
            {isOverBudget && <Badge color="red" variant="outline" size="xs">+{formatHours(spentHours - estHours)} Over</Badge>}
          </Group>
        )}

        {/* Progress & Over Budget Info */}
        <Group justify="space-between" mb={4}>
          <Text size="xs" fw={600}>Progress</Text>
          <Text size="xs" fw={600} c={isOverBudget ? 'red' : undefined}>
            {formatHours(spentHours)} / {formatHours(estHours)}
          </Text>
        </Group>
        <Progress 
          value={progressPercent} 
          size="sm" 
          radius="xl" 
          color={isCompleted ? 'green' : isOverBudget ? 'red' : 'blue'} 
          mb="md" 
        />

        {/* Footer info & Buttons */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Group gap={3} style={{ color: '#64748b' }}>
              <MessageSquare size={12} />
              <Text size="xs" c="dimmed">{commentCount}</Text>
            </Group>
            {attachmentCount > 0 && (
              <Group gap={3} style={{ color: '#64748b' }}>
                <Paperclip size={12} />
                <Text size="xs" c="dimmed">{attachmentCount}</Text>
              </Group>
            )}
          </Group>

          <Group gap="xs">
            {isTimerRunningOnThisTask ? (
              <Button size="xs" color="red" leftSection={<Square size={12} />} onClick={(e) => { e.stopPropagation(); handleStopTimer(); }}>
                Stop
              </Button>
            ) : !isCompleted ? (
              <Button size="xs" variant="light" leftSection={<Play size={12} />} onClick={(e) => { e.stopPropagation(); handleStartTimer(task._id); }}>
                Start
              </Button>
            ) : null}

            <Button size="xs" variant="outline" color="gray" leftSection={<Eye size={12} />} onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${task._id}`); }}>
              View
            </Button>
          </Group>
        </Group>
      </Card>
    );
  };

  if (isLoading) return <Center h={400}><Loader color="blue" /></Center>;

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
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
            My Tasks
          </Title>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            Manage your assignments, filter tasks, and track time cleanly.
          </Text>
        </div>

        {/* View Mode Switcher */}
        <SegmentedControl
          value={viewMode}
          onChange={(val) => setViewMode(val as 'kanban' | 'list')}
          data={[
            {
              label: (
                <Center inline style={{ gap: 6 }}>
                  <LayoutGrid size={14} />
                  <span>Kanban</span>
                </Center>
              ),
              value: 'kanban',
            },
            {
              label: (
                <Center inline style={{ gap: 6 }}>
                  <ListIcon size={14} />
                  <span>List View</span>
                </Center>
              ),
              value: 'list',
            },
          ]}
        />
      </Group>

      {/* Search & Filter Bar */}
      <Card withBorder p="sm" radius="md" mb="xl" bg="#FAFAFA">
        <Grid align="center" gutter="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              placeholder="Search tasks..."
              leftSection={<Search size={16} color="#94a3b8" />}
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ flex: 1 }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              placeholder="Filter by Project"
              data={projectOptions}
              value={projectFilter}
              onChange={handleProjectFilterChange}
              clearable
              searchable
              style={{ flex: 1 }}
            />
          </Grid.Col>
        </Grid>
      </Card>

      <PaginatedTable meta={meta} onPageChange={setPage} onLimitChange={setLimit} isLoading={isLoading}>
        {viewMode === 'kanban' ? (
        <Grid gutter="xl">
          {/* Active Tasks Column */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
              Active Tasks ({groupedTasks.active.length})
            </Title>
            <Stack gap="md">
              {groupedTasks.active.length > 0 ? groupedTasks.active.map(renderTaskCard) : (
                <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                  <Text c="dimmed" size="sm">No active tasks matching filter.</Text>
                </Card>
              )}
            </Stack>
          </Grid.Col>

          {/* In Review Column */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              In Review ({groupedTasks.review.length})
            </Title>
            <Stack gap="md">
              {groupedTasks.review.length > 0 ? groupedTasks.review.map(renderTaskCard) : (
                <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                  <Text c="dimmed" size="sm">No tasks in review.</Text>
                </Card>
              )}
            </Stack>
          </Grid.Col>

          {/* Completed Column */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
              Completed ({groupedTasks.completed.length})
            </Title>
            <Stack gap="md">
              {groupedTasks.completed.length > 0 ? groupedTasks.completed.map(renderTaskCard) : (
                <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                  <Text c="dimmed" size="sm">No completed tasks yet.</Text>
                </Card>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      ) : (
        /* List View Table */
        <Card withBorder radius="md" p={0}>
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead bg="#f8fafc">
              <Table.Tr>
                <Table.Th>Task</Table.Th>
                <Table.Th>Project</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Due Date</Table.Th>
                <Table.Th>Progress</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((t: any) => {
                  const isCompleted = t.status === 'completed';
                  const isRunning = activeTimerTaskId === t._id;
                  const spent = t.spentHours || 0;
                  const est = t.estimatedHours || 1;
                  const isOverBudget = spent > est;
                  const formattedDue = t.endDate 
                    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(t.endDate))
                    : '-';

                  return (
                    <Table.Tr key={t._id} bg={isRunning ? '#f0f9ff' : undefined}>
                      <Table.Td>
                        <Text fw={600} size="sm">{t.title}</Text>
                        <Group gap={8} mt={2}>
                          <Text size="xs" c="dimmed">💬 {Array.isArray(t.comments) ? t.comments.length : 0}</Text>
                          <Text size="xs" c="dimmed">📎 {Array.isArray(t.attachments) ? t.attachments.length : 0}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{t.milestone?.project?.name || t.project?.name || 'General'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={isCompleted ? 'green' : isRunning ? 'blue' : 'gray'} variant="light">
                          {isRunning ? '⏱ Running' : t.status.replace('_', ' ')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formattedDue}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" fw={600} c={isOverBudget ? 'red' : undefined}>
                          {formatHours(spent)} / {formatHours(est)} {isOverBudget ? `(+${formatHours(spent - est)})` : ''}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap="xs" justify="flex-end">
                          {isRunning ? (
                            <Button size="xs" color="red" leftSection={<Square size={12} />} onClick={handleStopTimer}>
                              Stop
                            </Button>
                          ) : !isCompleted ? (
                            <Button size="xs" variant="light" leftSection={<Play size={12} />} onClick={() => handleStartTimer(t._id)}>
                              Start
                            </Button>
                          ) : null}
                          <Button size="xs" variant="outline" color="gray" onClick={() => navigate(`/tasks/${t._id}`)}>
                            View
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    <Text c="dimmed" size="sm">No tasks matching search filters.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}
      </PaginatedTable>
    </Container>
  );
};
