import { useMemo, useState } from 'react';
import { 
  Container, Title, Text, Card, Group, Badge, Stack, Button, Progress, Loader, 
  Center, Grid, TextInput, Textarea, Select, SegmentedControl, Table, Box, Modal
} from '@mantine/core';
import { 
  Play, Square, Eye, Clock, AlertCircle, Search, Calendar, MessageSquare, 
  Paperclip, LayoutGrid, List as ListIcon, X, Send, Link as LinkIcon, CheckCircle2,
  FileText, GitPullRequest, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetTasksByUserQuery, useUpdateTaskMutation } from './task.slice';
import { useGetActiveTimerQuery, useStartTimerMutation, useStopTimerMutation } from '../timelogs/timeLog.slice';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

export const MyTasks = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { data: tasksData, isLoading, refetch } = useGetTasksByUserQuery((user as any)?._id || (user as any)?.id || '');
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const [startTimer] = useStartTimerMutation();
  const [stopTimer] = useStopTimerMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  // Search & Filter & View state
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  // Submit for Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [prUrl, setPrUrl] = useState('');

  const activeTimer = activeTimerData?.data;
  const activeTimerTaskId = activeTimer
    ? (typeof activeTimer.task === 'string' ? activeTimer.task : activeTimer.task?._id)
    : null;

  const tasks = tasksData?.data || [];

  // Unique project list for filter
  const projectOptions = useMemo(() => {
    const projectsMap = new Map<string, string>();
    tasks.forEach((t: any) => {
      const proj = t.milestone?.project || t.project;
      if (proj && proj._id && proj.name) {
        projectsMap.set(proj._id, proj.name);
      }
    });
    return Array.from(projectsMap.entries()).map(([id, name]) => ({ value: id, label: name }));
  }, [tasks]);

  // Filtered tasks based on search & project dropdown
  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      const matchesSearch = searchQuery.trim() === '' || 
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.milestone?.project?.name || t.project?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const projId = (t.milestone?.project?._id || t.project?._id || t.project);
      const matchesProject = !projectFilter || projId === projectFilter;

      return matchesSearch && matchesProject;
    });
  }, [tasks, searchQuery, projectFilter]);

  const groupedTasks = useMemo(() => {
    return {
      active: filteredTasks.filter((t: any) => t.status === 'assigned' || t.status === 'in_progress'),
      review: filteredTasks.filter((t: any) => t.status === 'in_review'),
      completed: filteredTasks.filter((t: any) => t.status === 'completed'),
    };
  }, [filteredTasks]);

  const handleStartTimer = async (taskId: string) => {
    if (activeTimer) {
      alert('You already have an active timer. Please stop it first.');
      return;
    }
    
    try {
      await startTimer({ taskId }).unwrap();
      navigate(`/tasks/${taskId}`);
    } catch (err: any) {
      alert(err.data?.message || 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer({}).unwrap();
    } catch (err: any) {
      alert(err.data?.message || 'Failed to stop timer');
    }
  };

  const openReviewModal = (task: any) => {
    console.log('Opening review modal for task:', task);
    setSelectedTaskForReview(task);
    setReviewNotes('');
    setPrUrl('');
    setReviewModalOpen(true);
  };

  const handleSubmitForReview = async () => {
    if (!selectedTaskForReview) return;

    try {
      await updateTask({ 
        _id: selectedTaskForReview._id, 
        status: 'in_review',
      }).unwrap();

      setReviewModalOpen(false);
      setSelectedTaskForReview(null);
      refetch();
    } catch (e: any) {
      console.error(e);
      alert(e.data?.message || 'Failed to move task to review');
    }
  };

  const renderTaskCard = (task: any) => {
    const rawStatus = (task.status || '').toLowerCase();
    const isCompleted = rawStatus === 'completed';
    const isOverdue = !isCompleted && task.endDate && new Date(task.endDate) < new Date();
    const isDueSoon = !isCompleted && task.endDate && new Date(task.endDate) < new Date(Date.now() + 48 * 60 * 60 * 1000) && !isOverdue;
    
    const isTimerRunningOnThisTask = activeTimerTaskId === task._id;

    const spentHours = task.spentHours || 0;
    const estHours = task.estimatedHours || 1;
    const isOverBudget = spentHours > estHours;
    const progressPercent = Math.min((spentHours / estHours) * 100, 100);

    const formattedDueDate = task.endDate 
      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(task.endDate))
      : null;

    const commentCount = Array.isArray(task.comments) ? task.comments.length : (task.commentCount || 0);
    const attachmentCount = Array.isArray(task.attachments) ? task.attachments.length : (task.attachmentCount || 0);

    return (
      <Card key={task._id} shadow="sm" p="md" radius="md" withBorder style={{ 
        borderColor: isOverdue ? '#fca5a5' : isDueSoon ? '#fcd34d' : isTimerRunningOnThisTask ? '#60a5fa' : '#e5e7eb',
        borderLeftWidth: '4px',
        backgroundColor: isTimerRunningOnThisTask ? '#f0f9ff' : '#ffffff'
      }}>
        <Group justify="space-between" mb="xs">
          <Badge color={isCompleted ? 'green' : rawStatus === 'in_review' ? 'orange' : isTimerRunningOnThisTask ? 'blue' : 'gray'} variant="light">
            {isTimerRunningOnThisTask ? '⏱ Running' : (task.status || 'ASSIGNED').replace('_', ' ')}
          </Badge>

          <Group gap={6}>
            {isOverdue && <Badge color="red" leftSection={<AlertCircle size={10} />}>Overdue</Badge>}
            {isDueSoon && <Badge color="orange" leftSection={<Clock size={10} />}>Due Soon</Badge>}
            {isOverBudget && <Badge color="red" variant="outline" size="xs">+{ (spentHours - estHours).toFixed(1) }h Over</Badge>}
          </Group>
        </Group>

        <Text fw={700} mb={4} lineClamp={1}>{task.title}</Text>
        <Text size="xs" c="dimmed" mb={8} lineClamp={1}>
          Project: {task.milestone?.project?.name || task.project?.name || 'General Project'}
        </Text>

        {/* Due Date Display */}
        {formattedDueDate && (
          <Group gap={4} mb={10}>
            <Calendar size={12} color="#64748b" />
            <Text size="xs" c="dimmed" fw={500}>Due {formattedDueDate}</Text>
          </Group>
        )}

        {/* Progress & Over Budget Info */}
        <Group justify="space-between" mb={4}>
          <Text size="xs" fw={600}>Progress</Text>
          <Text size="xs" fw={600} c={isOverBudget ? 'red' : undefined}>
            {spentHours.toFixed(1)}h / {estHours}h
          </Text>
        </Group>
        <Progress 
          value={progressPercent} 
          size="sm" 
          radius="xl" 
          color={isCompleted ? 'green' : isOverBudget ? 'red' : 'blue'} 
          mb="md" 
        />

        {/* Footer info & Buttons */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Group gap={3} style={{ color: '#64748b' }}>
              <MessageSquare size={12} />
              <Text size="xs" c="dimmed">{commentCount}</Text>
            </Group>
            {attachmentCount > 0 && (
              <Group gap={3} style={{ color: '#64748b' }}>
                <Paperclip size={12} />
                <Text size="xs" c="dimmed">{attachmentCount}</Text>
              </Group>
            )}
          </Group>

          <Group gap="xs">
            {isTimerRunningOnThisTask ? (
              <Button size="xs" color="red" leftSection={<Square size={12} />} onClick={(e) => { e.stopPropagation(); handleStopTimer(); }}>
                Stop
              </Button>
            ) : !isCompleted ? (
              <Button size="xs" variant="light" leftSection={<Play size={12} />} onClick={(e) => { e.stopPropagation(); handleStartTimer(task._id); }}>
                Start
              </Button>
            ) : null}

            <Button size="xs" variant="outline" color="gray" leftSection={<Eye size={12} />} onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${task._id}`); }}>
              View
            </Button>

            {!isCompleted && (
              <Button 
                size="xs" 
                variant="light" 
                color="orange" 
                type="button"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  openReviewModal(task); 
                }}
              >
                Review
              </Button>
            )}
          </Group>
        </Group>
      </Card>
    );
  };

  if (isLoading) return <Center h={400}><Loader color="blue" /></Center>;

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
          <Title
            order={2}
            style={{
              color: '#0f172a',
              fontSize: '1.625rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.25,
            }}
          >
            My Tasks
          </Title>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            Manage your assignments, filter tasks, and track time cleanly.
          </Text>
        </div>

        {/* View Mode Switcher */}
        <SegmentedControl
          value={viewMode}
          onChange={(val) => setViewMode(val as 'kanban' | 'list')}
          data={[
            {
              label: (
                <Center inline style={{ gap: 6 }}>
                  <LayoutGrid size={14} />
                  <span>Kanban</span>
                </Center>
              ),
              value: 'kanban',
            },
            {
              label: (
                <Center inline style={{ gap: 6 }}>
                  <ListIcon size={14} />
                  <span>List View</span>
                </Center>
              ),
              value: 'list',
            },
          ]}
        />
      </Group>

      {/* Search & Filter Bar */}
      <Card withBorder p="sm" radius="md" mb="xl" bg="#FAFAFA">
        <Grid align="center" gutter="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              placeholder="Search tasks by title or project..."
              leftSection={<Search size={16} />}
              rightSection={searchQuery ? <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} /> : null}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              placeholder="Filter by Project"
              clearable
              data={projectOptions}
              value={projectFilter}
              onChange={setProjectFilter}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Text size="xs" c="dimmed" ta="right">
              Showing {filteredTasks.length} / {tasks.length} Tasks
            </Text>
          </Grid.Col>
        </Grid>
      </Card>

      {/* View Mode: Kanban Grid vs List Table */}
      {viewMode === 'kanban' ? (
        <Grid gutter="xl">
          {/* Active Tasks Column */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
              Active Tasks ({groupedTasks.active.length})
            </Title>
            <Stack gap="md">
              {groupedTasks.active.length > 0 ? groupedTasks.active.map(renderTaskCard) : (
                <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                  <Text c="dimmed" size="sm">No active tasks matching filter.</Text>
                </Card>
              )}
            </Stack>
          </Grid.Col>

          {/* In Review Column */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              In Review ({groupedTasks.review.length})
            </Title>
            <Stack gap="md">
              {groupedTasks.review.length > 0 ? groupedTasks.review.map(renderTaskCard) : (
                <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                  <Text c="dimmed" size="sm">No tasks in review.</Text>
                </Card>
              )}
            </Stack>
          </Grid.Col>

          {/* Completed Column */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
              Completed ({groupedTasks.completed.length})
            </Title>
            <Stack gap="md">
              {groupedTasks.completed.length > 0 ? groupedTasks.completed.map(renderTaskCard) : (
                <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                  <Text c="dimmed" size="sm">No completed tasks yet.</Text>
                </Card>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      ) : (
        /* List View Table */
        <Card withBorder radius="md" p={0}>
          <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
            <Table.Thead bg="#f8fafc">
              <Table.Tr>
                <Table.Th>Task</Table.Th>
                <Table.Th>Project</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Due Date</Table.Th>
                <Table.Th>Progress</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((t: any) => {
                  const isCompleted = t.status === 'completed';
                  const isRunning = activeTimerTaskId === t._id;
                  const spent = t.spentHours || 0;
                  const est = t.estimatedHours || 1;
                  const isOverBudget = spent > est;
                  const formattedDue = t.endDate 
                    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(t.endDate))
                    : '-';

                  return (
                    <Table.Tr key={t._id} bg={isRunning ? '#f0f9ff' : undefined}>
                      <Table.Td>
                        <Text fw={600} size="sm">{t.title}</Text>
                        <Group gap={8} mt={2}>
                          <Text size="xs" c="dimmed">💬 {Array.isArray(t.comments) ? t.comments.length : 0}</Text>
                          <Text size="xs" c="dimmed">📎 {Array.isArray(t.attachments) ? t.attachments.length : 0}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{t.milestone?.project?.name || t.project?.name || 'General'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={isCompleted ? 'green' : isRunning ? 'blue' : 'gray'} variant="light">
                          {isRunning ? '⏱ Running' : t.status.replace('_', ' ')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formattedDue}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" fw={600} c={isOverBudget ? 'red' : undefined}>
                          {spent.toFixed(1)}h / {est}h {isOverBudget ? `(+${(spent - est).toFixed(1)}h)` : ''}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap="xs" justify="flex-end">
                          {isRunning ? (
                            <Button size="xs" color="red" leftSection={<Square size={12} />} onClick={handleStopTimer}>
                              Stop
                            </Button>
                          ) : !isCompleted ? (
                            <Button size="xs" variant="light" leftSection={<Play size={12} />} onClick={() => handleStartTimer(t._id)}>
                              Start
                            </Button>
                          ) : null}

                          {(t.status === 'assigned' || t.status === 'in_progress') && (
                            <Button size="xs" variant="light" color="orange" onClick={() => openReviewModal(t)}>
                              Review
                            </Button>
                          )}

                          <Button size="xs" variant="outline" color="gray" onClick={() => navigate(`/tasks/${t._id}`)}>
                            View
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    <Text c="dimmed" size="sm">No tasks matching search filters.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Submit for Review Modal */}
      <Modal
        opened={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={
          <Group gap="sm">
            <Box p={8} style={{ borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} color="#d97706" />
            </Box>
            <div>
              <Text fw={700} size="lg" style={{ color: '#0f172a', lineHeight: 1.2 }}>Submit Task for Review</Text>
              <Text size="xs" c="dimmed">Notify your Project Manager & Lead for QA review.</Text>
            </div>
          </Group>
        }
        centered
        size="lg"
        radius="lg"
        overlayProps={{ blur: 3, opacity: 0.4 }}
      >
        {selectedTaskForReview && (
          <Stack gap="md" mt="xs">
            {/* Task Info Context Box */}
            <Box 
              p="md" 
              style={{ 
                borderRadius: 10, 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #f59e0b'
              }}
            >
              <Group justify="space-between" align="flex-start" mb={6}>
                <div>
                  <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    TASK ASSIGNMENT
                  </Text>
                  <Text fw={700} size="md" style={{ color: '#0f172a' }}>
                    {selectedTaskForReview.title}
                  </Text>
                </div>
                <Badge variant="light" color="indigo" size="sm">
                  {selectedTaskForReview.milestone?.project?.name || selectedTaskForReview.project?.name || 'General Project'}
                </Badge>
              </Group>
              
              <Group justify="space-between" align="center" mt={12}>
                <Group gap={6}>
                  <Clock size={13} color="#64748b" />
                  <Text size="xs" c="dimmed" fw={600}>Hours Spent:</Text>
                  <Text size="xs" fw={700} c={selectedTaskForReview.spentHours > selectedTaskForReview.estimatedHours ? 'red' : 'blue'}>
                    {(selectedTaskForReview.spentHours || 0).toFixed(1)}h / {selectedTaskForReview.estimatedHours}h
                  </Text>
                </Group>

                {selectedTaskForReview.spentHours > selectedTaskForReview.estimatedHours && (
                  <Badge color="red" variant="outline" size="xs">
                    +{(selectedTaskForReview.spentHours - selectedTaskForReview.estimatedHours).toFixed(1)}h Over Budget
                  </Badge>
                )}
              </Group>

              <Progress 
                value={Math.min(((selectedTaskForReview.spentHours || 0) / selectedTaskForReview.estimatedHours) * 100, 100)} 
                size="xs" 
                radius="xl" 
                color={selectedTaskForReview.spentHours > selectedTaskForReview.estimatedHours ? 'red' : 'blue'} 
                mt={8} 
              />
            </Box>

            {/* Work Summary Input */}
            <div>
              <Group gap={6} mb={6}>
                <FileText size={15} color="#d97706" />
                <Text size="xs" fw={700} style={{ color: '#334155' }}>
                  Work Summary &amp; Implementation Details
                </Text>
              </Group>
              <Textarea
                placeholder="Describe what features were implemented, bug fixes completed, or testing performed..."
                rows={4}
                radius="md"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.currentTarget.value)}
                style={{ fontSize: '0.875rem' }}
              />
            </div>

            {/* PR or Staging Link Input */}
            <div>
              <Group gap={6} mb={6}>
                <GitPullRequest size={15} color="#2563eb" />
                <Text size="xs" fw={700} style={{ color: '#334155' }}>
                  Pull Request or Live Preview Link <Text span size="xs" c="dimmed" fw={400}>(Optional)</Text>
                </Text>
              </Group>
              <TextInput
                placeholder="e.g. https://github.com/my-org/repo/pull/42 or https://staging.dev.com"
                leftSection={<LinkIcon size={14} color="#94a3b8" />}
                radius="md"
                value={prUrl}
                onChange={(e) => setPrUrl(e.currentTarget.value)}
              />
            </div>

            {/* Helpful Pro Tip Banner */}
            <Box 
              p="xs" 
              px="sm"
              style={{ 
                borderRadius: 8, 
                backgroundColor: '#eff6ff', 
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <Sparkles size={16} color="#2563eb" style={{ flexShrink: 0 }} />
              <Text size="xs" c="#1e40af" fw={500}>
                <strong>Pro Tip:</strong> Including clear summary notes and a working preview link speeds up PM review turnaround by 50%.
              </Text>
            </Box>

            {/* Action Buttons */}
            <Group justify="flex-end" mt="xs" gap="sm">
              <Button 
                variant="subtle" 
                color="gray" 
                radius="md"
                onClick={() => setReviewModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                radius="md"
                loading={isUpdating}
                onClick={handleSubmitForReview}
                leftSection={<Send size={14} />}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                Submit for Review
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
};



