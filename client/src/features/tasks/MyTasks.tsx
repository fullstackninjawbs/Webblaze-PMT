import { useMemo } from 'react';
import { Container, Title, Text, Card, Group, Badge, Stack, Button, Progress, Loader, Center, Grid } from '@mantine/core';
import { Play, Eye, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetTasksByUserQuery, useUpdateTaskMutation } from './task.slice';
import { useGetActiveTimerQuery, useStartTimerMutation } from '../timelogs/timeLog.slice';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

export const MyTasks = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { data: tasksData, isLoading } = useGetTasksByUserQuery((user as any)?._id || (user as any)?.id || '');
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const [startTimer] = useStartTimerMutation();
  const [updateTask] = useUpdateTaskMutation();
  
  const activeTimer = activeTimerData?.data;
  const tasks = tasksData?.data || [];

  const groupedTasks = useMemo(() => {
    return {
      active: tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress'),
      review: tasks.filter(t => t.status === 'in_review'),
      completed: tasks.filter(t => t.status === 'completed'),
    };
  }, [tasks]);

  const handleStartTimer = async (taskId: string) => {
    if (activeTimer) {
      alert('You already have an active timer. Please stop it first.');
      return;
    }
    
    try {
      await startTimer({ taskId }).unwrap();
      navigate(`/tasks/${taskId}`); // Optional: redirect to task detail
    } catch (err: any) {
      alert(err.data?.message || 'Failed to start timer');
    }
  };

  const handleMarkInReview = async (taskId: string) => {
    try {
      await updateTask({ _id: taskId, status: 'in_review' }).unwrap();
      alert('Task moved to In Review.');
    } catch (e) {
      console.error(e);
    }
  };

  const renderTaskCard = (task: any) => {
    const isOverdue = task.endDate && new Date(task.endDate) < new Date();
    const isDueSoon = task.endDate && new Date(task.endDate) < new Date(Date.now() + 48 * 60 * 60 * 1000) && !isOverdue;
    const progressPercent = Math.min(((task.spentHours || 0) / task.estimatedHours) * 100, 100);

    return (
      <Card key={task._id} shadow="sm" p="md" radius="md" withBorder style={{ 
        borderColor: isOverdue ? '#fca5a5' : isDueSoon ? '#fcd34d' : '#e5e7eb',
        borderLeftWidth: '4px'
      }}>
        <Group justify="space-between" mb="xs">
          <Badge color={task.status === 'completed' ? 'green' : 'blue'} variant="light">
            {task.status.replace('_', ' ')}
          </Badge>
          {isOverdue && <Badge color="red" leftSection={<AlertCircle size={10} />}>Overdue</Badge>}
          {isDueSoon && <Badge color="orange" leftSection={<Clock size={10} />}>Due Soon</Badge>}
        </Group>

        <Text fw={700} mb={4} lineClamp={1}>{task.title}</Text>
        <Text size="xs" color="dimmed" mb="md" lineClamp={2}>
          Project: {task.milestone?.project?.name || 'Unknown'}
        </Text>

        <Group justify="space-between" mb={8}>
          <Text size="xs" fw={600}>Progress</Text>
          <Text size="xs" fw={600}>{(task.spentHours || 0).toFixed(1)}h / {task.estimatedHours}h</Text>
        </Group>
        <Progress value={progressPercent} size="sm" radius="xl" color={task.status === 'completed' ? 'green' : 'blue'} mb="md" />

        <Group grow gap="xs">
          {task.status !== 'completed' && (
            <Button size="xs" variant="light" leftSection={<Play size={14} />} onClick={() => handleStartTimer(task._id)}>
              Start
            </Button>
          )}
          <Button size="xs" variant="outline" color="gray" leftSection={<Eye size={14} />} onClick={() => navigate(`/tasks/${task._id}`)}>
            View
          </Button>
          {(task.status === 'assigned' || task.status === 'in_progress') && (
            <Button size="xs" variant="light" color="orange" onClick={() => handleMarkInReview(task._id)}>
              Review
            </Button>
          )}
        </Group>
      </Card>
    );
  };

  if (isLoading) return <Center h={400}><Loader color="blue" /></Center>;

  return (
    <Container size="xl" py="xl" style={{ animation: 'fade-in 0.4s ease-out' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#111827', fontSize: '28px', fontWeight: 800 }}>My Tasks</Title>
          <Text color="dimmed" size="sm">Manage your assignments and track time.</Text>
        </div>
      </Group>

      <Grid gutter="xl">
        {/* Active Tasks Column */}
        <Grid.Col span={4}>
          <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
            Active Tasks ({groupedTasks.active.length})
          </Title>
          <Stack gap="md">
            {groupedTasks.active.length > 0 ? groupedTasks.active.map(renderTaskCard) : (
              <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                <Text color="dimmed" size="sm">No active tasks.</Text>
              </Card>
            )}
          </Stack>
        </Grid.Col>

        {/* In Review Column */}
        <Grid.Col span={4}>
          <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            In Review ({groupedTasks.review.length})
          </Title>
          <Stack gap="md">
            {groupedTasks.review.length > 0 ? groupedTasks.review.map(renderTaskCard) : (
              <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                <Text color="dimmed" size="sm">No tasks in review.</Text>
              </Card>
            )}
          </Stack>
        </Grid.Col>

        {/* Completed Column */}
        <Grid.Col span={4}>
          <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
            Completed ({groupedTasks.completed.length})
          </Title>
          <Stack gap="md">
            {groupedTasks.completed.length > 0 ? groupedTasks.completed.map(renderTaskCard) : (
              <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                <Text color="dimmed" size="sm">No completed tasks yet.</Text>
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
};
