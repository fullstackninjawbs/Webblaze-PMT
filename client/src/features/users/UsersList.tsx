import React, { useState, useMemo } from 'react';
import {
  useGetUsersQuery,
  useRegisterUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from './user.slice';
import {
  Table,
  Button,
  Group,
  Title,
  Modal,
  TextInput,
  Select,
  Card,
  Text,
  Badge,
  ActionIcon,
  PasswordInput,
  Paper,
  SimpleGrid,
  Stack,
  Alert,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import {
  Plus,
  Mail,
  Edit,
  Trash,
  Search,
  Users,
  ShieldCheck,
  UserCheck,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { UserAvatar } from '../../components/common/UserAvatar';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

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

  const [invitedUserSuccess, setInvitedUserSuccess] = useState<{ email: string; name: string } | null>(null);

  const onSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        ...values,
        department: values.department || undefined,
      };
      await registerUser(payload as any).unwrap();
      setModalOpened(false);
      setInvitedUserSuccess({ email: values.email, name: values.name });
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
        },
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

  const users = usersData?.data || [];

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = users.length;
    const adminPmCount = users.filter((u) => u.role === Role.ADMIN || u.role === Role.PM).length;
    const tlCount = users.filter((u) => u.role === Role.TEAM_LEAD).length;
    const memberCount = users.filter((u) => u.role === Role.TEAM_MEMBER).length;
    return { totalCount, adminPmCount, tlCount, memberCount };
  }, [users]);

  const rows = filteredUsers.map((user) => (
    <Table.Tr key={user._id}>
      <Table.Td>
        <Group gap="sm">
          <UserAvatar
            name={user.name}
            email={user.email}
            avatarUrl={user.avatarUrl}
            size={36}
          />
          <div>
            <Text size="sm" fw={700} style={{ color: '#0f172a' }}>
              {user.name || 'Unknown User'}
            </Text>
            <Text size="xs" style={{ color: '#64748b' }}>
              <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
              {user.email}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge
          variant="light"
          radius="sm"
          fw={600}
          color={
            user.role === Role.ADMIN
              ? 'red'
              : user.role === Role.PM
              ? 'grape'
              : user.role === Role.TEAM_LEAD
              ? 'blue'
              : 'gray'
          }
        >
          {user.role.replace('_', ' ')}
        </Badge>
      </Table.Td>
      <Table.Td>
        {user.department ? (
          <Badge variant="outline" color="dark" radius="sm" fw={600}>
            {user.department.toUpperCase()}
          </Badge>
        ) : (
          <Text size="xs" style={{ color: '#94a3b8' }}>
            -
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => openEditModal(user)}
            title="Edit Role"
          >
            <Edit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDelete(user._id, user.name)}
            title="Remove User"
          >
            <Trash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
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
            Team Roster & Access
          </Title>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            Invite team members, assign department roles, and manage system permissions.
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          radius="md"
          size="md"
          onClick={() => setModalOpened(true)}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
          }}
        >
          Invite Member
        </Button>
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" mb="xl">
        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Total Members
            </Text>
            <Paper p={8} radius="md" bg="#eff6ff">
              <Users size={18} color="#2563eb" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
            {metrics.totalCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Admins & PMs
            </Text>
            <Paper p={8} radius="md" bg="#fef2f2">
              <ShieldCheck size={18} color="#ef4444" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#ef4444', lineHeight: 1 }}>
            {metrics.adminPmCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Team Leads
            </Text>
            <Paper p={8} radius="md" bg="#f0fdf4">
              <UserCheck size={18} color="#10b981" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#10b981', lineHeight: 1 }}>
            {metrics.tlCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Team Members
            </Text>
            <Paper p={8} radius="md" bg="#f3e8ff">
              <Users size={18} color="#9333ea" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#9333ea', lineHeight: 1 }}>
            {metrics.memberCount}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Filter Toolbar */}
      <Paper p="md" radius="lg" withBorder mb="lg" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
        <Group justify="space-between">
          <TextInput
            placeholder="Search member by name or email..."
            leftSection={<Search size={16} color="#94a3b8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 320 }}
            radius="md"
          />
          <Group gap="sm">
            <Filter size={16} color="#64748b" />
            <Select
              placeholder="Filter Role"
              data={[
                { value: Role.ADMIN, label: 'Admin' },
                { value: Role.PM, label: 'Project Manager' },
                { value: Role.TEAM_LEAD, label: 'Team Lead' },
                { value: Role.TEAM_MEMBER, label: 'Team Member' },
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
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
        p={0}
        radius="xl"
        withBorder
        style={{
          borderColor: '#e8ecf4',
          boxShadow: 'none',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" horizontalSpacing="lg">
            <Table.Thead style={{ backgroundColor: '#f8faff' }}>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th w={100}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows?.length ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                    <Text style={{ color: '#64748b' }} fw={500}>
                      No team members found matching criteria.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Text fw={700} size="lg">
            Invite Team Member
          </Text>
        }
        radius="lg"
        padding="xl"
        size={520}
      >
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Full Name"
              placeholder="Jane Doe"
              withAsterisk
              radius="md"
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Email Address"
              placeholder="jane@webblaze.com"
              withAsterisk
              radius="md"
              {...form.getInputProps('email')}
            />

            <Group grow gap="md">
              <Select
                label="Role"
                data={[
                  { value: Role.ADMIN, label: 'Admin' },
                  { value: Role.PM, label: 'Project Manager' },
                  { value: Role.TEAM_LEAD, label: 'Team Lead' },
                  { value: Role.TEAM_MEMBER, label: 'Team Member' },
                ]}
                withAsterisk
                radius="md"
                {...form.getInputProps('role')}
              />
              <Select
                label="Department"
                placeholder="Optional"
                data={[
                  { value: 'design', label: 'Design' },
                  { value: 'development', label: 'Development' },
                  { value: 'seo', label: 'SEO' },
                ]}
                radius="md"
                {...form.getInputProps('department')}
              />
            </Group>
            <PasswordInput
              label="Temporary Password"
              placeholder="At least 6 characters"
              withAsterisk
              radius="md"
              {...form.getInputProps('password')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={() => setModalOpened(false)} radius="md">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isRegistering}
                radius="md"
                size="md"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                }}
              >
                Send Invite
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title={
          <Text fw={700} size="lg">
            Edit Team Member Access
          </Text>
        }
        radius="lg"
        padding="xl"
        size={520}
      >
        {editingUser && (
          <form onSubmit={editForm.onSubmit(onEditSubmit)}>
            <Stack gap="md">
              <TextInput label="Full Name" value={editingUser.name || ''} disabled radius="md" />
              <TextInput label="Email Address" value={editingUser.email || ''} disabled radius="md" />

              <Group grow gap="md">
                <Select
                  label="Role"
                  data={[
                    { value: Role.ADMIN, label: 'Admin' },
                    { value: Role.PM, label: 'Project Manager' },
                    { value: Role.TEAM_LEAD, label: 'Team Lead' },
                    { value: Role.TEAM_MEMBER, label: 'Team Member' },
                  ]}
                  withAsterisk
                  radius="md"
                  {...editForm.getInputProps('role')}
                />
                <Select
                  label="Department"
                  placeholder="None"
                  data={[
                    { value: 'design', label: 'Design' },
                    { value: 'development', label: 'Development' },
                    { value: 'seo', label: 'SEO' },
                  ]}
                  clearable
                  radius="md"
                  {...editForm.getInputProps('department')}
                />
              </Group>

              <Group justify="flex-end" mt="md">
                <Button
                  variant="light"
                  color="gray"
                  onClick={() => setEditModalOpened(false)}
                  radius="md"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isUpdating}
                  radius="md"
                  size="md"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                  }}
                >
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove User"
        itemName={deleteTarget?.name}
      />

      {/* Invitation Success Modal */}
      <Modal
        opened={!!invitedUserSuccess}
        onClose={() => setInvitedUserSuccess(null)}
        title={<Group gap="xs"><CheckCircle2 color="#10b981" size={20} /><Text fw={700}>Invitation Dispatched</Text></Group>}
        radius="lg"
      >
        <Stack gap="md">
          <Alert color="green" variant="light" radius="md">
            Team member <strong>{invitedUserSuccess?.name}</strong> ({invitedUserSuccess?.email}) was successfully registered and invited!
          </Alert>

          <Text size="xs" c="dimmed">
            If your real SMTP details (e.g. Gmail/SendGrid) are configured in <code>server/.env</code>, an email was sent directly to their inbox.
          </Text>

          <Button color="blue" radius="md" onClick={() => setInvitedUserSuccess(null)}>
            Done
          </Button>
        </Stack>
      </Modal>
    </div>
  );
};

export default UsersList;
