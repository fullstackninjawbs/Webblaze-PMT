import React, { useState, useMemo } from 'react';
import {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} from './todo.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Card,
  Badge,
  Stack,
  Modal,
  TextInput,
  Select,
  NumberInput,
  Table,
  ActionIcon,
  Menu,
  Paper,
  SimpleGrid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import {
  Plus,
  Edit2,
  Trash,
  CheckCircle,
  Clock,
  CheckCircle2,
  ListTodo,
  Search,
  Filter,
} from 'lucide-react';

import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

export const TodosList: React.FC = () => {
  const { data: todosData, isLoading } = useGetTodosQuery();
  const { data: projectsData } = useGetProjectsQuery();

  const [createTodo] = useCreateTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();

  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      title: '',
      relatedProject: '',
      estimatedTime: 0,
      dueDate: '',
    },
  });

  const todos = todosData?.data || [];
  const projects = projectsData?.data || [];

  // Filtered Todos
  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      const projName = t.relatedProject?.name || '';
      const matchesQuery =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || t.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [todos, searchQuery, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = todos.length;
    const pendingCount = todos.filter((t) => t.status === 'pending').length;
    const inProgressCount = todos.filter((t) => t.status === 'in_progress').length;
    const completedCount = todos.filter((t) => t.status === 'done').length;
    return { totalCount, pendingCount, inProgressCount, completedCount };
  }, [todos]);

  const handleOpenModal = (todo?: any) => {
    if (todo) {
      setEditingId(todo._id);
      form.setValues({
        title: todo.title,
        relatedProject: todo.relatedProject?._id || '',
        estimatedTime: todo.estimatedTime || 0,
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingId(null);
      form.reset();
    }
    open();
  };

  const handleSubmit = async (values: typeof form.values) => {
    const payload = {
      title: values.title,
      relatedProject: values.relatedProject || undefined,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      estimatedTime: values.estimatedTime || undefined,
    };

    try {
      if (editingId) {
        await updateTodo({ id: editingId, data: payload as any }).unwrap();
      } else {
        await createTodo(payload as any).unwrap();
      }
      close();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'in_progress' | 'done') => {
    await updateTodo({ id, data: { status } });
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteTodo(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'blue';
      case 'done':
        return 'green';
      default:
        return 'gray';
    }
  };

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
            Team To-Dos
          </Title>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            Organize personal tasks, project action items, and deadline targets.
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          size="md"
          radius="md"
          onClick={() => handleOpenModal()}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
          }}
        >
          Add To-Do
        </Button>
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" mb="xl">
        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Total Tasks
            </Text>
            <Paper p={8} radius="md" bg="#eff6ff">
              <ListTodo size={18} color="#2563eb" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
            {metrics.totalCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Pending
            </Text>
            <Paper p={8} radius="md" bg="#f1f5f9">
              <Clock size={18} color="#64748b" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#64748b', lineHeight: 1 }}>
            {metrics.pendingCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              In Progress
            </Text>
            <Paper p={8} radius="md" bg="#eff6ff">
              <Clock size={18} color="#2563eb" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#2563eb', lineHeight: 1 }}>
            {metrics.inProgressCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Completed
            </Text>
            <Paper p={8} radius="md" bg="#f0fdf4">
              <CheckCircle2 size={18} color="#10b981" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#10b981', lineHeight: 1 }}>
            {metrics.completedCount}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Filter Toolbar */}
      <Paper p="md" radius="lg" withBorder mb="lg" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
        <Group justify="space-between">
          <TextInput
            placeholder="Search task title or project..."
            leftSection={<Search size={16} color="#94a3b8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 320 }}
            radius="md"
          />
          <Group gap="sm">
            <Filter size={16} color="#64748b" />
            <Select
              placeholder="Filter Status"
              data={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'done', label: 'Done' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
              style={{ width: 180 }}
              radius="md"
            />
          </Group>
        </Group>
      </Paper>

      {/* Data Table */}
      <Card
        shadow="xs"
        radius="xl"
        withBorder
        style={{
          borderColor: '#e8ecf4',
          boxShadow: 'none',
          overflow: 'hidden',
          padding: 0,
          backgroundColor: '#ffffff',
        }}
      >
        <Table verticalSpacing="md" horizontalSpacing="lg">
          <Table.Thead style={{ backgroundColor: '#f8faff' }}>
            <Table.Tr>
              <Table.Th>Task Title</Table.Th>
              <Table.Th>Related Project</Table.Th>
              <Table.Th>Assigned To</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Est. Hours</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredTodos.map((todo) => (
              <Table.Tr key={todo._id}>
                <Table.Td>
                  <Text fw={700} size="sm" style={{ color: '#0f172a' }}>
                    {todo.title}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" style={{ color: '#64748b' }}>
                    {todo.relatedProject ? todo.relatedProject.name : 'None'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" style={{ color: '#334155' }}>
                    {todo.user?.name || 'Unassigned'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" style={{ color: '#334155' }}>
                    {todo.dueDate ? new Intl.DateTimeFormat('en-GB').format(new Date(todo.dueDate)) : '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600} style={{ color: todo.estimatedTime ? '#2563eb' : '#94a3b8' }}>
                    {todo.estimatedTime ? `${todo.estimatedTime}h` : '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu shadow="sm" width={150} radius="md">
                    <Menu.Target>
                      <Badge
                        variant="light"
                        radius="sm"
                        fw={600}
                        color={getStatusColor(todo.status)}
                        style={{ cursor: 'pointer' }}
                      >
                        {todo.status.replace('_', ' ')}
                      </Badge>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={() => handleStatusChange(todo._id, 'pending')}>Pending</Menu.Item>
                      <Menu.Item onClick={() => handleStatusChange(todo._id, 'in_progress')}>
                        In Progress
                      </Menu.Item>
                      <Menu.Item onClick={() => handleStatusChange(todo._id, 'done')}>Done</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    {todo.status !== 'done' && (
                      <ActionIcon
                        color="green"
                        variant="light"
                        onClick={() => handleStatusChange(todo._id, 'done')}
                        title="Mark Complete"
                      >
                        <CheckCircle size={16} />
                      </ActionIcon>
                    )}
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => handleOpenModal(todo)}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(todo._id, todo.title)}
                      title="Delete"
                    >
                      <Trash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {filteredTodos.length === 0 && !isLoading && (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  <Text style={{ color: '#64748b' }} fw={500}>
                    No to-dos found matching criteria.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Save Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Text fw={700} size="lg">
            {editingId ? 'Edit To-Do' : 'Create To-Do'}
          </Text>
        }
        radius="lg"
        padding="xl"
        size={520}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              required
              label="Task Title"
              placeholder="What needs to be done?"
              withAsterisk
              radius="md"
              {...form.getInputProps('title')}
            />

            <Select
              label="Related Project (Optional)"
              placeholder="Select project..."
              data={projects.map((p) => ({ value: p._id, label: p.name }))}
              clearable
              radius="md"
              {...form.getInputProps('relatedProject')}
            />

            <Group grow gap="md">
              <TextInput
                label="Due Date"
                type="date"
                placeholder="Select due date"
                radius="md"
                {...form.getInputProps('dueDate')}
              />
              <NumberInput
                label="Estimated Hours"
                placeholder="0"
                min={0}
                radius="md"
                {...form.getInputProps('estimatedTime')}
              />
            </Group>

            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={close} radius="md">
                Cancel
              </Button>
              <Button
                type="submit"
                radius="md"
                size="md"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                }}
              >
                {editingId ? 'Update To-Do' : 'Create To-Do'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        itemName={deleteTarget?.title}
      />
    </Container>
  );
};

export default TodosList;
