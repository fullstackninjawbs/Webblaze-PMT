import React, { useState } from 'react';
import { useGetUsersQuery, useRegisterUserMutation, useUpdateUserMutation, useDeleteUserMutation } from './user.slice';
import { Table, Button, Group, Title, Modal, TextInput, Select, Card, Text, Badge, ActionIcon, PasswordInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Plus, Mail, Edit, Trash } from 'lucide-react';
import { Role } from '../../types';

import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

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
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [modalOpened, setModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

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

  const editForm = useForm({
    initialValues: {
      role: Role.TEAM_MEMBER,
      department: '',
    },
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

  const openEditModal = (user: any) => {
    setEditingUser(user);
    editForm.setValues({
      role: user.role,
      department: user.department || '',
    });
    setEditModalOpened(true);
  };

  const onEditSubmit = async (values: typeof editForm.values) => {
    if (!editingUser) return;
    try {
      await updateUser({
        id: editingUser._id,
        data: {
          role: values.role,
          department: values.department || undefined,
        }
      }).unwrap();
      setEditModalOpened(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user role', error);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteUser(deleteTarget.id).unwrap();
      setDeleteTarget(null);
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
        <Group gap={4} wrap="nowrap">
          <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(user)} title="Edit Role">
            <Edit size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(user._id, user.name)} title="Remove User">
            <Trash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
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
            Team Directory
          </Title>
          <Text
            size="sm"
            mt={4}
            style={{ color: '#64748b', letterSpacing: '-0.01em' }}
          >
            Manage team members, roles, and access.
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          radius="md"
          variant="filled"
          onClick={() => setModalOpened(true)}
          style={{
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
          }}
        >
          Invite Member
        </Button>
      </Group>

      <Card
        shadow="sm"
        p="0"
        radius="xl"
        withBorder
        style={{
          border: '1px solid #e8ecf4',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" horizontalSpacing="xl">
            <Table.Thead>
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
            <Button type="submit" loading={isRegistering}>Send Invite</Button>
          </Group>
        </form>
      </Modal>

      <Modal opened={editModalOpened} onClose={() => setEditModalOpened(false)} title={<Text fw={600}>Edit Team Member</Text>} radius="md">
        {editingUser && (
          <form onSubmit={editForm.onSubmit(onEditSubmit)}>
            <TextInput label="Full Name" value={editingUser.name || ''} disabled mb="md" />
            <TextInput label="Email Address" value={editingUser.email || ''} disabled mb="md" />
            
            <Group grow mb="xl">
              <Select 
                label="Role" 
                data={[
                  { value: Role.ADMIN, label: 'Admin' },
                  { value: Role.PM, label: 'Project Manager' },
                  { value: Role.TEAM_LEAD, label: 'Team Lead' },
                  { value: Role.TEAM_MEMBER, label: 'Team Member' },
                ]} 
                required
                {...editForm.getInputProps('role')}
              />
              <Select 
                label="Department" 
                placeholder="None"
                data={[{ value: 'design', label: 'Design' }, { value: 'development', label: 'Development' }, { value: 'seo', label: 'SEO' }]} 
                clearable
                {...editForm.getInputProps('department')}
              />
            </Group>

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setEditModalOpened(false)}>Cancel</Button>
              <Button type="submit" loading={isUpdating}>Save Changes</Button>
            </Group>
          </form>
        )}
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove User"
        itemName={deleteTarget?.name}
      />
    </div>
  );
};
