import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Text, Card, TextInput, NumberInput, Textarea, Select,
  Button, Group, Stack, Breadcrumbs, Anchor, Loader, Center,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { ArrowLeft, Save, Edit } from 'lucide-react';
import { useGetMilestoneByIdQuery, useUpdateMilestoneMutation } from './milestone.slice';
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

export const MilestoneEditPage: React.FC = () => {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const navigate = useNavigate();
  const { data: milestoneData, isLoading: isMilestoneLoading } = useGetMilestoneByIdQuery(id!);
  const [updateMilestone, { isLoading: isUpdating }] = useUpdateMilestoneMutation();
  const { data: projectsData } = useGetProjectsQuery();

  const milestone = milestoneData?.data;
  const project = projectsData?.data?.find(p => p._id === (projectId || milestone?.project));

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      estimatedHours: 10,
      startDate: '',
      endDate: '',
      status: 'not_started' as 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled',
    },
    validate: zodResolver(milestoneSchema),
  });

  useEffect(() => {
    if (milestone) {
      const sDateStr = milestone.startDate ? formatLocalDateString(parseLocalDateString(milestone.startDate)) : '';
      const eDateStr = milestone.endDate ? formatLocalDateString(parseLocalDateString(milestone.endDate)) : '';
      form.setValues({
        title: milestone.title || '',
        description: milestone.description || '',
        estimatedHours: milestone.estimatedHours || 0,
        startDate: sDateStr,
        endDate: eDateStr,
        status: milestone.status || 'not_started',
      });
    }
  }, [milestone]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!id) return;
    try {
      const sDate = values.startDate ? parseLocalDateString(values.startDate) : undefined;
      const eDate = values.endDate ? parseLocalDateString(values.endDate) : undefined;

      await updateMilestone({
        _id: id,
        project: projectId || (milestone?.project as string),
        title: values.title,
        description: values.description || undefined,
        estimatedHours: Number(values.estimatedHours) || 0,
        startDate: sDate ? formatLocalDateString(sDate) : undefined,
        endDate: eDate ? formatLocalDateString(eDate) : undefined,
        status: values.status,
      }).unwrap();

      navigate(`/projects/${projectId || milestone?.project}`);
    } catch (e) {
      console.error('Failed to update milestone', e);
    }
  };

  if (isMilestoneLoading) {
    return <Center h={400}><Loader size="lg" color="blue" /></Center>;
  }

  const pId = projectId || (typeof milestone?.project === 'object' ? (milestone?.project as any)?._id : milestone?.project);

  return (
    <Container size="md" style={{ animation: 'fade-in 0.3s ease' }}>
      <Breadcrumbs mb="lg" style={{ fontSize: '0.875rem' }}>
        <Anchor onClick={() => navigate('/projects')} c="blue">Projects</Anchor>
        <Anchor onClick={() => navigate(`/projects/${pId}`)} c="blue">
          {project?.name || 'Project Details'}
        </Anchor>
        <Text color="dimmed">Edit Milestone</Text>
      </Breadcrumbs>

      <Button
        variant="subtle"
        color="gray"
        leftSection={<ArrowLeft size={16} />}
        onClick={() => navigate(`/projects/${pId}`)}
        mb="md"
        style={{ paddingLeft: 0 }}
      >
        Back to Project
      </Button>

      <Card withBorder radius="xl" p="xl" shadow="sm">
        <Group gap="sm" mb="lg">
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: '#eff6ff' }}>
            <Edit size={24} color="#2563eb" />
          </div>
          <div>
            <Title order={2} style={{ color: '#0f172a' }}>Edit Milestone</Title>
            <Text size="sm" c="dimmed">
              Update details for &quot;{milestone?.title}&quot;
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
                onClick={() => navigate(`/projects/${pId}`)}
                radius="md"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={isUpdating}
                radius="md"
                leftSection={<Save size={16} />}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Container>
  );
};
