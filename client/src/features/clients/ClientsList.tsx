import React, { useState, useMemo } from 'react';
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from './client.slice';
import {
  Table,
  Button,
  Group,
  Title,
  Drawer,
  TextInput,
  Select,
  Card,
  Text,
  Badge,
  ActionIcon,
  Divider,
  Stack,
  Paper,
  SimpleGrid,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  Plus,
  Building2,
  Edit,
  Trash,
  Eye,
  Search,
  Filter,
  Users,
  Globe,
  Clock,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';
import { useGetProjectsQuery } from '../projects/project.slice';

import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').or(z.literal('')),
  companyName: z.string().optional(),
  source: z.enum(['upwork', 'direct']),
  billingType: z.enum(['hourly', 'fixed']),
  country: z.string().optional(),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
});

export const ClientsList: React.FC = () => {
  const { data } = useGetClientsQuery();
  const { data: projectsData } = useGetProjectsQuery();
  const navigate = useNavigate();
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const [deleteClient] = useDeleteClientMutation();

  const [drawerOpened, setDrawerOpened] = useState(false);
  const [viewDrawerOpened, setViewDrawerOpened] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [billingFilter, setBillingFilter] = useState<string | null>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const isAdminOrPM = user?.role === Role.ADMIN || user?.role === Role.PM;

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      companyName: '',
      source: 'upwork',
      billingType: 'hourly',
      country: '',
      address: '',
      contactNumber: '',
    },
    validate: zodResolver(clientSchema),
  });

  const openCreateDrawer = () => {
    setSelectedClient(null);
    form.reset();
    setDrawerOpened(true);
  };

  const openEditDrawer = (client: any) => {
    setSelectedClient(client);
    form.setValues({
      name: client.name || '',
      email: client.email || '',
      companyName: client.companyName || '',
      source: client.source || 'upwork',
      billingType: client.billingType || 'hourly',
      country: client.country || '',
      address: client.address || '',
      contactNumber: client.contactNumber || '',
    });
    setDrawerOpened(true);
  };

  const openViewDrawer = (client: any) => {
    setSelectedClient(client);
    setViewDrawerOpened(true);
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteClient(deleteTarget.id).unwrap();
      setDeleteTarget(null);
    }
  };

  const onSubmit = async (values: typeof form.values) => {
    try {
      if (selectedClient) {
        await updateClient({ id: selectedClient._id, data: values as any }).unwrap();
      } else {
        await createClient(values as any).unwrap();
      }
      setDrawerOpened(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save client', error);
    }
  };

  const clients = data?.data || [];

  // Filter clients
  const filteredClients = useMemo(() => {
    let result = clients;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.companyName?.toLowerCase().includes(q)
      );
    }

    if (sourceFilter) {
      result = result.filter((c) => c.source === sourceFilter);
    }

    if (billingFilter) {
      result = result.filter((c) => c.billingType === billingFilter);
    }

    return result;
  }, [clients, searchQuery, sourceFilter, billingFilter]);

  // Compute active projects per client
  const projects = projectsData?.data || [];
  const getActiveProjectsCount = (clientId: string) => {
    return projects.filter((p) => (p.client as any)?._id === clientId && p.status === 'active').length;
  };
  const getClientProjects = (clientId: string) => {
    return projects.filter(
      (p) => (p.client as any)?._id === clientId || (p.client as any) === clientId
    );
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalClients = clients.length;
    const upworkCount = clients.filter((c) => c.source === 'upwork').length;
    const directCount = clients.filter((c) => c.source === 'direct').length;
    const hourlyCount = clients.filter((c) => c.billingType === 'hourly').length;
    return { totalClients, upworkCount, directCount, hourlyCount };
  }, [clients]);

  const rows = filteredClients.map((client) => (
    <Table.Tr key={client._id}>
      <Table.Td>
        <Group gap="sm">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Text fw={700} style={{ color: '#2563eb' }}>
              {client.name.charAt(0).toUpperCase()}
            </Text>
          </div>
          <div>
            <Text size="sm" fw={700} style={{ color: '#0f172a' }}>
              {client.name}
            </Text>
            {client.companyName && (
              <Text size="xs" style={{ color: '#64748b' }}>
                <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                {client.companyName}
              </Text>
            )}
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" style={{ color: '#64748b' }}>
          {client.country || '-'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge
          variant="light"
          radius="sm"
          fw={600}
          color={client.source === 'upwork' ? 'green' : 'blue'}
        >
          {client.source}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge
          variant="dot"
          radius="sm"
          fw={600}
          color={client.billingType === 'hourly' ? 'orange' : 'teal'}
        >
          {client.billingType}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={700} style={{ color: '#0f172a' }}>
          {getActiveProjectsCount(client._id)}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <ActionIcon variant="subtle" color="blue" onClick={() => openViewDrawer(client)}>
            <Eye size={16} />
          </ActionIcon>
          {isAdminOrPM && (
            <>
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => openEditDrawer(client)}
                title="Edit"
              >
                <Edit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => handleDelete(client._id, client.name)}
                title="Delete"
              >
                <Trash size={16} />
              </ActionIcon>
            </>
          )}
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
            Client Directory
          </Title>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            Manage client profiles, company contacts, lead channels, and billing models.
          </Text>
        </div>
        {isAdminOrPM && (
          <Button
            leftSection={<Plus size={16} />}
            radius="md"
            size="md"
            onClick={openCreateDrawer}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
            }}
          >
            Add Client
          </Button>
        )}
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" mb="xl">
        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Total Accounts
            </Text>
            <Paper p={8} radius="md" bg="#eff6ff">
              <Users size={18} color="#2563eb" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
            {metrics.totalClients}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Upwork Escrow
            </Text>
            <Paper p={8} radius="md" bg="#f0fdf4">
              <Globe size={18} color="#10b981" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#10b981', lineHeight: 1 }}>
            {metrics.upworkCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Direct Retainers
            </Text>
            <Paper p={8} radius="md" bg="#eff6ff">
              <Building2 size={18} color="#2563eb" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#2563eb', lineHeight: 1 }}>
            {metrics.directCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Hourly Billing
            </Text>
            <Paper p={8} radius="md" bg="#fffbeb">
              <Clock size={18} color="#f59e0b" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#d97706', lineHeight: 1 }}>
            {metrics.hourlyCount}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Filter Toolbar */}
      <Paper p="md" radius="lg" withBorder mb="lg" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
        <Group align="center" justify="space-between">
          <TextInput
            placeholder="Search client name or company..."
            leftSection={<Search size={16} color="#94a3b8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ width: 320 }}
            radius="md"
          />
          <Group gap="sm">
            <Filter size={16} color="#64748b" />
            <Select
              placeholder="Filter Source"
              data={[
                { value: 'upwork', label: 'Upwork' },
                { value: 'direct', label: 'Direct' },
              ]}
              value={sourceFilter}
              onChange={setSourceFilter}
              clearable
              style={{ width: 160 }}
              radius="md"
            />
            <Select
              placeholder="Filter Billing"
              data={[
                { value: 'hourly', label: 'Hourly' },
                { value: 'fixed', label: 'Fixed Price' },
              ]}
              value={billingFilter}
              onChange={setBillingFilter}
              clearable
              style={{ width: 160 }}
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
                <Table.Th>Client</Table.Th>
                <Table.Th>Country</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Billing Type</Table.Th>
                <Table.Th>Active Projects</Table.Th>
                <Table.Th w={100}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows?.length ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    <Text style={{ color: '#64748b' }} fw={500}>
                      No clients found matching criteria.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      {/* Add/Edit Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        title={
          <Text fw={700} size="lg">
            {selectedClient ? 'Edit Client Profile' : 'Add New Client'}
          </Text>
        }
        position="right"
        size="md"
        padding="xl"
      >
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="lg">
            <div>
              <Text fw={700} size="xs" mb="xs" style={{ color: '#2563eb', letterSpacing: '0.05em' }} tt="uppercase">
                Identity & Company
              </Text>
              <Stack gap="sm">
                <TextInput
                  label="Client Name"
                  placeholder="e.g. John Doe"
                  withAsterisk
                  radius="md"
                  {...form.getInputProps('name')}
                />
                <TextInput
                  label="Company Name"
                  placeholder="e.g. Acme Corp (Optional)"
                  radius="md"
                  {...form.getInputProps('companyName')}
                />
                <TextInput
                  label="Country"
                  placeholder="e.g. United States"
                  radius="md"
                  {...form.getInputProps('country')}
                />
                <TextInput
                  label="Address"
                  placeholder="e.g. 123 Main St, City"
                  radius="md"
                  {...form.getInputProps('address')}
                />
              </Stack>
            </div>
            <Divider color="#e8ecf4" />

            <div>
              <Text fw={700} size="xs" mb="xs" style={{ color: '#2563eb', letterSpacing: '0.05em' }} tt="uppercase">
                Contact Information
              </Text>
              <Stack gap="sm">
                <TextInput
                  label="Email Address"
                  placeholder="client@example.com"
                  radius="md"
                  {...form.getInputProps('email')}
                />
                <TextInput
                  label="Contact Phone"
                  placeholder="+1 (555) 123-4567"
                  radius="md"
                  {...form.getInputProps('contactNumber')}
                />
              </Stack>
            </div>
            <Divider color="#e8ecf4" />

            <div>
              <Text fw={700} size="xs" mb="xs" style={{ color: '#2563eb', letterSpacing: '0.05em' }} tt="uppercase">
                Business & Billing
              </Text>
              <Group grow gap="md">
                <Select
                  label="Source"
                  data={[
                    { value: 'upwork', label: 'Upwork' },
                    { value: 'direct', label: 'Direct' },
                  ]}
                  radius="md"
                  {...form.getInputProps('source')}
                />
                <Select
                  label="Billing Type"
                  data={[
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'fixed', label: 'Fixed Price' },
                  ]}
                  radius="md"
                  {...form.getInputProps('billingType')}
                />
              </Group>
            </div>

            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={() => setDrawerOpened(false)} radius="md">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isCreating || isUpdating}
                radius="md"
                size="md"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                }}
              >
                {selectedClient ? 'Update Client' : 'Create Client'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Drawer>

      {/* View Drawer */}
      <Drawer
        opened={viewDrawerOpened}
        onClose={() => setViewDrawerOpened(false)}
        title={
          <Text fw={700} size="lg">
            Client Profile Overview
          </Text>
        }
        position="right"
        size="md"
        padding="xl"
      >
        {selectedClient && (
          <Stack gap="lg">
            <Group gap="md">
              <Paper
                p={10}
                radius="xl"
                bg="#eff6ff"
                style={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text fw={800} style={{ color: '#2563eb', fontSize: '20px' }}>
                  {selectedClient.name.charAt(0).toUpperCase()}
                </Text>
              </Paper>
              <div>
                <Text fw={700} size="lg" style={{ color: '#0f172a' }}>
                  {selectedClient.name}
                </Text>
                {selectedClient.companyName && (
                  <Text size="sm" style={{ color: '#64748b' }}>
                    <Building2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                    {selectedClient.companyName}
                  </Text>
                )}
              </div>
            </Group>

            <Divider color="#e8ecf4" />

            <div>
              <Text fw={700} size="xs" mb="xs" style={{ color: '#64748b', letterSpacing: '0.05em' }} tt="uppercase">
                Contact Details
              </Text>
              <Stack gap={4}>
                <Text size="sm" style={{ color: '#334155' }}>
                  <strong>Email:</strong> {selectedClient.email || 'N/A'}
                </Text>
                <Text size="sm" style={{ color: '#334155' }}>
                  <strong>Phone:</strong> {selectedClient.contactNumber || 'N/A'}
                </Text>
                <Text size="sm" style={{ color: '#334155' }}>
                  <strong>Country:</strong> {selectedClient.country || 'N/A'}
                </Text>
                <Text size="sm" style={{ color: '#334155' }}>
                  <strong>Address:</strong> {selectedClient.address || 'N/A'}
                </Text>
              </Stack>
            </div>

            <Divider color="#e8ecf4" />

            <div>
              <Text fw={700} size="xs" mb="xs" style={{ color: '#64748b', letterSpacing: '0.05em' }} tt="uppercase">
                Engagement & Billing
              </Text>
              <Group gap="md">
                <div>
                  <Text size="xs" style={{ color: '#64748b' }}>
                    Channel
                  </Text>
                  <Badge variant="light" radius="sm" color={selectedClient.source === 'upwork' ? 'green' : 'blue'}>
                    {selectedClient.source}
                  </Badge>
                </div>
                <div>
                  <Text size="xs" style={{ color: '#64748b' }}>
                    Billing Type
                  </Text>
                  <Badge variant="dot" radius="sm" color={selectedClient.billingType === 'hourly' ? 'orange' : 'teal'}>
                    {selectedClient.billingType}
                  </Badge>
                </div>
                <div>
                  <Text size="xs" style={{ color: '#64748b' }}>
                    Active Projects
                  </Text>
                  <Text size="sm" fw={700} style={{ color: '#0f172a' }}>
                    {getActiveProjectsCount(selectedClient._id)}
                  </Text>
                </div>
              </Group>
            </div>

            <Divider color="#e8ecf4" />

            <div>
              <Text fw={700} size="xs" mb="xs" style={{ color: '#64748b', letterSpacing: '0.05em' }} tt="uppercase">
                Associated Projects
              </Text>
              {getClientProjects(selectedClient._id).length === 0 ? (
                <Text size="sm" style={{ color: '#64748b' }}>
                  No projects found for this client.
                </Text>
              ) : (
                <Stack gap="xs">
                  {getClientProjects(selectedClient._id).map((proj) => (
                    <Paper
                      key={proj._id}
                      withBorder
                      p="sm"
                      radius="md"
                      style={{
                        borderColor: '#e8ecf4',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <Text
                          size="sm"
                          fw={700}
                          style={{ cursor: 'pointer', color: '#2563eb' }}
                          onClick={() => {
                            setViewDrawerOpened(false);
                            navigate(`/projects/${proj._id}`);
                          }}
                        >
                          {proj.name}
                        </Text>
                        <Text size="xs" style={{ color: '#64748b' }}>
                          {proj.type || 'Web App'}
                        </Text>
                      </div>
                      <Badge
                        size="xs"
                        variant="light"
                        radius="sm"
                        color={proj.status === 'active' ? 'green' : proj.status === 'on_hold' ? 'orange' : 'blue'}
                      >
                        {proj.status}
                      </Badge>
                    </Paper>
                  ))}
                </Stack>
              )}
            </div>

            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={() => setViewDrawerOpened(false)} radius="md">
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Client"
        itemName={deleteTarget?.name}
      />
    </div>
  );
};

export default ClientsList;
