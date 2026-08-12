import React, { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Table,
  Badge,
  Button,
  Select,
  Modal,
  TextInput,
  Textarea,
  ActionIcon,
  Paper,
  SimpleGrid,
  Stack,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  Plus,
  Edit,
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Layers,
} from 'lucide-react';
import {
  useGetReleasesQuery,
  useCreateReleaseMutation,
  useUpdateReleaseMutation,
} from './release.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';

import { formatDateDisplay, parseLocalDateString, formatLocalDateString } from '../../utils/dateUtils';
import { DEPARTMENT_OPTIONS } from '../../types';

const releaseSchema = z.object({
  project: z.string().min(1, 'Project is required'),
  department: z.enum(['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales', 'pm', 'admin']),
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

  const [opened, setOpened] = useState(false);
  const [editingRelease, setEditingRelease] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const releases = releasesData?.data || [];
  const projects = projectsData?.data || [];
  const users = usersData?.data || [];

  const filteredReleases = useMemo(() => {
    return releases.filter((r) => {
      const projName = typeof r.project === 'object' ? r.project?.name || '' : '';
      const matchesQuery =
        projName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !filterStatus || r.status === filterStatus;
      return matchesQuery && matchesStatus;
    });
  }, [releases, searchQuery, filterStatus]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = releases.length;
    const scheduledCount = releases.filter((r) => r.status === 'scheduled').length;
    const inReviewCount = releases.filter((r) => r.status === 'in_review').length;
    const releasedCount = releases.filter((r) => r.status === 'released').length;
    return { totalCount, scheduledCount, inReviewCount, releasedCount };
  }, [releases]);

  const form = useForm({
    initialValues: {
      project: '',
      department: 'fullstack',
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


  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        project: values.project,
        department: values.department as any,
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
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* Header Banner */}
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
            Release Sheet & Deployments
          </Title>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            Schedule release dates, track staging reviews, and audit client deployment logs.
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          size="md"
          radius="md"
          onClick={openCreateModal}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
          }}
        >
          Add Release
        </Button>
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" mb="xl">
        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Total Releases
            </Text>
            <Paper p={8} radius="md" bg="#eff6ff">
              <Layers size={18} color="#2563eb" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
            {metrics.totalCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Scheduled
            </Text>
            <Paper p={8} radius="md" bg="#eff6ff">
              <Calendar size={18} color="#2563eb" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#2563eb', lineHeight: 1 }}>
            {metrics.scheduledCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              In Review
            </Text>
            <Paper p={8} radius="md" bg="#fffbeb">
              <Clock size={18} color="#f59e0b" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#d97706', lineHeight: 1 }}>
            {metrics.inReviewCount}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Deploys Completed
            </Text>
            <Paper p={8} radius="md" bg="#f0fdf4">
              <CheckCircle2 size={18} color="#10b981" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#10b981', lineHeight: 1 }}>
            {metrics.releasedCount}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Filter Toolbar */}
      <Paper p="md" radius="lg" withBorder mb="lg" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
        <Group justify="space-between">
          <TextInput
            placeholder="Search project or release notes..."
            leftSection={<Search size={16} color="#94a3b8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 320 }}
            radius="md"
          />
          <Group gap="sm">
            <Filter size={16} color="#64748b" />
            <Select
              placeholder="Filter Status"
              data={[
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'in_review', label: 'In Review' },
                { value: 'released', label: 'Released' },
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
              clearable
              style={{ width: 180 }}
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
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" horizontalSpacing="lg">
            <Table.Thead style={{ backgroundColor: '#f8faff' }}>
              <Table.Tr>
                <Table.Th>Project</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th>Team Member</Table.Th>
                <Table.Th>Release Details</Table.Th>
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
                      <Text size="sm" fw={700} style={{ color: '#0f172a' }}>
                        {project?.name || 'Unknown Project'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="dot"
                        radius="sm"
                        fw={600}
                        color={
                          release.department === 'design'
                            ? 'pink'
                            : release.department === 'seo'
                            ? 'green'
                            : 'blue'
                        }
                      >
                        {release.department.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ color: '#334155' }}>
                        {member?.name || 'Unassigned'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ color: '#475569' }} lineClamp={2}>
                        {release.details}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600} style={{ color: '#0f172a' }}>
                        {formatDateDisplay(release.releaseDate)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        radius="sm"
                        fw={600}
                        color={
                          release.status === 'released'
                            ? 'green'
                            : release.status === 'in_review'
                            ? 'orange'
                            : 'blue'
                        }
                      >
                        {release.status.replace('_', ' ')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end" wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => openEditModal(release)}
                          title="Edit Release"
                        >
                          <Edit size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {filteredReleases.length === 0 && !isLoading && (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <Text style={{ color: '#64748b' }} fw={500}>
                      No releases found matching criteria.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      {/* Save Release Modal */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Text fw={700} size="lg">
            {editingRelease ? 'Edit Release' : 'Create New Release'}
          </Text>
        }
        radius="lg"
        padding="xl"
        size={520}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="Project"
              placeholder="Select project"
              data={projects.map((p) => ({ value: p._id, label: p.name || 'Unnamed Project' }))}
              withAsterisk
              radius="md"
              {...form.getInputProps('project')}
            />
            <Group grow gap="md">
              <Select
                label="Department"
                data={DEPARTMENT_OPTIONS}
                withAsterisk
                radius="md"
                {...form.getInputProps('department')}
              />
              <Select
                label="Team Member (Optional)"
                placeholder="Assign to..."
                data={users.map((u) => ({ value: u._id, label: u.name || 'Unknown User' }))}
                clearable
                radius="md"
                {...form.getInputProps('teamMember')}
              />
            </Group>
            <Textarea
              label="Release Details"
              placeholder="Detail what is being deployed or released..."
              withAsterisk
              minRows={3}
              radius="md"
              {...form.getInputProps('details')}
            />
            <Group grow gap="md">
              <DatePickerInput
                label="Release Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                leftSection={<Calendar size={16} color="#64748b" />}
                withAsterisk
                radius="md"
                value={parseLocalDateString(form.values.releaseDate)}
                onChange={(val) =>
                  form.setFieldValue('releaseDate', formatLocalDateString(val))
                }
                clearable
              />
              <Select
                label="Status"
                data={[
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'in_review', label: 'In Review' },
                  { value: 'released', label: 'Released' },
                ]}
                radius="md"
                {...form.getInputProps('status')}
              />
            </Group>

            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={() => setOpened(false)} radius="md">
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
                {editingRelease ? 'Update Release' : 'Create Release'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>


    </Container>
  );
};

export default ReleasesPage;
