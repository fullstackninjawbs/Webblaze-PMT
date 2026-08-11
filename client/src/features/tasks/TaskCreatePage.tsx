import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Text, Card, TextInput, NumberInput, Textarea, Select,
  Button, Group, Stack, Breadcrumbs, Anchor,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { ArrowLeft, Save, ListTodo } from 'lucide-react';
import { useCreateTaskMutation } from './task.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetMilestonesByProjectQuery } from '../milestones/milestone.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { DEPARTMENT_OPTIONS } from '../../types';
import { parseLocalDateString, formatLocalDateString } from '../../utils/dateUtils';

const taskSchema = z.object({
  project: z.string().min(1, 'Project is required'),
  milestone: z.string().min(1, 'Milestone is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  estimatedHours: z.number().min(0.5, 'Estimated hours must be at least 0.5'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const TaskCreatePage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');

  const { data: projectsData } = useGetProjectsQuery();
  const { data: milestonesData } = useGetMilestonesByProjectQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });
  const { data: usersData } = useGetUsersQuery();
  const [createTask, { isLoading }] = useCreateTaskMutation();

  const projects = projectsData?.data || [];
  const milestones = milestonesData?.data || [];
  const users = usersData?.data || [];

  const currentProject = projects.find(p => p._id === selectedProjectId);

  const form = useForm({
    initialValues: {
      project: projectId || '',
      milestone: '',
      title: '',
      description: '',
      department: 'fullstack',
      estimatedHours: 2,
      startDate: '',
      endDate: '',
      assignedTo: '',
    },
    validate: zodResolver(taskSchema),
  });

  const handleProjectChange = (val: string | null) => {
    const newPId = val || '';
    setSelectedProjectId(newPId);
    form.setFieldValue('project', newPId);
    form.setFieldValue('milestone', '');
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const sDate = values.startDate ? parseLocalDateString(values.startDate) : undefined;
      const eDate = values.endDate ? parseLocalDateString(values.endDate) : undefined;

      await createTask({
        milestone: values.milestone,
        title: values.title,
        description: values.description || undefined,
        department: values.department as any,
        estimatedHours: Number(values.estimatedHours) || 2,
        startDate: sDate ? formatLocalDateString(sDate) : undefined,
        endDate: eDate ? formatLocalDateString(eDate) : undefined,
        assignedTo: values.assignedTo || undefined,
        status: 'assigned',
      }).unwrap();

      navigate(selectedProjectId ? `/projects/${selectedProjectId}` : '/team-tasks');
    } catch (e) {
      console.error('Failed to create task', e);
    }
  };

  return (
    <Container size="md" style={{ animation: 'fade-in 0.3s ease' }}>
      <Breadcrumbs mb="lg" style={{ fontSize: '0.875rem' }}>
        <Anchor onClick={() => navigate('/projects')} c="blue">Projects</Anchor>
        {selectedProjectId && (
          <Anchor onClick={() => navigate(`/projects/${selectedProjectId}`)} c="blue">
            {currentProject?.name || 'Project Details'}
          </Anchor>
        )}
        <Text color="dimmed">New Task</Text>
      </Breadcrumbs>

      <Button
        variant="subtle"
        color="gray"
        leftSection={<ArrowLeft size={16} />}
        onClick={() => navigate(selectedProjectId ? `/projects/${selectedProjectId}` : '/projects')}
        mb="md"
        style={{ paddingLeft: 0 }}
      >
        Back
      </Button>

      <Card withBorder radius="xl" p="xl" shadow="sm">
        <Group gap="sm" mb="lg">
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: '#eff6ff' }}>
            <ListTodo size={24} color="#2563eb" />
          </div>
          <div>
            <Title order={2} style={{ color: '#0f172a' }}>Create New Task</Title>
            <Text size="sm" c="dimmed">
              Assign a new task under a project milestone
            </Text>
          </div>
        </Group>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Group grow gap="md">
              <Select
                label="Project"
                placeholder="Select project"
                data={projects.map(p => ({ value: p._id, label: p.name }))}
                value={form.values.project}
                onChange={handleProjectChange}
                searchable
                withAsterisk
                radius="md"
              />

              <Select
                label="Milestone"
                placeholder={selectedProjectId ? "Select milestone" : "Select project first"}
                data={milestones.map(m => ({ value: m._id, label: m.title }))}
                disabled={!selectedProjectId}
                searchable
                withAsterisk
                radius="md"
                {...form.getInputProps('milestone')}
              />
            </Group>

            <TextInput
              label="Task Title"
              placeholder="e.g. Implement User Authentication API"
              withAsterisk
              radius="md"
              {...form.getInputProps('title')}
            />

            <Textarea
              label="Description"
              placeholder="Detailed description of deliverables and requirements..."
              minRows={3}
              maxRows={6}
              autosize
              radius="md"
              {...form.getInputProps('description')}
            />

            <Group grow gap="md">
              <Select
                label="Department"
                data={DEPARTMENT_OPTIONS}
                withAsterisk
                radius="md"
                {...form.getInputProps('department')}
              />

              <NumberInput
                label="Estimated Hours"
                placeholder="2"
                min={0.5}
                step={0.5}
                radius="md"
                withAsterisk
                {...form.getInputProps('estimatedHours')}
              />

              <Select
                label="Assignee"
                placeholder="Select team member"
                data={users.map(u => ({ value: u._id, label: `${u.name} (${u.department || u.role})` }))}
                searchable
                clearable
                radius="md"
                {...form.getInputProps('assignedTo')}
              />
            </Group>

            <Group grow gap="md">
              <DatePickerInput
                label="Start Date"
                placeholder="Pick start date"
                radius="md"
                value={form.values.startDate ? parseLocalDateString(form.values.startDate) : null}
                onChange={(date) =>
                  form.setFieldValue('startDate', date ? formatLocalDateString(date) : '')
                }
                clearable
              />

              <DatePickerInput
                label="End Date"
                placeholder="Pick end date"
                radius="md"
                value={form.values.endDate ? parseLocalDateString(form.values.endDate) : null}
                onChange={(date) =>
                  form.setFieldValue('endDate', date ? formatLocalDateString(date) : '')
                }
                clearable
              />
            </Group>

            <Group justify="flex-end" mt="xl">
              <Button
                variant="light"
                color="gray"
                onClick={() => navigate(selectedProjectId ? `/projects/${selectedProjectId}` : '/projects')}
                radius="md"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={isLoading}
                radius="md"
                leftSection={<Save size={16} />}
              >
                Create Task
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Container>
  );
};
