import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProjectsQuery } from './project.slice';
import { useGetMilestonesByProjectQuery, useCreateMilestoneMutation } from '../milestones/milestone.slice';
import { useGetTasksByMilestoneQuery, useCreateTaskMutation } from '../tasks/task.slice';
import { useStartTimerMutation, useStopTimerMutation, useGetActiveTimerQuery } from '../timelogs/timeLog.slice';
import { Container, Title, Text, Button, Group, Card, Badge, Stack, Accordion, Drawer, TextInput, NumberInput, Loader, Center, Tabs, Progress, SimpleGrid, Avatar, Table, Select, Tooltip, ActionIcon, FileInput, Textarea, Alert } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Plus, ArrowLeft, Play, Square, DollarSign, Calendar, Users, Activity, FileText, FileCheck, CheckCircle, Info, UploadCloud, Filter } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role, ProjectStatus } from '../../types';
import { useGetUsersQuery } from '../users/user.slice';
import { useGetReleasesQuery } from '../releases/release.slice';
import { useGetInvoicesQuery } from '../invoices/invoice.slice';

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
      await createTask({
        ...values,
        department: values.department as any,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
        assignedTo: values.assignedTo || undefined
      }).unwrap();
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
    <Container size="xl" py="xl" style={{ animation: 'fade-in 0.4s ease-out' }}>
      <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} onClick={() => navigate('/projects')} mb="md" style={{ paddingLeft: 0 }}>
        Back to Projects
      </Button>

      {/* Header Section */}
      <Card shadow="sm" p="xl" radius="lg" withBorder mb="xl" style={{ borderColor: '#e5e7eb', background: '#ffffff' }}>
        <Group justify="space-between" align="flex-start">
          {/* Left: Project Info */}
          <div style={{ flex: 1 }}>
            <Group gap="sm" mb="xs">
              <Badge variant="light" color={project.status === ProjectStatus.ACTIVE ? 'green' : 'orange'} size="lg">
                {project.status.replace('_', ' ')}
              </Badge>
              <Badge variant="dot" color="blue" size="lg">
                Client: {project.client?.name || 'Unknown'}
              </Badge>
            </Group>

            <Title order={1} style={{ color: '#111827', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }} mb="xs">
              {project.name}
            </Title>

            <Text size="sm" color="dimmed" style={{ maxWidth: '600px' }}>
              {project.description || 'No description provided for this project.'}
            </Text>

            <Group mt="xl" gap="sm" wrap="nowrap" style={{ maxWidth: '400px' }}>
              <div style={{ flex: 1 }}>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" fw={600} color="dimmed">Project Progress (Hours)</Text>
                  <Text size="xs" fw={700} color="blue">{Math.round((projectSpentHours / (projectEstHours || 1)) * 100)}%</Text>
                </Group>
                <Progress value={(projectSpentHours / (projectEstHours || 1)) * 100} color="blue" size="sm" radius="xl" />
              </div>
            </Group>
          </div>

          {/* Right: KPIs (Admin/PM only) */}
          {isAdminOrPM && (
            <Group gap="lg" style={{ minWidth: '450px' }}>
              <Card withBorder p="sm" radius="md" style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
                <Group gap="xs" mb="xs">
                  <DollarSign size={14} color="#6B7280" />
                  <Text size="xs" fw={600} tt="uppercase" color="dimmed">Total Budget</Text>
                </Group>
                <Text fw={700} size="xl">{project.totalBudget ? `$${project.totalBudget.toLocaleString()}` : 'N/A'}</Text>
              </Card>

              <Card withBorder p="sm" radius="md" style={{ flex: 1, backgroundColor: '#F0FDF4' }}>
                <Group gap="xs" mb="xs">
                  <CheckCircle size={14} color="#059669" />
                  <Text size="xs" fw={600} tt="uppercase" color="#059669">Received</Text>
                </Group>
                <Text fw={700} size="xl" color="#059669">$0</Text>
              </Card>

              <Card withBorder p="sm" radius="md" style={{ flex: 1, backgroundColor: '#EFF6FF' }}>
                <Group gap="xs" mb="xs">
                  <Activity size={14} color="#2563EB" />
                  <Text size="xs" fw={600} tt="uppercase" color="#2563EB">Pending</Text>
                </Group>
                <Text fw={700} size="xl" color="#2563EB">
                  {project.pendingAmount !== undefined ? `$${project.pendingAmount.toLocaleString()}` : (project.totalBudget ? `$${project.totalBudget.toLocaleString()}` : '$0')}
                </Text>
              </Card>
            </Group>
          )}
        </Group>
      </Card>

      {/* Tabbed Navigation */}
      <Tabs defaultValue="milestones" color="blue" radius="md">
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
                      <Avatar color="blue" radius="xl">{member.name.charAt(0)}</Avatar>
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
            <Button leftSection={<Plus size={16} />} color="blue" onClick={() => setMilestoneDrawerOpened(true)}>
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

        <Tabs.Panel value="tasks"><Placeholder tab="Tasks" /></Tabs.Panel>
        <Tabs.Panel value="team"><Placeholder tab="Project Team" /></Tabs.Panel>
        <Tabs.Panel value="releases">
          <ProjectReleases projectId={id!} />
        </Tabs.Panel>
        {(user?.role === Role.ADMIN || user?.role === Role.PM) && (
          <Tabs.Panel value="invoices">
            <ProjectInvoices projectId={id!} projectData={project} />
          </Tabs.Panel>
        )}
        <Tabs.Panel value="reports"><Placeholder tab="Reports" /></Tabs.Panel>
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
              {...milestoneForm.getInputProps('estimatedHours')}
            />
            <Group grow>
              <TextInput type="date" label="Start Date" {...milestoneForm.getInputProps('startDate')} />
              <TextInput type="date" label="End Date" {...milestoneForm.getInputProps('endDate')} />
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
            <Button type="submit" color="blue" fullWidth loading={isCreatingMilestone} mt="md">Create Milestone</Button>
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
              <NumberInput required label="Estimated Hours" min={0.5} step={0.5} {...taskForm.getInputProps('estimatedHours')} />
            </Group>
            <Group grow>
              <TextInput type="date" label="Start Date" {...taskForm.getInputProps('startDate')} />
              <TextInput type="date" label="End Date" {...taskForm.getInputProps('endDate')} />
            </Group>
            <Select label="Assign To" placeholder="Leave empty for unassigned" data={teamOptions} searchable clearable {...taskForm.getInputProps('assignedTo')} />

            <FileInput
              label="Attachments"
              placeholder="Upload files (Mocked UI)"
              leftSection={<UploadCloud size={16} />}
              disabled // Mocked for this phase
              description="File upload is scheduled for Phase 7"
            />

            <Button type="submit" color="blue" fullWidth disabled={isOverAllocated} loading={isCreatingTask} mt="md">
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
    <Accordion.Item value={milestone._id} style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden' }}>
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
            <Button size="xs" leftSection={<Plus size={14} />} color="blue" onClick={() => onAddTask(milestone._id, milestone.estimatedHours, allocatedHours)}>
              Add Task
            </Button>
          </Group>

          {isLoading ? (
            <Center h={100}><Loader size="sm" /></Center>
          ) : filteredTasks.length > 0 ? (
            <Table verticalSpacing="sm" bg="white" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
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
                              <Avatar size="sm" radius="xl" color="blue">{task.assignedTo.name.charAt(0)}</Avatar>
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
                            <Button size="xs" color="blue" variant="light" leftSection={<Play size={14} />} onClick={() => handleStartTimer(task._id)} disabled={!!activeTimer}>Start</Button>
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

const Placeholder = ({ tab }: { tab: string }) => (
  <Card withBorder shadow="sm" p="xl" radius="md" ta="center">
    <Title order={3} mb="sm">{tab}</Title>
    <Text c="dimmed">Module scheduled for future development</Text>
  </Card>
);

const ProjectReleases = ({ projectId }: { projectId: string }) => {
  const { data: releasesData, isLoading } = useGetReleasesQuery({ projectId });
  const releases = releasesData?.data || [];

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Project Releases</Title>
        <Button leftSection={<Plus size={16} />} color="indigo">Add Release</Button>
      </Group>

      <Table verticalSpacing="sm" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Details</Table.Th>
            <Table.Th>Department</Table.Th>
            <Table.Th>Team Member</Table.Th>
            <Table.Th>Release Date</Table.Th>
            <Table.Th>Status</Table.Th>
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
              </Table.Tr>
            );
          })}
          {releases.length === 0 && !isLoading && (
            <Table.Tr>
              <Table.Td colSpan={5} ta="center" py="xl">
                <Text color="dimmed">No releases found for this project.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Card>
  );
};
const ProjectInvoices = ({ projectId, projectData }: { projectId: string; projectData: any }) => {
  const { data: invoicesData, isLoading } = useGetInvoicesQuery({ project: projectId });
  const invoices = invoicesData?.data || [];
  
  const getStatusColor = (status: string) => {
    switch(status) {
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
        <Button leftSection={<Plus size={16} />} color="indigo">Add Invoice</Button>
      </Group>

      <Group grow mb="xl">
        <Card withBorder p="sm" radius="sm">
          <Text size="xs" color="dimmed" tt="uppercase" fw={600}>Total Budget</Text>
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
            </Table.Tr>
          ))}
          {invoices.length === 0 && !isLoading && (
            <Table.Tr>
              <Table.Td colSpan={7} ta="center" py="xl">
                <Text color="dimmed">No invoices found for this project.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Card>
  );
};
