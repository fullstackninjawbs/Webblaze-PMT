import { useGetTodosQuery, useCreateTodoMutation, useUpdateTodoMutation, useDeleteTodoMutation } from './todo.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { Container, Title, Text, Button, Group, Card, Badge, Stack, Modal, TextInput, Select, NumberInput, Table, ActionIcon, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { Plus, Edit2, Trash, CheckCircle } from 'lucide-react';

import { useState } from 'react';

export const TodosList = () => {
  const { data: todosData, isLoading } = useGetTodosQuery();
  const { data: projectsData } = useGetProjectsQuery();

  const [createTodo] = useCreateTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();

  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this to-do?')) {
      await deleteTodo(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'blue';
      case 'done': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Container size="xl" py="xl">
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
            Team To-Dos
          </Title>
          <Text
            size="sm"
            mt={6}
            style={{ color: '#94a3b8', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}
          >
            Manage your personal and team tasks
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          color="blue"
          onClick={() => handleOpenModal()}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
          }}
        >
          Add To-Do
        </Button>
      </Group>

      <Card
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          border: '1px solid #e8ecf4',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Project</Table.Th>
              <Table.Th>Assigned To</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {todos.map((todo) => (
              <Table.Tr key={todo._id}>
                <Table.Td><Text fw={500} size="sm">{todo.title}</Text></Table.Td>
                <Table.Td>
                  <Text size="sm" color="dimmed">
                    {todo.relatedProject ? todo.relatedProject.name : 'None'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{todo.user?.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {todo.dueDate ? new Intl.DateTimeFormat('en-GB').format(new Date(todo.dueDate)) : '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu shadow="sm" width={150}>
                    <Menu.Target>
                      <Badge
                        variant="light"
                        color={getStatusColor(todo.status)}
                        style={{ cursor: 'pointer' }}
                      >
                        {todo.status.replace('_', ' ')}
                      </Badge>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={() => handleStatusChange(todo._id, 'pending')}>Pending</Menu.Item>
                      <Menu.Item onClick={() => handleStatusChange(todo._id, 'in_progress')}>In Progress</Menu.Item>
                      <Menu.Item onClick={() => handleStatusChange(todo._id, 'done')}>Done</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    {todo.status !== 'done' && (
                      <ActionIcon color="green" variant="light" onClick={() => handleStatusChange(todo._id, 'done')}>
                        <CheckCircle size={16} />
                      </ActionIcon>
                    )}
                    <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenModal(todo)} title="Edit">
                      <Edit2 size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(todo._id)} title="Delete">
                      <Trash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {todos.length === 0 && !isLoading && (
              <Table.Tr>
                <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  <Text color="dimmed">No to-dos found.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={opened} onClose={close} title={editingId ? 'Edit To-Do' : 'Create To-Do'}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput required label="Title" placeholder="What needs to be done?" {...form.getInputProps('title')} />

            <Select
              label="Related Project (Optional)"
              placeholder="Select project"
              data={projects.map(p => ({ value: p._id, label: p.name }))}
              clearable
              {...form.getInputProps('relatedProject')}
            />

            <TextInput
              label="Due Date"
              type="date"
              placeholder="Select due date"
              {...form.getInputProps('dueDate')}
            />

            <NumberInput
              label="Estimated Time (Hours)"
              placeholder="0"
              min={0}
              {...form.getInputProps('estimatedTime')}
            />

            <Button type="submit" fullWidth>
              {editingId ? 'Update To-Do' : 'Create To-Do'}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
};
