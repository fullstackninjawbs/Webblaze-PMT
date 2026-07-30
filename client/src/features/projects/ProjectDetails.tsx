import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProjectsQuery, useUpdateProjectMutation } from './project.slice';
import { useGetMilestonesByProjectQuery, useCreateMilestoneMutation } from '../milestones/milestone.slice';
import { useGetTasksByMilestoneQuery, useCreateTaskMutation, useGetAllTasksQuery } from '../tasks/task.slice';
import { useStartTimerMutation, useStopTimerMutation, useGetActiveTimerQuery } from '../timelogs/timeLog.slice';
import { Container, Title, Text, Button, Group, Card, Badge, Stack, Accordion, Drawer, TextInput, NumberInput, Loader, Center, Tabs, Progress, SimpleGrid, Table, Select, Tooltip, ActionIcon, FileInput, Textarea, Alert, Modal, MultiSelect, Paper } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Plus, ArrowLeft, Play, Square, DollarSign, Calendar, Users, Activity, FileText, FileCheck, CheckCircle, Info, UploadCloud, Filter, Edit, Trash, Search, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role, ProjectStatus } from '../../types';
import { useGetUsersQuery } from '../users/user.slice';
import { useGetReleasesQuery, useCreateReleaseMutation, useUpdateReleaseMutation, useDeleteReleaseMutation } from '../releases/release.slice';
import { useGetInvoicesQuery, useCreateInvoiceMutation, useUpdateInvoiceMutation, useDeleteInvoiceMutation } from '../invoices/invoice.slice';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useUploadFileMutation } from '../uploads/upload.slice';

const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  estimatedHours: z.number().min(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled']),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End Date cannot be before Start Date",
  path: ["endDate"],
});

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  department: z.enum(['design', 'development', 'seo']),
  estimatedHours: z.number().min(0.5, 'Minimum 0.5 hours'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assignedTo: z.string().optional(),
  milestone: z.string(),
});

