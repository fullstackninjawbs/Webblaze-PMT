import { useState } from 'react';
import { Container, Title, Text, Card, Group, Table, Badge, Button, Modal, TextInput, Select, NumberInput, Stack, ActionIcon } from '@mantine/core';
import { Plus, Edit, Trash } from 'lucide-react';
import { useGetInvoicesQuery, useCreateInvoiceMutation, useUpdateInvoiceMutation, useDeleteInvoiceMutation } from './invoice.slice';
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
  const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();

  const [opened, setOpened] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  // Payment states
  const [paymentModalOpened, setPaymentModalOpened] = useState(false);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

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

  const openCreateModal = () => {
    setEditingInvoice(null);
    form.reset();
    setOpened(true);
  };

  const openEditModal = (inv: any) => {
    setEditingInvoice(inv);
    form.setValues({
      project: typeof inv.project === 'object' ? inv.project._id : inv.project,
      invoiceNumber: inv.invoiceNumber,
      issueDate: new Date(inv.issueDate).toISOString().split('T')[0],
      dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
      totalAmount: inv.totalAmount,
      status: inv.status,
    });
    setOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        project: values.project,
        invoiceNumber: values.invoiceNumber,
        issueDate: new Date(values.issueDate).toISOString(),
        dueDate: new Date(values.dueDate).toISOString(),
        totalAmount: values.totalAmount,
        status: values.status as any,
      };

      if (editingInvoice) {
        await updateInvoice({ _id: editingInvoice._id, ...payload }).unwrap();
      } else {
        await createInvoice(payload).unwrap();
      }
      setOpened(false);
      form.reset();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRecordPayment = async () => {
    if (!activeInvoiceForPayment || paymentAmount <= 0) return;
    try {
      const existingPayments = activeInvoiceForPayment.paymentDetails || [];
      const newPayment = {
        paymentDate: new Date(paymentDate).toISOString(),
        method: paymentMethod,
        amount: paymentAmount,
      };

      await updateInvoice({
        _id: activeInvoiceForPayment._id,
        paymentDetails: [...existingPayments, newPayment],
      }).unwrap();

      setPaymentModalOpened(false);
      setPaymentAmount(0);
      setActiveInvoiceForPayment(null);
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
        <Button leftSection={<Plus size={16} />} size="md" color="blue" onClick={openCreateModal}>
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
              <Table.Th w={150}></Table.Th>
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
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      {inv.status !== 'paid' && (
                        <Button 
                          size="xs" 
                          variant="light" 
                          color="green" 
                          onClick={() => {
                            setActiveInvoiceForPayment(inv);
                            setPaymentAmount(inv.pendingAmount);
                            setPaymentModalOpened(true);
                          }}
                        >
                          + Pay
                        </Button>
                      )}
                      <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(inv)} title="Edit">
                        <Edit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteInvoice(inv._id)} title="Delete">
                        <Trash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {invoices.length === 0 && !isLoading && (
              <Table.Tr>
                <Table.Td colSpan={8} ta="center" py="xl">
                  <Text color="dimmed">No invoices found.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Save Invoice Modal */}
      <Modal opened={opened} onClose={() => setOpened(false)} title={editingInvoice ? "Edit Invoice" : "Create Invoice"} radius="md">
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
                { value: 'sent', label: 'Sent' },
                { value: 'partially_paid', label: 'Partially Paid' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' }
              ]}
              {...form.getInputProps('status')}
            />
            <Button type="submit" color="blue" loading={isCreating || isUpdating} mt="md">
              {editingInvoice ? "Update Invoice" : "Save Invoice"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal opened={paymentModalOpened} onClose={() => setPaymentModalOpened(false)} title="Record Payment" radius="md">
        <Stack gap="sm">
          <Text size="sm">Enter payment details to update the invoice status and totals.</Text>
          <NumberInput
            label="Payment Amount ($)"
            value={paymentAmount}
            onChange={(val) => setPaymentAmount(Number(val) || 0)}
            min={0.01}
            max={activeInvoiceForPayment?.pendingAmount}
            withAsterisk
          />
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(val) => setPaymentMethod(val || 'bank_transfer')}
            data={[
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'upwork', label: 'Upwork Escrow' },
              { value: 'stripe', label: 'Stripe' },
              { value: 'paypal', label: 'PayPal' },
              { value: 'cash', label: 'Cash' },
            ]}
          />
          <TextInput
            type="date"
            label="Payment Date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
          <Button color="green" onClick={handleRecordPayment} loading={isUpdating}>
            Submit Payment
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
};

export default InvoicesPage;
