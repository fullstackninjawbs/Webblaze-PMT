import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Text, Card, TextInput, NumberInput, Textarea, Select,
  Button, Group, Stack, Breadcrumbs, Anchor,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { ArrowLeft, Save, Flag } from 'lucide-react';
import { useCreateMilestoneMutation } from './milestone.slice';
import { useGetProjectsQuery } from '../projects/project.slice';
import { parseLocalDateString, formatLocalDateString } from '../../utils/dateUtils';

const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  estimatedHours: z.number().min(0, 'Hours must be non-negative'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled']),
});

export const MilestoneCreatePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [createMilestone, { isLoading }] = useCreateMilestoneMutation();
  const { data: projectsData } = useGetProjectsQuery();

  const project = projectsData?.data?.find(p => p._id === projectId);

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      estimatedHours: 10,
      startDate: '',
      endDate: '',
      status: 'not_started' as const,
    },
    validate: zodResolver(milestoneSchema),
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!projectId) return;
    try {
      const sDate = values.startDate ? parseLocalDateString(values.startDate) : undefined;
      const eDate = values.endDate ? parseLocalDateString(values.endDate) : undefined;

      await createMilestone({
        project: projectId,
        title: values.title,
        description: values.description || undefined,
        estimatedHours: Number(values.estimatedHours) || 0,
        startDate: sDate ? formatLocalDateString(sDate) : undefined,
        endDate: eDate ? formatLocalDateString(eDate) : undefined,
        status: values.status,
      }).unwrap();

      navigate(`/projects/${projectId}`);
    } catch (e) {
      console.error('Failed to create milestone', e);
    }
  };

  return (
    <Container size="md" style={{ animation: 'fade-in 0.3s ease' }}>
      <Breadcrumbs mb="lg" style={{ fontSize: '0.875rem' }}>
        <Anchor onClick={() => navigate('/projects')} c="blue">Projects</Anchor>
        <Anchor onClick={() => navigate(`/projects/${projectId}`)} c="blue">
          {project?.name || 'Project Details'}
        </Anchor>
        <Text color="dimmed">New Milestone</Text>
      </Breadcrumbs>

      <Button
        variant="subtle"
        color="gray"
        leftSection={<ArrowLeft size={16} />}
        onClick={() => navigate(`/projects/${projectId}`)}
        mb="md"
        style={{ paddingLeft: 0 }}
      >
        Back to Project
      </Button>

      <Card withBorder radius="xl" p="xl" shadow="sm">
        <Group gap="sm" mb="lg">
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: '#eff6ff' }}>
            <Flag size={24} color="#2563eb" />
          </div>
          <div>
            <Title order={2} style={{ color: '#0f172a' }}>Create New Milestone</Title>
            <Text size="sm" c="dimmed">
              Add a new project milestone for {project?.name || 'this project'}
            </Text>
          </div>
        </Group>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Milestone Title"
              placeholder="e.g. Phase 1: MVP Release"
              withAsterisk
              radius="md"
              {...form.getInputProps('title')}
            />

            <Textarea
              label="Description"
              placeholder="Detailed scope, goals, or deliverables for this milestone..."
              minRows={3}
              maxRows={6}
              autosize
              radius="md"
              {...form.getInputProps('description')}
            />

            <Group grow gap="md">
              <NumberInput
                label="Estimated Hours"
                placeholder="10"
                min={0}
                radius="md"
                withAsterisk
                {...form.getInputProps('estimatedHours')}
              />

              <Select
                label="Status"
                data={[
                  { value: 'not_started', label: 'Not Started' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'on_hold', label: 'On Hold' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                radius="md"
                {...form.getInputProps('status')}
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
                onClick={() => navigate(`/projects/${projectId}`)}
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
                Create Milestone
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Container>
  );
};