export const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user } = useSelector((state: RootState) => state.auth);
  const isAdminOrPM = user?.role === Role.ADMIN || user?.role === Role.PM;

  const { data: projectsData, isLoading: isProjectLoading } = useGetProjectsQuery();
  const project = projectsData?.data?.find(p => p._id === id);

  const { data: milestonesData, isLoading: isMilestonesLoading } = useGetMilestonesByProjectQuery(id!);
  const milestones = milestonesData?.data || [];

  const projectEstHours = milestones.reduce((sum, m) => sum + (m.estimatedHours || 0), 0);
  const projectSpentHours = milestones.reduce((sum, m) => sum + (m.spentHours || 0), 0);

  const { data: usersData } = useGetUsersQuery();
  const teamOptions = usersData?.data
    .filter(u => u.role === Role.TEAM_LEAD || u.role === Role.TEAM_MEMBER)
    .map(u => ({ value: u._id, label: `${u.name} (${u.department || 'N/A'})` })) || [];

  const [createMilestone, { isLoading: isCreatingMilestone }] = useCreateMilestoneMutation();
  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
  const [uploadFile, { isLoading: isUploadingFile }] = useUploadFileMutation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [milestoneDrawerOpened, setMilestoneDrawerOpened] = useState(false);
  const [taskDrawerOpened, setTaskDrawerOpened] = useState(false);
  const [activeMilestoneEstimated, setActiveMilestoneEstimated] = useState<number>(0);
  const [activeMilestoneAllocated, setActiveMilestoneAllocated] = useState<number>(0);

  const milestoneForm = useForm({
    initialValues: { title: '', estimatedHours: 10, startDate: '', endDate: '', status: 'not_started' },
    validate: zodResolver(milestoneSchema),
  });

  const taskForm = useForm({
    initialValues: { title: '', description: '', department: 'development', estimatedHours: 2, startDate: '', endDate: '', assignedTo: '', milestone: '' },
    validate: zodResolver(taskSchema),
  });

  const handleCreateMilestone = async (values: typeof milestoneForm.values) => {
    try {
      await createMilestone({
        ...values,
        project: id,
        status: values.status as any,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined
      }).unwrap();
      setMilestoneDrawerOpened(false);
      milestoneForm.reset();
    } catch (e) {
      console.error(e);
    }
  };

  const openTaskDrawer = (milestoneId: string, estHours: number, allocHours: number) => {
    setActiveMilestoneEstimated(estHours);
    setActiveMilestoneAllocated(allocHours);
    taskForm.setFieldValue('milestone', milestoneId);
    setTaskDrawerOpened(true);
  };

  const handleCreateTask = async (values: typeof taskForm.values) => {
    try {
      let attachmentIds: string[] = [];

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await uploadFile(formData).unwrap();
        if (uploadRes.success && uploadRes.data) {
          attachmentIds.push(uploadRes.data._id);
        }
      }

      await createTask({
        ...values,
        department: values.department as any,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
        assignedTo: values.assignedTo || undefined,
        attachments: attachmentIds.length > 0 ? attachmentIds : undefined,
      }).unwrap();
      
      setSelectedFile(null);
      setTaskDrawerOpened(false);
      taskForm.reset();
    } catch (e) {
      console.error(e);
    }
  };

  const newTaskEst = taskForm.values.estimatedHours || 0;
  const remainingHours = activeMilestoneEstimated - activeMilestoneAllocated;
  const isOverAllocated = newTaskEst > remainingHours;

  if (isProjectLoading || isMilestonesLoading) return <Center h={400}><Loader color="blue" /></Center>;
  if (!project) return <Container mt="xl"><Title>Project not found</Title></Container>;

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <Button
        variant="subtle"
        color="gray"
        leftSection={<ArrowLeft size={16} />}
        onClick={() => navigate('/projects')}
        mb="md"
        style={{
          paddingLeft: 0,
          color: '#64748b',
          fontWeight: 500,
          fontSize: '0.875rem',
          letterSpacing: '-0.01em',
        }}
      >
        Back to Projects
      </Button>

      {/* Header Section */}
      <Card
        shadow="sm"
        p="xl"
        radius="xl"
        withBorder
        mb="xl"
        style={{
          borderColor: '#e8ecf4',
          background: '#ffffff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Group justify="space-between" align="flex-start">
          {/* Left: Project Info */}
          <div style={{ flex: 1 }}>
            <Group gap="xs" mb="xs">
              <Badge variant="light" color={project.status === ProjectStatus.ACTIVE ? 'green' : 'orange'} radius="sm" fw={600}>
                {project.status.replace('_', ' ')}
              </Badge>
              <Badge variant="light" color="blue" radius="sm" fw={600}>
                Client: {project.client?.name || 'Unknown'}
              </Badge>
            </Group>

            <Title order={1} style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }} mb="xs">
              {project.name}
            </Title>

            <Text size="sm" style={{ color: '#64748b', maxWidth: '650px', lineHeight: 1.6 }}>
              {project.description || 'No description provided for this project.'}
            </Text>

            <Group mt="xl" gap="sm" wrap="nowrap" style={{ maxWidth: '420px' }}>
              <div style={{ flex: 1 }}>
                <Group justify="space-between" mb={6}>
                  <Text size="xs" fw={600} style={{ color: '#64748b' }}>Project Progress (Hours)</Text>
                  <Text size="xs" fw={700} style={{ color: '#2563eb' }}>{Math.round((projectSpentHours / (projectEstHours || 1)) * 100)}%</Text>
                </Group>
                <Progress value={(projectSpentHours / (projectEstHours || 1)) * 100} color="blue" size="sm" radius="xl" />
              </div>
            </Group>
          </div>

          {/* Right: KPIs (Admin/PM only) */}
          {isAdminOrPM && (
            <Group gap="md">
              <Paper p="md" radius="lg" withBorder style={{ borderColor: '#e8ecf4', minWidth: 140, background: '#ffffff' }}>
                <Group gap="xs" mb={4}>
                  <DollarSign size={16} color="#3b82f6" />
                  <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>Total Amount</Text>
                </Group>
                <Text fw={800} style={{ fontSize: '1.25rem', color: '#0f172a' }}>{project.totalBudget ? `$${project.totalBudget.toLocaleString()}` : 'N/A'}</Text>
              </Paper>

              <Paper p="md" radius="lg" withBorder style={{ borderColor: '#e8ecf4', minWidth: 140, background: '#ffffff' }}>
                <Group gap="xs" mb={4}>
                  <CheckCircle size={16} color="#10b981" />
                  <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>Received</Text>
                </Group>
                <Text fw={800} style={{ fontSize: '1.25rem', color: '#059669' }}>$0</Text>
              </Paper>

              <Paper p="md" radius="lg" withBorder style={{ borderColor: '#e8ecf4', minWidth: 140, background: '#ffffff' }}>
                <Group gap="xs" mb={4}>
                  <Activity size={16} color="#f59e0b" />
                  <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>Pending</Text>
                </Group>
                <Text fw={800} style={{ fontSize: '1.25rem', color: '#d97706' }}>
                  {project.pendingAmount !== undefined ? `$${project.pendingAmount.toLocaleString()}` : (project.totalBudget ? `$${project.totalBudget.toLocaleString()}` : '$0')}
                </Text>
              </Paper>
            </Group>
          )}
        </Group>
      </Card>

      {/* Tabbed Navigation */}
      <Tabs defaultValue="milestones" radius="md">
        <Tabs.List style={{ borderBottom: '1px solid #e5e7eb' }} mb="xl">
          <Tabs.Tab value="overview" leftSection={<Activity size={16} />}>Overview</Tabs.Tab>
          <Tabs.Tab value="milestones" leftSection={<CheckCircle size={16} />}>Milestones</Tabs.Tab>
          <Tabs.Tab value="tasks" leftSection={<FileCheck size={16} />}>Tasks</Tabs.Tab>
          <Tabs.Tab value="team" leftSection={<Users size={16} />}>Team</Tabs.Tab>
          <Tabs.Tab value="releases" leftSection={<Calendar size={16} />}>Releases</Tabs.Tab>
          {(user?.role === Role.ADMIN || user?.role === Role.PM) && (
            <Tabs.Tab value="invoices" leftSection={<FileText size={16} />}>Invoices</Tabs.Tab>
          )}
          <Tabs.Tab value="reports" leftSection={<FileText size={16} />}>Reports</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <Card withBorder shadow="sm" p="xl" radius="md">
              <Title order={3} mb="md">Project Information</Title>
              <Stack gap="sm">
                <Group justify="space-between"><Text c="dimmed">Project Type</Text><Text fw={500}>{project.type || 'Standard'}</Text></Group>
                <Group justify="space-between"><Text c="dimmed">Created At</Text><Text fw={500}>{new Date(project.createdAt).toLocaleDateString()}</Text></Group>
                <Group justify="space-between"><Text c="dimmed">Client Source</Text><Badge variant="light">{project.client?.source || 'direct'}</Badge></Group>
              </Stack>
            </Card>

            <Card withBorder shadow="sm" p="xl" radius="md">
              <Title order={3} mb="md">Team Members</Title>
              {project.team?.length > 0 ? (
                <Stack gap="sm">
                  {project.team.slice(0, 3).map((member: any) => (
                    <Group key={member._id} gap="sm">
                      <UserAvatar name={member.name} email={member.email} avatarUrl={member.avatarUrl} size="sm" />
                      <div>
                        <Text size="sm" fw={500}>{member.name}</Text>
                        <Text size="xs" c="dimmed">{member.role.replace('_', ' ')}</Text>
                      </div>
                    </Group>
                  ))}
                  {project.team.length > 3 && <Text size="sm" c="blue" fw={500}>+ {project.team.length - 3} more members</Text>}
                </Stack>
              ) : (
                <Text c="dimmed">No team members assigned yet.</Text>
              )}
            </Card>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="milestones">
          <Group justify="space-between" mb="md">
            <Title order={3}>Project Milestones</Title>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => setMilestoneDrawerOpened(true)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
              }}
            >
              Add Milestone
            </Button>
          </Group>

          <Accordion variant="separated" radius="md" multiple>
            {milestones.map((milestone) => (
              <MilestoneAccordionItem
                key={milestone._id}
                milestone={milestone}
                onAddTask={openTaskDrawer}
              />
            ))}
          </Accordion>

          {milestones.length === 0 && (
            <Card withBorder padding="xl" radius="md" style={{ textAlign: 'center', backgroundColor: '#F9FAFB' }} mt="md">
              <Text color="dimmed">No milestones created yet. Add one to get started!</Text>
            </Card>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="tasks">
          <ProjectTasks projectId={id!} milestones={milestones} />
        </Tabs.Panel>
        <Tabs.Panel value="team">
          <ProjectTeam projectId={id!} projectData={project} />
        </Tabs.Panel>
        <Tabs.Panel value="releases">
          <ProjectReleases projectId={id!} />
        </Tabs.Panel>
        {(user?.role === Role.ADMIN || user?.role === Role.PM) && (
          <Tabs.Panel value="invoices">
            <ProjectInvoices projectId={id!} projectData={project} />
          </Tabs.Panel>
        )}
        <Tabs.Panel value="reports">
          <ProjectReports project={project} milestones={milestones} />
        </Tabs.Panel>
      </Tabs>

      {/* Add Milestone Drawer */}
      <Drawer opened={milestoneDrawerOpened} onClose={() => setMilestoneDrawerOpened(false)} position="right" title={<Text fw={600}>Add Milestone</Text>} padding="xl">
        <form onSubmit={milestoneForm.onSubmit(handleCreateMilestone)}>
          <Stack>
            <TextInput required label="Milestone Title" placeholder="e.g. Design Phase" {...milestoneForm.getInputProps('title')} />
            <NumberInput
              required
              label={
                <Group gap={4}>
                  <Text size="sm" fw={500}>Estimated Hours</Text>
                  <Tooltip label="Estimated hours define the maximum task hours that can be allocated to this milestone" withArrow multiline w={250}>
                    <ActionIcon size="xs" radius="xl" variant="subtle" color="gray"><Info size={14} /></ActionIcon>
                  </Tooltip>
                </Group>
              }
              min={0}
              onFocus={(e) => e.target.select()}
              {...milestoneForm.getInputProps('estimatedHours')}
            />
            <Group grow>
              <DatePickerInput
                label="Start Date"
                placeholder="Select date"
                leftSection={<Calendar size={16} color="#64748b" />}
                value={milestoneForm.values.startDate ? new Date(milestoneForm.values.startDate) : null}
                onChange={(val) => milestoneForm.setFieldValue('startDate', val ? val.toISOString().split('T')[0] : '')}
                clearable
                radius="md"
              />
              <DatePickerInput
                label="End Date"
                placeholder="Select date"
                leftSection={<Calendar size={16} color="#64748b" />}
                value={milestoneForm.values.endDate ? new Date(milestoneForm.values.endDate) : null}
                onChange={(val) => milestoneForm.setFieldValue('endDate', val ? val.toISOString().split('T')[0] : '')}
                clearable
                radius="md"
              />
            </Group>
            <Select
              label="Status"
              data={[
                { value: 'not_started', label: 'Not Started' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'on_hold', label: 'On Hold' },
                { value: 'completed', label: 'Completed' },
              ]}
              {...milestoneForm.getInputProps('status')}
            />
            <Button type="submit" fullWidth loading={isCreatingMilestone} mt="md">Create Milestone</Button>
          </Stack>
        </form>
      </Drawer>

      {/* Add Task Drawer */}
      <Drawer opened={taskDrawerOpened} onClose={() => setTaskDrawerOpened(false)} position="right" size="lg" title={<Text fw={600}>Create Task</Text>} padding="xl">
        {/* Real-time Hour Cap Indicator */}
        <Card withBorder p="md" radius="md" mb="xl" style={{ backgroundColor: '#F8FAFC' }}>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={600} color="dimmed">Milestone Capacity</Text>
            <Text size="sm" fw={600} color={isOverAllocated ? 'red' : 'blue'}>
              {remainingHours - newTaskEst}h Remaining
            </Text>
          </Group>
          <Progress.Root>
            <Progress.Section value={(activeMilestoneAllocated / activeMilestoneEstimated) * 100} color="blue" />
            <Progress.Section value={(newTaskEst / activeMilestoneEstimated) * 100} color={isOverAllocated ? 'red' : 'teal'} />
          </Progress.Root>
          <Group justify="space-between" mt="xs">
            <Text size="xs" color="dimmed">Est: {activeMilestoneEstimated}h</Text>
            <Text size="xs" color="dimmed">Allocated: {activeMilestoneAllocated}h + {newTaskEst}h (New)</Text>
          </Group>
        </Card>

        {isOverAllocated && (
          <Alert color="red" title="Hour Cap Exceeded" mb="xl">
            This task requires {newTaskEst}h, but the milestone only has {remainingHours}h remaining. Please adjust the estimated hours or increase the milestone cap.
          </Alert>
        )}

        <form onSubmit={taskForm.onSubmit(handleCreateTask)}>
          <Stack>
            <TextInput required label="Task Title" placeholder="e.g. Wireframe Homepage" {...taskForm.getInputProps('title')} />
            <Textarea label="Description" placeholder="Task details..." minRows={3} {...taskForm.getInputProps('description')} />
            <Group grow>
              <Select required label="Department" data={[{ value: 'design', label: 'Design' }, { value: 'development', label: 'Development' }, { value: 'seo', label: 'SEO' }]} {...taskForm.getInputProps('department')} />
              <NumberInput required label="Estimated Hours" min={0.5} step={0.5} onFocus={(e) => e.target.select()} {...taskForm.getInputProps('estimatedHours')} />
            </Group>
            <Group grow>
              <DatePickerInput
                label="Start Date"
                placeholder="Select date"
                leftSection={<Calendar size={16} color="#64748b" />}
                value={taskForm.values.startDate ? new Date(taskForm.values.startDate) : null}
                onChange={(val) => taskForm.setFieldValue('startDate', val ? val.toISOString().split('T')[0] : '')}
                clearable
                radius="md"
              />
              <DatePickerInput
                label="End Date"
                placeholder="Select date"
                leftSection={<Calendar size={16} color="#64748b" />}
                value={taskForm.values.endDate ? new Date(taskForm.values.endDate) : null}
                onChange={(val) => taskForm.setFieldValue('endDate', val ? val.toISOString().split('T')[0] : '')}
                clearable
                radius="md"
              />
            </Group>
            <Select label="Assign To" placeholder="Leave empty for unassigned" data={teamOptions} searchable clearable {...taskForm.getInputProps('assignedTo')} />

            <FileInput
              label="Attachments"
              placeholder="Select file to upload..."
              leftSection={<UploadCloud size={16} />}
              value={selectedFile}
              onChange={setSelectedFile}
              clearable
            />

            <Button type="submit" fullWidth disabled={isOverAllocated} loading={isCreatingTask || isUploadingFile} mt="md">
              Create Task
            </Button>
          </Stack>
        </form>
      </Drawer>
    </Container>
  );
};

