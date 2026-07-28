import React, { useState } from 'react';
import { Card, Text, Group, Table, Avatar, Badge, ActionIcon, Select, TextInput } from '@mantine/core';
import { Search, ExternalLink } from 'lucide-react';
import { Todo } from '../todos/todo.slice';
import { useNavigate } from 'react-router-dom';

interface Props {
  todos: Todo[];
}

export const TeamTodoOverview: React.FC<Props> = ({ todos }) => {
  const navigate = useNavigate();
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Apply filters
  const filteredTodos = todos
    .filter(t => !filterDepartment || (typeof t.user === 'object' && t.user?.department === filterDepartment))
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime());

  return (
    <Card shadow="sm" p="lg" radius="lg" withBorder style={{ borderColor: '#e5e7eb' }} mb="xl">
      <Group justify="space-between" mb="md">
        <Text fw={700} size="lg" style={{ color: '#111827' }}>Team Todo Overview</Text>
        <Group>
          <Select
            placeholder="Department"
            data={['design', 'development', 'seo']}
            value={filterDepartment}
            onChange={setFilterDepartment}
            clearable
            styles={{ input: { width: 140 } }}
          />
          <TextInput
            placeholder="Search todos..."
            leftSection={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            styles={{ input: { width: 200 } }}
          />
        </Group>
      </Group>

      <Table verticalSpacing="sm" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Team Member</Table.Th>
            <Table.Th>Todo</Table.Th>
            <Table.Th>Project</Table.Th>
            <Table.Th>Est. Time</Table.Th>
            <Table.Th>Due Date</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredTodos.slice(0, 10).map((todo) => {
            const user = typeof todo.user === 'object' ? todo.user : null;
            const project = typeof todo.relatedProject === 'object' ? todo.relatedProject : null;
            
            return (
              <Table.Tr key={todo._id}>
                <Table.Td>
                  <Group gap="sm">
                    <Avatar src={user?.avatarUrl} radius="xl" size="sm" color="blue">
                      {user?.name?.charAt(0)}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>{user?.name || 'Unassigned'}</Text>
                      <Text size="xs" c="dimmed">{user?.role?.replace('_', ' ')}</Text>
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>{todo.title}</Text>
                </Table.Td>
                <Table.Td>
                  {project ? (
                    <Text size="sm" c="blue" style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${project._id}`)}>
                      {project.name}
                    </Text>
                  ) : (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{todo.estimatedTime ? `${todo.estimatedTime}h` : '-'}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : '-'}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge 
                    color={todo.status === 'done' ? 'green' : todo.status === 'in_progress' ? 'blue' : 'gray'}
                    variant="light"
                  >
                    {todo.status.replace('_', ' ')}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <ActionIcon variant="light" color="blue" onClick={() => navigate('/todos')}>
                    <ExternalLink size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            );
          })}
          {filteredTodos.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7} ta="center" py="xl">
                <Text color="dimmed">No todos found for the selected criteria.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Card>
  );
};
