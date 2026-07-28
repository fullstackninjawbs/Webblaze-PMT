import { useParams, useNavigate } from 'react-router-dom';
import { useGetProjectsQuery } from './project.slice';
import { useGetMilestonesByProjectQuery, useCreateMilestoneMutation } from '../milestones/milestone.slice';
import { useGetTasksByMilestoneQuery, useCreateTaskMutation } from '../tasks/task.slice';
import { useStartTimerMutation, useStopTimerMutation, useGetActiveTimerQuery } from '../timelogs/timeLog.slice';
import { Container, Title, Text, Button, Group, Card, Badge, Stack, Accordion, Modal, TextInput, NumberInput, Loader, Center } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { Plus, ArrowLeft, Play, Square } from 'lucide-react';

export const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: projectsData, isLoading: isProjectLoading } = useGetProjectsQuery();
  const project = projectsData?.data?.find(p => p._id === id);

  const { data: milestonesData, isLoading: isMilestonesLoading } = useGetMilestonesByProjectQuery(id!);
  const milestones = milestonesData?.data || [];

  const [createMilestone] = useCreateMilestoneMutation();
  const [createTask] = useCreateTaskMutation();

  const [milestoneModalOpened, { open: openMilestoneModal, close: closeMilestoneModal }] = useDisclosure(false);
  const [taskModalOpened, { open: openTaskModal, close: closeTaskModal }] = useDisclosure(false);

  const milestoneForm = useForm({
    initialValues: { title: '', estimatedHours: 10 },
  });

  const taskForm = useForm({
    initialValues: { title: '', estimatedHours: 2, milestone: '', assignedTo: '' },
  });

  const handleCreateMilestone = async (values: typeof milestoneForm.values) => {
    try {
      await createMilestone({ ...values, project: id }).unwrap();
      closeMilestoneModal();
      milestoneForm.reset();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (values: typeof taskForm.values) => {
    try {
      await createTask({ ...values, department: 'development' }).unwrap(); // simplify dept
      closeTaskModal();
      taskForm.reset();
    } catch (e) {
      console.error(e);
    }
  };

  const openTaskModalForMilestone = (milestoneId: string) => {
    taskForm.setFieldValue('milestone', milestoneId);
    openTaskModal();
  };

  if (isProjectLoading || isMilestonesLoading) return <Center h={400}><Loader color="blue" /></Center>;
  if (!project) return <Container mt="xl"><Title>Project not found</Title></Container>;

  return (
    <Container size="xl" py="xl">
      <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} onClick={() => navigate('/projects')} mb="md">
        Back to Projects
      </Button>

      <Group justify="space-between" align="flex-start" mb="xl">
        <div>
          <Title order={2} style={{ color: '#111827' }}>{project.name}</Title>
          <Text size="sm" color="dimmed">{project.description}</Text>
        </div>
        <Button leftSection={<Plus size={16} />} color="blue" onClick={openMilestoneModal}>
          Add Milestone
        </Button>
      </Group>

      <Accordion variant="separated" radius="md">
        {milestones.map((milestone) => (
          <MilestoneAccordionItem
            key={milestone._id}
            milestone={milestone}
            onAddTask={() => openTaskModalForMilestone(milestone._id)}
          />
        ))}
      </Accordion>

      {milestones.length === 0 && (
        <Card withBorder padding="xl" radius="md" style={{ textAlign: 'center', backgroundColor: '#F9FAFB' }}>
          <Text color="dimmed">No milestones created yet. Add one to get started!</Text>
        </Card>
      )}

      {/* Milestone Modal */}
      <Modal opened={milestoneModalOpened} onClose={closeMilestoneModal} title="Create Milestone">
        <form onSubmit={milestoneForm.onSubmit(handleCreateMilestone)}>
          <Stack>
            <TextInput required label="Milestone Title" placeholder="e.g. Design Phase" {...milestoneForm.getInputProps('title')} />
            <NumberInput required label="Estimated Hours" min={0} {...milestoneForm.getInputProps('estimatedHours')} />
            <Button type="submit" color="blue" fullWidth>Create Milestone</Button>
          </Stack>
        </form>
      </Modal>

      {/* Task Modal */}
      <Modal opened={taskModalOpened} onClose={closeTaskModal} title="Create Task">
        <form onSubmit={taskForm.onSubmit(handleCreateTask)}>
          <Stack>
            <TextInput required label="Task Title" placeholder="e.g. Wireframe Homepage" {...taskForm.getInputProps('title')} />
            <NumberInput required label="Estimated Hours" min={0} {...taskForm.getInputProps('estimatedHours')} />
            <TextInput label="Assign To (User ID for now)" placeholder="Leave empty for unassigned" {...taskForm.getInputProps('assignedTo')} />
            <Button type="submit" color="blue" fullWidth>Create Task</Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
};

// Sub-component for accordion item to handle its own tasks fetching safely
const MilestoneAccordionItem = ({ milestone, onAddTask }: { milestone: any, onAddTask: () => void }) => {
  const { data: tasksData, isLoading } = useGetTasksByMilestoneQuery(milestone._id);
  const tasks = tasksData?.data || [];
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const [startTimer] = useStartTimerMutation();
  const [stopTimer] = useStopTimerMutation();
  
  const activeTimer = activeTimerData?.data;

  const handleStartTimer = async (taskId: string) => {
    try {
      await startTimer({ taskId }).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer({}).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Accordion.Item value={milestone._id} style={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}>
      <Accordion.Control>
        <Group justify="space-between">
          <Text fw={600}>{milestone.title}</Text>
          <Group>
            <Badge color="blue" variant="light">{milestone.estimatedHours}h Budget</Badge>
            <Badge color={milestone.status === 'completed' ? 'green' : 'gray'}>{milestone.status}</Badge>
          </Group>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="sm">
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={600} color="dimmed">Tasks ({tasks.length})</Text>
            <Button variant="light" size="xs" color="blue" onClick={onAddTask}>Add Task</Button>
          </Group>

          {isLoading && <Loader size="sm" />}

          {tasks.map((task: any) => {
            const isTimerActive = activeTimer?.task === task._id || (activeTimer?.task as any)?._id === task._id;

            return (
              <Card key={task._id} withBorder padding="sm" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={500} size="sm">{task.title}</Text>
                    <Text size="xs" color="dimmed">Assigned to: {task.assignedTo?.name || 'Unassigned'}</Text>
                  </div>
                  <Group>
                    <Badge color="cyan" variant="dot">{task.estimatedHours}h</Badge>
                    <Badge color="gray">{task.status}</Badge>
                    
                    {isTimerActive ? (
                      <Button size="xs" color="red" variant="light" leftSection={<Square size={14} />} onClick={handleStopTimer}>
                        Stop
                      </Button>
                    ) : (
                      <Button size="xs" color="blue" variant="light" leftSection={<Play size={14} />} onClick={() => handleStartTimer(task._id)} disabled={!!activeTimer}>
                        Start
                      </Button>
                    )}
                  </Group>
                </Group>
              </Card>
            );
          })}
          {tasks.length === 0 && !isLoading && (
            <Text size="sm" color="dimmed" fs="italic">No tasks in this milestone.</Text>
          )}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
};