const MilestoneAccordionItem = ({ milestone, onAddTask }: { milestone: any, onAddTask: (milestoneId: string, est: number, alloc: number) => void }) => {
  const { data: tasksData, isLoading } = useGetTasksByMilestoneQuery(milestone._id);
  const tasks = tasksData?.data || [];
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const [startTimer] = useStartTimerMutation();
  const [stopTimer] = useStopTimerMutation();

  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const activeTimer = activeTimerData?.data;
  const spentHours = tasks.reduce((sum: number, t: any) => sum + (t.spentHours || 0), 0);
  const allocatedHours = tasks.reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0);
  const progressPercent = Math.min((spentHours / milestone.estimatedHours) * 100, 100);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (deptFilter) result = result.filter((t: any) => t.department === deptFilter);
    if (statusFilter) result = result.filter((t: any) => t.status === statusFilter);
    return result;
  }, [tasks, deptFilter, statusFilter]);

  const handleStartTimer = async (taskId: string) => {
    try { await startTimer({ taskId }).unwrap(); } catch (e) { console.error(e); }
  };

  const handleStopTimer = async () => {
    try { await stopTimer({}).unwrap(); } catch (e) { console.error(e); }
  };

  return (
    <Accordion.Item value={milestone._id} style={{ backgroundColor: 'white', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden' }}>
      <Accordion.Control>
        <Group justify="space-between" wrap="nowrap">
          <div style={{ flex: 1 }}>
            <Group gap="sm" mb={4}>
              <Text fw={700} size="lg">{milestone.title}</Text>
              <Badge variant="dot" color={milestone.status === 'completed' ? 'green' : milestone.status === 'in_progress' ? 'blue' : 'gray'}>
                {milestone.status.replace('_', ' ')}
              </Badge>
            </Group>
            <Group gap="xl">
              <Text size="xs" color="dimmed">Dates: {milestone.startDate ? new Date(milestone.startDate).toLocaleDateString() : '-'} to {milestone.endDate ? new Date(milestone.endDate).toLocaleDateString() : '-'}</Text>
              <Text size="xs" color="dimmed">Tasks: {tasks.length}</Text>
            </Group>
          </div>

          <div style={{ width: '200px' }}>
            <Group justify="space-between" mb={4}>
              <Text size="xs" fw={600}>Hours (Spent / Est)</Text>
              <Text size="xs" fw={700} color={spentHours > milestone.estimatedHours ? 'red' : 'blue'}>
                {spentHours} / {milestone.estimatedHours}h
              </Text>
            </Group>
            <Progress value={progressPercent} color={spentHours > milestone.estimatedHours ? 'red' : 'blue'} size="sm" />
          </div>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Card withBorder radius="md" style={{ backgroundColor: '#F9FAFB' }}>
          <Group justify="space-between" mb="md">
            <Group>
              <Select placeholder="Filter Department" leftSection={<Filter size={14} />} data={['design', 'development', 'seo']} value={deptFilter} onChange={setDeptFilter} clearable size="xs" w={150} />
              <Select placeholder="Filter Status" leftSection={<Filter size={14} />} data={['assigned', 'in_progress', 'in_review', 'completed']} value={statusFilter} onChange={setStatusFilter} clearable size="xs" w={150} />
            </Group>
            <Button size="xs" leftSection={<Plus size={14} />} onClick={() => onAddTask(milestone._id, milestone.estimatedHours, allocatedHours)}>
              Add Task
            </Button>
          </Group>

          {isLoading ? (
            <Center h={100}><Loader size="sm" /></Center>
          ) : filteredTasks.length > 0 ? (
            <Table verticalSpacing="sm" bg="white" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <Table.Thead bg="#F3F4F6">
                <Table.Tr>
                  <Table.Th>Task</Table.Th>
                  <Table.Th>Department</Table.Th>
                  <Table.Th>Assigned To</Table.Th>
                  <Table.Th>Est. Time</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Progress</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredTasks.map((task: any) => {
                  const isTimerActive = activeTimer?.task === task._id || (activeTimer?.task as any)?._id === task._id;
                  return (
                    <Table.Tr key={task._id}>
                      <Table.Td>
                        <Text fw={500} size="sm">{task.title}</Text>
                        {(task.startDate || task.endDate) && (
                          <Text size="xs" color="dimmed">
                            {task.startDate ? new Date(task.startDate).toLocaleDateString() : '-'} - {task.endDate ? new Date(task.endDate).toLocaleDateString() : '-'}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td><Badge variant="outline" color="gray">{task.department || 'N/A'}</Badge></Table.Td>
                      <Table.Td>
                        {task.assignedTo ? (
                          <Tooltip label={task.assignedTo.role?.replace('_', ' ')} withArrow>
                            <Group gap="xs" wrap="nowrap">
                              <UserAvatar name={task.assignedTo.name} avatarUrl={task.assignedTo.avatarUrl} size="sm" />
                              <Text size="sm">{task.assignedTo.name}</Text>
                            </Group>
                          </Tooltip>
                        ) : (
                          <Badge variant="light" color="orange">Unassigned</Badge>
                        )}
                      </Table.Td>
                      <Table.Td><Text size="sm" fw={600}>{task.estimatedHours}h</Text></Table.Td>
                      <Table.Td>
                        <Badge color={task.status === 'completed' ? 'green' : 'blue'} variant="light">{task.status.replace('_', ' ')}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label={`${(task.spentHours || 0).toFixed(1)}h / ${task.estimatedHours}h (${Math.round(((task.spentHours || 0) / task.estimatedHours) * 100)}%)`}>
                          <Progress value={((task.spentHours || 0) / task.estimatedHours) * 100} size="sm" color={task.status === 'completed' ? 'green' : 'blue'} />
                        </Tooltip>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {isTimerActive ? (
                            <Button size="xs" color="red" variant="light" leftSection={<Square size={14} />} onClick={handleStopTimer}>Stop</Button>
                          ) : (
                            <Button size="xs" variant="light" leftSection={<Play size={14} />} onClick={() => handleStartTimer(task._id)} disabled={!!activeTimer}>Start</Button>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          ) : (
            <Center h={100}><Text color="dimmed" size="sm">No tasks match criteria.</Text></Center>
          )}
        </Card>
      </Accordion.Panel>
    </Accordion.Item>
  );
};


const ProjectReports = ({ project, milestones }: { project: any; milestones: any[] }) => {
  const { data: tasksData } = useGetAllTasksQuery();
  
  if (!project) return null;

  const milestoneIds = milestones.map(m => m._id);
  const projectTasks = (tasksData?.data || []).filter((t: any) => {
    const milestoneId = typeof t.milestone === 'object' ? t.milestone?._id : t.milestone;
    return milestoneIds.includes(milestoneId);
  });

  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((t: any) => t.status === 'completed').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const budget = project.totalBudget || 0;
  const received = project.receivedAmount || 0;
  const pending = Math.max(budget - received, 0);
  const paidPercent = budget > 0 ? (received / budget) * 100 : 0;
  const pendingPercent = budget > 0 ? (pending / budget) * 100 : 0;

  const totalEstimated = projectTasks.reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0);
  const totalSpent = projectTasks.reduce((sum: number, t: any) => sum + (t.spentHours || 0), 0);
  const hoursPercent = totalEstimated > 0 ? Math.round((totalSpent / totalEstimated) * 100) : 0;

  return (
    <Stack gap="xl" style={{ marginTop: '20px' }}>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Card shadow="xs" p="lg" radius="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} color="dimmed" tt="uppercase">Financial Progress</Text>
            <DollarSign size={18} color="#10b981" />
          </Group>
          <Text size="lg" fw={800} color="teal">${received.toLocaleString()} Received</Text>
          <Text size="xs" c="dimmed" mt={4}>Of total ${budget.toLocaleString()} amount</Text>
          <Progress value={paidPercent} color="teal" size="sm" mt="md" radius="xl" />
        </Card>

        <Card shadow="xs" p="lg" radius="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} color="dimmed" tt="uppercase">Tasks Completion</Text>
            <CheckCircle size={18} color="#3b82f6" />
          </Group>
          <Text size="lg" fw={800} color="blue">{taskCompletionRate}% Rate</Text>
          <Text size="xs" c="dimmed" mt={4}>{completedTasks} of {totalTasks} tasks done</Text>
          <Progress value={taskCompletionRate} color="blue" size="sm" mt="md" radius="xl" />
        </Card>

        <Card shadow="xs" p="lg" radius="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} color="dimmed" tt="uppercase">Hours Distribution</Text>
            <Clock size={18} color="#f59e0b" />
          </Group>
          <Text size="lg" fw={800} color="orange">{totalSpent}h Spent</Text>
          <Text size="xs" c="dimmed" mt={4}>Of total {totalEstimated}h estimated</Text>
          <Progress value={Math.min(hoursPercent, 100)} color={hoursPercent > 100 ? 'red' : 'orange'} size="sm" mt="md" radius="xl" />
        </Card>
      </SimpleGrid>

      <Card shadow="xs" p="xl" radius="lg" withBorder>
        <Title order={4} mb="md">Total Amount Invoicing Progress</Title>
        <Progress.Root size="lg" radius="xl" mb="md" style={{ backgroundColor: '#f1f5f9' }}>
          <Progress.Section value={paidPercent} color="#10b981" />
          <Progress.Section value={pendingPercent} color="#6366f1" />
        </Progress.Root>
        <Group justify="space-between">
          <Group gap="xs">
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <Text size="xs" color="dimmed" fw={500}>Paid Amount: ${received.toLocaleString()} ({Math.round(paidPercent)}%)</Text>
          </Group>
          <Group gap="xs">
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366f1' }} />
            <Text size="xs" color="dimmed" fw={500}>Pending Amount: ${pending.toLocaleString()} ({Math.round(pendingPercent)}%)</Text>
          </Group>
        </Group>
      </Card>
    </Stack>
  );
};

const ProjectTasks = ({ projectId: _projectId, milestones }: { projectId: string; milestones: any[] }) => {
  const { data: tasksData, isLoading } = useGetAllTasksQuery();
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const [startTimer] = useStartTimerMutation();
  const [stopTimer] = useStopTimerMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [milestoneFilter, setMilestoneFilter] = useState<string | null>(null);

  const navigate = useNavigate();

  const activeTimer = activeTimerData?.data;
  const allTasks = tasksData?.data || [];

  const projectMilestoneIds = useMemo(() => milestones.map(m => m._id), [milestones]);
  const projectTasks = useMemo(() => {
    return allTasks.filter((t: any) => {
      const milestoneId = typeof t.milestone === 'object' ? t.milestone?._id : t.milestone;
      return projectMilestoneIds.includes(milestoneId);
    });
  }, [allTasks, projectMilestoneIds]);

  const filteredTasks = useMemo(() => {
    let result = projectTasks;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }

    if (deptFilter) {
      result = result.filter(t => t.department === deptFilter);
    }

    if (statusFilter) {
      result = result.filter(t => t.status === statusFilter);
    }

    if (milestoneFilter) {
      result = result.filter(t => {
        const milestoneId = typeof t.milestone === 'object' ? t.milestone?._id : t.milestone;
        return milestoneId === milestoneFilter;
      });
    }

    return result;
  }, [projectTasks, searchQuery, deptFilter, statusFilter, milestoneFilter]);

  const handleStartTimer = async (taskId: string) => {
    try { await startTimer({ taskId }).unwrap(); } catch (e) { console.error(e); }
  };

  const handleStopTimer = async () => {
    try { await stopTimer({}).unwrap(); } catch (e) { console.error(e); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'gray';
      case 'in_progress': return 'blue';
      case 'in_review': return 'orange';
      case 'completed': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Tasks</Title>
      </Group>

      {/* Filters */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" mb="xl">
        <TextInput
          placeholder="Search tasks..."
          leftSection={<Search size={14} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
        <Select
          placeholder="Filter Milestone"
          leftSection={<Filter size={14} />}
          data={milestones.map(m => ({ value: m._id, label: m.title }))}
          value={milestoneFilter}
          onChange={setMilestoneFilter}
          clearable
        />
        <Select
          placeholder="Filter Department"
          leftSection={<Filter size={14} />}
          data={['design', 'development', 'seo']}
          value={deptFilter}
          onChange={setDeptFilter}
          clearable
        />
        <Select
          placeholder="Filter Status"
          leftSection={<Filter size={14} />}
          data={['assigned', 'in_progress', 'in_review', 'completed']}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
        />
      </SimpleGrid>

      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Task</Table.Th>
            <Table.Th>Milestone</Table.Th>
            <Table.Th>Department</Table.Th>
            <Table.Th>Assigned To</Table.Th>
            <Table.Th>Est. Time</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Progress</Table.Th>
            <Table.Th w={150}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredTasks.map((task) => {
            const milestone = typeof task.milestone === 'object' ? task.milestone : null;
            const assignee = typeof task.assignedTo === 'object' ? task.assignedTo : null;
            const isTimerActive = activeTimer?.task === task._id || (activeTimer?.task as any)?._id === task._id;

            return (
              <Table.Tr key={task._id}>
                <Table.Td>
                  <Text fw={600} size="sm" style={{ cursor: 'pointer', color: '#228be6' }} onClick={() => navigate(`/tasks/${task._id}`)}>
                    {task.title}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{milestone?.title || 'Unknown Milestone'}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="outline" color="gray">{task.department || 'N/A'}</Badge>
                </Table.Td>
                <Table.Td>
                  {assignee ? (
                    <Group gap="xs" wrap="nowrap">
                      <UserAvatar name={assignee.name} email={assignee.email} avatarUrl={assignee.avatarUrl} size="sm" />
                      <Text size="sm">{assignee.name}</Text>
                    </Group>
                  ) : (
                    <Badge variant="light" color="orange">Unassigned</Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600}>{task.estimatedHours}h</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={getStatusColor(task.status)} variant="light">
                    {task.status.replace('_', ' ')}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Tooltip label={`${(task.spentHours || 0).toFixed(1)}h / ${task.estimatedHours}h`}>
                    <Progress value={((task.spentHours || 0) / task.estimatedHours) * 100} size="sm" color={task.status === 'completed' ? 'green' : 'blue'} />
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {isTimerActive ? (
                      <Button size="xs" color="red" variant="light" leftSection={<Square size={14} />} onClick={handleStopTimer}>Stop</Button>
                    ) : (
                      <Button size="xs" variant="light" leftSection={<Play size={14} />} onClick={() => handleStartTimer(task._id)} disabled={!!activeTimer || task.status === 'completed'}>Start</Button>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
          {filteredTasks.length === 0 && !isLoading && (
            <Table.Tr>
              <Table.Td colSpan={8} ta="center" py="xl">
                <Text color="dimmed">No tasks found matching filters.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Card>
  );
};

const ProjectTeam = ({ projectId, projectData }: { projectId: string; projectData: any }) => {
  const { data: usersData } = useGetUsersQuery();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const isAdminOrPM = currentUser?.role === Role.ADMIN || currentUser?.role === Role.PM;
  const [modalOpened, setModalOpened] = useState(false);

  const team = projectData?.team || [];
  const allUsers = usersData?.data || [];

  const assignableUsers = allUsers.filter(u => u.role === Role.TEAM_LEAD || u.role === Role.TEAM_MEMBER);
  const assignableOptions = assignableUsers.map(u => ({
    value: u._id,
    label: `${u.name} (${u.role.replace('_', ' ')})`
  }));

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleOpenModal = () => {
    setSelectedMembers(team.map((t: any) => t._id));
    setModalOpened(true);
  };

  const handleSaveTeam = async () => {
    try {
      await updateProject({
        id: projectId,
        data: { team: selectedMembers }
      }).unwrap();
      setModalOpened(false);
    } catch (err) {
      console.error(err);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleRemoveMember = (userId: string, memberName: string) => {
    setDeleteTarget({ id: userId, name: memberName });
  };

  const confirmDeleteAction = async () => {
    if (!deleteTarget) return;
    try {
      const updatedTeamIds = team.filter((t: any) => t._id !== deleteTarget.id).map((t: any) => t._id);
      await updateProject({
        id: projectId,
        data: { team: updatedTeamIds },
      }).unwrap();
    } catch (err) {
      console.error('Delete action failed', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Project Team ({team.length})</Title>
        {isAdminOrPM && (
          <Button leftSection={<Plus size={16} />} onClick={handleOpenModal}>
            Manage Team
          </Button>
        )}
      </Group>

      <Table verticalSpacing="sm" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Department</Table.Th>
            {isAdminOrPM && <Table.Th w={100}></Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {team.map((member: any) => (
            <Table.Tr key={member._id}>
              <Table.Td>
                <Group gap="sm">
                  <UserAvatar name={member.name} email={member.email} avatarUrl={member.avatarUrl} size="sm" />
                  <Text size="sm" fw={600}>{member.name}</Text>
                </Group>
              </Table.Td>
              <Table.Td><Text size="sm">{member.email}</Text></Table.Td>
              <Table.Td>
                <Badge variant="light" color="blue">
                  {member.role?.replace('_', ' ')}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge variant="outline" color="gray">
                  {member.department || 'N/A'}
                </Badge>
              </Table.Td>
              {isAdminOrPM && (
                <Table.Td>
                  <Button size="xs" color="red" variant="subtle" onClick={() => handleRemoveMember(member._id, member.name)}>
                    Remove
                  </Button>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
          {team.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5} ta="center" py="xl">
                <Text color="dimmed">No team members assigned to this project.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {/* Manage Team Modal */}
      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Manage Project Team" radius="md">
        <Stack gap="sm">
          <Text size="sm">Select team members and team leads to assign to this project.</Text>
          <MultiSelect
            label="Project Team"
            placeholder="Select team members"
            data={assignableOptions}
            value={selectedMembers}
            onChange={setSelectedMembers}
            searchable
            clearable
          />
          <Button onClick={handleSaveTeam} loading={isUpdating}>
            Save Changes
          </Button>
        </Stack>
      </Modal>

      <DeleteConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteAction}
        title="Remove Team Member"
        itemName={deleteTarget?.name}
        description={`Are you sure you want to remove ${deleteTarget?.name} from this project?`}
      />
    </Card>
  );
};

const ProjectReleases = ({ projectId }: { projectId: string }) => {
  const { data: releasesData, isLoading } = useGetReleasesQuery({ projectId });
  const [createRelease, { isLoading: isCreating }] = useCreateReleaseMutation();
  const [updateRelease, { isLoading: isUpdating }] = useUpdateReleaseMutation();
  const [deleteRelease] = useDeleteReleaseMutation();
  const { data: usersData } = useGetUsersQuery();
  const users = usersData?.data || [];

  const [releaseModalOpened, setReleaseModalOpened] = useState(false);
  const [editingRelease, setEditingRelease] = useState<any>(null);

  const releases = releasesData?.data || [];

  const releaseForm = useForm({
    initialValues: {
      department: 'development',
      teamMember: '',
      details: '',
      releaseDate: '',
      status: 'scheduled',
    },
    validate: {
      details: (val) => (!val ? 'Details are required' : null),
      releaseDate: (val) => (!val ? 'Release Date is required' : null),
    }
  });

  const openCreateModal = () => {
    setEditingRelease(null);
    releaseForm.reset();
    setReleaseModalOpened(true);
  };

  const openEditModal = (release: any) => {
    setEditingRelease(release);
    releaseForm.setValues({
      department: release.department,
      teamMember: typeof release.teamMember === 'object' ? release.teamMember?._id : release.teamMember || '',
      details: release.details,
      releaseDate: new Date(release.releaseDate).toISOString().split('T')[0],
      status: release.status,
    });
    setReleaseModalOpened(true);
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteRelease = (id: string, details: string) => {
    setDeleteTarget({ id, name: details });
  };

  const confirmDeleteRelease = async () => {
    if (deleteTarget) {
      await deleteRelease(deleteTarget.id).unwrap();
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (values: typeof releaseForm.values) => {
    try {
      const payload = {
        project: projectId,
        department: values.department as any,
        teamMember: values.teamMember || undefined,
        details: values.details,
        releaseDate: new Date(values.releaseDate).toISOString(),
        status: values.status as any,
      };

      if (editingRelease) {
        await updateRelease({ _id: editingRelease._id, ...payload }).unwrap();
      } else {
        await createRelease(payload).unwrap();
      }
      setReleaseModalOpened(false);
      releaseForm.reset();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Project Releases</Title>
        <Button leftSection={<Plus size={16} />} onClick={openCreateModal}>Add Release</Button>
      </Group>

      <Table verticalSpacing="sm" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Details</Table.Th>
            <Table.Th>Department</Table.Th>
            <Table.Th>Team Member</Table.Th>
            <Table.Th>Release Date</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th w={100}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {releases.map((release) => {
            const member = typeof release.teamMember === 'object' ? release.teamMember : null;
            return (
              <Table.Tr key={release._id}>
                <Table.Td>
                  <Text size="sm" fw={500} lineClamp={2}>{release.details}</Text>
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
                  <Text size="sm">{new Date(release.releaseDate).toLocaleDateString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={release.status === 'released' ? 'green' : release.status === 'in_review' ? 'orange' : release.status === 'scheduled' ? 'blue' : 'gray'}
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
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteRelease(release._id, release.details)} title="Delete">
                      <Trash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
          {releases.length === 0 && !isLoading && (
            <Table.Tr>
              <Table.Td colSpan={6} ta="center" py="xl">
                <Text color="dimmed">No releases found for this project.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {/* Save Release Modal */}
      <Modal opened={releaseModalOpened} onClose={() => setReleaseModalOpened(false)} title={editingRelease ? "Edit Release" : "Create Release"} radius="md">
        <form onSubmit={releaseForm.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Select
              label="Department"
              data={[
                { value: 'design', label: 'Design' },
                { value: 'development', label: 'Development' },
                { value: 'seo', label: 'SEO' }
              ]}
              {...releaseForm.getInputProps('department')}
              withAsterisk
            />
            <Select
              label="Team Member (Optional)"
              placeholder="Assign to..."
              data={users.map(u => ({ value: u._id, label: u.name || 'Unknown User' }))}
              {...releaseForm.getInputProps('teamMember')}
              clearable
            />
            <Textarea
              label="Release Details"
              placeholder="What is being released?"
              {...releaseForm.getInputProps('details')}
              withAsterisk
              minRows={3}
            />
            <DatePickerInput
              label="Release Date"
              placeholder="Select date"
              leftSection={<Calendar size={16} color="#64748b" />}
              value={releaseForm.values.releaseDate ? new Date(releaseForm.values.releaseDate) : null}
              onChange={(val) => releaseForm.setFieldValue('releaseDate', val ? val.toISOString().split('T')[0] : '')}
              clearable
              withAsterisk
              radius="md"
            />
            <Select
              label="Status"
              data={[
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'in_review', label: 'In Review' },
                { value: 'released', label: 'Released' }
              ]}
              {...releaseForm.getInputProps('status')}
            />
            <Button type="submit" loading={isCreating || isUpdating} mt="md">
              {editingRelease ? "Update Release" : "Create Release"}
            </Button>
          </Stack>
        </form>
      </Modal>

      <DeleteConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteRelease}
        title="Delete Release"
        itemName={deleteTarget?.name}
      />
    </Card>
  );
};

const ProjectInvoices = ({ projectId, projectData }: { projectId: string; projectData: any }) => {
  const { data: invoicesData, isLoading } = useGetInvoicesQuery({ project: projectId });
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
  const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();

  const [invoiceModalOpened, setInvoiceModalOpened] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  // Payment states
  const [paymentModalOpened, setPaymentModalOpened] = useState(false);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const invoices = invoicesData?.data || [];

  const invoiceForm = useForm({
    initialValues: {
      invoiceNumber: '',
      issueDate: '',
      dueDate: '',
      totalAmount: 0,
      status: 'draft',
    },
    validate: {
      invoiceNumber: (val) => (!val ? 'Invoice Number is required' : null),
      issueDate: (val) => (!val ? 'Issue Date is required' : null),
      dueDate: (val) => (!val ? 'Due Date is required' : null),
      totalAmount: (val) => (val <= 0 ? 'Amount must be positive' : null),
    }
  });

  const openCreateModal = () => {
    setEditingInvoice(null);
    invoiceForm.reset();
    setInvoiceModalOpened(true);
  };

  const openEditModal = (inv: any) => {
    setEditingInvoice(inv);
    invoiceForm.setValues({
      invoiceNumber: inv.invoiceNumber,
      issueDate: new Date(inv.issueDate).toISOString().split('T')[0],
      dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
      totalAmount: inv.totalAmount,
      status: inv.status,
    });
    setInvoiceModalOpened(true);
  };

  const handleSubmit = async (values: typeof invoiceForm.values) => {
    try {
      const payload = {
        project: projectId,
        invoiceNumber: values.invoiceNumber,
        issueDate: new Date(values.issueDate).toISOString(),
        dueDate: new Date(values.dueDate).toISOString(),
        totalAmount: values.totalAmount,
        status: values.status as any,
      };

      if (editingInvoice) {
        await updateInvoice({ _id: editingInvoice._id, ...payload }).unwrap();
      } else {
        await createInvoice(payload).unwrap();
      }
      setInvoiceModalOpened(false);
      invoiceForm.reset();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInvoice = (id: string, invoiceNumber: string) => {
    setDeleteTarget({ id, name: invoiceNumber });
  };

  const confirmDeleteInvoice = async () => {
    if (deleteTarget) {
      await deleteInvoice(deleteTarget.id).unwrap();
      setDeleteTarget(null);
    }
  };

  const handleRecordPayment = async () => {
    if (!activeInvoiceForPayment || paymentAmount <= 0) return;
    try {
      const existingPayments = activeInvoiceForPayment.paymentDetails || [];
      const newPayment = {
        paymentDate: new Date(paymentDate).toISOString(),
        method: paymentMethod,
        amount: paymentAmount,
      };

      await updateInvoice({
        _id: activeInvoiceForPayment._id,
        paymentDetails: [...existingPayments, newPayment],
      }).unwrap();

      setPaymentModalOpened(false);
      setPaymentAmount(0);
      setActiveInvoiceForPayment(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'sent': return 'blue';
      case 'partially_paid': return 'orange';
      case 'paid': return 'green';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Invoices</Title>
        <Button leftSection={<Plus size={16} />} onClick={openCreateModal}>Add Invoice</Button>
      </Group>

      <Group grow mb="xl">
        <Card withBorder p="sm" radius="sm">
          <Text size="xs" color="dimmed" tt="uppercase" fw={600}>Total Amount</Text>
          <Text size="lg" fw={700}>${projectData.totalBudget?.toLocaleString() || 0}</Text>
        </Card>
        <Card withBorder p="sm" radius="sm">
          <Text size="xs" color="dimmed" tt="uppercase" fw={600}>Received</Text>
          <Text size="lg" fw={700} c="green">${projectData.receivedAmount?.toLocaleString() || 0}</Text>
        </Card>
        <Card withBorder p="sm" radius="sm">
          <Text size="xs" color="dimmed" tt="uppercase" fw={600}>Pending</Text>
          <Text size="lg" fw={700} c="orange">${projectData.pendingAmount?.toLocaleString() || 0}</Text>
        </Card>
      </Group>

      <Table verticalSpacing="sm" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Invoice #</Table.Th>
            <Table.Th>Issue Date</Table.Th>
            <Table.Th>Due Date</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Received</Table.Th>
            <Table.Th>Pending</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th w={150}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invoices.map((inv) => (
            <Table.Tr key={inv._id}>
              <Table.Td fw={600}>{inv.invoiceNumber}</Table.Td>
              <Table.Td>{new Date(inv.issueDate).toLocaleDateString()}</Table.Td>
              <Table.Td>{new Date(inv.dueDate).toLocaleDateString()}</Table.Td>
              <Table.Td>${inv.totalAmount.toLocaleString()}</Table.Td>
              <Table.Td>${inv.receivedAmount.toLocaleString()}</Table.Td>
              <Table.Td fw={600} c={inv.pendingAmount > 0 ? 'orange' : 'dimmed'}>
                ${inv.pendingAmount.toLocaleString()}
              </Table.Td>
              <Table.Td>
                <Badge color={getStatusColor(inv.status)} variant="light">
                  {inv.status.replace('_', ' ')}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap={4} justify="flex-end" wrap="nowrap">
                  {inv.status !== 'paid' && (
                    <Button
                      size="xs"
                      variant="light"
                      color="green"
                      onClick={() => {
                        setActiveInvoiceForPayment(inv);
                        setPaymentAmount(inv.pendingAmount);
                        setPaymentModalOpened(true);
                      }}
                    >
                      + Pay
                    </Button>
                  )}
                  <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(inv)} title="Edit">
                    <Edit size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteInvoice(inv._id, inv.invoiceNumber)} title="Delete">
                    <Trash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {invoices.length === 0 && !isLoading && (
            <Table.Tr>
              <Table.Td colSpan={8} ta="center" py="xl">
                <Text color="dimmed">No invoices found for this project.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {/* Save Invoice Modal */}
      <Modal opened={invoiceModalOpened} onClose={() => setInvoiceModalOpened(false)} title={editingInvoice ? "Edit Invoice" : "Create Invoice"} radius="md">
        <form onSubmit={invoiceForm.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput label="Invoice Number" {...invoiceForm.getInputProps('invoiceNumber')} withAsterisk />
            <Group grow>
              <DatePickerInput
                label="Issue Date"
                placeholder="Select date"
                leftSection={<Calendar size={16} color="#64748b" />}
                value={invoiceForm.values.issueDate ? new Date(invoiceForm.values.issueDate) : null}
                onChange={(val) => invoiceForm.setFieldValue('issueDate', val ? val.toISOString().split('T')[0] : '')}
                clearable
                withAsterisk
                radius="md"
              />
              <DatePickerInput
                label="Due Date"
                placeholder="Select date"
                leftSection={<Calendar size={16} color="#64748b" />}
                value={invoiceForm.values.dueDate ? new Date(invoiceForm.values.dueDate) : null}
                onChange={(val) => invoiceForm.setFieldValue('dueDate', val ? val.toISOString().split('T')[0] : '')}
                clearable
                withAsterisk
                radius="md"
              />
            </Group>
            <NumberInput label="Total Amount ($)" min={0} onFocus={(e) => e.target.select()} {...invoiceForm.getInputProps('totalAmount')} withAsterisk />
            <Select
              label="Status"
              data={[
                { value: 'draft', label: 'Draft' },
                { value: 'sent', label: 'Sent' },
                { value: 'partially_paid', label: 'Partially Paid' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' }
              ]}
              {...invoiceForm.getInputProps('status')}
            />
            <Button type="submit" loading={isCreating || isUpdating} mt="md">
              {editingInvoice ? "Update Invoice" : "Save Invoice"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal opened={paymentModalOpened} onClose={() => setPaymentModalOpened(false)} title="Record Payment" radius="md">
        <Stack gap="sm">
          <Text size="sm">Enter payment details to update the invoice status and totals.</Text>
          <NumberInput
            label="Payment Amount ($)"
            value={paymentAmount}
            onChange={(val) => setPaymentAmount(typeof val === 'number' ? val : 0)}
            min={0.01}
            max={activeInvoiceForPayment?.pendingAmount}
            onFocus={(e) => e.target.select()}
            withAsterisk
          />
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(val) => setPaymentMethod(val || 'bank_transfer')}
            data={[
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'upwork', label: 'Upwork Escrow' },
              { value: 'stripe', label: 'Stripe' },
              { value: 'paypal', label: 'PayPal' },
              { value: 'cash', label: 'Cash' },
            ]}
          />
          <DatePickerInput
            label="Payment Date"
            placeholder="Select date"
            leftSection={<Calendar size={16} color="#64748b" />}
            value={paymentDate ? new Date(paymentDate) : null}
            onChange={(val) => setPaymentDate(val ? val.toISOString().split('T')[0] : '')}
            clearable
            radius="md"
          />
          <Button color="green" onClick={handleRecordPayment} loading={isUpdating}>
            Submit Payment
          </Button>
        </Stack>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteInvoice}
        title="Delete Invoice"
        itemName={deleteTarget?.name}
      />
    </Card>
  );
};
