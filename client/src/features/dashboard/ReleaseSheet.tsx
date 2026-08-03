import React, { useState } from 'react';
import { Card, Text, Group, Table, Badge, Button, Select, Modal, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { Calendar } from 'lucide-react';
import { useGetReleasesQuery, useCreateReleaseMutation } from '../releases/release.slice';
import { formatDateDisplay, parseLocalDateString, formatLocalDateString } from '../../utils/dateUtils';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { DEPARTMENT_OPTIONS } from '../../types';

const releaseSchema = z.object({
  project: z.string().min(1, 'Project is required'),
  department: z.enum(['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales', 'pm', 'admin']),
  teamMember: z.string().optional(),
  details: z.string().min(1, 'Details are required'),
  releaseDate: z.string().min(1, 'Date is required'),
  status: z.enum(['scheduled', 'in_review', 'released']),
});

export const ReleaseSheet: React.FC = () => {
  const { data: releasesData, isLoading } = useGetReleasesQuery();
  const { data: projectsData } = useGetProjectsQuery();
  const { data: usersData } = useGetUsersQuery();
  const [createRelease, { isLoading: isCreating }] = useCreateReleaseMutation();

  const [opened, setOpened] = useState(false);
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

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await createRelease({
        ...values,
        department: values.department as any,
        status: values.status as 'scheduled' | 'in_review' | 'released',
        releaseDate: new Date(values.releaseDate).toISOString()
      }).unwrap();
      setOpened(false);
      form.reset();
    } catch (err) {
      console.error('Failed to create release', err);
    }
  };

  return (
    <Card shadow="sm" p="lg" radius="lg" withBorder mb="xl">
      <Group justify="space-between" mb="md">
        <Text fw={700} size="lg" style={{ color: '#111827' }}>Release Sheet</Text>
        <Select
          placeholder="Status"
          data={[
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'in_review', label: 'In Review' },
            { value: 'released', label: 'Released' }
          ]}
          value={filterStatus}
          onChange={setFilterStatus}
          clearable
          styles={{ input: { width: 140 } }}
        />
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Project</Table.Th>
            <Table.Th>Department</Table.Th>
            <Table.Th>Team Member</Table.Th>
            <Table.Th>Details</Table.Th>
            <Table.Th>Release Date</Table.Th>
            <Table.Th>Status</Table.Th>
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
                  <Text size="sm" lineClamp={1}>{release.details}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>{formatDateDisplay(release.releaseDate)}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge 
                    color={release.status === 'released' ? 'green' : release.status === 'in_review' ? 'yellow' : 'gray'}
                    variant="light"
                  >
                    {release.status.replace('_', ' ')}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            );
          })}
          {filteredReleases.length === 0 && !isLoading && (
            <Table.Tr>
              <Table.Td colSpan={6} ta="center" py="xl">
                <Text color="dimmed">No releases found.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Create New Release">
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
            data={DEPARTMENT_OPTIONS}
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
          />
          <DatePickerInput
            label="Release Date"
            placeholder="DD Month, YYYY"
            valueFormat="DD MMMM, YYYY"
            leftSection={<Calendar size={16} color="#64748b" />}
            value={parseLocalDateString(form.values.releaseDate)}
            onChange={(val) =>
              form.setFieldValue('releaseDate', formatLocalDateString(val))
            }
            mb="sm"
            withAsterisk
            radius="md"
            clearable
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
            <Button type="submit" loading={isCreating}>Create Release</Button>
          </Group>
        </form>
      </Modal>
    </Card>
  );
};
