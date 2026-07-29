import React, { useState } from 'react';
import { Container, Title, Text, Card, Group, Table, Badge, Button, Select, Modal, TextInput, Textarea, ActionIcon } from '@mantine/core';
import { Plus, Edit, Trash } from 'lucide-react';
import { useGetReleasesQuery, useCreateReleaseMutation, useUpdateReleaseMutation, useDeleteReleaseMutation } from './release.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';

const releaseSchema = z.object({
  project: z.string().min(1, 'Project is required'),
  department: z.enum(['design', 'development', 'seo']),
  teamMember: z.string().optional(),
  details: z.string().min(1, 'Details are required'),
  releaseDate: z.string().min(1, 'Date is required'),
  status: z.enum(['scheduled', 'in_review', 'released']),
});

export const ReleasesPage: React.FC = () => {
  const { data: releasesData, isLoading } = useGetReleasesQuery();
  const { data: projectsData } = useGetProjectsQuery();
  const { data: usersData } = useGetUsersQuery();
  const [createRelease, { isLoading: isCreating }] = useCreateReleaseMutation();
  const [updateRelease, { isLoading: isUpdating }] = useUpdateReleaseMutation();
  const [deleteRelease] = useDeleteReleaseMutation();

  const [opened, setOpened] = useState(false);
  const [editingRelease, setEditingRelease] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const releases = releasesData?.data || [];
  const projects = projectsData?.data || [];
  const users = usersData?.data || [];

  const filteredReleases = filterStatus
    ? releases.filter(r => r.status === filterStatus)
    : releases;

  const form = useForm({
    initialValues: {
      project: '',
      department: 'development',
      teamMember: '',
      details: '',
      releaseDate: '',
      status: 'scheduled',
    },
    validate: zodResolver(releaseSchema),
  });

  const openCreateModal = () => {
    setEditingRelease(null);
    form.reset();
    setOpened(true);
  };

  const openEditModal = (release: any) => {
    setEditingRelease(release);
    form.setValues({
      project: typeof release.project === 'object' ? release.project._id : release.project,
      department: release.department,
      teamMember: typeof release.teamMember === 'object' ? release.teamMember?._id : release.teamMember || '',
      details: release.details,
      releaseDate: new Date(release.releaseDate).toISOString().split('T')[0],
      status: release.status,
    });
    setOpened(true);
  };

  const handleDeleteRelease = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this release?')) {
      try {
        await deleteRelease(id).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        project: values.project,
        department: values.department as 'design' | 'development' | 'seo',
        teamMember: values.teamMember || undefined,
        details: values.details,
        releaseDate: new Date(values.releaseDate).toISOString(),
        status: values.status as 'scheduled' | 'in_review' | 'released',
      };

      if (editingRelease) {
        await updateRelease({ _id: editingRelease._id, ...payload }).unwrap();
      } else {
        await createRelease(payload).unwrap();
      }
      setOpened(false);
      form.reset();
    } catch (err) {
      console.error('Failed to save release', err);
    }
  };

  return (
    <Container size="xl" py="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <Group justify="space-between" mb="xl" style={{ marginBottom: '28px' }}>
        <div>
          <Title
            order={2}
            style={{
              color: '#0f172a',
              fontSize: '1.875rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.2,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Releases
          </Title>
          <Text
            size="sm"
            mt={6}
            style={{ color: '#94a3b8', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}
          >
            Manage and track project deployments and milestones.
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          size="md"
          color="blue"
          onClick={openCreateModal}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
          }}
        >
          Add Release
        </Button>
      </Group>

      <Card
        shadow="sm"
        p="lg"
        radius="lg"
        withBorder
        style={{
          border: '1px solid #e8ecf4',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <Group mb="md">
          <Select
            placeholder="Filter by Status"
            data={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'in_review', label: 'In Review' },
              { value: 'released', label: 'Released' }
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            clearable
            styles={{ input: { width: 200 } }}
          />
        </Group>

        <Table verticalSpacing="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Project</Table.Th>
              <Table.Th>Department</Table.Th>
              <Table.Th>Team Member</Table.Th>
              <Table.Th>Details</Table.Th>
              <Table.Th>Release Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th w={100}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredReleases.map((release) => {
              const project = typeof release.project === 'object' ? release.project : null;
              const member = typeof release.teamMember === 'object' ? release.teamMember : null;

              return (
                <Table.Tr key={release._id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{project?.name || 'Unknown'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="dot" color={release.department === 'design' ? 'pink' : release.department === 'seo' ? 'green' : 'blue'}>
                      {release.department.toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{member?.name || 'Unassigned'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={2}>{release.details}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>{new Date(release.releaseDate).toLocaleDateString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={release.status === 'released' ? 'green' : release.status === 'in_review' ? 'yellow' : 'gray'}
                      variant="light"
                    >
                      {release.status.replace('_', ' ')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(release)} title="Edit">
                        <Edit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteRelease(release._id)} title="Delete">
                        <Trash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {filteredReleases.length === 0 && !isLoading && (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center" py="xl">
                  <Text color="dimmed">No releases found matching the criteria.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={opened} onClose={() => setOpened(false)} title={editingRelease ? "Edit Release" : "Create New Release"} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Select
            label="Project"
            placeholder="Select project"
            data={projects.map(p => ({ value: p._id, label: p.name || 'Unnamed Project' }))}
            {...form.getInputProps('project')}
            mb="sm"
            withAsterisk
          />
          <Select
            label="Department"
            data={[
              { value: 'design', label: 'Design' },
              { value: 'development', label: 'Development' },
              { value: 'seo', label: 'SEO' }
            ]}
            {...form.getInputProps('department')}
            mb="sm"
            withAsterisk
          />
          <Select
            label="Team Member (Optional)"
            placeholder="Assign to..."
            data={users.map(u => ({ value: u._id, label: u.name || 'Unknown User' }))}
            {...form.getInputProps('teamMember')}
            mb="sm"
            clearable
          />
          <Textarea
            label="Release Details"
            placeholder="What is being released?"
            {...form.getInputProps('details')}
            mb="sm"
            withAsterisk
            minRows={3}
          />
          <TextInput
            label="Release Date"
            type="date"
            {...form.getInputProps('releaseDate')}
            mb="sm"
            withAsterisk
          />
          <Select
            label="Status"
            data={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'in_review', label: 'In Review' },
              { value: 'released', label: 'Released' }
            ]}
            {...form.getInputProps('status')}
            mb="xl"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>Cancel</Button>
            <Button type="submit" loading={isCreating || isUpdating}>
              {editingRelease ? "Update Release" : "Create Release"}
            </Button>
          </Group>
        </form>
      </Modal>
    </Container>
  );
};

export default ReleasesPage;
