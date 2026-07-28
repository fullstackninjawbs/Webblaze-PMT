import React, { useState } from 'react';
import { useGetProjectsQuery, useCreateProjectMutation } from './project.slice';
import { useGetClientsQuery } from '../clients/client.slice';
import { Table, Button, Group, Title, Modal, TextInput, Select, Card, Text, Badge, ActionIcon, Menu, NumberInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Plus, MoreVertical, Edit, Trash, Briefcase, DollarSign } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role, ProjectStatus } from '../../types';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  client: z.string().min(1, 'Client is required'),
  description: z.string().optional(),
  type: z.string().optional(),
  totalBudget: z.number().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const ProjectsList: React.FC = () => {
  const { data: projectsData } = useGetProjectsQuery();
  const { data: clientsData } = useGetClientsQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [modalOpened, setModalOpened] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  const isAdminOrPM = user?.role === Role.ADMIN || user?.role === Role.PM;

  const form = useForm({
    initialValues: {
      name: '',
      client: '',
      description: '',
      type: '',
      totalBudget: 0,
      status: ProjectStatus.ACTIVE,
    },
    validate: zodResolver(projectSchema),
  });

  const onSubmit = async (values: typeof form.values) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await createProject({ ...values, totalBudget: values.totalBudget || undefined } as any).unwrap();
      setModalOpened(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  const clientOptions = clientsData?.data.map((c) => ({ value: c._id, label: c.name })) || [];

  const rows = projectsData?.data.map((project) => (
    <Table.Tr key={project._id}>
      <Table.Td>
        <Group gap="sm">
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
            <Briefcase size={18} />
          </div>
          <div>
            <Text size="sm" fw={600}>{project.name}</Text>
            <Text size="xs" c="dimmed">
              Client: {project.client?.name || 'Unknown'}
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
        <AvatarGroup team={project.team} />
      </Table.Td>
      <Table.Td>
        {project.totalBudget !== undefined ? (
          <Text size="sm" fw={500}>
            ${project.totalBudget.toLocaleString()}
          </Text>
        ) : (
          <Text size="sm" c="dimmed">-</Text>
        )}
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

      <Card shadow="sm" p="0" radius="xl" withBorder style={{ border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}>
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" horizontalSpacing="xl" striped>
            <Table.Thead style={{ backgroundColor: '#F9FAFB' }}>
              <Table.Tr>
                <Table.Th>Project</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Team</Table.Th>
                <Table.Th>Budget</Table.Th>
                <Table.Th w={80}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows?.length ? rows : (
                <Table.Tr>
                  <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    <Text c="dimmed">No projects found.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={<Text fw={600}>Create New Project</Text>} radius="md" size="lg">
        <form onSubmit={form.onSubmit(onSubmit)}>
          <TextInput label="Project Name" placeholder="e.g. Website Redesign" required mb="md" {...form.getInputProps('name')} />
          <Select 
            label="Client" 
            placeholder="Select a client"
            data={clientOptions}
            required 
            mb="md" 
            {...form.getInputProps('client')} 
          />
          <Group grow mb="md">
            <TextInput label="Project Type" placeholder="e.g. Web App" {...form.getInputProps('type')} />
            <NumberInput 
              label="Total Budget" 
              placeholder="0.00" 
              leftSection={<DollarSign size={16} color="gray" />}
              thousandSeparator=","
              min={0}
              {...form.getInputProps('totalBudget')} 
            />
          </Group>
          <TextInput label="Description" placeholder="Brief project description" mb="xl" {...form.getInputProps('description')} />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalOpened(false)}>Cancel</Button>
            <Button type="submit" color="indigo" loading={isCreating}>Create Project</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
};

// Helper component for team avatars
const AvatarGroup = ({ team }: { team: any[] }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!team || team.length === 0) return <Text size="sm" c="dimmed">Unassigned</Text>;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {team.slice(0, 3).map((member, i) => (
        <div 
          key={member._id} 
          style={{ 
            width: 32, height: 32, borderRadius: '50%', backgroundColor: '#DBEAFE', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8', 
            fontSize: '12px', fontWeight: 600, border: '2px solid white', 
            marginLeft: i > 0 ? -10 : 0, zIndex: 10 - i, position: 'relative' 
          }}
          title={member.name}
        >
          {member.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {team.length > 3 && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', fontSize: '12px', fontWeight: 600, border: '2px solid white', marginLeft: -10, zIndex: 0, position: 'relative' }}>
          +{team.length - 3}
        </div>
      )}
    </div>
  );
};
