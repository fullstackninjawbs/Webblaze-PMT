import React, { useState, useMemo } from 'react';
import { useGetProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation } from './project.slice';
import { useGetClientsQuery } from '../clients/client.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { useGetReleasesQuery } from '../releases/release.slice';
import { Table, Button, Group, Title, Modal, TextInput, Select, Card, Text, Badge, ActionIcon, NumberInput, MultiSelect, Grid, Progress, Tabs } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Plus, Edit, Trash, Briefcase, DollarSign, Eye } from 'lucide-react';
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
        team: values.team.length > 0 ? values.team : undefined
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
  const teamOptions = usersData?.data
    .filter(u => u.role === Role.TEAM_LEAD || u.role === Role.TEAM_MEMBER)
    .map((u) => ({ value: u._id, label: `${u.name} (${u.role.replace('_', ' ')})` })) || [];

  const getClientName = (id: string) => clientOptions.find(c => c.value === id)?.label || 'Unknown Client';

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

  const filteredProjects = useMemo(() => {
    const raw = projectsData?.data || [];
    if (activeTab === 'all') return raw;
    return raw.filter(p => p.status === activeTab);
  }, [projectsData, activeTab]);

  const rows = filteredProjects.map((project: any) => (
    <Table.Tr key={project._id}>
      <Table.Td>
        <Group gap="sm">
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
            <Briefcase size={18} />
          </div>
          <div>
            <Text size="sm" fw={600} style={{ cursor: 'pointer', color: '#111827' }} onClick={() => navigate(`/projects/${project._id}`)}>
              {project.name}
            </Text>
            <Text size="xs" c="dimmed">
              {project.client?.name || 'Unknown Client'}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge
          variant="light"
          color={
            project.status === ProjectStatus.ACTIVE ? 'green' :
              project.status === ProjectStatus.ON_HOLD ? 'orange' :
                project.status === ProjectStatus.COMPLETED ? 'blue' : 'gray'
          }
        >
          {project.status.replace('_', ' ')}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">{getProjectReleaseDate(project._id)}</Text>
      </Table.Td>
      {isAdminOrPM && (
        <>
          <Table.Td>
            {project.totalBudget ? <Text size="sm" fw={500}>${project.totalBudget.toLocaleString()}</Text> : <Text size="sm" c="dimmed">-</Text>}
          </Table.Td>
          <Table.Td>
            <Text size="sm" c="teal" fw={500}>
              ${(project.receivedAmount || 0).toLocaleString()}
            </Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm" c="blue" fw={500}>
              ${(project.pendingAmount || 0).toLocaleString()}
            </Text>
          </Table.Td>
        </>
      )}
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" w={35} ta="right">{project.progress || 0}%</Text>
          <Progress value={project.progress || 0} color="blue" size="sm" radius="xl" style={{ flex: 1 }} />
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <ActionIcon variant="subtle" color="blue" onClick={() => navigate(`/projects/${project._id}`)} title="View Details">
            <Eye size={16} />
          </ActionIcon>
          {isAdminOrPM && (
            <>
              <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(project)} title="Edit">
                <Edit size={16} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteProject(project._id, project.name)} title="Delete">
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
              fontSize: '1.625rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.25,
            }}
          >
            Projects
          </Title>
          <Text
            size="sm"
            mt={4}
            style={{ color: '#64748b', letterSpacing: '-0.01em' }}
          >
            Track and manage all your active engagements.
          </Text>
        </div>
        {isAdminOrPM && (
          <Button
            leftSection={<Plus size={16} />}
            radius="md"
            variant="filled"
            onClick={openCreateModal}
            style={{
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
            }}
          >
            New Project
          </Button>
        )}
      </Group>

      <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'all')} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="all">All Projects</Tabs.Tab>
          <Tabs.Tab value={ProjectStatus.ACTIVE}>Active</Tabs.Tab>
          <Tabs.Tab value={ProjectStatus.ON_HOLD}>On Hold</Tabs.Tab>
          <Tabs.Tab value={ProjectStatus.MAINTENANCE}>Maintenance</Tabs.Tab>
          <Tabs.Tab value={ProjectStatus.COMPLETED}>Completed</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Card
        shadow="sm"
        p="0"
        radius="xl"
        withBorder
        style={{
          border: '1px solid #e8ecf4',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" horizontalSpacing="xl">
            <Table.Thead>
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
              {rows?.length ? rows : (
                <Table.Tr>
                  <Table.Td colSpan={isAdminOrPM ? 8 : 5} style={{ textAlign: 'center', padding: '40px' }}>
                    <Text c="dimmed">No projects found.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      {/* Create Project Modal (Split Layout) */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={<Text fw={700} size="xl">{editingProject ? 'Edit Project' : 'Create New Project'}</Text>}
        radius="lg"
        size="1000px" // large for split layout
      >
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Grid gutter="xl">
            {/* Left: Form Inputs */}
            <Grid.Col span={7}>
              <TextInput label="Project Name" placeholder="e.g. Website Redesign" required mb="md" {...form.getInputProps('name')} />
              <Select
                label="Client"
                placeholder="Select a client"
                data={clientOptions}
                searchable
                required
                mb="md"
                {...form.getInputProps('client')}
              />
              <Group grow mb="md">
                <TextInput label="Project Type" placeholder="e.g. Web App" {...form.getInputProps('type')} />
                <Select
                  label="Status"
                  data={[
                    { value: ProjectStatus.ACTIVE, label: 'Active' },
                    { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
                    { value: ProjectStatus.MAINTENANCE, label: 'Maintenance' },
                    { value: ProjectStatus.COMPLETED, label: 'Completed' },
                  ]}
                  {...form.getInputProps('status')}
                />
              </Group>

              <NumberInput
                label="Total Budget ($)"
                placeholder="0.00"
                leftSection={<DollarSign size={16} color="gray" />}
                thousandSeparator=","
                min={0}
                mb="md"
                {...form.getInputProps('totalBudget')}
              />

              <MultiSelect
                label="Assign Team"
                placeholder="Select Team Leads and Members"
                data={teamOptions}
                searchable
                clearable
                mb="md"
                {...form.getInputProps('team')}
              />

              <TextInput label="Description" placeholder="Brief project description" mb="xl" {...form.getInputProps('description')} />

              <Group justify="flex-start" mt="xl">
                <Button variant="light" onClick={() => setModalOpened(false)}>Cancel</Button>
                <Button type="submit" loading={isCreating || isUpdating}>
                  {editingProject ? 'Update Project' : 'Create Project'}
                </Button>
              </Group>
            </Grid.Col>

            {/* Right: Live Summary Preview */}
            <Grid.Col span={5}>
              <Card shadow="sm" p="lg" radius="md" withBorder style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: '20px' }}>
                <Text fw={600} size="sm" c="dimmed" tt="uppercase" mb="md">Live Preview</Text>

                <Group gap="sm" mb="xl">
                  <div style={{ width: 48, height: 48, borderRadius: '8px', backgroundColor: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                    <Briefcase size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text fw={700} size="lg" style={{ color: form.values.name ? '#111827' : '#9CA3AF' }}>
                      {form.values.name || 'Project Name'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Client: {form.values.client ? getClientName(form.values.client) : 'Not Selected'}
                    </Text>
                  </div>
                </Group>

                <Group justify="space-between" mb="sm">
                  <Text size="sm" c="dimmed">Status</Text>
                  <Badge variant="light" color={form.values.status === ProjectStatus.ACTIVE ? 'green' : 'orange'}>
                    {form.values.status.replace('_', ' ')}
                  </Badge>
                </Group>

                <Group justify="space-between" mb="sm">
                  <Text size="sm" c="dimmed">Type</Text>
                  <Text size="sm" fw={500}>{form.values.type || '-'}</Text>
                </Group>

                <Group justify="space-between" mb="sm">
                  <Text size="sm" c="dimmed">Budget</Text>
                  <Text size="sm" fw={500}>
                    {form.values.totalBudget ? `$${form.values.totalBudget.toLocaleString()}` : '-'}
                  </Text>
                </Group>

                <Group justify="space-between" mb="sm" align="flex-start">
                  <Text size="sm" c="dimmed">Team</Text>
                  <div style={{ textAlign: 'right' }}>
                    <Text size="sm" fw={500}>
                      {form.values.team.length > 0 ? `${form.values.team.length} members` : 'Unassigned'}
                    </Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </form>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
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
