import React, { useState, useMemo } from 'react';
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from './project.slice';
import { useGetClientsQuery } from '../clients/client.slice';
import { useGetReleasesQuery } from '../releases/release.slice';
import {
  Table,
  Button,
  Group,
  Modal,
  TextInput,
  Textarea,
  Select,
  Card,
  Text,
  Badge,
  ActionIcon,
  NumberInput,
  Grid,
  Progress,
  Tabs,
  Paper,
  SimpleGrid,
  Stack,
  Collapse,
  Box,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import {
  Plus,
  Edit,
  Trash,
  Briefcase,
  DollarSign,
  Eye,
  Search,
  CheckCircle2,
  Clock,
  LayoutDashboard,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role, ProjectStatus } from '../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';
import { formatDateDisplay } from '../../utils/dateUtils';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  client: z.string().min(1, 'Client is required'),
  description: z.string().optional(),
  type: z.string().optional(),
  totalBudget: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional(),
  costPerHour: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional(),
  totalHours: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional(),
  status: z.enum(['new', 'active', 'on_hold', 'maintenance', 'completed']).optional(),
  team: z.array(z.string()).optional(),
});

const PROJECT_DEPARTMENT_OPTIONS = [
  { value: 'Shopify', label: 'Shopify' },
  { value: 'WordPress', label: 'WordPress' },
  { value: 'Full Stack', label: 'Full Stack' },
  { value: 'SEO', label: 'SEO' },
  { value: 'UI/UX', label: 'UI/UX' },
];

