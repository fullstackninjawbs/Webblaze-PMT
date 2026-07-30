import React, { useState, useMemo } from 'react';
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from './project.slice';
import { useGetClientsQuery } from '../clients/client.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { useGetReleasesQuery } from '../releases/release.slice';
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
  NumberInput,
  MultiSelect,
  Grid,
  Progress,
  Tabs,
  Paper,
  SimpleGrid,
  Stack,
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
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role, ProjectStatus } from '../../types';
import { useNavigate } from 'react-router-dom';

import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  client: z.string().min(1, 'Client is required'),
  description: z.string().optional(),
  type: z.string().optional(),
  totalBudget: z.number().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  team: z.array(z.string()).optional(),
});

export const ProjectsList: React.FC = () => {
  const navigate = useNavigate();
  const { data: projectsData } = useGetProjectsQuery();
  const { data: clientsData } = useGetClientsQuery();
  const { data: usersData } = useGetUsersQuery();
  const { data: releasesData } = useGetReleasesQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useSelector((state: RootState) => state.auth);

  const isAdminOrPM = user?.role === Role.ADMIN || user?.role === Role.PM;

  const form = useForm({
    initialValues: {
      name: '',
      client: '',
      description: '',
      type: 'Web App',
      totalBudget: 0,
      status: ProjectStatus.ACTIVE,
      team: [] as string[],
    },
    validate: zodResolver(projectSchema),
  });

  const openCreateModal = () => {
    setEditingProject(null);
    form.reset();
    setModalOpened(true);
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    form.setValues({
      name: project.name || '',
      client: project.client?._id || project.client || '',
      description: project.description || '',
      type: project.type || 'Web App',
      totalBudget: project.totalBudget || 0,
      status: project.status || ProjectStatus.ACTIVE,
      team: project.team?.map((t: any) => t._id || t) || [],
    });
    setModalOpened(true);
  };

  const onSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        ...values,
        totalBudget: values.totalBudget || undefined,
        team: values.team.length > 0 ? values.team : undefined,
      };

      if (editingProject) {
        await updateProject({ id: editingProject._id, data: payload as any }).unwrap();
      } else {
        await createProject(payload as any).unwrap();
      }
      setModalOpened(false);
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
  const teamOptions =
    usersData?.data
      .filter((u) => u.role === Role.TEAM_LEAD || u.role === Role.TEAM_MEMBER)
      .map((u) => ({ value: u._id, label: `${u.name} (${u.role ? u.role.replace('_', ' ') : 'Member'})` })) || [];

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
    return new Date(sorted[0].releaseDate).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const allProjects = projectsData?.data || [];

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      const matchesTab = activeTab === 'all' || p.status === activeTab;
      const matchesQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.type || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [allProjects, activeTab, searchQuery]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const activeCount = allProjects.filter((p) => p.status === ProjectStatus.ACTIVE).length;
    const totalBudgetSum = allProjects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
    const totalReceivedSum = allProjects.reduce((sum, p) => sum + (p.receivedAmount || 0), 0);
    const totalPendingSum = allProjects.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);
    return { activeCount, totalBudgetSum, totalReceivedSum, totalPendingSum };
  }, [allProjects]);

  const rows = filteredProjects.map((project: any) => (
    <Table.Tr key={project._id}>
      <Table.Td>
        <Group gap="sm">
          <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Briefcase size={18} color="#2563eb" />
          </div>
          <div>
            <Text
              size="sm"
              fw={700}
              style={{ cursor: 'pointer', color: '#0f172a' }}
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              {project.name}
            </Text>
            <Text size="xs" style={{ color: '#64748b' }}>
              {project.client?.name || 'Unknown Client'}
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
      <Table.Td>
        <Text size="sm" style={{ color: '#64748b' }}>
          {getProjectReleaseDate(project._id)}
        </Text>
      </Table.Td>
      {isAdminOrPM && (
        <>
          <Table.Td>
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
          <Table.Td>
            <Text size="sm" style={{ color: '#059669' }} fw={600}>
              ${(project.receivedAmount || 0).toLocaleString()}
            </Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm" style={{ color: '#d97706' }} fw={600}>
              ${(project.pendingAmount || 0).toLocaleString()}
            </Text>
          </Table.Td>
        </>
      )}
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" w={35} ta="right" fw={600} style={{ color: '#0f172a' }}>
            {project.progress || 0}%
          </Text>
          <Progress value={project.progress || 0} color="blue" size="sm" radius="xl" style={{ flex: 1 }} />
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => navigate(`/projects/${project._id}`)}
            title="View Details"
          >
            <Eye size={16} />
          </ActionIcon>
          {isAdminOrPM && (
            <>
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => openEditModal(project)}
                title="Edit"
              >
                <Edit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => handleDeleteProject(project._id, project.name)}
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
            Projects Directory
          </Title>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            Manage client deliverables, milestone schedules, team assignments, and budgets.
          </Text>
        </div>
        {isAdminOrPM && (
          <Button
            leftSection={<Plus size={16} />}
            radius="md"
            size="md"
            onClick={openCreateModal}
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

      {/* KPI Cards */}
      {isAdminOrPM && (
        <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" mb="xl">
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

          <Paper
            p="lg"
            radius="xl"
            withBorder
            style={{ borderColor: '#e8ecf4', background: '#ffffff' }}
          >
            <Group justify="space-between" mb="xs">
              <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
                Total Portfolio Budget
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
        </SimpleGrid>
      )}

      {/* Tabs & Search Filter Toolbar */}
      <Paper p="md" radius="lg" withBorder mb="lg" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
        <Group justify="space-between">
          <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'all')} radius="md">
            <Tabs.List style={{ borderBottom: 'none' }}>
              <Tabs.Tab value="all">All Projects</Tabs.Tab>
              <Tabs.Tab value={ProjectStatus.ACTIVE}>Active</Tabs.Tab>
              <Tabs.Tab value={ProjectStatus.ON_HOLD}>On Hold</Tabs.Tab>
              <Tabs.Tab value={ProjectStatus.MAINTENANCE}>Maintenance</Tabs.Tab>
              <Tabs.Tab value={ProjectStatus.COMPLETED}>Completed</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <TextInput
            placeholder="Search project name, client..."
            leftSection={<Search size={16} color="#94a3b8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 280 }}
            radius="md"
          />
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
                <Table.Th>Project</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Release Date</Table.Th>
                {isAdminOrPM && (
                  <>
                    <Table.Th>Budget</Table.Th>
                    <Table.Th>Received</Table.Th>
                    <Table.Th>Pending</Table.Th>
                  </>
                )}
                <Table.Th>Progress</Table.Th>
                <Table.Th w={100}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows?.length ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={isAdminOrPM ? 8 : 5} style={{ textAlign: 'center', padding: '40px' }}>
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
        onClose={() => setModalOpened(false)}
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
                  <TextInput
                    label="Project Type"
                    placeholder="e.g. Web App"
                    radius="md"
                    {...form.getInputProps('type')}
                  />
                  <Select
                    label="Status"
                    data={[
                      { value: ProjectStatus.ACTIVE, label: 'Active' },
                      { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
                      { value: ProjectStatus.MAINTENANCE, label: 'Maintenance' },
                      { value: ProjectStatus.COMPLETED, label: 'Completed' },
                    ]}
                    radius="md"
                    {...form.getInputProps('status')}
                  />
                </Group>

                <NumberInput
                  label="Total Budget ($)"
                  placeholder="0.00"
                  leftSection={<DollarSign size={16} color="gray" />}
                  thousandSeparator=","
                  min={0}
                  radius="md"
                  {...form.getInputProps('totalBudget')}
                />

                <MultiSelect
                  label="Assign Team"
                  placeholder="Select Team Leads and Members"
                  data={teamOptions}
                  searchable
                  clearable
                  radius="md"
                  {...form.getInputProps('team')}
                />

                <TextInput
                  label="Description"
                  placeholder="Brief project description"
                  radius="md"
                  {...form.getInputProps('description')}
                />

                <Group justify="flex-end" mt="md">
                  <Button variant="light" color="gray" onClick={() => setModalOpened(false)} radius="md">
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
                      color={form.values.status === ProjectStatus.ACTIVE ? 'green' : 'orange'}
                    >
                      {form.values.status ? form.values.status.replace('_', ' ') : '-'}
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

                  <Group justify="space-between">
                    <Text size="xs" style={{ color: '#64748b' }}>
                      Budget
                    </Text>
                    <Text size="xs" fw={600} style={{ color: '#0f172a' }}>
                      {form.values.totalBudget ? `$${form.values.totalBudget.toLocaleString()}` : '-'}
                    </Text>
                  </Group>

                  <Group justify="space-between" align="flex-start">
                    <Text size="xs" style={{ color: '#64748b' }}>
                      Team
                    </Text>
                    <Text size="xs" fw={600} style={{ color: '#0f172a' }}>
                      {form.values.team.length > 0 ? `${form.values.team.length} members` : 'Unassigned'}
                    </Text>
                  </Group>
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
