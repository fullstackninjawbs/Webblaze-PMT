import React, { useState } from 'react';
import { useGetProjectsQuery, useCreateProjectMutation, useDeleteProjectMutation } from './project.slice';
import { useGetClientsQuery } from '../clients/client.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { Table, Button, Group, Title, Modal, TextInput, Select, Card, Text, Badge, ActionIcon, Menu, NumberInput, MultiSelect, Grid, Progress } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Plus, MoreVertical, Edit, Trash, Briefcase, DollarSign, Eye } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role, ProjectStatus } from '../../types';
import { useNavigate } from 'react-router-dom';

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
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [modalOpened, setModalOpened] = useState(false);
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

  const onSubmit = async (values: typeof form.values) => {
    try {
      await createProject({
        ...values,
        totalBudget: values.totalBudget || undefined,
        team: values.team.length > 0 ? values.team : undefined
      } as any).unwrap();
      setModalOpened(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  const clientOptions = clientsData?.data.map((c) => ({ value: c._id, label: c.name })) || [];
  const teamOptions = usersData?.data
    .filter(u => u.role === Role.TEAM_LEAD || u.role === Role.TEAM_MEMBER)
    .map((u) => ({ value: u._id, label: `${u.name} (${u.role.replace('_', ' ')})` })) || [];

  const getClientName = (id: string) => clientOptions.find(c => c.value === id)?.label || 'Unknown Client';

  const rows = projectsData?.data.map((project) => (
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
        <Text size="sm" c="dimmed">TBD</Text>
      </Table.Td>
      {isAdminOrPM && (
        <>
          <Table.Td>
            {project.totalBudget ? <Text size="sm" fw={500}>${project.totalBudget.toLocaleString()}</Text> : <Text size="sm" c="dimmed">-</Text>}
          </Table.Td>
          <Table.Td><Text size="sm" c="teal" fw={500}>$0</Text></Table.Td>
          <Table.Td>
            {project.totalBudget ? <Text size="sm" c="blue" fw={500}>${project.totalBudget.toLocaleString()}</Text> : <Text size="sm" c="dimmed">-</Text>}
          </Table.Td>
        </>
      )}
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" w={35} ta="right">0%</Text>
          <Progress value={0} color="blue" size="sm" radius="xl" style={{ flex: 1 }} />
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end">
          <ActionIcon variant="subtle" color="blue" onClick={() => navigate(`/projects/${project._id}`)} title="View Details">
            <Eye size={16} />
          </ActionIcon>
          {isAdminOrPM && (
            <Menu position="bottom-end" shadow="sm">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <MoreVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<Edit size={14} />}>Edit</Menu.Item>
                <Menu.Item color="red" leftSection={<Trash size={14} />} onClick={() => deleteProject(project._id)}>Delete</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div style={{ animation: 'fade-in 0.4s ease-out' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#111827', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Projects
          </Title>
          <Text color="dimmed" size="sm">Track and manage all your active engagements.</Text>
        </div>
        {isAdminOrPM && (
          <Button
            leftSection={<Plus size={18} />}
            radius="md"
            variant="filled"
            color="indigo"
            onClick={() => setModalOpened(true)}
          >
            New Project
          </Button>
        )}
      </Group>

      {/* Project Status Filters could go here */}

      <Card shadow="sm" p="0" radius="xl" withBorder style={{ border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}>
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" horizontalSpacing="xl" striped>
            <Table.Thead style={{ backgroundColor: '#F9FAFB' }}>
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
        title={<Text fw={700} size="xl">Create New Project</Text>}
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
                <Button type="submit" color="indigo" loading={isCreating}>Create Project</Button>
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
    </div>
  );
};

export default ProjectsList;
