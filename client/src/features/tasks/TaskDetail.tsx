import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Title, Text, Group, Badge, Button, Stack, Progress, ActionIcon, Avatar, Timeline, Loader, Center, Modal, Textarea, Select, FileInput, Paper } from '@mantine/core';
import { ArrowLeft, Play, Square, Clock, CheckCircle, UploadCloud, Paperclip } from 'lucide-react';
import { useGetTaskByIdQuery, useUpdateTaskMutation } from './task.slice';
import { useGetTimeLogsByTaskQuery, useStartTimerMutation, useStopTimerMutation, useGetActiveTimerQuery } from '../timelogs/timeLog.slice';
import { useUploadFileMutation } from '../uploads/upload.slice';

export const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: taskData, isLoading: isTaskLoading } = useGetTaskByIdQuery(id as string);
  const { data: timeLogsData, isLoading: isLogsLoading } = useGetTimeLogsByTaskQuery(id as string);
  const { data: activeTimerData } = useGetActiveTimerQuery();
  
  const [startTimer] = useStartTimerMutation();
  const [stopTimer] = useStopTimerMutation();
  const [updateTask] = useUpdateTaskMutation();

  const [statusModalOpened, setStatusModalOpened] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusComment, setStatusComment] = useState('');

  const [uploadFile, { isLoading: isUploadingAttachment }] = useUploadFileMutation();
  const [newFile, setNewFile] = useState<File | null>(null);

  const task = taskData?.data;
  const timeLogs = timeLogsData?.data || [];
  const activeTimer = activeTimerData?.data;

  if (isTaskLoading || isLogsLoading) return <Center h={400}><Loader color="blue" /></Center>;
  if (!task) return <Center h={400}><Text>Task not found</Text></Center>;

  const isTimerActiveForThisTask = (activeTimer?.task as any)?._id === task._id || activeTimer?.task === task._id;
  const progressPercent = Math.min(((task.spentHours || 0) / task.estimatedHours) * 100, 100);

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
            <Text color="dimmed" mt="xs">{task.description || 'No description provided.'}</Text>
          </div>
          
          <Select
            data={[
              { value: 'assigned', label: 'Assigned' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'in_review', label: 'In Review' },
              { value: 'completed', label: 'Completed' },
            ]}
            value={task.status}
            onChange={handleStatusChange}
            w={160}
          />
        </Group>

        <Group gap="xl" align="center">
          {/* Large Play/Stop Button */}
          {task.status !== 'completed' && (
            <ActionIcon 
              size={80} 
              radius="100%" 
              color={isTimerActiveForThisTask ? "red" : "blue"}
              variant={isTimerActiveForThisTask ? "light" : "filled"}
              onClick={isTimerActiveForThisTask ? handleStopTimer : handleStartTimer}
              style={{ boxShadow: isTimerActiveForThisTask ? 'none' : '0 10px 25px rgba(59, 130, 246, 0.4)', transition: 'all 0.2s ease' }}
            >
              {isTimerActiveForThisTask ? <Square size={32} fill="currentColor" /> : <Play size={36} fill="currentColor" style={{ marginLeft: 6 }} />}
            </ActionIcon>
          )}

          <div style={{ flex: 1 }}>
            <Group justify="space-between" mb={8}>
              <Text fw={600} size="sm">Task Progress</Text>
              <Text fw={700} size="sm" color={progressPercent > 100 ? 'red' : 'blue'}>
                {(task.spentHours || 0).toFixed(2)}h / {task.estimatedHours}h
              </Text>
            </Group>
            <Progress 
              value={progressPercent} 
              size="xl" 
              radius="xl" 
              color={task.status === 'completed' ? 'green' : (progressPercent > 100 ? 'red' : 'blue')} 
              striped={isTimerActiveForThisTask}
              animated={isTimerActiveForThisTask}
            />
          </div>
        </Group>
      </Card>

      {/* Timeline Section */}
      <Title order={4} mb="md">Time Log Activity</Title>
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
                    <Text fw={500} size="sm">
                      {log.durationSeconds ? `${(log.durationSeconds / 3600).toFixed(2)}h logged` : 'Session recorded'}
                    </Text>
                    <Text size="xs" color="dimmed">{new Date(log.startTime).toLocaleString()}</Text>
                  </Group>
                }
              >
                <Group gap="xs" mt={8}>
                  <Avatar src={(log.user as any)?.avatarUrl} size="sm" radius="xl" color="blue">{(log.user as any)?.name?.charAt(0)}</Avatar>
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
          <Textarea 
            placeholder="E.g., Finished the UI layout, pushed to staging..." 
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            minRows={3}
          />
          <Button onClick={confirmStatusUpdate}>Confirm Update</Button>
        </Stack>
      </Modal>
    </Container>
  );
};
