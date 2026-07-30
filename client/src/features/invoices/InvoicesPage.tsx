import { useState } from 'react';
import { Container, Title, Text, Card, Group, Table, Badge, Button, Modal, TextInput, Select, NumberInput, Stack, ActionIcon, SimpleGrid, Paper } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { Plus, Edit, Trash, DollarSign, ArrowUpRight, Clock, CheckCircle2, Search, Filter, Calendar } from 'lucide-react';
import { useGetInvoicesQuery, useCreateInvoiceMutation, useUpdateInvoiceMutation, useDeleteInvoiceMutation } from './invoice.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';

import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const invoices = invoicesData?.data || [];
  const projects = projectsData?.data || [];

  const form = useForm({
    initialValues: {
      project: '',
      invoiceNumber: '',
      issueDate: '',
      dueDate: '',
      totalAmount: '' as any,
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

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteInvoice = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteInvoice(deleteTarget.id).unwrap();
      setDeleteTarget(null);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="light" color="gray" radius="sm" fw={600}>Draft</Badge>;
      case 'sent':
        return <Badge variant="light" color="blue" radius="sm" fw={600}>Sent</Badge>;
      case 'partially_paid':
        return <Badge variant="light" color="orange" radius="sm" fw={600}>Partially Paid</Badge>;
      case 'paid':
        return <Badge variant="light" color="green" radius="sm" fw={600}>Paid</Badge>;
      case 'overdue':
        return <Badge variant="light" color="red" radius="sm" fw={600}>Overdue</Badge>;
      default:
        return <Badge variant="light" color="gray" radius="sm" fw={600}>{status}</Badge>;
    }
  };

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const projectObj = typeof inv.project === 'object' ? inv.project : null;
    const projectName = projectObj?.name?.toLowerCase() || '';
    const invNum = inv.invoiceNumber?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();

    const matchesQuery = invNum.includes(q) || projectName.includes(q);
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalReceived = invoices.reduce((sum, inv) => sum + (inv.receivedAmount || 0), 0);
  const totalPending = invoices.reduce((sum, inv) => sum + (inv.pendingAmount || 0), 0);

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      
      {/* Header Bar */}
      <Group justify="space-between" mb="xl">
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
            Financial Management & Invoices
          </Title>
          <Text
            size="sm"
            mt={4}
            style={{ color: '#64748b', letterSpacing: '-0.01em' }}
          >
            Monitor billing status, record client payments, and manage invoices.
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          size="md"
          onClick={openCreateModal}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
          }}
        >
          Create Invoice
        </Button>
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
        {/* Total Billed */}
        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{
            borderColor: '#e8ecf4',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            background: '#ffffff',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Total Billed
            </Text>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#f0f5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <DollarSign size={20} color="#3b82f6" />
            </div>
          </Group>
          <Text fw={800} style={{ fontSize: '1.625rem', color: '#0f172a', letterSpacing: '-0.03em' }}>
            ${totalBilled.toLocaleString()}
          </Text>
          <Text size="xs" mt={4} style={{ color: '#64748b' }}>
            Cumulative invoiced across {invoices.length} invoices
          </Text>
        </Paper>

        {/* Total Received */}
        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{
            borderColor: '#e8ecf4',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            background: '#ffffff',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Total Received
            </Text>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle2 size={20} color="#10b981" />
            </div>
          </Group>
          <Text fw={800} style={{ fontSize: '1.625rem', color: '#059669', letterSpacing: '-0.03em' }}>
            ${totalReceived.toLocaleString()}
          </Text>
          <Text size="xs" mt={4} style={{ color: '#64748b' }}>
            {totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 0}% of total billing collected
          </Text>
        </Paper>

        {/* Total Pending */}
        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{
            borderColor: '#e8ecf4',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            background: '#ffffff',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Total Outstanding
            </Text>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={20} color="#f59e0b" />
            </div>
          </Group>
          <Text fw={800} style={{ fontSize: '1.625rem', color: '#d97706', letterSpacing: '-0.03em' }}>
            ${totalPending.toLocaleString()}
          </Text>
          <Text size="xs" mt={4} style={{ color: '#64748b' }}>
            Pending payment from active clients
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Filter Toolbar */}
      <Paper p="md" radius="lg" withBorder mb="lg" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
        <Group justify="space-between">
          <TextInput
            placeholder="Search invoice number or project..."
            leftSection={<Search size={16} color="#94a3b8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 320 }}
            radius="md"
          />
          <Group gap="sm">
            <Filter size={16} color="#64748b" />
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || 'all')}
              data={[
                { value: 'all', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'sent', label: 'Sent' },
                { value: 'partially_paid', label: 'Partially Paid' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
              ]}
              style={{ width: 180 }}
              radius="md"
            />
          </Group>
        </Group>
      </Paper>

      {/* Invoices Data Table */}
      <Card
        p={0}
        radius="lg"
        withBorder
        style={{
          borderColor: '#e8ecf4',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        <Table verticalSpacing="md" horizontalSpacing="lg">
          <Table.Thead style={{ backgroundColor: '#f8faff' }}>
            <Table.Tr>
              <Table.Th>Invoice #</Table.Th>
              <Table.Th>Project</Table.Th>
              <Table.Th>Issue Date</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Pending</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredInvoices.map((inv) => {
              const project = typeof inv.project === 'object' ? inv.project : null;
              return (
                <Table.Tr key={inv._id}>
                  <Table.Td fw={700} style={{ color: '#0f172a' }}>{inv.invoiceNumber}</Table.Td>
                  <Table.Td fw={500}>{project?.name || 'Unknown'}</Table.Td>
                  <Table.Td style={{ color: '#64748b' }}>{new Date(inv.issueDate).toLocaleDateString()}</Table.Td>
                  <Table.Td style={{ color: '#64748b' }}>{new Date(inv.dueDate).toLocaleDateString()}</Table.Td>
                  <Table.Td fw={700} style={{ color: '#0f172a' }}>${inv.totalAmount.toLocaleString()}</Table.Td>
                  <Table.Td fw={700} style={{ color: inv.pendingAmount > 0 ? '#d97706' : '#64748b' }}>
                    ${inv.pendingAmount.toLocaleString()}
                  </Table.Td>
                  <Table.Td>
                    {getStatusBadge(inv.status)}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Group gap={6} justify="flex-end">
                      {inv.status !== 'paid' && (
                        <Button
                          size="xs"
                          variant="light"
                          color="green"
                          radius="md"
                          onClick={() => {
                            setActiveInvoiceForPayment(inv);
                            setPaymentAmount(inv.pendingAmount);
                            setPaymentModalOpened(true);
                          }}
                          leftSection={<ArrowUpRight size={14} />}
                        >
                          Pay
                        </Button>
                      )}
                      <ActionIcon variant="subtle" color="blue" radius="md" onClick={() => openEditModal(inv)} title="Edit">
                        <Edit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" radius="md" onClick={() => handleDeleteInvoice(inv._id, inv.invoiceNumber)} title="Delete">
                        <Trash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {filteredInvoices.length === 0 && !isLoading && (
              <Table.Tr>
                <Table.Td colSpan={8} ta="center" py={40}>
                  <Text color="dimmed" fw={500}>No invoices found matching criteria.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Save Invoice Modal */}
      <Modal opened={opened} onClose={() => setOpened(false)} title={<Text fw={700} size="lg">{editingInvoice ? "Edit Invoice" : "Create New Invoice"}</Text>} radius="lg" padding="xl" size={520}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="Project"
              placeholder="Select project..."
              data={projects.map(p => ({ value: p._id, label: p.name }))}
              {...form.getInputProps('project')}
              radius="md"
              withAsterisk
            />
            <TextInput label="Invoice Number" placeholder="INV-2026-001" {...form.getInputProps('invoiceNumber')} radius="md" withAsterisk />
            <Group grow gap="md">
              <DatePickerInput
                label="Issue Date"
                placeholder="Select date"
                leftSection={<Calendar size={16} color="#64748b" />}
                radius="md"
                withAsterisk
                value={form.values.issueDate ? new Date(form.values.issueDate) : null}
                onChange={(val) =>
                  form.setFieldValue('issueDate', val ? val.toISOString().split('T')[0] : '')
                }
                clearable
              />
              <DatePickerInput
                label="Due Date"
                placeholder="Select date"
                leftSection={<Calendar size={16} color="#64748b" />}
                radius="md"
                withAsterisk
                value={form.values.dueDate ? new Date(form.values.dueDate) : null}
                onChange={(val) =>
                  form.setFieldValue('dueDate', val ? val.toISOString().split('T')[0] : '')
                }
                clearable
              />
            </Group>
            <NumberInput label="Total Amount ($)" min={0} onFocus={(e) => e.target.select()} {...form.getInputProps('totalAmount')} radius="md" withAsterisk />
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
              radius="md"
            />
            <Button 
              type="submit" 
              loading={isCreating || isUpdating} 
              mt="md" 
              radius="md"
              size="md"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
              }}
            >
              {editingInvoice ? "Update Invoice" : "Save Invoice"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal opened={paymentModalOpened} onClose={() => setPaymentModalOpened(false)} title={<Text fw={700} size="lg">Record Payment</Text>} radius="lg" padding="xl" size={520}>
        <Stack gap="md">
          <Text size="sm" style={{ color: '#64748b' }}>Record payment details for invoice #{activeInvoiceForPayment?.invoiceNumber}.</Text>
          <NumberInput
            label="Payment Amount ($)"
            value={paymentAmount}
            onChange={(val) => setPaymentAmount(typeof val === 'number' ? val : 0)}
            min={0.01}
            max={activeInvoiceForPayment?.pendingAmount}
            radius="md"
            onFocus={(e) => e.target.select()}
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
            radius="md"
          />
          <DatePickerInput
            label="Payment Date"
            placeholder="Select date"
            leftSection={<Calendar size={16} color="#64748b" />}
            value={paymentDate ? new Date(paymentDate) : null}
            onChange={(val) => setPaymentDate(val ? val.toISOString().split('T')[0] : '')}
            radius="md"
            clearable
          />
          <Button 
            color="green" 
            radius="md" 
            size="md"
            onClick={handleRecordPayment} 
            loading={isUpdating} 
            style={{ fontWeight: 600 }}
          >
            Submit Payment
          </Button>
        </Stack>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        itemName={deleteTarget?.name}
      />
    </Container>
  );
};

export default InvoicesPage;
