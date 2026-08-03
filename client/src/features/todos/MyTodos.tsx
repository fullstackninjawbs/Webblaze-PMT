import React from 'react';
import { Container, Title, Text, Card, Group, Badge, SimpleGrid, ActionIcon, Menu, Button, Center, Loader } from '@mantine/core';
import { CheckCircle, MoreVertical, Clock, AlertCircle } from 'lucide-react';
import { useGetTodosQuery, useUpdateTodoMutation } from './todo.slice';
import { formatDateDisplay } from '../../utils/dateUtils';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

export const MyTodos: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: todosData, isLoading, refetch } = useGetTodosQuery();
  const [updateTodo] = useUpdateTodoMutation();

  const todos = todosData?.data || [];
  const myTodos = todos.filter(t => {
    if (!t || !t.user) return false;
    const assignedUserId = typeof t.user === 'object' ? (t.user as any)?._id || (t.user as any)?.id : t.user;
    const currentUserId = user?._id || (user as any)?.id;
    return String(assignedUserId) === String(currentUserId);
  });

  const activeTodos = myTodos.filter(t => t?.status !== 'done');
  const completedTodos = myTodos.filter(t => t?.status === 'done');

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      console.log('Updating todo status:', id, status);
      await updateTodo({ id, data: { status } as any }).unwrap();
      refetch();
    } catch (err: any) {
      console.error('Failed to update status', err);
      alert(err?.data?.message || 'Failed to update todo status');
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'in_progress': return 'blue';
      case 'done': return 'green';
      case 'blocked': return 'red';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <Group justify="space-between" mb="xl" style={{ marginBottom: '28px' }}>
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
            My Todos
          </Title>
          <Text
            size="sm"
            mt={4}
            style={{ color: '#64748b', letterSpacing: '-0.01em' }}
          >
            Manage your personal tasks and daily focus.
          </Text>
        </div>
      </Group>

      <Title order={4} mb="md" style={{ color: '#1e293b' }}>Active Todos</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="xl">
        {activeTodos.map((todo) => {
          if (!todo) return null;
          const project = typeof todo.relatedProject === 'object' ? todo.relatedProject : null;
          const overdue = isOverdue(todo.dueDate);
          const safeStatus = todo.status || 'pending';

          return (
            <Card key={todo._id} shadow="sm" p="lg" radius="lg" withBorder style={{ borderColor: overdue ? '#ef4444' : '#e5e7eb' }}>
              <Group justify="space-between" align="flex-start" mb="sm">
                <Badge color={getStatusColor(safeStatus)} variant="light">
                  {safeStatus.replace('_', ' ')}
                </Badge>
                <Menu position="bottom-end" shadow="sm">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <MoreVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={(e) => { e.stopPropagation(); handleUpdateStatus(todo._id, 'pending'); }}>Mark Pending</Menu.Item>
                    <Menu.Item onClick={(e) => { e.stopPropagation(); handleUpdateStatus(todo._id, 'in_progress'); }}>Mark In Progress</Menu.Item>
                    <Menu.Item onClick={(e) => { e.stopPropagation(); handleUpdateStatus(todo._id, 'blocked'); }} color="red">Mark Blocked</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              <Text fw={600} size="md" mb="xs">{todo.title || 'Untitled Todo'}</Text>
              
              {project && (project as any).name && (
                <Text size="xs" color="dimmed" mb="sm">Project: {(project as any).name}</Text>
              )}

              <Group justify="space-between" mt="auto" pt="md" style={{ borderTop: '1px solid #f3f4f6' }}>
                <Group gap="xs">
                  <Clock size={14} color={overdue ? '#ef4444' : '#9ca3af'} />
                  <Text size="xs" color={overdue ? 'red' : 'dimmed'} fw={overdue ? 600 : 400}>
                    {formatDateDisplay(todo.dueDate)}
                  </Text>
                  {overdue && <AlertCircle size={14} color="#ef4444" />}
                </Group>
                
                <Button 
                  size="xs" 
                  variant="light" 
                  color="green" 
                  leftSection={<CheckCircle size={14} />}
                  onClick={() => handleUpdateStatus(todo._id, 'done')}
                >
                  Complete
                </Button>
              </Group>
            </Card>
          );
        })}
        {activeTodos.length === 0 && (
          <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB" style={{ gridColumn: '1 / -1' }}>
            <Text c="dimmed" size="sm">You have no active todos. Great job!</Text>
          </Card>
        )}
      </SimpleGrid>

      {completedTodos.length > 0 && (
        <>
          <Title order={4} mb="md" style={{ color: '#1e293b' }}>Recently Completed</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {completedTodos.slice(0, 6).map((todo) => {
              if (!todo) return null;
              return (
                <Card key={todo._id} shadow="sm" p="lg" radius="lg" withBorder style={{ opacity: 0.7 }}>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600} size="sm" style={{ textDecoration: 'line-through' }}>{todo.title || 'Untitled Todo'}</Text>
                    <Badge color="green" variant="dot">Done</Badge>
                  </Group>
                  <Text size="xs" color="dimmed">Completed Task</Text>
                </Card>
              );
            })}
          </SimpleGrid>
        </>
      )}
    </Container>
  );
};

