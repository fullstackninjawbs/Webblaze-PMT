import React, { useState } from 'react';
import { useGetUsersQuery, useRegisterUserMutation, useDeleteUserMutation } from './user.slice';
import { Table, Button, Group, Title, Modal, TextInput, Select, Card, Text, Badge, ActionIcon, Menu, PasswordInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Plus, Mail, MoreVertical, Edit, Trash } from 'lucide-react';
import { Role } from '../../types';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role),
  department: z.string().optional(),
});

export const UsersList: React.FC = () => {
  const { data: usersData } = useGetUsersQuery();
  const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [modalOpened, setModalOpened] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: Role.TEAM_MEMBER,
      department: '',
    },
    validate: zodResolver(registerSchema),
  });

  const onSubmit = async (values: typeof form.values) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await registerUser(values as any).unwrap();
      setModalOpened(false);
      form.reset();
    } catch (error) {
      console.error('Failed to register user', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      await deleteUser(id).unwrap();
    }
  };

  const rows = usersData?.data.map((user) => (
    <Table.Tr key={user._id}>
      <Table.Td>
        <Group gap="sm">
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA', fontWeight: 600 }}>
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <Text size="sm" fw={600}>{user.name || 'Unknown User'}</Text>
            <Text size="xs" c="dimmed">
              <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
              {user.email}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge 
          variant="light" 
          color={
            user.role === Role.ADMIN ? 'red' : 
            user.role === Role.PM ? 'grape' : 
            user.role === Role.TEAM_LEAD ? 'blue' : 'gray'
          }
        >
          {user.role.replace('_', ' ')}
        </Badge>
      </Table.Td>
      <Table.Td>
        {user.department ? (
          <Badge variant="outline" color="dark">{user.department}</Badge>
        ) : (
          <Text size="xs" c="dimmed">-</Text>
        )}
      </Table.Td>
      <Table.Td>
        <Menu position="bottom-end" shadow="sm">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <MoreVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<Edit size={14} />}>Edit Role</Menu.Item>
            <Menu.Item color="red" leftSection={<Trash size={14} />} onClick={() => handleDelete(user._id)}>Remove User</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div style={{ animation: 'fade-in 0.4s ease-out' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#111827', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Team Directory
          </Title>
          <Text color="dimmed" size="sm">Manage team members, roles, and access.</Text>
        </div>
        <Button 
          leftSection={<Plus size={18} />} 
          radius="md" 
          variant="filled" 
          color="grape"
          onClick={() => setModalOpened(true)}
        >
          Invite Member
        </Button>
      </Group>

      <Card shadow="sm" p="0" radius="xl" withBorder style={{ border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}>
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" horizontalSpacing="xl" striped>
            <Table.Thead style={{ backgroundColor: '#F9FAFB' }}>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th w={80}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows?.length ? rows : (
                <Table.Tr>
                  <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                    <Text c="dimmed">No team members found.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={<Text fw={600}>Invite Team Member</Text>} radius="md">
        <form onSubmit={form.onSubmit(onSubmit)}>
          <TextInput label="Full Name" placeholder="Jane Doe" required mb="md" {...form.getInputProps('name')} />
          <TextInput label="Email Address" placeholder="jane@webblaze.com" required mb="md" {...form.getInputProps('email')} />
          
          <Group grow mb="md">
            <Select 
              label="Role" 
              data={[
                { value: Role.ADMIN, label: 'Admin' },
                { value: Role.PM, label: 'Project Manager' },
                { value: Role.TEAM_LEAD, label: 'Team Lead' },
                { value: Role.TEAM_MEMBER, label: 'Team Member' },
              ]} 
              required
              {...form.getInputProps('role')}
            />
            <Select 
              label="Department" 
              placeholder="Optional"
              data={[{ value: 'design', label: 'Design' }, { value: 'development', label: 'Development' }, { value: 'seo', label: 'SEO' }]} 
              {...form.getInputProps('department')}
            />
          </Group>
          <PasswordInput label="Temporary Password" placeholder="At least 6 characters" required mb="xl" {...form.getInputProps('password')} />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalOpened(false)}>Cancel</Button>
            <Button type="submit" color="grape" loading={isRegistering}>Send Invite</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
};
