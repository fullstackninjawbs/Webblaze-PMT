import { useState } from 'react';
import { Container, Title, Text, Card, Group, Table, Badge, Button, Modal, TextInput, Select, NumberInput, Stack } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useGetInvoicesQuery, useCreateInvoiceMutation } from './invoice.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';

const invoiceSchema = z.object({
  project: z.string().min(1, 'Project is required'),
  invoiceNumber: z.string().min(1, 'Invoice Number is required'),
  issueDate: z.string().min(1, 'Issue Date is required'),
  dueDate: z.string().min(1, 'Due Date is required'),
  totalAmount: z.number().min(0, 'Must be positive'),
  status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue']),
});

export const InvoicesPage = () => {
  const { data: invoicesData, isLoading } = useGetInvoicesQuery();
  const { data: projectsData } = useGetProjectsQuery();
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();

  const [opened, setOpened] = useState(false);

  const invoices = invoicesData?.data || [];
  const projects = projectsData?.data || [];

  const form = useForm({
    initialValues: {
      project: '',
      invoiceNumber: '',
      issueDate: '',
      dueDate: '',
      totalAmount: 0,
      status: 'draft',
    },
    validate: zodResolver(invoiceSchema),
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await createInvoice({
        ...values,
        issueDate: new Date(values.issueDate).toISOString(),
        dueDate: new Date(values.dueDate).toISOString(),
        status: values.status as any,
      }).unwrap();
      setOpened(false);
      form.reset();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'gray';
      case 'sent': return 'blue';
      case 'partially_paid': return 'orange';
      case 'paid': return 'green';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  const totalPending = invoices.reduce((sum, inv) => sum + (inv.pendingAmount || 0), 0);
  const totalReceived = invoices.reduce((sum, inv) => sum + (inv.receivedAmount || 0), 0);

  return (
    <Container size="xl" py="xl" style={{ animation: 'fade-in 0.4s ease-out' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#111827', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Financial Overview
          </Title>
          <Text color="dimmed" size="sm">Manage all project invoices and track payments.</Text>
        </div>
        <Button leftSection={<Plus size={16} />} size="md" color="indigo" onClick={() => setOpened(true)}>
          Create Invoice
        </Button>
      </Group>

      <Group grow mb="xl">
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Text size="sm" c="dimmed" fw={600} tt="uppercase">Total Received</Text>
          <Text size="xl" fw={700} c="green">${totalReceived.toLocaleString()}</Text>
        </Card>
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Text size="sm" c="dimmed" fw={600} tt="uppercase">Total Pending</Text>
          <Text size="xl" fw={700} c="orange">${totalPending.toLocaleString()}</Text>
        </Card>
      </Group>

      <Card shadow="sm" p="lg" radius="lg" withBorder>
        <Table verticalSpacing="md" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice #</Table.Th>
              <Table.Th>Project</Table.Th>
              <Table.Th>Issue Date</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Pending</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {invoices.map((inv) => {
              const project = typeof inv.project === 'object' ? inv.project : null;
              return (
                <Table.Tr key={inv._id}>
                  <Table.Td fw={600}>{inv.invoiceNumber}</Table.Td>
                  <Table.Td>{project?.name || 'Unknown'}</Table.Td>
                  <Table.Td>{new Date(inv.issueDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>{new Date(inv.dueDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>${inv.totalAmount.toLocaleString()}</Table.Td>
                  <Table.Td fw={600} c={inv.pendingAmount > 0 ? 'orange' : 'dimmed'}>
                    ${inv.pendingAmount.toLocaleString()}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(inv.status)} variant="light">
                      {inv.status.replace('_', ' ')}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {invoices.length === 0 && !isLoading && (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center" py="xl">
                  <Text color="dimmed">No invoices found.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Create Invoice" radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Select
              label="Project"
              data={projects.map(p => ({ value: p._id, label: p.name }))}
              {...form.getInputProps('project')}
              withAsterisk
            />
            <TextInput label="Invoice Number" {...form.getInputProps('invoiceNumber')} withAsterisk />
            <Group grow>
              <TextInput type="date" label="Issue Date" {...form.getInputProps('issueDate')} withAsterisk />
              <TextInput type="date" label="Due Date" {...form.getInputProps('dueDate')} withAsterisk />
            </Group>
            <NumberInput label="Total Amount ($)" min={0} {...form.getInputProps('totalAmount')} withAsterisk />
            <Select
              label="Status"
              data={[
                { value: 'draft', label: 'Draft' },
                { value: 'sent', label: 'Sent' }
              ]}
              {...form.getInputProps('status')}
            />
            <Button type="submit" color="indigo" loading={isCreating} mt="md">Save Invoice</Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
};
