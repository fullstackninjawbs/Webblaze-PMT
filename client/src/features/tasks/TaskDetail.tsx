import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Title, Text, Group, Badge, Button, Stack, Progress, ActionIcon, Timeline, Loader, Center, Modal, Textarea, FileInput, Paper, NumberInput, Chip } from '@mantine/core';
import { ArrowLeft, Play, Square, Clock, CheckCircle, UploadCloud, Paperclip, Plus } from 'lucide-react';
import { useGetTaskByIdQuery, useUpdateTaskMutation } from './task.slice';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useGetTimeLogsByTaskQuery, useStartTimerMutation, useStopTimerMutation, useGetActiveTimerQuery, useCreateManualTimeLogMutation } from '../timelogs/timeLog.slice';
import { useUploadFileMutation } from '../uploads/upload.slice';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';
import { formatHours } from '../../utils/formatHours';

export const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: taskData, isLoading: isTaskLoading } = useGetTaskByIdQuery(id as string);
  const { data: timeLogsData, isLoading: isLogsLoading } = useGetTimeLogsByTaskQuery(id as string);
  const { data: activeTimerData } = useGetActiveTimerQuery();
  
  const [startTimer] = useStartTimerMutation();
  const [stopTimer] = useStopTimerMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [createManualTimeLog, { isLoading: isCreatingManualLog }] = useCreateManualTimeLogMutation();

  const [, setTicker] = useState<number>(0);
  const [statusModalOpened, setStatusModalOpened] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusComment, setStatusComment] = useState('');

  const [manualLogModalOpened, setManualLogModalOpened] = useState(false);
  const [manualHours, setManualHours] = useState<number | string>(1);
  const [manualDescription, setManualDescription] = useState('');

  const [uploadFile, { isLoading: isUploadingAttachment }] = useUploadFileMutation();
  const [newFile, setNewFile] = useState<File | null>(null);

  const task = taskData?.data;
  const timeLogs = timeLogsData?.data || [];
  const activeTimer = activeTimerData?.data;

  const isTimerActiveForThisTask = (activeTimer?.task as any)?._id === task?._id || activeTimer?.task === task?._id;

  // Live timer tick every second to update elapsed hours and progress bar in real-time
  useEffect(() => {
    if (!isTimerActiveForThisTask) return;
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerActiveForThisTask]);

  if (isTaskLoading || isLogsLoading) return <Center h={400}><Loader color="blue" /></Center>;
  if (!task) return <Center h={400}><Text>Task not found</Text></Center>;

  const activeElapsedHours = isTimerActiveForThisTask && activeTimer?.startTime 
    ? Math.max(0, (Date.now() - new Date(activeTimer.startTime).getTime()) / 3600000) 
    : 0;

  const totalSpentHours = (task.spentHours || 0) + activeElapsedHours;
  const progressPercent = Math.min((totalSpentHours / (task.estimatedHours || 1)) * 100, 100);


  const handleStartTimer = async () => {
    if (activeTimer && !isTimerActiveForThisTask) {
      alert('You already have an active timer. Please stop it first.');
      return;
    }
    
    try {
      await startTimer({ taskId: task._id }).unwrap();
    } catch (err: any) {
      alert(err.data?.message || 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer({}).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = (val: string | null) => {
    if (!val) return;
    
    if (val === 'in_review' || val === 'completed') {
      setSelectedStatus(val);
      setStatusModalOpened(true);
    } else {
      updateTask({ _id: task._id, status: val as any });
    }
  };

  const confirmStatusUpdate = async () => {
    if (isTimerActiveForThisTask) {
      await stopTimer({ description: statusComment }).unwrap();
    }
    await updateTask({ _id: task._id, status: selectedStatus as any }).unwrap();
    setStatusModalOpened(false);
    setStatusComment('');

    if (selectedStatus === 'in_review') {
      navigate('/daily-status?openEod=true');
    }
  };

  const handleUploadAttachment = async () => {
    if (!newFile) return;
    try {
      const formData = new FormData();
      formData.append('file', newFile);
      const uploadRes = await uploadFile(formData).unwrap();
      if (uploadRes.success && uploadRes.data) {
        const existingIds = (task.attachments || []).map((att: any) => att._id || att);
        await updateTask({
          _id: task._id,
          attachments: [...existingIds, uploadRes.data._id]
        }).unwrap();
        setNewFile(null);
      }
    } catch (err) {
      console.error('Failed to upload attachment:', err);
    }
  };

  const remainingHours = Math.max(0, (task?.estimatedHours || 0) - (task?.spentHours || 0));

  const handleCreateManualLog = async () => {
    const hrs = Number(manualHours);
    if (!hrs || hrs <= 0) return;
    try {
      await createManualTimeLog({
        taskId: task!._id,
        hours: hrs,
        description: manualDescription || undefined,
      }).unwrap();
      setManualLogModalOpened(false);
      setManualHours(1);
      setManualDescription('');
    } catch (err: any) {
      alert(err.data?.message || 'Failed to log manual time');
    }
  };

  return (
    <Container size="md" style={{ animation: 'fade-in 0.4s ease-out' }}>
      <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} onClick={() => navigate(-1)} mb="md" style={{ paddingLeft: 0 }}>
        Back
      </Button>

      {/* Hero Widget: Timer & Overview */}
      <Card shadow="sm" p="xl" radius="lg" withBorder mb="xl">
        <Group justify="space-between" align="flex-start" mb="xl">
          <div>
            <Group gap="xs" mb="sm">
              <Badge color="blue" variant="light">{task.department || 'No Dept'}</Badge>
              <Badge color={task.status === 'completed' ? 'green' : 'gray'} variant="outline">
                {task.status.replace('_', ' ')}
              </Badge>
            </Group>
            <Title order={2} style={{ color: '#111827', fontSize: '28px', fontWeight: 800 }}>{task.title}</Title>
            <Text color="dimmed" mt="xs" style={{ whiteSpace: 'pre-wrap' }}>{task.description || 'No description provided.'}</Text>
          </div>
        </Group>

        <Group justify="space-between" align="flex-end" wrap="nowrap">
          <Group gap="xl" align="center" wrap="nowrap" style={{ flex: 1 }}>
            {/* Large Play/Stop Button */}
            {task.status !== 'completed' && (!task.assignedTo || (typeof task.assignedTo === 'object' ? (task.assignedTo as any)._id : task.assignedTo) === user?._id) && (
              <ActionIcon 
                size={60} 
                radius="100%" 
                color={isTimerActiveForThisTask ? "red" : "blue"}
                variant={isTimerActiveForThisTask ? "light" : "filled"}
                onClick={isTimerActiveForThisTask ? handleStopTimer : handleStartTimer}
                style={{ boxShadow: isTimerActiveForThisTask ? 'none' : '0 6px 16px rgba(59, 130, 246, 0.4)', transition: 'all 0.2s ease' }}
              >
                {isTimerActiveForThisTask ? <Square size={24} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: 4 }} />}
              </ActionIcon>
            )}

            {/* Progress Bar Container — Responsive & Live Updating */}
            <div style={{ flex: 1, minWidth: '240px', maxWidth: '550px' }}>
              <Group justify="space-between" mb={8}>
                <Text fw={600} size="sm">Task Progress</Text>
                <Text fw={700} size="sm" color={totalSpentHours > task.estimatedHours ? 'red' : 'blue'}>
                  {Number(totalSpentHours.toFixed(2))}h / {formatHours(task.estimatedHours)}
                </Text>
              </Group>
              <Progress 
                value={progressPercent} 
                size="lg" 
                radius="xl" 
                color={task.status === 'completed' ? 'green' : (totalSpentHours > task.estimatedHours ? 'red' : 'blue')} 
                striped={isTimerActiveForThisTask}
                animated={isTimerActiveForThisTask}
              />
            </div>
          </Group>

          <Chip.Group
            multiple={false}
            value={task.status}
            onChange={(val: string) => val && handleStatusChange(val)}
          >
            <Group gap={8}>
              <Chip size="sm" radius="md" value="assigned" color="blue" variant="filled">Assigned</Chip>
              <Chip size="sm" radius="md" value="in_progress" color="orange" variant="filled">In Progress</Chip>
              <Chip size="sm" radius="md" value="in_review" color="grape" variant="filled">In Review</Chip>
              {(user?.role === Role.ADMIN || user?.role === Role.PM || task.status === 'completed') && (
                <Chip size="sm" radius="md" value="completed" color="green" variant="filled">Completed</Chip>
              )}
            </Group>
          </Chip.Group>
        </Group>
      </Card>

      {/* Timeline Section */}
      <Group justify="space-between" align="center" mb="md">
        <Title order={4}>Time Log Activity</Title>
        <Group gap="xs">
          {task.status === 'in_review' && (
            <Button
              variant="light"
              color="blue"
              size="xs"
              leftSection={<Plus size={14} />}
              onClick={() => setManualLogModalOpened(true)}
              disabled={task.estimatedHours > 0 && remainingHours <= 0}
            >
              Log Manual Time
            </Button>
          )}
        </Group>
      </Group>

      <Card shadow="sm" p="xl" radius="md" withBorder>
        {timeLogs.length === 0 && !isTimerActiveForThisTask ? (
          <Text color="dimmed" ta="center">No time logged for this task yet.</Text>
        ) : (
          <Timeline active={timeLogs.length} bulletSize={24} lineWidth={2}>
            {isTimerActiveForThisTask && (
              <Timeline.Item bullet={<Clock size={12} />} title="Timer Active">
                <Text color="dimmed" size="sm" mt={4}>Currently tracking time...</Text>
              </Timeline.Item>
            )}

            {timeLogs.map((log) => (
              <Timeline.Item
                key={log._id}
                bullet={<CheckCircle size={12} />}
                title={
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={600} size="sm">
                      {log.durationSeconds ? `${formatHours(log.durationSeconds / 3600)} logged` : 'Session recorded'}
                    </Text>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="xs" color="dimmed">{new Date(log.startTime).toLocaleString()}</Text>
                    </Group>
                  </Group>
                }
              >
                <Group gap="xs" mt={8}>
                  <UserAvatar name={(log.user as any)?.name} avatarUrl={(log.user as any)?.avatarUrl} size="sm" />
                  <Text size="sm" color="dimmed">by {(log.user as any)?.name}</Text>
                </Group>
                {log.description && (
                  <Text size="sm" mt="sm" p="xs" style={{ backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
                    {log.description}
                  </Text>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>

      {/* Attachments Section */}
      <Title order={4} mt="xl" mb="md">Task Attachments</Title>
      <Card shadow="sm" p="xl" radius="md" withBorder mb="xl">
        <Stack gap="md">
          {(!task.attachments || task.attachments.length === 0) ? (
            <Text color="dimmed" ta="center">No attachments uploaded yet.</Text>
          ) : (
            <Stack gap="xs">
              {(task.attachments as any[]).map((att) => (
                <Paper key={att._id} withBorder p="xs" radius="md" bg="#f8fafc">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Paperclip size={16} color="#64748b" />
                      <div>
                        <Text 
                          component="a" 
                          href={att.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          size="sm" 
                          fw={600} 
                          c="blue"
                          style={{ textDecoration: 'underline' }}
                        >
                          {att.name}
                        </Text>
                        <Text size="xs" color="dimmed">
                          Uploaded by {att.uploadedBy?.name || 'Unknown'} on {new Date(att.createdAt).toLocaleDateString()}
                        </Text>
                      </div>
                    </Group>
                    <Badge size="xs" variant="outline" color="gray">
                      {(att.sizeBytes / 1024).toFixed(1)} KB
                    </Badge>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}

          <Group align="flex-end" mt="md">
            <FileInput
              placeholder="Choose file to upload..."
              leftSection={<UploadCloud size={16} />}
              value={newFile}
              onChange={setNewFile}
              style={{ flex: 1 }}
            />
            <Button 
              onClick={handleUploadAttachment} 
              loading={isUploadingAttachment} 
              disabled={!newFile}
            >
              Upload Attachment
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* Status Update Modal */}
      <Modal opened={statusModalOpened} onClose={() => setStatusModalOpened(false)} title={<Text fw={700}>Status Update Required</Text>}>
        <Stack>
          <Text size="sm">Please provide a quick comment on what was completed before moving to <strong>{selectedStatus.replace('_', ' ')}</strong>.</Text>
          {selectedStatus === 'in_review' && (
            <Text size="sm" mt={-8} c="dimmed">
              Total time logged: <strong>{Number(totalSpentHours.toFixed(2))}h</strong> / {formatHours(task.estimatedHours)}
            </Text>
          )}
          <Textarea 
            placeholder="E.g., Finished the UI layout, pushed to staging..." 
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            minRows={3}
          />
          <Button onClick={confirmStatusUpdate}>
            {selectedStatus === 'in_review' ? 'Mark In Review' : 'Confirm Update'}
          </Button>
        </Stack>
      </Modal>

      {/* Manual Time Log Modal */}
      <Modal opened={manualLogModalOpened} onClose={() => setManualLogModalOpened(false)} title={<Text fw={700}>Log Manual Time</Text>} radius="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">Task Estimated Hours: <strong>{formatHours(task.estimatedHours)}</strong></Text>
            <Badge color={remainingHours > 0 ? 'blue' : 'red'} variant="light" size="lg">
              {formatHours(remainingHours)} remaining
            </Badge>
          </Group>

          <NumberInput
            label="Logged Hours"
            placeholder="1"
            min={0.1}
            max={task.estimatedHours > 0 ? remainingHours : undefined}
            step={0.5}
            decimalScale={2}
            value={manualHours}
            onChange={(val) => setManualHours(typeof val === 'number' ? val : 0)}
            withAsterisk
            radius="md"
          />

          <Textarea
            label="Work Description"
            placeholder="E.g., Configured database indexes and tested authentication endpoints..."
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            minRows={3}
            radius="md"
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="light" color="gray" onClick={() => setManualLogModalOpened(false)} radius="md">
              Cancel
            </Button>
            <Button
              onClick={handleCreateManualLog}
              loading={isCreatingManualLog}
              disabled={task.estimatedHours > 0 && remainingHours <= 0}
              radius="md"
            >
              Save Time Log
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};