export const ProjectsList: React.FC = () => {
  const navigate = useNavigate();
  const { data: projectsData } = useGetProjectsQuery();
  const { data: clientsData } = useGetClientsQuery();
  const { data: releasesData } = useGetReleasesQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  const canManageProjects = user?.role === Role.ADMIN || user?.role === Role.PM;
  const isFinancialsVisible = user?.role === Role.ADMIN || user?.role === Role.PM;

  const form = useForm({
    initialValues: {
      name: '',
      client: '',
      description: '',
      type: '',
      totalBudget: '' as any,
      costPerHour: '' as any,
      totalHours: '' as any,
      status: ProjectStatus.NEW,
      team: [] as string[],
    },
    validate: zodResolver(projectSchema),
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingProject(null);
    if (searchParams.toString()) {
      setSearchParams({}, { replace: true });
    }
  };

  const openCreateModal = (preselectedClient?: string) => {
    setEditingProject(null);
    form.reset();
    if (preselectedClient) {
      form.setFieldValue('client', preselectedClient);
    }
    setModalOpened(true);
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    form.setValues({
      name: project.name || '',
      client: project.client?._id || project.client || '',
      description: project.description || '',
      type: project.type || '',
      totalBudget: project.totalBudget ?? '',
      costPerHour: project.costPerHour ?? '',
      totalHours: project.totalHours ?? '',
      status: project.status || ProjectStatus.NEW,
      team: project.team?.map((t: any) => t._id || t) || [],
    });
    setModalOpened(true);
  };

  React.useEffect(() => {
    const createParam = searchParams.get('create');
    const clientParam = searchParams.get('client') || searchParams.get('clientId');
    const editParam = searchParams.get('edit');

    if (createParam === 'true' || clientParam) {
      openCreateModal(clientParam || undefined);
    } else if (editParam && projectsData?.data) {
      const projToEdit = projectsData.data.find((p: any) => p._id === editParam);
      if (projToEdit) {
        openEditModal(projToEdit);
      }
    }
  }, [searchParams, projectsData?.data]);

  const onSubmit = async (values: typeof form.values) => {
    try {
      // For hourly clients: compute totalBudget from costPerHour * totalHours
      const selectedClient = clientsData?.data.find((c) => c._id === values.client);
      const isHourly = selectedClient?.billingType === 'hourly';
      const rawBudget = values.totalBudget !== '' && values.totalBudget !== null && values.totalBudget !== undefined
        ? Number(values.totalBudget)
        : undefined;
      const computedBudget = isHourly
        ? (Number(values.costPerHour) || 0) * (Number(values.totalHours) || 0)
        : (rawBudget !== undefined && !isNaN(rawBudget) ? rawBudget : undefined);

      const rawCostPerHour = values.costPerHour !== '' && values.costPerHour !== null && values.costPerHour !== undefined
        ? Number(values.costPerHour)
        : undefined;
      const rawTotalHours = values.totalHours !== '' && values.totalHours !== null && values.totalHours !== undefined
        ? Number(values.totalHours)
        : undefined;

      const payload = {
        name: values.name,
        client: values.client,
        description: values.description || undefined,
        type: values.type || undefined,
        status: values.status || ProjectStatus.NEW,
        totalBudget: computedBudget,
        costPerHour: isHourly && rawCostPerHour !== undefined && !isNaN(rawCostPerHour) ? rawCostPerHour : undefined,
        totalHours: isHourly && rawTotalHours !== undefined && !isNaN(rawTotalHours) ? rawTotalHours : undefined,
        team: values.team && values.team.length > 0 ? values.team : undefined,
      };

      if (editingProject) {
        await updateProject({ id: editingProject._id, data: payload as any }).unwrap();
      } else {
        await createProject(payload as any).unwrap();
      }
      handleCloseModal();
      form.reset();
    } catch (error) {
      console.error('Failed to save project', error);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteProject = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteProject(deleteTarget.id).unwrap();
    }
  };

  const clientOptions = clientsData?.data.map((c) => ({ value: c._id, label: c.name })) || [];

  // Derived: selected client object and billing type
  const selectedClient = clientsData?.data.find((c) => c._id === form.values.client);
  const isHourlyClient = selectedClient?.billingType === 'hourly';
  const computedTotal = isHourlyClient
    ? (Number(form.values.costPerHour) || 0) * (Number(form.values.totalHours) || 0)
    : Number(form.values.totalBudget) || 0;

  const getClientName = (id: string) =>
    clientOptions.find((c) => c.value === id)?.label || 'Unknown Client';

  const getProjectReleaseDate = (projectId: string) => {
    const projectReleases = (releasesData?.data || []).filter(
      (r) => (r.project as any)?._id === projectId || (r.project as any) === projectId
    );
    if (projectReleases.length === 0) return 'TBD';

    const sorted = [...projectReleases].sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
    return formatDateDisplay(sorted[0].releaseDate);
  };

  const allProjects = projectsData?.data || [];

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      const matchesTab = activeTab === 'all' || p.status === activeTab;
      const matchesDept = !departmentFilter || (p.type || '').toLowerCase() === departmentFilter.toLowerCase();
      const matchesQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.type || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesDept && matchesQuery;
    });
  }, [allProjects, activeTab, departmentFilter, searchQuery]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const activeCount = allProjects.filter((p) => p.status === ProjectStatus.ACTIVE).length;
    const totalBudgetSum = allProjects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
    const totalReceivedSum = allProjects.reduce((sum, p) => sum + (p.receivedAmount || 0), 0);
    const totalPendingSum = allProjects.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);
    return { activeCount, totalBudgetSum, totalReceivedSum, totalPendingSum };
  }, [allProjects]);

  const rows = filteredProjects.map((project: any) => (
    <Table.Tr
      key={project._id}
      onClick={() => navigate(`/projects/${project._id}`)}
      style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
    >
      {/* 1. Project */}
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        <div>
          <Text
            size="sm"
            fw={700}
            style={{ color: '#0f172a' }}
          >
            {project.name}
          </Text>
          <Text size="xs" style={{ color: '#64748b' }}>
            {project.client?.name || 'Unknown Client'}
          </Text>
        </div>
      </Table.Td>

      {/* 2. Hours Assists / Est. Hours */}
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        <Text size="sm" fw={600} style={{ color: '#475569' }}>
          {project.estHours !== undefined ? `${project.estHours}h` : '0h'}
        </Text>
      </Table.Td>

      {/* 3. Active Hours */}
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        <Text size="sm" fw={600} style={{ color: '#2563eb' }}>
          {project.spentHours !== undefined ? `${Number(project.spentHours.toFixed(1))}h` : '0h'}
        </Text>
      </Table.Td>

      {/* 4. Total Amount, 5. Pending Amount, 6. Received Amount */}
      {isFinancialsVisible && (
        <>
          <Table.Td style={{ whiteSpace: 'nowrap' }}>
            {project.totalBudget ? (
              <Text size="sm" fw={600} style={{ color: '#0f172a' }}>
                ${project.totalBudget.toLocaleString()}
              </Text>
            ) : (
              <Text size="sm" style={{ color: '#94a3b8' }}>
                -
              </Text>
            )}
          </Table.Td>
          <Table.Td style={{ whiteSpace: 'nowrap' }}>
            <Text size="sm" style={{ color: '#d97706' }} fw={600}>
              ${(project.pendingAmount || 0).toLocaleString()}
            </Text>
          </Table.Td>
          <Table.Td style={{ whiteSpace: 'nowrap' }}>
            <Text size="sm" style={{ color: '#059669' }} fw={600}>
              ${(project.receivedAmount || 0).toLocaleString()}
            </Text>
          </Table.Td>
        </>
      )}

      {/* 7. Release Date */}
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        <Text size="sm" style={{ color: '#64748b' }}>
          {getProjectReleaseDate(project._id)}
        </Text>
      </Table.Td>

      {/* 8. Status */}
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        <Badge
          variant="light"
          radius="sm"
          size="sm"
          fw={600}
          style={{ whiteSpace: 'nowrap' }}
          color={
            project.status === ProjectStatus.ACTIVE
              ? 'green'
              : project.status === ProjectStatus.ON_HOLD
                ? 'orange'
                : project.status === ProjectStatus.COMPLETED
                  ? 'blue'
                  : 'gray'
          }
        >
          {project.status ? project.status.replace('_', ' ') : '-'}
        </Badge>
      </Table.Td>

      {/* 9. Progress */}
      <Table.Td style={{ minWidth: 130 }}>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" w={32} ta="right" fw={600} style={{ color: '#0f172a' }}>
            {Math.min(project.progress || 0, 100)}%
          </Text>
          <Progress value={Math.min(project.progress || 0, 100)} color={project.progress >= 100 ? 'green' : 'blue'} size="sm" radius="xl" style={{ flex: 1 }} />
        </Group>
      </Table.Td>

      {/* 10. Actions */}
      <Table.Td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${project._id}`);
            }}
            title="View Details"
          >
            <Eye size={16} />
          </ActionIcon>
          {canManageProjects && (
            <>
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(project);
                }}
                title="Edit"
              >
                <Edit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project._id, project.name);
                }}
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
      {/* Header */}
      <Group justify="flex-end" align="center" mb="xl">
        <Group gap="sm">
          {isFinancialsVisible && (
            <Button
              size="md"
              radius="md"
              leftSection={<LayoutDashboard size={16} />}
              onClick={() => setShowOverview((prev) => !prev)}
              style={{
                background: showOverview
                  ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                  : '#ffffff',
                color: showOverview ? '#ffffff' : '#475569',
                border: showOverview ? 'none' : '1px solid #cbd5e1',
                fontWeight: 600,
                boxShadow: showOverview ? '0 4px 14px rgba(59, 130, 246, 0.35)' : '0 2px 6px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Overview
            </Button>
          )}
          {canManageProjects && (
            <Button
              leftSection={<Plus size={16} />}
              radius="md"
              size="md"
              onClick={() => openCreateModal()}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
              }}
            >
              New Project
            </Button>
          )}
        </Group>
      </Group>

      {/* KPI Cards (Hidden by Default, Toggled via Overview Button) */}
      {canManageProjects && (
        <Collapse in={showOverview} transitionDuration={350} transitionTimingFunction="cubic-bezier(0.4, 0, 0.2, 1)">
          <Box mb="xl">
            <SimpleGrid cols={{ base: 1, sm: isFinancialsVisible ? 4 : 1 }} spacing="md">
              <Paper
                p="lg"
                radius="xl"
                withBorder
                style={{ borderColor: '#e8ecf4', background: '#ffffff' }}
              >
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
                    Active Projects
                  </Text>
                  <Paper p={8} radius="md" bg="#eff6ff">
                    <Briefcase size={18} color="#2563eb" />
                  </Paper>
                </Group>
                <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
                  {metrics.activeCount}
                </Text>
              </Paper>

              {isFinancialsVisible && (
                <>
                  <Paper
                    p="lg"
                    radius="xl"
                    withBorder
                    style={{ borderColor: '#e8ecf4', background: '#ffffff' }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
                        Total Portfolio Amount
                      </Text>
                      <Paper p={8} radius="md" bg="#f0fdf4">
                        <DollarSign size={18} color="#10b981" />
                      </Paper>
                    </Group>
                    <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
                      ${metrics.totalBudgetSum.toLocaleString()}
                    </Text>
                  </Paper>

                  <Paper
                    p="lg"
                    radius="xl"
                    withBorder
                    style={{ borderColor: '#e8ecf4', background: '#ffffff' }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
                        Total Received
                      </Text>
                      <Paper p={8} radius="md" bg="#f0fdf4">
                        <CheckCircle2 size={18} color="#10b981" />
                      </Paper>
                    </Group>
                    <Text fw={800} style={{ fontSize: '1.75rem', color: '#059669', lineHeight: 1 }}>
                      ${metrics.totalReceivedSum.toLocaleString()}
                    </Text>
                  </Paper>

                  <Paper
                    p="lg"
                    radius="xl"
                    withBorder
                    style={{ borderColor: '#e8ecf4', background: '#ffffff' }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
                        Total Pending
                      </Text>
                      <Paper p={8} radius="md" bg="#fffbeb">
                        <Clock size={18} color="#f59e0b" />
                      </Paper>
                    </Group>
                    <Text fw={800} style={{ fontSize: '1.75rem', color: '#d97706', lineHeight: 1 }}>
                      ${metrics.totalPendingSum.toLocaleString()}
                    </Text>
                  </Paper>
                </>
              )}
            </SimpleGrid>
          </Box>
        </Collapse>
      )}

      {/* Tabs & Search Filter Toolbar */}
      <Paper p="md" radius="lg" withBorder mb="lg" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
        <Group justify="space-between">
          <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'all')} radius="md">
            <Tabs.List style={{ borderBottom: 'none' }}>
              <Tabs.Tab value="all">All Projects</Tabs.Tab>
              <Tabs.Tab value={ProjectStatus.NEW}>New</Tabs.Tab>
              <Tabs.Tab value={ProjectStatus.ACTIVE}>Active</Tabs.Tab>
              <Tabs.Tab value={ProjectStatus.ON_HOLD}>On Hold</Tabs.Tab>
              <Tabs.Tab value={ProjectStatus.MAINTENANCE}>Maintenance</Tabs.Tab>
              <Tabs.Tab value={ProjectStatus.COMPLETED}>Completed</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Group gap="sm">
            <Select
              placeholder="Filter Department"
              data={PROJECT_DEPARTMENT_OPTIONS}
              value={departmentFilter}
              onChange={setDepartmentFilter}
              clearable
              style={{ width: 180 }}
              radius="md"
            />
            <TextInput
              placeholder="Search project name, client..."
              leftSection={<Search size={16} color="#94a3b8" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 240 }}
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
        <Table.ScrollContainer minWidth={1200}>
          <Table verticalSpacing="md" horizontalSpacing="lg">
            <Table.Thead style={{ backgroundColor: '#f8faff' }}>
              <Table.Tr>
                <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>PROJECT</Table.Th>
                <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>EST. HOURS</Table.Th>
                <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>ACTIVE HOURS</Table.Th>
                {isFinancialsVisible && (
                  <>
                    <Table.Th>Total Amount</Table.Th>
                    <Table.Th>Received</Table.Th>
                    <Table.Th>Pending</Table.Th>
                  </>
                )}
                <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>RELEASE DATE</Table.Th>
                <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>STATUS</Table.Th>
                <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>PROGRESS</Table.Th>
                <Table.Th ta="right" style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>ACTIONS</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows?.length ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={isFinancialsVisible ? 10 : 7} style={{ textAlign: 'center', padding: '40px' }}>
                    <Text style={{ color: '#64748b' }} fw={500}>
                      No projects found matching criteria.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      {/* Create / Edit Project Modal */}
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={
          <Text fw={700} size="lg">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </Text>
        }
        radius="lg"
        padding="xl"
        size="1000px"
      >
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Grid gutter="xl">
            {/* Left: Inputs */}
            <Grid.Col span={7}>
              <Stack gap="md">
                <TextInput
                  label="Project Name"
                  placeholder="e.g. Website Redesign"
                  withAsterisk
                  radius="md"
                  {...form.getInputProps('name')}
                />
                <Select
                  label="Client"
                  placeholder="Select a client"
                  data={clientOptions}
                  searchable
                  withAsterisk
                  radius="md"
                  {...form.getInputProps('client')}
                />
                <Group grow gap="md">
                  <Select
                    label="Department / Project Type"
                    placeholder="Select Department"
                    data={PROJECT_DEPARTMENT_OPTIONS}
                    searchable
                    clearable
                    radius="md"
                    {...form.getInputProps('type')}
                  />
                  <Select
                    label="Status"
                    data={[
                      { value: ProjectStatus.NEW, label: 'New' },
                      { value: ProjectStatus.ACTIVE, label: 'Active' },
                      { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
                      { value: ProjectStatus.MAINTENANCE, label: 'Maintenance' },
                      { value: ProjectStatus.COMPLETED, label: 'Completed' },
                    ]}
                    radius="md"
                    {...form.getInputProps('status')}
                  />
                </Group>

                {/* Dynamic billing fields based on selected client billing type (Only visible to ADMIN and PM) */}
                {isFinancialsVisible && (
                  !form.values.client ? (
                    <NumberInput
                      label="Total Amount ($)"
                      placeholder="Select a client first to unlock billing fields"
                      leftSection={<DollarSign size={16} color="gray" />}
                      disabled
                      radius="md"
                    />
                  ) : isHourlyClient ? (
                    // Hourly client: Cost/hr + Total Hours → auto-calculate total
                    <Stack gap="sm">
                      <Group grow gap="md">
                        <NumberInput
                          label="Cost / Hour ($)"
                          placeholder="0.00"
                          leftSection={<DollarSign size={16} color="gray" />}
                          thousandSeparator=","
                          min={0}
                          radius="md"
                          decimalScale={2}
                          onFocus={(e) => e.target.select()}
                          {...form.getInputProps('costPerHour')}
                        />
                        <NumberInput
                          label="Total Hours"
                          placeholder="0"
                          min={0}
                          radius="md"
                          decimalScale={1}
                          onFocus={(e) => e.target.select()}
                          {...form.getInputProps('totalHours')}
                        />
                      </Group>
                      {/* Auto-computed total */}
                      <Paper
                        p="sm"
                        radius="md"
                        style={{
                          background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        <Group justify="space-between">
                          <Text size="xs" fw={600} c="#1d4ed8">Computed Total Budget</Text>
                          <Text size="sm" fw={800} c="#1d4ed8">
                            ${computedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed" mt={2}>
                          {form.values.costPerHour || 0} $/hr × {form.values.totalHours || 0} hrs
                        </Text>
                      </Paper>
                    </Stack>
                  ) : (
                    // Fixed client: single total amount
                    <NumberInput
                      label="Total Amount ($)"
                      placeholder="0.00"
                      leftSection={<DollarSign size={16} color="gray" />}
                      thousandSeparator=","
                      min={0}
                      radius="md"
                      decimalScale={2}
                      onFocus={(e) => e.target.select()}
                      {...form.getInputProps('totalBudget')}
                    />
                  )
                )}

                <Textarea
                  label="Description"
                  placeholder="Detailed project description..."
                  minRows={3}
                  maxRows={6}
                  autosize
                  radius="md"
                  {...form.getInputProps('description')}
                />

                <Group justify="flex-end" mt="md">
                  <Button variant="light" color="gray" onClick={handleCloseModal} radius="md">
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
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </Button>
                </Group>
              </Stack>
            </Grid.Col>

            {/* Right: Live Summary Preview */}
            <Grid.Col span={5}>
              <Paper
                p="lg"
                radius="xl"
                withBorder
                style={{
                  borderColor: '#e8ecf4',
                  backgroundColor: '#f8fafc',
                  position: 'sticky',
                  top: '20px',
                }}
              >
                <Text fw={700} size="xs" style={{ color: '#64748b', letterSpacing: '0.05em' }} tt="uppercase" mb="md">
                  Live Preview
                </Text>

                <Group gap="sm" mb="xl">
                  <Paper p={10} radius="md" bg="#eff6ff">
                    <Briefcase size={22} color="#2563eb" />
                  </Paper>
                  <div style={{ flex: 1 }}>
                    <Text fw={700} size="md" style={{ color: form.values.name ? '#0f172a' : '#94a3b8' }}>
                      {form.values.name || 'Project Name'}
                    </Text>
                    <Text size="xs" style={{ color: '#64748b' }}>
                      Client: {form.values.client ? getClientName(form.values.client) : 'Not Selected'}
                    </Text>
                  </div>
                </Group>

                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="xs" style={{ color: '#64748b' }}>
                      Status
                    </Text>
                    <Badge
                      variant="light"
                      radius="sm"
                      color={
                        form.values.status === ProjectStatus.NEW || form.values.status === ProjectStatus.ACTIVE
                          ? 'green'
                          : 'orange'
                      }
                    >
                      {form.values.status ? form.values.status.replace('_', ' ').toUpperCase() : '-'}
                    </Badge>
                  </Group>

                  <Group justify="space-between">
                    <Text size="xs" style={{ color: '#64748b' }}>
                      Type
                    </Text>
                    <Text size="xs" fw={600} style={{ color: '#0f172a' }}>
                      {form.values.type || '-'}
                    </Text>
                  </Group>

                  {isFinancialsVisible && (
                    isHourlyClient ? (
                      <>
                        <Group justify="space-between">
                          <Text size="xs" style={{ color: '#64748b' }}>Cost / Hour</Text>
                          <Text size="xs" fw={600} style={{ color: '#0f172a' }}>
                            {form.values.costPerHour ? `$${Number(form.values.costPerHour).toFixed(2)}/hr` : '-'}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" style={{ color: '#64748b' }}>Total Hours</Text>
                          <Text size="xs" fw={600} style={{ color: '#0f172a' }}>
                            {form.values.totalHours ? `${form.values.totalHours} hrs` : '-'}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" style={{ color: '#64748b' }}>Computed Total</Text>
                          <Text size="xs" fw={800} style={{ color: '#1d4ed8' }}>
                            {computedTotal > 0 ? `$${computedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </Text>
                        </Group>
                      </>
                    ) : (
                      <Group justify="space-between">
                        <Text size="xs" style={{ color: '#64748b' }}>Total Amount</Text>
                        <Text size="xs" fw={600} style={{ color: '#0f172a' }}>
                          {form.values.totalBudget ? `$${Number(form.values.totalBudget).toLocaleString()}` : '-'}
                        </Text>
                      </Group>
                    )
                  )}
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Project"
        itemName={deleteTarget?.name}
      />
    </div>
  );
};

export default ProjectsList;
