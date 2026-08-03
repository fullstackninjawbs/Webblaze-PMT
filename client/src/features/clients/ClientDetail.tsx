import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Text, Group, Card, Badge, Stack, SimpleGrid, Tabs,
  Table, Progress, Loader, Center, Button, Paper, Anchor,
  ThemeIcon, Avatar,
} from '@mantine/core';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Globe, DollarSign,
  Briefcase, FileText, TrendingUp, Clock, AlertCircle,
} from 'lucide-react';
import { useGetClientByIdQuery } from './client.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetInvoicesQuery } from '../invoices/invoice.slice';
import { formatDateDisplay } from '../../utils/dateUtils';

const StatCard = ({
  label, value, sub, icon: Icon, color,
}: { label: string; value: string | number; sub?: string; icon: any; color: string }) => (
  <Paper withBorder radius="md" p="md" style={{ borderTop: `3px solid var(--mantine-color-${color}-6)` }}>
    <Group justify="space-between" align="flex-start">
      <div>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={4}>{label}</Text>
        <Text size="xl" fw={800} style={{ color: '#0f172a', lineHeight: 1 }}>{value}</Text>
        {sub && <Text size="xs" c="dimmed" mt={4}>{sub}</Text>}
      </div>
      <ThemeIcon size={40} radius="md" variant="light" color={color}>
        <Icon size={20} />
      </ThemeIcon>
    </Group>
  </Paper>
);

const statusColor = (s: string) => {
  if (s === 'active') return 'green';
  if (s === 'completed') return 'blue';
  if (s === 'on_hold') return 'orange';
  if (s === 'cancelled') return 'red';
  return 'gray';
};

