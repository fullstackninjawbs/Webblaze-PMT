import React, { useState } from 'react';
import { useGetClientsQuery, useCreateClientMutation } from './client.slice';
import { Table, Button, Group, Title, Modal, TextInput, Select, Card, Text, Badge, ActionIcon, Menu } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Plus, Building2, Mail, MoreVertical, Edit, Trash } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').or(z.literal('')),
  companyName: z.string().optional(),
  source: z.enum(['upwork', 'direct']),
  billingType: z.enum(['hourly', 'fixed']),
  country: z.string().optional(),
});

export const ClientsList: React.FC = () => {
  const { data } = useGetClientsQuery();
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [modalOpened, setModalOpened] = useState(false);
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
    },
    validate: zodResolver(clientSchema),
  });

  const onSubmit = async (values: typeof form.values) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await createClient(values as any).unwrap();
      setModalOpened(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create client', error);
    }
  };

  const rows = data?.data.map((client) => (
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
        {client.email ? (
          <Text size="sm" c="dimmed">
            <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
            {client.email}
          </Text>
        ) : '-'}
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
        {isAdminOrPM && (
          <Menu position="bottom-end" shadow="sm">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <MoreVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<Edit size={14} />}>Edit</Menu.Item>
              <Menu.Item color="red" leftSection={<Trash size={14} />}>Delete</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div style={{ animation: 'fade-in 0.4s ease-out' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#111827', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Clients
          </Title>
          <Text color="dimmed" size="sm">Manage your clients and their billing details.</Text>
        </div>
        {isAdminOrPM && (
          <Button 
            leftSection={<Plus size={18} />} 
            radius="md" 
            variant="filled" 
            color="blue"
            onClick={() => setModalOpened(true)}
          >
            Add Client
          </Button>
        )}
      </Group>

      <Card shadow="sm" p="0" radius="xl" withBorder style={{ border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}>
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" horizontalSpacing="xl" striped>
            <Table.Thead style={{ backgroundColor: '#F9FAFB' }}>
              <Table.Tr>
                <Table.Th>Client</Table.Th>
                <Table.Th>Contact</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Billing</Table.Th>
                <Table.Th w={80}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows?.length ? rows : (
                <Table.Tr>
                  <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    <Text c="dimmed">No clients found.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={<Text fw={600}>Add New Client</Text>} radius="md">
        <form onSubmit={form.onSubmit(onSubmit)}>
          <TextInput label="Name" placeholder="Client Name" required mb="md" {...form.getInputProps('name')} />
          <TextInput label="Company" placeholder="Company Name (Optional)" mb="md" {...form.getInputProps('companyName')} />
          <TextInput label="Email" placeholder="client@example.com" mb="md" {...form.getInputProps('email')} />
          
          <Group grow mb="md">
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
          <TextInput label="Country" placeholder="e.g. United States" mb="xl" {...form.getInputProps('country')} />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalOpened(false)}>Cancel</Button>
            <Button type="submit" loading={isCreating}>Create Client</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
};
