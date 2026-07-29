import React, { useState, useMemo } from 'react';
import { useGetClientsQuery, useCreateClientMutation, useUpdateClientMutation, useDeleteClientMutation } from './client.slice';
import { Table, Button, Group, Title, Drawer, TextInput, Select, Card, Text, Badge, ActionIcon, Divider, Stack, Paper } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Plus, Building2, Edit, Trash, Eye, Search, Filter } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';
import { useGetProjectsQuery } from '../projects/project.slice';

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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(id).unwrap();
      } catch (error) {
        console.error('Failed to delete client', error);
      }
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

  // Filter clients
  const filteredClients = useMemo(() => {
    let result = data?.data || [];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.companyName?.toLowerCase().includes(q));
    }
    
    if (sourceFilter) {
      result = result.filter(c => c.source === sourceFilter);
    }

    if (billingFilter) {
      result = result.filter(c => c.billingType === billingFilter);
    }

    return result;
  }, [data, searchQuery, sourceFilter, billingFilter]);

  // Compute active projects per client
  const projects = projectsData?.data || [];
  const getActiveProjectsCount = (clientId: string) => {
    return projects.filter(p => (p.client as any)?._id === clientId && p.status === 'active').length;
  };
  const getClientProjects = (clientId: string) => {
    return projects.filter(p => (p.client as any)?._id === clientId || (p.client as any) === clientId);
  };

  const rows = filteredClients.map((client) => (
    <Table.Tr key={client._id}>
      <Table.Td>
        <Group gap="sm">
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 600 }}>
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <Text size="sm" fw={500}>{client.name}</Text>
            {client.companyName && (
              <Text size="xs" c="dimmed">
                <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                {client.companyName}
              </Text>
            )}
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">{client.country || '-'}</Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color={client.source === 'upwork' ? 'green' : 'blue'}>
          {client.source}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge variant="dot" color={client.billingType === 'hourly' ? 'orange' : 'teal'}>
          {client.billingType}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={600}>{getActiveProjectsCount(client._id)}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <ActionIcon variant="subtle" color="blue" onClick={() => openViewDrawer(client)}>
            <Eye size={16} />
          </ActionIcon>
          {isAdminOrPM && (
            <>
              <ActionIcon variant="subtle" color="blue" onClick={() => openEditDrawer(client)} title="Edit">
                <Edit size={16} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(client._id)} title="Delete">
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
            Clients
          </Title>
          <Text
            size="sm"
            mt={6}
            style={{
              color: '#94a3b8',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            Manage your clients and their billing details.
          </Text>
        </div>
        {isAdminOrPM && (
          <Button
            leftSection={<Plus size={16} />}
            radius="md"
            variant="filled"
            color="blue"
            onClick={openCreateDrawer}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              letterSpacing: '-0.01em',
              boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
            }}
          >
            Add Client
          </Button>
        )}
      </Group>

      {/* Filters */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e8ecf4',
        borderRadius: '14px',
        padding: '14px 18px',
        marginBottom: '20px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}>
        <Group align="flex-end">
          <TextInput
            placeholder="Search clients or companies..."
            leftSection={<Search size={15} color="#94a3b8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <Select
            placeholder="Filter Source"
            leftSection={<Filter size={15} color="#94a3b8" />}
            data={[{ value: 'upwork', label: 'Upwork' }, { value: 'direct', label: 'Direct' }]}
            value={sourceFilter}
            onChange={setSourceFilter}
            clearable
            style={{ width: '150px' }}
          />
          <Select
            placeholder="Filter Billing"
            leftSection={<Filter size={15} color="#94a3b8" />}
            data={[{ value: 'hourly', label: 'Hourly' }, { value: 'fixed', label: 'Fixed Price' }]}
            value={billingFilter}
            onChange={setBillingFilter}
            clearable
            style={{ width: '150px' }}
          />
        </Group>
      </div>

      <Card shadow="sm" p="0" radius="xl" withBorder style={{
        border: '1px solid #e8ecf4',
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.05)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" horizontalSpacing="xl" striped>
            <Table.Thead style={{ backgroundColor: '#F9FAFB' }}>
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
              {rows?.length ? rows : (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    <Text c="dimmed">No clients found.</Text>
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
        title={<Text fw={700} size="lg">{selectedClient ? 'Edit Client' : 'Add New Client'}</Text>}
        position="right"
        size="md"
        padding="xl"
      >
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="xl">
            {/* Section 1: Identity */}
            <div>
              <Text fw={600} size="sm" mb="sm" c="blue">Identity</Text>
              <TextInput label="Client Name" placeholder="e.g. John Doe" required mb="sm" {...form.getInputProps('name')} />
              <TextInput label="Company Name" placeholder="e.g. Acme Corp (Optional)" mb="sm" {...form.getInputProps('companyName')} />
              <TextInput label="Country" placeholder="e.g. United States" mb="sm" {...form.getInputProps('country')} />
              <TextInput label="Address" placeholder="e.g. 123 Main St, City" {...form.getInputProps('address')} />
            </div>
            <Divider />

            {/* Section 2: Contact */}
            <div>
              <Text fw={600} size="sm" mb="sm" c="blue">Contact</Text>
              <TextInput label="Email" placeholder="client@example.com" mb="sm" {...form.getInputProps('email')} />
              <TextInput label="Contact Number" placeholder="+1 (555) 123-4567" {...form.getInputProps('contactNumber')} />
            </div>
            <Divider />

            {/* Section 3: Business */}
            <div>
              <Text fw={600} size="sm" mb="sm" c="blue">Business</Text>
              <Text size="xs" c="dimmed" mb="sm">Billing type will impact how you invoice this client in the future.</Text>
              <Group grow>
                <Select 
                  label="Source" 
                  data={[{ value: 'upwork', label: 'Upwork' }, { value: 'direct', label: 'Direct' }]} 
                  {...form.getInputProps('source')}
                />
                <Select 
                  label="Billing Type" 
                  data={[{ value: 'hourly', label: 'Hourly' }, { value: 'fixed', label: 'Fixed Price' }]} 
                  {...form.getInputProps('billingType')}
                />
              </Group>
            </div>

            <Group justify="flex-end" mt="xl">
              <Button variant="light" onClick={() => setDrawerOpened(false)}>Cancel</Button>
              <Button type="submit" loading={isCreating || isUpdating}>
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
        title={<Text fw={700} size="lg">Client Details</Text>}
        position="right"
        size="md"
        padding="xl"
      >
        {selectedClient && (
          <Stack gap="xl">
            <div>
              <Group gap="sm" mb="md">
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 600, fontSize: '20px' }}>
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <Text fw={700} size="lg">{selectedClient.name}</Text>
                  {selectedClient.companyName && (
                    <Text size="sm" c="dimmed">
                      <Building2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                      {selectedClient.companyName}
                    </Text>
                  )}
                </div>
              </Group>
            </div>
            <Divider />

            <div>
              <Text fw={600} size="sm" mb="sm" c="dimmed" tt="uppercase">Contact Information</Text>
              {selectedClient.email ? (
                <Text size="sm" mb={4}><strong>Email:</strong> {selectedClient.email}</Text>
              ) : <Text size="sm" mb={4} c="dimmed">No email provided</Text>}
              
              {selectedClient.contactNumber ? (
                <Text size="sm" mb={4}><strong>Phone:</strong> {selectedClient.contactNumber}</Text>
              ) : <Text size="sm" mb={4} c="dimmed">No phone provided</Text>}
              
              {selectedClient.country ? (
                <Text size="sm" mb={4}><strong>Country:</strong> {selectedClient.country}</Text>
              ) : <Text size="sm" mb={4} c="dimmed">No country provided</Text>}
              
              {selectedClient.address ? (
                <Text size="sm" mb={4}><strong>Address:</strong> {selectedClient.address}</Text>
              ) : <Text size="sm" mb={4} c="dimmed">No address provided</Text>}
            </div>
            <Divider />

            <div>
              <Text fw={600} size="sm" mb="sm" c="dimmed" tt="uppercase">Business Details</Text>
              <Group gap="md">
                <div>
                  <Text size="xs" c="dimmed">Source</Text>
                  <Badge variant="light" color={selectedClient.source === 'upwork' ? 'green' : 'blue'}>
                    {selectedClient.source}
                  </Badge>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Billing Type</Text>
                  <Badge variant="dot" color={selectedClient.billingType === 'hourly' ? 'orange' : 'teal'}>
                    {selectedClient.billingType}
                  </Badge>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Active Projects</Text>
                  <Text size="sm" fw={600}>{getActiveProjectsCount(selectedClient._id)}</Text>
                </div>
              </Group>
            </div>
            <Divider />

            <div>
              <Text fw={600} size="sm" mb="sm" c="dimmed" tt="uppercase">Associated Projects</Text>
              {getClientProjects(selectedClient._id).length === 0 ? (
                <Text size="sm" color="dimmed">No projects found for this client.</Text>
              ) : (
                <Stack gap="xs">
                  {getClientProjects(selectedClient._id).map((proj) => (
                    <Paper key={proj._id} withBorder p="xs" radius="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text 
                          component="span" 
                          size="sm" 
                          fw={600} 
                          style={{ cursor: 'pointer', color: '#2563EB', textDecoration: 'underline' }}
                          onClick={() => {
                            setViewDrawerOpened(false);
                            navigate(`/projects/${proj._id}`);
                          }}
                        >
                          {proj.name}
                        </Text>
                        <Text size="xs" color="dimmed">{proj.type || 'Web App'}</Text>
                      </div>
                      <Badge 
                        size="xs" 
                        variant="light" 
                        color={proj.status === 'active' ? 'green' : proj.status === 'on_hold' ? 'orange' : 'blue'}
                      >
                        {proj.status}
                      </Badge>
                    </Paper>
                  ))}
                </Stack>
              )}
            </div>
            <Divider />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setViewDrawerOpened(false)}>Close</Button>
            </Group>
          </Stack>
        )}
      </Drawer>
    </div>
  );
};

export default ClientsList;