const invoiceStatusColor = (s: string) => {
  if (s === 'paid') return 'green';
  if (s === 'overdue') return 'red';
  if (s === 'sent') return 'blue';
  if (s === 'partially_paid') return 'orange';
  return 'gray';
};

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: clientData, isLoading: isClientLoading } = useGetClientByIdQuery(id!);
  const { data: projectsData, isLoading: isProjectsLoading } = useGetProjectsQuery();
  const { data: invoicesData, isLoading: isInvoicesLoading } = useGetInvoicesQuery();

  const client = clientData?.data;
  const allProjects = projectsData?.data || [];
  const allInvoices = invoicesData?.data || [];

  // Filter projects and invoices for this client
  const clientProjects = useMemo(() =>
    allProjects.filter((p) => {
      const cId = typeof p.client === 'object' ? (p.client as any)?._id : p.client;
      return cId === id;
    }),
    [allProjects, id]
  );

  const clientInvoices = useMemo(() =>
    allInvoices.filter((inv: any) => {
      const projectMatch = clientProjects.some(p => p._id === (typeof inv.project === 'object' ? (inv.project as any)._id : inv.project));
      return projectMatch;
    }),
    [allInvoices, clientProjects]
  );

  // Financial stats
  const totalBudget = clientProjects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
  const totalReceived = clientProjects.reduce((sum, p) => sum + (p.receivedAmount || 0), 0);
  const totalPending = clientProjects.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);
  const completedProjects = clientProjects.filter(p => p.status === 'completed').length;

  if (isClientLoading || isProjectsLoading || isInvoicesLoading) {
    return <Center h={400}><Loader size="lg" color="blue" /></Center>;
  }

  if (!client) {
    return (
      <Center h={400}>
        <Stack align="center">
          <AlertCircle size={48} color="#ef4444" />
          <Text size="lg" fw={600}>Client not found</Text>
          <Button variant="subtle" leftSection={<ArrowLeft size={16} />} onClick={() => navigate('/clients')}>Back to Clients</Button>
        </Stack>
      </Center>
    );
  }

  const initials = client.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Container size="xl">
      {/* Back Button */}
      <Button
        variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />}
        onClick={() => navigate('/clients')} mb="lg" style={{ paddingLeft: 0 }}
      >
        Back to Clients
      </Button>

      {/* Header Card */}
      <Card withBorder shadow="sm" radius="xl" p="xl" mb="xl"
        style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderColor: '#bae6fd' }}>
        <Group align="flex-start" gap="xl">
          <Avatar size={80} radius="xl" color="blue" style={{ fontSize: '1.5rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
            {initials}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Group gap="sm" mb="xs">
              <Title order={2} style={{ color: '#0f172a' }}>{client.name}</Title>
              {client.companyName && (
                <Badge variant="light" color="blue" size="lg">{client.companyName}</Badge>
              )}
              <Badge variant="filled" color={client.source === 'upwork' ? 'teal' : 'violet'} size="sm">
                {client.source === 'upwork' ? '🔗 Upwork' : '🤝 Direct'}
              </Badge>
              {client.billingType && (
                <Badge variant="outline" color="gray" size="sm">
                  {client.billingType === 'hourly' ? '⏱ Hourly' : '📦 Fixed'}
                </Badge>
              )}
            </Group>
            <Group gap="xl" wrap="wrap">
              {client.email && (
                <Group gap="xs">
                  <Mail size={14} color="#64748b" />
                  <Anchor href={`mailto:${client.email}`} size="sm" c="blue">{client.email}</Anchor>
                </Group>
              )}
              {client.contactNumber && (
                <Group gap="xs">
                  <Phone size={14} color="#64748b" />
                  <Text size="sm" c="dimmed">{client.contactNumber}</Text>
                </Group>
              )}
              {client.country && (
                <Group gap="xs">
                  <Globe size={14} color="#64748b" />
                  <Text size="sm" c="dimmed">{client.country}</Text>
                </Group>
              )}
              {client.address && (
                <Group gap="xs">
                  <MapPin size={14} color="#64748b" />
                  <Text size="sm" c="dimmed">{client.address}</Text>
                </Group>
              )}
            </Group>
          </div>
          <Stack align="flex-end" gap="xs">
            <Text size="xs" c="dimmed">Client since</Text>
            <Text size="sm" fw={700}>{formatDateDisplay(client.createdAt)}</Text>
          </Stack>
        </Group>
      </Card>

      {/* Stats Row */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="xl">
        <StatCard label="Total Projects" value={clientProjects.length} sub={`${completedProjects} completed`} icon={Briefcase} color="blue" />
        <StatCard label="Total Budget" value={`$${totalBudget.toLocaleString()}`} sub="across all projects" icon={DollarSign} color="violet" />
        <StatCard label="Amount Received" value={`$${totalReceived.toLocaleString()}`} sub={`${totalBudget > 0 ? Math.round((totalReceived / totalBudget) * 100) : 0}% of total`} icon={TrendingUp} color="green" />
        <StatCard label="Pending Amount" value={`$${totalPending.toLocaleString()}`} sub={`${clientInvoices.length} invoices`} icon={Clock} color="orange" />
      </SimpleGrid>

      {/* Tabs */}
      <Tabs defaultValue="projects" radius="md">
        <Tabs.List mb="lg">
          <Tabs.Tab value="projects" leftSection={<Briefcase size={16} />}>
            Projects <Badge variant="light" size="xs" ml={4}>{clientProjects.length}</Badge>
          </Tabs.Tab>
          <Tabs.Tab value="invoices" leftSection={<FileText size={16} />}>
            Invoices <Badge variant="light" size="xs" ml={4}>{clientInvoices.length}</Badge>
          </Tabs.Tab>
          <Tabs.Tab value="contact" leftSection={<Building2 size={16} />}>Contact Info</Tabs.Tab>
        </Tabs.List>

        {/* Projects Tab */}
        <Tabs.Panel value="projects">
          <Card withBorder radius="md" p={0}>
            {clientProjects.length === 0 ? (
              <Center h={200}>
                <Stack align="center">
                  <Briefcase size={40} color="#cbd5e1" />
                  <Text c="dimmed">No projects for this client yet.</Text>
                </Stack>
              </Center>
            ) : (
              <Table verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead bg="#f8fafc">
                  <Table.Tr>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>PROJECT</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>STATUS</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>BUDGET</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>RECEIVED</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>PROGRESS</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>ACTION</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {clientProjects.map((project) => {
                    const progress = project.estHours && project.spentHours
                      ? Math.min((project.spentHours / project.estHours) * 100, 100)
                      : 0;
                    return (
                      <Table.Tr key={project._id}>
                        <Table.Td>
                          <Text fw={600} size="sm">{project.name}</Text>
                          {project.description && (
                            <Text size="xs" c="dimmed" lineClamp={1}>{project.description}</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge color={statusColor(project.status)} variant="light" size="sm">
                            {project.status?.replace('_', ' ')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600}>${(project.totalBudget || 0).toLocaleString()}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} c={project.receivedAmount === project.totalBudget ? 'green' : 'orange'}>
                            ${(project.receivedAmount || 0).toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ minWidth: 120 }}>
                          <Group gap="xs" wrap="nowrap">
                            <Text size="xs" w={32} ta="right" fw={700}>{Math.round(progress)}%</Text>
                            <Progress value={progress} size="sm" radius="xl" style={{ flex: 1 }}
                              color={progress === 100 ? 'green' : 'blue'} />
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Button size="xs" variant="light" onClick={() => navigate(`/projects/${project._id}`)}>
                            View
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Tabs.Panel>

        {/* Invoices Tab */}
        <Tabs.Panel value="invoices">
          <Card withBorder radius="md" p={0}>
            {clientInvoices.length === 0 ? (
              <Center h={200}>
                <Stack align="center">
                  <FileText size={40} color="#cbd5e1" />
                  <Text c="dimmed">No invoices for this client yet.</Text>
                </Stack>
              </Center>
            ) : (
              <Table verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead bg="#f8fafc">
                  <Table.Tr>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>INVOICE #</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>PROJECT</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>AMOUNT</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>STATUS</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>ISSUE DATE</Table.Th>
                    <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>DUE DATE</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {clientInvoices.map((inv: any) => (
                    <Table.Tr key={inv._id}>
                      <Table.Td>
                        <Text size="sm" fw={700} c="blue">{inv.invoiceNumber}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {typeof inv.project === 'object' ? inv.project?.name : 'N/A'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={700}>${(inv.totalAmount || 0).toLocaleString()}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={invoiceStatusColor(inv.status)} variant="light" size="sm">
                          {inv.status?.replace('_', ' ')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDateDisplay(inv.issueDate)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c={new Date(inv.dueDate) < new Date() && inv.status !== 'paid' ? 'red' : 'inherit'}>
                          {formatDateDisplay(inv.dueDate)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Tabs.Panel>

        {/* Contact Info Tab */}
        <Tabs.Panel value="contact">
          <Card withBorder radius="xl" p="xl">
            <Title order={4} mb="lg">Contact Information</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              {[
                { label: 'Full Name', value: client.name, icon: Building2 },
                { label: 'Company Name', value: client.companyName || '—', icon: Building2 },
                { label: 'Email Address', value: client.email || '—', icon: Mail },
                { label: 'Phone Number', value: client.contactNumber || '—', icon: Phone },
                { label: 'Country', value: client.country || '—', icon: Globe },
                { label: 'Address', value: client.address || '—', icon: MapPin },
                { label: 'Source', value: client.source === 'upwork' ? 'Upwork' : 'Direct', icon: Globe },
                { label: 'Billing Type', value: client.billingType === 'hourly' ? 'Hourly Rate' : 'Fixed Price', icon: DollarSign },
              ].map(({ label, value, icon: Icon }) => (
                <Paper key={label} withBorder p="md" radius="md" bg="#f8fafc">
                  <Group gap="sm">
                    <ThemeIcon size={32} radius="md" variant="light" color="blue">
                      <Icon size={16} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" c="dimmed" fw={600} tt="uppercase">{label}</Text>
                      <Text size="sm" fw={600}>{value}</Text>
                    </div>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};
