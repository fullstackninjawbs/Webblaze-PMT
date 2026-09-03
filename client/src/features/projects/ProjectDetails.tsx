import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProjectsQuery, useUpdateProjectMutation } from './project.slice';
import { PaginatedTable, usePagination } from '../../components/common/PaginatedTable';
import { useGetMilestonesByProjectQuery, useCreateMilestoneMutation, useUpdateMilestoneMutation, useDeleteMilestoneMutation } from '../milestones/milestone.slice';
import { useGetTasksByMilestoneQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useGetAllTasksQuery } from '../tasks/task.slice';
import { useStartTimerMutation, useStopTimerMutation, useGetActiveTimerQuery, useCreateManualTimeLogMutation } from '../timelogs/timeLog.slice';
import { Container, Title, Text, Button, Group, Card, Badge, Stack, Drawer, TextInput, NumberInput, Loader, Center, Tabs, Progress, SimpleGrid, Table, Select, Tooltip, ActionIcon, FileInput, Textarea, Alert, Modal, MultiSelect, Paper, Menu, Grid, Box, Chip } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Plus, ArrowLeft, Play, Square, DollarSign, Calendar, Users, Activity, FileText, FileCheck, CheckCircle, Info, UploadCloud, Filter, Edit, Trash, Search, Clock, TrendingUp, AlertTriangle, Eye } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role, ProjectStatus, DEPARTMENT_OPTIONS } from '../../types';
import { useGetUsersQuery } from '../users/user.slice';
import { useGetReleasesQuery, useCreateReleaseMutation, useUpdateReleaseMutation, useDeleteReleaseMutation } from '../releases/release.slice';
import { useGetInvoicesQuery, useCreateInvoiceMutation, useUpdateInvoiceMutation, useDeleteInvoiceMutation } from '../invoices/invoice.slice';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useUploadFileMutation } from '../uploads/upload.slice';
import { formatDateDisplay, parseLocalDateString, formatLocalDateString } from '../../utils/dateUtils';
import { formatHours } from '../../utils/formatHours';

const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  estimatedHours: z.number().min(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed']),
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
  department: z.enum(['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales', 'pm', 'admin']),
  estimatedHours: z.number().min(0.5, 'Minimum 0.5 hours'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assignedTo: z.string().optional(),
  milestone: z.string(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End Date cannot be before Start Date",
  path: ["endDate"],
});

const editTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  department: z.enum(['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales', 'pm', 'admin']),
  estimatedHours: z.number().min(0.5, 'Minimum 0.5 hours'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assignedTo: z.string().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End Date cannot be before Start Date",
  path: ["endDate"],
});

export const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user } = useSelector((state: RootState) => state.auth);
  const isAdminOrPM = user?.role === Role.ADMIN || user?.role === Role.PM;

  const { data: projectsData, isLoading: isProjectLoading } = useGetProjectsQuery({ limit: 1000 });
  const project = projectsData?.data?.find(p => p._id === id);

  const { data: milestonesData, isLoading: isMilestonesLoading } = useGetMilestonesByProjectQuery({ projectId: id!, limit: 1000 });
  const milestones = milestonesData?.data || [];

  const { data: allTasksData } = useGetAllTasksQuery();
  const projectTasks = useMemo(() => {
    if (!allTasksData?.data) return [];
    const milestoneIds = new Set(milestones.map((m: any) => String(m._id)));
    return allTasksData.data.filter((t: any) => {
      const tMilestoneId = typeof t.milestone === 'object' ? t.milestone?._id : t.milestone;
      const tProjectId = typeof t.project === 'object' ? t.project?._id : t.project;
      return String(tProjectId) === String(id) || milestoneIds.has(String(tMilestoneId));
    });
  }, [allTasksData, milestones, id]);

  const taskMetrics = useMemo(() => {
    const total = projectTasks.length;
    const assigned = projectTasks.filter((t: any) => t.status === 'assigned').length;
    const inProgress = projectTasks.filter((t: any) => t.status === 'in_progress').length;
    const inReview = projectTasks.filter((t: any) => t.status === 'in_review').length;
    const completed = projectTasks.filter((t: any) => t.status === 'completed').length;

    const totalEstHours = projectTasks.reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0);
    const totalSpentHours = projectTasks.reduce((sum: number, t: any) => sum + (t.spentHours || 0), 0);

    const completedTasks = projectTasks.filter((t: any) => t.status === 'completed');
    const avgRunTime = completedTasks.length > 0
      ? (completedTasks.reduce((sum: number, t: any) => sum + (t.spentHours || 0), 0) / completedTasks.length).toFixed(1)
      : '0.0';

    const overtimeHours = projectTasks.reduce((sum: number, t: any) => {
      const over = (t.spentHours || 0) - (t.estimatedHours || 0);
      return sum + (over > 0 ? over : 0);
    }, 0);

    // Department breakdown
    const deptMap: Record<string, { count: number; spent: number; est: number }> = {};
    projectTasks.forEach((t: any) => {
      const dept = t.department || 'other';
      if (!deptMap[dept]) deptMap[dept] = { count: 0, spent: 0, est: 0 };
      deptMap[dept].count += 1;
      deptMap[dept].spent += (t.spentHours || 0);
      deptMap[dept].est += (t.estimatedHours || 0);
    });

    return {
      total,
      assigned,
      inProgress,
      inReview,
      completed,
      totalEstHours,
      totalSpentHours,
      avgRunTime,
      overtimeHours,
      deptMap,
    };
  }, [projectTasks]);

  const projectEstHours = milestones.reduce((sum, m) => sum + (m.estimatedHours || 0), 0);
  const projectSpentHours = milestones.reduce((sum, m) => sum + (m.spentHours || 0), 0);

  const { data: usersData } = useGetUsersQuery({ limit: 1000 });
  const projectDept = project?.type ? normalizeFrontendDept(project.type) : '';
  const teamOptions = (usersData?.data || [])
    .filter(u => {
      if (u.role !== Role.TEAM_LEAD && u.role !== Role.TEAM_MEMBER) return false;
      if (!projectDept) return true;
      return normalizeFrontendDept(u.department || '') === projectDept;
    })
    .map(u => ({
      value: u._id,
      label: `${u.name} (${u.role.replace('_', ' ')})`
    }));

  const [createMilestone, { isLoading: isCreatingMilestone }] = useCreateMilestoneMutation();
  const [updateMilestone, { isLoading: isUpdatingMilestone }] = useUpdateMilestoneMutation();
  const [deleteMilestone, { isLoading: isDeletingMilestone }] = useDeleteMilestoneMutation();
  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdatingTask }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeletingTask }] = useDeleteTaskMutation();
  const [createManualTimeLog, { isLoading: isLoggingTime }] = useCreateManualTimeLogMutation();
  const [uploadFile, { isLoading: isUploadingFile }] = useUploadFileMutation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [activeTab, setActiveTab] = useState<string>('milestones');
  const [selectedMilestoneFilter, setSelectedMilestoneFilter] = useState<string | null>(null);
  const { page, limit, setPage, setLimit, resetPage } = usePagination();

  const paginatedMilestones = useMemo(() => {
    return milestones.slice((page - 1) * limit, page * limit);
  }, [milestones, page, limit]);
  const milestoneMeta = { page, limit, total: milestones.length, totalPages: Math.ceil(milestones.length / limit) || 1 };

  const handleViewMilestoneTasks = (milestoneId: string) => {
    setSelectedMilestoneFilter(milestoneId);
    setActiveTab('tasks');
  };
  void handleViewMilestoneTasks;

  const [milestoneDrawerOpened, setMilestoneDrawerOpened] = useState(false);
  const [editMilestoneOpened, setEditMilestoneOpened] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);

  const [deleteMilestoneModalOpened, setDeleteMilestoneModalOpened] = useState(false);
  const [deletingMilestone, setDeletingMilestone] = useState<any>(null);

  const [taskDrawerOpened, setTaskDrawerOpened] = useState(false);
  const [editTaskOpened, setEditTaskOpened] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<{ id: string; title: string } | null>(null);

  const [logTimeOpened, setLogTimeOpened] = useState(false);
  const [logTimeTask, setLogTimeTask] = useState<any>(null);
  const [logTimeHours, setLogTimeHours] = useState<number | string>(1);
  const [logTimeDescription, setLogTimeDescription] = useState('');

  const [activeMilestoneEstimated, setActiveMilestoneEstimated] = useState<number>(0);
  const [activeMilestoneAllocated, setActiveMilestoneAllocated] = useState<number>(0);

  const [updateProject, { isLoading: isUpdatingProject }] = useUpdateProjectMutation();
  const [editProjectOpened, setEditProjectOpened] = useState(false);
  const editProjectForm = useForm({
    initialValues: { name: '', description: '', type: '', status: ProjectStatus.NEW as any },
    validate: {
      name: (val) => (val.trim().length === 0 ? 'Name is required' : null),
    },
  });

  const handleOpenEditProject = () => {
    if (!project) return;
    editProjectForm.setValues({
      name: project.name || '',
      description: project.description || '',
      type: project.type || '',
      status: project.status || ProjectStatus.NEW,
    });
    setEditProjectOpened(true);
  };

  const handleUpdateProject = async (values: typeof editProjectForm.values) => {
    if (!project) return;
    try {
      await updateProject({
        id: project._id,
        data: {
          name: values.name,
          description: values.description,
          type: values.type,
          status: values.status,
        }
      }).unwrap();
      setEditProjectOpened(false);
    } catch (e) {
      console.error('Failed to update project', e);
    }
  };

  const milestoneForm = useForm({
    initialValues: { title: '', estimatedHours: 10, startDate: '', endDate: '', status: 'not_started' },
    validate: zodResolver(milestoneSchema),
  });

  const editMilestoneForm = useForm({
    initialValues: { title: '', estimatedHours: 10, startDate: '', endDate: '', status: 'not_started' },
    validate: zodResolver(milestoneSchema),
  });

  const taskForm = useForm({
    initialValues: { title: '', description: '', department: 'fullstack', estimatedHours: 2, startDate: '', endDate: '', assignedTo: '', milestone: '' },
    validate: zodResolver(taskSchema),
  });

  const editTaskForm = useForm({
    initialValues: { title: '', description: '', department: 'fullstack', estimatedHours: 2, startDate: '', endDate: '', assignedTo: '' },
    validate: zodResolver(editTaskSchema),
  });

  const handleOpenEditTask = (task: any) => {
    setEditingTask(task);
    const startStr = task.startDate ? formatLocalDateString(parseLocalDateString(task.startDate)) : '';
    const endStr = task.endDate ? formatLocalDateString(parseLocalDateString(task.endDate)) : '';
    const assignedId = typeof task.assignedTo === 'object' && task.assignedTo !== null
      ? task.assignedTo._id
      : (typeof task.assignedTo === 'string' ? task.assignedTo : '');
    editTaskForm.setValues({
      title: task.title || '',
      description: task.description || '',
      department: task.department || 'fullstack',
      estimatedHours: task.estimatedHours || 2,
      startDate: startStr,
      endDate: endStr,
      assignedTo: assignedId,
    });
    setEditTaskOpened(true);
  };

  const handleUpdateTask = async (values: typeof editTaskForm.values) => {
    if (!editingTask) return;
    try {
      const sDate = parseLocalDateString(values.startDate);
      const eDate = parseLocalDateString(values.endDate);
      await updateTask({
        _id: editingTask._id,
        ...values,
        startDate: sDate ? formatLocalDateString(sDate) : undefined,
        endDate: eDate ? formatLocalDateString(eDate) : undefined,
        assignedTo: values.assignedTo || undefined,
      } as any).unwrap();
      setEditTaskOpened(false);
      setEditingTask(null);
    } catch (e) {
      console.error('Failed to update task', e);
    }
  };

  const handleOpenDeleteTask = (task: any) => {
    setDeleteTaskTarget({ id: task._id, title: task.title });
  };

  const confirmDeleteTask = async () => {
    if (deleteTaskTarget) {
      try {
        await deleteTask(deleteTaskTarget.id).unwrap();
        setDeleteTaskTarget(null);
      } catch (e) {
        console.error('Failed to delete task', e);
      }
    }
  };

  const handleOpenLogTime = (task: any) => {
    setLogTimeTask(task);
    setLogTimeHours(1);
    setLogTimeDescription('');
    setLogTimeOpened(true);
  };

  const handleSaveManualTime = async () => {
    if (!logTimeTask) return;
    const hours = Number(logTimeHours);
    if (!hours || hours <= 0) return;
    try {
      await createManualTimeLog({
        taskId: logTimeTask._id,
        hours,
        description: logTimeDescription || 'Manual time entry',
      }).unwrap();
      setLogTimeOpened(false);
      setLogTimeTask(null);
    } catch (e) {
      console.error('Failed to log manual time', e);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await updateTask({ _id: taskId, status } as any).unwrap();
    } catch (e) {
      console.error('Failed to update task status', e);
    }
  };

  const handleCreateMilestone = async (values: typeof milestoneForm.values) => {
    try {
      const sDate = parseLocalDateString(values.startDate);
      const eDate = parseLocalDateString(values.endDate);
      await createMilestone({
        ...values,
        project: id,
        status: values.status as any,
        startDate: sDate ? formatLocalDateString(sDate) : undefined,
        endDate: eDate ? formatLocalDateString(eDate) : undefined
      }).unwrap();
      setMilestoneDrawerOpened(false);
      milestoneForm.reset();
    } catch (e) {
      console.error(e);
    }
  };


  const handleOpenEditMilestone = (milestone: any) => {
    setEditingMilestone(milestone);
    const startStr = milestone.startDate ? formatLocalDateString(parseLocalDateString(milestone.startDate)) : '';
    const endStr = milestone.endDate ? formatLocalDateString(parseLocalDateString(milestone.endDate)) : '';
    editMilestoneForm.setValues({
      title: milestone.title || '',
      estimatedHours: milestone.estimatedHours || 10,
      startDate: startStr,
      endDate: endStr,
      status: milestone.status || 'not_started',
    });
    setEditMilestoneOpened(true);
  };
  void handleOpenEditMilestone;

  const handleUpdateMilestone = async (values: typeof editMilestoneForm.values) => {
    if (!editingMilestone) return;
    try {
      const sDate = parseLocalDateString(values.startDate);
      const eDate = parseLocalDateString(values.endDate);
      await updateMilestone({
        _id: editingMilestone._id,
        project: id!,
        title: values.title,
        estimatedHours: values.estimatedHours,
        startDate: sDate ? formatLocalDateString(sDate) : undefined,
        endDate: eDate ? formatLocalDateString(eDate) : undefined,
        status: values.status as any,
      }).unwrap();
      setEditMilestoneOpened(false);
      setEditingMilestone(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDeleteMilestone = (milestone: any) => {
    setDeletingMilestone(milestone);
    setDeleteMilestoneModalOpened(true);
  };

  const handleDeleteMilestoneConfirm = async () => {
    if (!deletingMilestone) return;
    try {
      await deleteMilestone(deletingMilestone._id).unwrap();
      setDeleteMilestoneModalOpened(false);
      setDeletingMilestone(null);
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
  void openTaskDrawer;

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

      const sDate = parseLocalDateString(values.startDate);
      const eDate = parseLocalDateString(values.endDate);

      await createTask({
        ...values,
        department: values.department as any,
        startDate: sDate ? formatLocalDateString(sDate) : undefined,
        endDate: eDate ? formatLocalDateString(eDate) : undefined,
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

            <Text 
              size="sm" 
              style={{ 
                color: '#64748b', 
                maxWidth: '650px', 
                lineHeight: 1.6,
                maxHeight: '180px',
                overflowY: 'auto',
                paddingRight: '8px'
              }}
            >
              {project.description || 'No description provided for this project.'}
            </Text>

            <Group mt="xl" gap="sm" wrap="nowrap" style={{ maxWidth: '420px' }}>
              <div style={{ flex: 1 }}>
                <Group justify="space-between" mb={6}>
                  <Text size="xs" fw={600} style={{ color: '#64748b' }}>Project Progress (Hours)</Text>
                  <Text size="xs" fw={700} style={{ color: projectSpentHours >= projectEstHours && projectEstHours > 0 ? '#10b981' : '#2563eb' }}>
                    {Math.min(Math.round((projectSpentHours / (projectEstHours || 1)) * 100), 100)}%
                  </Text>
                </Group>
                <Progress
                  value={Math.min((projectSpentHours / (projectEstHours || 1)) * 100, 100)}
                  color={projectSpentHours >= projectEstHours && projectEstHours > 0 ? 'green' : 'blue'}
                  size="sm"
                  radius="xl"
                />
              </div>
            </Group>
          </div>

          {/* Right: Actions & KPIs */}
          <Stack align="flex-end" gap="md">
            {isAdminOrPM && (
              <Group>
                <Button variant="light" color="blue" onClick={handleOpenEditProject} leftSection={<Edit size={16} />}>
                  Edit Project
                </Button>
              </Group>
            )}
            {isAdminOrPM && (
              <Group gap="sm">
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

            {isAdminOrPM && (
              <Chip.Group
                multiple={false}
                value={project.status}
                onChange={async (val: string) => {
                  if (!val || val === project.status) return;
                  try {
                    await updateProject({ id: project._id, data: { status: val } as any }).unwrap();
                  } catch (e) {
                    console.error('Failed to update project status', e);
                  }
                }}
              >
                <Group gap={8}>
                  <Chip size="sm" radius="md" value={ProjectStatus.NEW} color="gray" variant="filled">New</Chip>
                  <Chip size="sm" radius="md" value={ProjectStatus.ACTIVE} color="blue" variant="filled">Active</Chip>
                  <Chip size="sm" radius="md" value={ProjectStatus.ON_HOLD} color="orange" variant="filled">On Hold</Chip>
                  <Chip size="sm" radius="md" value={ProjectStatus.MAINTENANCE} color="violet" variant="filled">Maintenance</Chip>
                  <Chip size="sm" radius="md" value={ProjectStatus.COMPLETED} color="green" variant="filled">Completed</Chip>
                </Group>
              </Chip.Group>
            )}
          </Stack>
        </Group>
      </Card>

      {/* Tabbed Navigation */}
      <Tabs value={activeTab} onChange={(val) => { setActiveTab(val || 'milestones'); resetPage(); }} radius="md">
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
          <Stack gap="xl">
            {/* 1. KPI Summary Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              <Card withBorder shadow="sm" p="lg" radius="lg" bg="#ffffff">
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">Total Tasks</Text>
                  <Box p={8} style={{ borderRadius: 8, backgroundColor: '#eff6ff' }}>
                    <FileCheck size={18} color="#2563eb" />
                  </Box>
                </Group>
                <Text fw={800} size="28px" style={{ color: '#0f172a' }}>{taskMetrics.total}</Text>
                <Group gap={6} mt="xs" wrap="nowrap">
                  <Badge size="xs" color="blue" variant="light">{taskMetrics.assigned} Assigned</Badge>
                  <Badge size="xs" color="yellow" variant="light">{taskMetrics.inProgress} In Prog</Badge>
                  <Badge size="xs" color="green" variant="light">{taskMetrics.completed} Done</Badge>
                </Group>
              </Card>

              <Card withBorder shadow="sm" p="lg" radius="lg" bg="#ffffff">
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">Total Task Run Time</Text>
                  <Box p={8} style={{ borderRadius: 8, backgroundColor: '#f0fdf4' }}>
                    <Clock size={18} color="#16a34a" />
                  </Box>
                </Group>
                <Text fw={800} size="28px" style={{ color: '#0f172a' }}>
                  {formatHours(taskMetrics.totalSpentHours)}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Out of {formatHours(taskMetrics.totalEstHours)} estimated ({taskMetrics.totalEstHours > 0 ? Math.round((taskMetrics.totalSpentHours / taskMetrics.totalEstHours) * 100) : 0}% used)
                </Text>
              </Card>

              <Card withBorder shadow="sm" p="lg" radius="lg" bg="#ffffff">
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">Avg Task Run Time</Text>
                  <Box p={8} style={{ borderRadius: 8, backgroundColor: '#fef3c7' }}>
                    <TrendingUp size={18} color="#d97706" />
                  </Box>
                </Group>
                <Text fw={800} size="28px" style={{ color: '#0f172a' }}>
                  {formatHours(taskMetrics.avgRunTime)}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Average run time per completed task
                </Text>
              </Card>

              <Card withBorder shadow="sm" p="lg" radius="lg" bg="#ffffff">
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">Task Overtime</Text>
                  <Box p={8} style={{ borderRadius: 8, backgroundColor: taskMetrics.overtimeHours > 0 ? '#fef2f2' : '#f8fafc' }}>
                    <AlertTriangle size={18} color={taskMetrics.overtimeHours > 0 ? '#dc2626' : '#64748b'} />
                  </Box>
                </Group>
                <Text fw={800} size="28px" style={{ color: taskMetrics.overtimeHours > 0 ? '#dc2626' : '#0f172a' }}>
                  +{formatHours(taskMetrics.overtimeHours)}
                </Text>
                <Text
                  size="xs" c="dimmed" mt={4}>
                  {taskMetrics.overtimeHours > 0 ? 'Hours exceeded beyond estimates' : 'All tasks within estimated time'}
                </Text>
              </Card>
            </SimpleGrid>

            {/* 2. Visual Charts Row 1: Task Status Distribution & Department Run Time */}
            <Grid gutter="xl">
              {/* Task Status Progress & Breakdown Chart */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder shadow="sm" p="xl" radius="lg" style={{ height: '100%', backgroundColor: '#ffffff' }}>
                  <Group justify="space-between" mb="md">
                    <div>
                      <Text fw={700} size="md" style={{ color: '#0f172a' }}>Task Status Distribution</Text>
                      <Text size="xs" c="dimmed">Visual breakdown of all project tasks</Text>
                    </div>
                    <Badge color="indigo" variant="light">{taskMetrics.total} Total Tasks</Badge>
                  </Group>

                  {/* Multi-segment Progress Bar Chart */}
                  <Box mb="xl" mt="md">
                    <Progress.Root size="24" radius="xl" style={{ backgroundColor: '#f1f5f9' }}>
                      <Tooltip label={`Assigned: ${taskMetrics.assigned} (${taskMetrics.total > 0 ? Math.round((taskMetrics.assigned / taskMetrics.total) * 100) : 0}%)`}>
                        <Progress.Section value={taskMetrics.total > 0 ? (taskMetrics.assigned / taskMetrics.total) * 100 : 0} color="#3b82f6" />
                      </Tooltip>
                      <Tooltip label={`In Progress: ${taskMetrics.inProgress} (${taskMetrics.total > 0 ? Math.round((taskMetrics.inProgress / taskMetrics.total) * 100) : 0}%)`}>
                        <Progress.Section value={taskMetrics.total > 0 ? (taskMetrics.inProgress / taskMetrics.total) * 100 : 0} color="#f59e0b" />
                      </Tooltip>
                      <Tooltip label={`In Review: ${taskMetrics.inReview} (${taskMetrics.total > 0 ? Math.round((taskMetrics.inReview / taskMetrics.total) * 100) : 0}%)`}>
                        <Progress.Section value={taskMetrics.total > 0 ? (taskMetrics.inReview / taskMetrics.total) * 100 : 0} color="#6366f1" />
                      </Tooltip>
                      <Tooltip label={`Completed: ${taskMetrics.completed} (${taskMetrics.total > 0 ? Math.round((taskMetrics.completed / taskMetrics.total) * 100) : 0}%)`}>
                        <Progress.Section value={taskMetrics.total > 0 ? (taskMetrics.completed / taskMetrics.total) * 100 : 0} color="#10b981" />
                      </Tooltip>
                    </Progress.Root>
                  </Box>

                  {/* Legend Grid */}
                  <SimpleGrid cols={2} spacing="md">
                    <Paper p="sm" radius="md" withBorder style={{ backgroundColor: '#f8fafc' }}>
                      <Group gap="xs" mb={4}>
                        <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                        <Text size="xs" fw={600} c="dimmed">Assigned</Text>
                      </Group>
                      <Text fw={800} size="lg">{taskMetrics.assigned}</Text>
                      <Text size="xs" c="dimmed">{taskMetrics.total > 0 ? Math.round((taskMetrics.assigned / taskMetrics.total) * 100) : 0}% of tasks</Text>
                    </Paper>

                    <Paper p="sm" radius="md" withBorder style={{ backgroundColor: '#f8fafc' }}>
                      <Group gap="xs" mb={4}>
                        <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                        <Text size="xs" fw={600} c="dimmed">In Progress</Text>
                      </Group>
                      <Text fw={800} size="lg">{taskMetrics.inProgress}</Text>
                      <Text size="xs" c="dimmed">{taskMetrics.total > 0 ? Math.round((taskMetrics.inProgress / taskMetrics.total) * 100) : 0}% of tasks</Text>
                    </Paper>

                    <Paper p="sm" radius="md" withBorder style={{ backgroundColor: '#f8fafc' }}>
                      <Group gap="xs" mb={4}>
                        <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#6366f1' }} />
                        <Text size="xs" fw={600} c="dimmed">In Review</Text>
                      </Group>
                      <Text fw={800} size="lg">{taskMetrics.inReview}</Text>
                      <Text size="xs" c="dimmed">{taskMetrics.total > 0 ? Math.round((taskMetrics.inReview / taskMetrics.total) * 100) : 0}% of tasks</Text>
                    </Paper>

                    <Paper p="sm" radius="md" withBorder style={{ backgroundColor: '#f8fafc' }}>
                      <Group gap="xs" mb={4}>
                        <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
                        <Text size="xs" fw={600} c="dimmed">Completed</Text>
                      </Group>
                      <Text fw={800} size="lg">{taskMetrics.completed}</Text>
                      <Text size="xs" c="dimmed">{taskMetrics.total > 0 ? Math.round((taskMetrics.completed / taskMetrics.total) * 100) : 0}% of tasks</Text>
                    </Paper>
                  </SimpleGrid>
                </Card>
              </Grid.Col>

              {/* Department Task Run Time & Workload Chart */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder shadow="sm" p="xl" radius="lg" style={{ height: '100%', backgroundColor: '#ffffff' }}>
                  <Group justify="space-between" mb="md">
                    <div>
                      <Text fw={700} size="md" style={{ color: '#0f172a' }}>Department Run Time & Workload</Text>
                      <Text size="xs" c="dimmed">Logged hours & task count per department</Text>
                    </div>
                    <Badge color="blue" variant="light">Department Metrics</Badge>
                  </Group>

                  <Stack gap="md" mt="sm">
                    {Object.keys(taskMetrics.deptMap).length > 0 ? (
                      Object.entries(taskMetrics.deptMap).map(([dept, data]) => {
                        const deptName = dept.toUpperCase();
                        const percentOfMax = taskMetrics.totalSpentHours > 0
                          ? Math.min(Math.round((data.spent / taskMetrics.totalSpentHours) * 100), 100)
                          : 0;
                        return (
                          <Box key={dept}>
                            <Group justify="space-between" mb={4}>
                              <Group gap="xs">
                                <Badge size="xs" variant="filled" color="indigo">{deptName}</Badge>
                                <Text size="xs" c="dimmed">({data.count} {data.count === 1 ? 'task' : 'tasks'})</Text>
                              </Group>
                              <Text size="xs" fw={700} style={{ color: '#0f172a' }}>
                                {formatHours(data.spent)} / {formatHours(data.est)}
                              </Text>
                            </Group>
                            <Progress value={percentOfMax} size="sm" radius="xl" color="indigo" />
                          </Box>
                        );
                      })
                    ) : (
                      <Center p="xl">
                        <Text size="xs" c="dimmed">No department workload data available yet.</Text>
                      </Center>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>

            {/* 3. Milestone Run Time Breakdown Chart */}
            <Card withBorder shadow="sm" p="xl" radius="lg" bg="#ffffff">
              <Group justify="space-between" mb="lg">
                <div>
                  <Text fw={700} size="md" style={{ color: '#0f172a' }}>Milestone Run Time Breakdown</Text>
                  <Text size="xs" c="dimmed">Comparing active run time vs estimated hours per milestone</Text>
                </div>
                <Badge color="teal" variant="light">{milestones.length} Milestones</Badge>
              </Group>

              {milestones.length > 0 ? (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  {milestones.map((m: any) => {
                    const mTasks = projectTasks.filter((t: any) => {
                      const tMId = typeof t.milestone === 'object' ? t.milestone?._id : t.milestone;
                      return String(tMId) === String(m._id);
                    });
                    const mSpent = m.spentHours || mTasks.reduce((acc: number, t: any) => acc + (t.spentHours || 0), 0);
                    const mEst = m.estimatedHours || mTasks.reduce((acc: number, t: any) => acc + (t.estimatedHours || 0), 0);
                    const mPercent = mEst > 0 ? Math.min(Math.round((mSpent / mEst) * 100), 100) : 0;

                    return (
                      <Paper key={m._id} p="md" radius="lg" withBorder style={{ backgroundColor: '#f8fafc' }}>
                        <Group justify="space-between" mb="xs">
                          <Text fw={700} size="sm" style={{ color: '#0f172a' }}>{m.title}</Text>
                          <Badge size="xs" color={m.status === 'completed' ? 'green' : 'blue'} variant="light">
                            {(m.status || 'in_progress').replace('_', ' ')}
                          </Badge>
                        </Group>

                        <Group justify="space-between" mb={4}>
                          <Text size="xs" c="dimmed">{mTasks.length} tasks assigned</Text>
                          <Text size="xs" fw={700} c={mSpent > mEst ? 'red' : 'blue'}>
                            {formatHours(mSpent)} / {formatHours(mEst)} ({mPercent}%)
                          </Text>
                        </Group>
                        <Progress value={mPercent} size="sm" radius="xl" color={mSpent > mEst ? 'red' : 'blue'} />
                      </Paper>
                    );
                  })}
                </SimpleGrid>
              ) : (
                <Text size="xs" c="dimmed">No milestones created yet.</Text>
              )}
            </Card>

            {/* 4. Project Information & Team Roster Footer */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <Card withBorder shadow="sm" p="xl" radius="lg" bg="#ffffff">
                <Title order={4} mb="md">Project Metadata</Title>
                <Stack gap="sm">
                  <Group justify="space-between"><Text size="xs" c="dimmed">Project Type</Text><Text size="xs" fw={600}>{project.type || 'Standard'}</Text></Group>
                  <Group justify="space-between"><Text size="xs" c="dimmed">Created Date</Text><Text size="xs" fw={600}>{formatDateDisplay(project.createdAt)}</Text></Group>
                  <Group justify="space-between"><Text size="xs" c="dimmed">Client Source</Text><Badge variant="light" size="xs">{project.client?.source || 'direct'}</Badge></Group>
                </Stack>
              </Card>

              <Card withBorder shadow="sm" p="xl" radius="lg" bg="#ffffff">
                <Title order={4} mb="md">Team Roster</Title>
                {project.team?.length > 0 ? (
                  <Stack gap="sm">
                    {project.team.map((member: any) => (
                      <Group key={member._id} gap="sm" justify="space-between">
                        <Group gap="xs">
                          <UserAvatar name={member.name} email={member.email} avatarUrl={member.avatarUrl} size="sm" />
                          <div>
                            <Text size="xs" fw={600}>{member.name}</Text>
                            <Text size="xs" c="dimmed">{member.role?.replace('_', ' ')}</Text>
                          </div>
                        </Group>
                        <Badge size="xs" variant="subtle" color="gray">{member.department || 'General'}</Badge>
                      </Group>
                    ))}
                  </Stack>
                ) : (
                  <Text size="xs" c="dimmed">No team members assigned yet.</Text>
                )}
              </Card>
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="milestones">
          <Card withBorder shadow="sm" p="md" radius="md">
            <Group justify="space-between" mb="lg">
              <Title order={3}>Project Milestones</Title>
              {isAdminOrPM && project?.status !== 'completed' && (
                <Button
                  leftSection={<Plus size={16} />}
                  onClick={() => navigate(`/projects/${id}/milestones/new`)}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                  }}
                >
                  Add Milestone
                </Button>
              )}
            </Group>

          {milestones.length > 0 ? (
            <PaginatedTable meta={milestoneMeta} onPageChange={setPage} onLimitChange={setLimit} isLoading={isMilestonesLoading}>
              <Table.ScrollContainer minWidth={950}>
                <Table verticalSpacing="sm" striped>
                  <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Milestone</Table.Th>
                        <Table.Th>Start Date</Table.Th>
                        <Table.Th>End Date</Table.Th>
                        <Table.Th>Est. Hours</Table.Th>
                        <Table.Th>Active Hours</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Progress</Table.Th>
                        <Table.Th w={150}></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedMilestones.map((milestone) => (
                        <MilestoneTableRow
                          key={milestone._id}
                          milestone={milestone}
                          onDelete={handleOpenDeleteMilestone}
                          canManage={isAdminOrPM}
                          projectStatus={project?.status}
                        />
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
            </PaginatedTable>
          ) : (
            <Box py="xl" ta="center">
              <Text color="dimmed">No milestones created yet. Add one to get started!</Text>
            </Box>
          )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="tasks">
          <ProjectTasks
            projectId={id!}
            milestones={milestones}
            projectStatus={project?.status}
            selectedMilestoneFilter={selectedMilestoneFilter}
            onMilestoneFilterChange={setSelectedMilestoneFilter}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleOpenDeleteTask}
            onLogTimeTask={handleOpenLogTime}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
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
      <Drawer opened={milestoneDrawerOpened} onClose={() => setMilestoneDrawerOpened(false)} position="right" size={600} title={<Text fw={600}>Add Milestone</Text>} padding="xl">
        <form onSubmit={milestoneForm.onSubmit(handleCreateMilestone)}>
          <Stack>
            <TextInput required label="Milestone Title" placeholder="e.g. Design Phase" {...milestoneForm.getInputProps('title')} />
            <NumberInput
              min={0}
              onFocus={(e) => e.target.select()}
              {...milestoneForm.getInputProps('estimatedHours')}
              label={
                <Text component="span" size="sm" fw={500} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Estimated Hours
                  <Tooltip label="Estimated hours define the maximum task hours that can be allocated to this milestone" withArrow multiline w={250}>
                    <ActionIcon size="xs" radius="xl" variant="subtle" color="gray"><Info size={14} /></ActionIcon>
                  </Tooltip>
                </Text>
              }
            />
            <Group grow>
              <DatePickerInput
                label="Start Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                maxDate={parseLocalDateString(milestoneForm.values.endDate) || undefined}
                leftSection={<Calendar size={16} color="#64748b" />}
                value={parseLocalDateString(milestoneForm.values.startDate)}
                onChange={(val) => milestoneForm.setFieldValue('startDate', formatLocalDateString(val))}
                error={milestoneForm.errors.startDate}
                clearable
                radius="md"
              />
              <DatePickerInput
                label="End Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                minDate={parseLocalDateString(milestoneForm.values.startDate) || undefined}
                leftSection={<Calendar size={16} color="#64748b" />}
                value={parseLocalDateString(milestoneForm.values.endDate)}
                onChange={(val) => milestoneForm.setFieldValue('endDate', formatLocalDateString(val))}
                error={milestoneForm.errors.endDate}
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
      <Drawer opened={taskDrawerOpened} onClose={() => setTaskDrawerOpened(false)} position="right" size={720} title={<Text fw={600}>Create Task</Text>} padding="xl">
        {/* Real-time Hour Cap Indicator */}
        <Card withBorder p="md" radius="md" mb="xl" style={{ backgroundColor: '#F8FAFC' }}>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={600} color="dimmed">Milestone Capacity</Text>
            <Text size="sm" fw={600} color={isOverAllocated ? 'red' : 'blue'}>
              {formatHours(remainingHours - newTaskEst)} Remaining
            </Text>
          </Group>
          <Progress.Root>
            <Progress.Section value={(activeMilestoneAllocated / activeMilestoneEstimated) * 100} color="blue" />
            <Progress.Section value={(newTaskEst / activeMilestoneEstimated) * 100} color={isOverAllocated ? 'red' : 'teal'} />
          </Progress.Root>
          <Group justify="space-between" mt="xs">
            <Text size="xs" color="dimmed">Est: {formatHours(activeMilestoneEstimated)}</Text>
            <Text size="xs" color="dimmed">Allocated: {formatHours(activeMilestoneAllocated)} + {formatHours(newTaskEst)} (New)</Text>
          </Group>
        </Card>

        {isOverAllocated && (
          <Alert color="red" title="Hour Cap Exceeded" mb="xl">
            This task requires {formatHours(newTaskEst)}, but the milestone only has {formatHours(remainingHours)} remaining. Please adjust the estimated hours or increase the milestone cap.
          </Alert>
        )}

        <form onSubmit={taskForm.onSubmit(handleCreateTask)}>
          <Stack>
            <TextInput required label="Task Title" placeholder="e.g. Wireframe Homepage" {...taskForm.getInputProps('title')} />
            <Textarea label="Description" placeholder="Task details..." minRows={3} {...taskForm.getInputProps('description')} />
            <Group grow>
              <Select required label="Department" data={DEPARTMENT_OPTIONS} {...taskForm.getInputProps('department')} />
              <NumberInput required label="Estimated Hours" min={0.5} step={0.5} onFocus={(e) => e.target.select()} {...taskForm.getInputProps('estimatedHours')} />
            </Group>
            <Group grow>
              <DatePickerInput
                label="Start Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                maxDate={parseLocalDateString(taskForm.values.endDate) || undefined}
                leftSection={<Calendar size={16} color="#64748b" />}
                value={parseLocalDateString(taskForm.values.startDate)}
                onChange={(val) => taskForm.setFieldValue('startDate', formatLocalDateString(val))}
                error={taskForm.errors.startDate}
                clearable
                radius="md"
              />
              <DatePickerInput
                label="End Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                minDate={parseLocalDateString(taskForm.values.startDate) || undefined}
                leftSection={<Calendar size={16} color="#64748b" />}
                value={parseLocalDateString(taskForm.values.endDate)}
                onChange={(val) => taskForm.setFieldValue('endDate', formatLocalDateString(val))}
                error={taskForm.errors.endDate}
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

      {/* Edit Milestone Drawer */}
      <Drawer opened={editMilestoneOpened} onClose={() => setEditMilestoneOpened(false)} position="right" size={600} title={<Text fw={600}>Edit Milestone</Text>} padding="xl">
        <form onSubmit={editMilestoneForm.onSubmit(handleUpdateMilestone)}>
          <Stack>
            <TextInput required label="Milestone Title" placeholder="e.g. Phase 1 Design" {...editMilestoneForm.getInputProps('title')} />
            <NumberInput required label="Estimated Hours" min={1} onFocus={(e) => e.target.select()} {...editMilestoneForm.getInputProps('estimatedHours')} />
            <Group grow>
              <DatePickerInput
                label="Start Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                maxDate={parseLocalDateString(editMilestoneForm.values.endDate) || undefined}
                leftSection={<Calendar size={16} color="#64748b" />}
                value={parseLocalDateString(editMilestoneForm.values.startDate)}
                onChange={(val) => editMilestoneForm.setFieldValue('startDate', formatLocalDateString(val))}
                error={editMilestoneForm.errors.startDate}
                clearable
                radius="md"
              />
              <DatePickerInput
                label="End Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                minDate={parseLocalDateString(editMilestoneForm.values.startDate) || undefined}
                leftSection={<Calendar size={16} color="#64748b" />}
                value={parseLocalDateString(editMilestoneForm.values.endDate)}
                onChange={(val) => editMilestoneForm.setFieldValue('endDate', formatLocalDateString(val))}
                error={editMilestoneForm.errors.endDate}
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
              {...editMilestoneForm.getInputProps('status')}
            />
            <Button type="submit" fullWidth loading={isUpdatingMilestone} mt="md">
              Update Milestone
            </Button>
          </Stack>
        </form>
      </Drawer>

      {/* Delete Milestone Confirmation Modal */}
      <DeleteConfirmModal
        opened={deleteMilestoneModalOpened}
        onClose={() => setDeleteMilestoneModalOpened(false)}
        onConfirm={handleDeleteMilestoneConfirm}
        title="Delete Milestone"
        itemName={deletingMilestone?.title}
        description="Are you sure you want to delete this milestone? All associated tasks will also be affected."
        loading={isDeletingMilestone}
      />

      {/* Edit Task Drawer */}
      <Drawer opened={editTaskOpened} onClose={() => setEditTaskOpened(false)} position="right" size={720} title={<Text fw={600}>Edit Task</Text>} padding="xl">
        <form onSubmit={editTaskForm.onSubmit(handleUpdateTask)}>
          <Stack gap="sm">
            <TextInput required label="Task Title" placeholder="e.g. Wireframe Homepage" {...editTaskForm.getInputProps('title')} />
            <Textarea label="Description" placeholder="Task details..." minRows={3} {...editTaskForm.getInputProps('description')} />
            <Group grow gap="md">
              <Select required label="Department" data={DEPARTMENT_OPTIONS} {...editTaskForm.getInputProps('department')} />
              <NumberInput required label="Estimated Hours" min={0.5} step={0.5} onFocus={(e) => e.target.select()} {...editTaskForm.getInputProps('estimatedHours')} />
            </Group>
            <Group grow gap="md">
              <DatePickerInput
                label="Start Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                maxDate={parseLocalDateString(editTaskForm.values.endDate) || undefined}
                leftSection={<Calendar size={16} color="#64748b" />}
                value={parseLocalDateString(editTaskForm.values.startDate)}
                onChange={(val) => editTaskForm.setFieldValue('startDate', formatLocalDateString(val))}
                error={editTaskForm.errors.startDate}
                clearable
                radius="md"
              />
              <DatePickerInput
                label="End Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                minDate={parseLocalDateString(editTaskForm.values.startDate) || undefined}
                leftSection={<Calendar size={16} color="#64748b" />}
                value={parseLocalDateString(editTaskForm.values.endDate)}
                onChange={(val) => editTaskForm.setFieldValue('endDate', formatLocalDateString(val))}
                error={editTaskForm.errors.endDate}
                clearable
                radius="md"
              />
            </Group>
            <Select label="Assign To" placeholder="Leave empty for unassigned" data={teamOptions} searchable clearable {...editTaskForm.getInputProps('assignedTo')} />

            <Button type="submit" fullWidth loading={isUpdatingTask} mt="md">
              Update Task
            </Button>
          </Stack>
        </form>
      </Drawer>

      {/* Delete Task Confirmation Modal */}
      <DeleteConfirmModal
        opened={!!deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        itemName={deleteTaskTarget?.title}
        description="Are you sure you want to delete this task? This action cannot be undone."
        loading={isDeletingTask}
      />

      {/* Log Time Manually Modal */}
      <Modal opened={logTimeOpened} onClose={() => setLogTimeOpened(false)} title={<Text fw={700}>Log Time Manually</Text>} radius="md">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">Log spent hours directly for <strong>{logTimeTask?.title}</strong>.</Text>
          <NumberInput
            label="Hours Spent"
            placeholder="e.g. 1.5"
            min={0.1}
            max={100}
            step={0.5}
            value={logTimeHours}
            onChange={(val) => setLogTimeHours(typeof val === 'number' ? val : 0)}
            onFocus={(e) => e.target.select()}
            withAsterisk
          />
          <TextInput
            label="Description / Work Notes"
            placeholder="What did you work on?"
            value={logTimeDescription}
            onChange={(e) => setLogTimeDescription(e.currentTarget.value)}
          />
          <Button color="blue" onClick={handleSaveManualTime} loading={isLoggingTime} mt="md">
            Save Time Log
          </Button>
        </Stack>
      </Modal>

      {/* Edit Project Modal */}
      <Modal opened={editProjectOpened} onClose={() => setEditProjectOpened(false)} title="Edit Project" radius="md">
        <form onSubmit={editProjectForm.onSubmit(handleUpdateProject)}>
          <Stack gap="md">
            <TextInput label="Project Name" {...editProjectForm.getInputProps('name')} withAsterisk />
            <Textarea label="Description" {...editProjectForm.getInputProps('description')} minRows={3} />
            <Select
              label="Department / Project Type"
              data={['Shopify', 'WordPress', 'Full Stack', 'SEO', 'UI/UX']}
              {...editProjectForm.getInputProps('type')}
            />
            <Select
              label="Status"
              data={[
                { value: ProjectStatus.NEW, label: 'New' },
                { value: ProjectStatus.ACTIVE, label: 'Active' },
                { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
                { value: ProjectStatus.MAINTENANCE, label: 'Maintenance' },
                { value: ProjectStatus.COMPLETED, label: 'Completed' },
              ]}
              {...editProjectForm.getInputProps('status')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={() => setEditProjectOpened(false)}>Cancel</Button>
              <Button type="submit" loading={isUpdatingProject}>Save Changes</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
};

const formatDateDDMMYYYY = (dateStr?: string) => {
  if (!dateStr) return '-';
  const d = parseLocalDateString(dateStr);
  if (!d) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthStr = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthStr}, ${year}`;
};

const MilestoneTableRow = ({
  milestone,
  onDelete,
  canManage = true,
  projectStatus,
}: {
  milestone: any;
  onDelete?: (milestone: any) => void;
  canManage?: boolean;
  projectStatus?: string;
}) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isCompleted = projectStatus === 'completed';
  const canCreateTask = !isCompleted && (user?.role === Role.ADMIN || user?.role === Role.PM || user?.role === Role.TEAM_LEAD || user?.role === Role.TEAM_MEMBER);
  const { data: tasksData } = useGetTasksByMilestoneQuery(milestone._id);
  const tasks = tasksData?.data || [];

  const spentHours = tasks.reduce((sum: number, t: any) => sum + (t.spentHours || 0), 0);
  const progressPercent = Math.min((spentHours / (milestone.estimatedHours || 1)) * 100, 100);

  const effectiveStatus = milestone.status;
  const pId = typeof milestone.project === 'object' ? milestone.project._id : milestone.project;

  return (
    <Table.Tr style={{ backgroundColor: 'white' }}>
      {/* 1. Milestone Title */}
      <Table.Td onClick={() => navigate(`/projects/${pId}/milestones/${milestone._id}`)} style={{ cursor: 'pointer' }}>
        <Text fw={700} size="sm" style={{ color: '#2563eb' }}>{milestone.title}</Text>
      </Table.Td>

      {/* 2. Start Date */}
      <Table.Td onClick={() => navigate(`/projects/${pId}/milestones/${milestone._id}`)} style={{ cursor: 'pointer' }}>
        <Text size="xs" fw={500} c="dimmed">
          {formatDateDisplay(milestone.startDate)}
        </Text>
      </Table.Td>

      {/* 3. End Date */}
      <Table.Td onClick={() => navigate(`/projects/${pId}/milestones/${milestone._id}`)} style={{ cursor: 'pointer' }}>
        <Text size="xs" fw={500} c="dimmed">
          {formatDateDisplay(milestone.endDate)}
        </Text>
      </Table.Td>

      {/* 4. Est. Hours */}
      <Table.Td onClick={() => navigate(`/projects/${pId}/milestones/${milestone._id}`)} style={{ cursor: 'pointer' }}>
        <Text size="sm" fw={600} style={{ color: '#475569' }}>
          {formatHours(milestone.estimatedHours)}
        </Text>
      </Table.Td>

      {/* 5. Active Hours */}
      <Table.Td onClick={() => navigate(`/projects/${pId}/milestones/${milestone._id}`)} style={{ cursor: 'pointer' }}>
        <Text size="sm" fw={600} style={{ color: spentHours > milestone.estimatedHours ? '#dc2626' : '#2563eb' }}>
          {formatHours(spentHours)}
        </Text>
      </Table.Td>

      {/* 6. Status */}
      <Table.Td onClick={() => navigate(`/projects/${pId}/milestones/${milestone._id}`)} style={{ cursor: 'pointer' }}>
        <Badge
          variant="light"
          radius="sm"
          size="sm"
          fw={600}
          color={effectiveStatus === 'completed' ? 'green' : effectiveStatus === 'in_progress' ? 'blue' : 'gray'}
        >
          {effectiveStatus ? effectiveStatus.replace('_', ' ') : 'not started'}
        </Badge>
      </Table.Td>

      {/* 7. Progress */}
      <Table.Td onClick={() => navigate(`/projects/${pId}/milestones/${milestone._id}`)} style={{ minWidth: 140, cursor: 'pointer' }}>
        <Group gap="xs" wrap="nowrap">
          <Text size="xs" fw={700} style={{ width: 32 }} ta="right">
            {Math.round(progressPercent)}%
          </Text>
          <Progress value={progressPercent} color={effectiveStatus === 'completed' ? 'green' : (spentHours > milestone.estimatedHours ? 'red' : 'blue')} size="sm" radius="xl" style={{ flex: 1 }} />
        </Group>
      </Table.Td>

      {/* 8. Actions */}
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        <Group gap={6} justify="flex-end" wrap="nowrap">
          <Tooltip label="View Milestone Details" withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              size="sm"
              onClick={() => navigate(`/projects/${pId}/milestones/${milestone._id}`)}
            >
              <Eye size={16} />
            </ActionIcon>
          </Tooltip>

          {canCreateTask && projectStatus !== 'completed' && (
            <Button
              display='none'
              size="xs"
              variant="light"
              leftSection={<Plus size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/projects/${pId}/tasks/new`);
              }}
            >
              Add Task
            </Button>
          )}

          {canManage && projectStatus !== 'completed' && (
            <>
              <Tooltip label="Edit Milestone" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${pId}/milestones/${milestone._id}/edit`);
                  }}
                >
                  <Edit size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Delete Milestone" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(milestone);
                  }}
                >
                  <Trash size={16} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
};


const ProjectReports = ({ project, milestones }: { project: any; milestones: any[] }) => {
  const { data: tasksData } = useGetAllTasksQuery();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdminOrPM = user?.role === Role.ADMIN || user?.role === Role.PM;

  if (!project) return null;

  const milestoneIds = milestones.map(m => m._id);
  const allTasks = tasksData?.data || [];
  const projectTasks = allTasks.filter((t: any) => {
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
  const hoursPercent = totalEstimated > 0 ? Math.min(Math.round((totalSpent / totalEstimated) * 100), 100) : 0;

  return (
    <Stack gap="xl" style={{ marginTop: '20px' }}>
      <SimpleGrid cols={{ base: 1, md: isAdminOrPM ? 3 : 2 }} spacing="lg">
        {isAdminOrPM && (
          <Card shadow="xs" p="lg" radius="lg" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="xs" fw={700} color="dimmed" tt="uppercase">Financial Progress</Text>
              <DollarSign size={18} color="#10b981" />
            </Group>
            <Text size="lg" fw={800} color="teal">${received.toLocaleString()} Received</Text>
            <Text size="xs" c="dimmed" mt={4}>Of total ${budget.toLocaleString()} amount</Text>
            <Progress value={paidPercent} color="teal" size="sm" mt="md" radius="xl" />
          </Card>
        )}

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
          <Text size="lg" fw={800} color="orange">{formatHours(totalSpent)} Spent</Text>
          <Text size="xs" c="dimmed" mt={4}>Of total {formatHours(totalEstimated)} estimated</Text>
          <Progress value={Math.min(hoursPercent, 100)} color={hoursPercent > 100 ? 'red' : 'orange'} size="sm" mt="md" radius="xl" />
        </Card>
      </SimpleGrid>

      {isAdminOrPM && (
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
      )}

      {/* Milestone Performance & Results Summary Table */}
      <Card shadow="xs" p="xl" radius="lg" withBorder>
        <Title order={4} mb="md">Milestones Performance & Results</Title>
        {milestones.length > 0 ? (
          <Table.ScrollContainer minWidth={700}>
            <Table verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead bg="#F8FAFC">
                <Table.Tr>
                  <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>MILESTONE</Table.Th>
                  <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>STATUS</Table.Th>
                  <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>TASKS DONE</Table.Th>
                  <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>EST. HOURS</Table.Th>
                  <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>ACTIVE HOURS</Table.Th>
                  <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>PROGRESS</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {milestones.map((m) => {
                  const mTasks = allTasks.filter((t: any) => {
                    const id = typeof t.milestone === 'object' ? t.milestone?._id : t.milestone;
                    return id === m._id;
                  });
                  const mDone = mTasks.filter((t: any) => t.status === 'completed').length;
                  const mSpent = mTasks.reduce((sum: number, t: any) => sum + (t.spentHours || 0), 0);
                  const mEst = m.estimatedHours || 0;
                  const mProgress = mEst > 0 ? Math.min(Math.round((mSpent / mEst) * 100), 100) : 0;

                  return (
                    <Table.Tr key={m._id}>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                        <Text fw={700} size="sm">{m.title}</Text>
                        <Text size="xs" c="dimmed">
                          {formatDateDDMMYYYY(m.startDate)} to {formatDateDDMMYYYY(m.endDate)}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                        <Badge variant="light" size="sm" color={m.status === 'completed' ? 'green' : m.status === 'in_progress' ? 'blue' : 'gray'}>
                          {m.status ? m.status.replace('_', ' ') : 'not started'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                        <Text size="sm" fw={600}>{mDone} / {mTasks.length} done</Text>
                      </Table.Td>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                        <Text size="sm" fw={600}>{formatHours(mEst)}</Text>
                      </Table.Td>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                        <Text size="sm" fw={600} style={{ color: mSpent > mEst ? '#dc2626' : '#2563eb' }}>
                          {formatHours(mSpent)}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ minWidth: 120 }}>
                        <Group gap="xs" wrap="nowrap">
                          <Text size="xs" fw={700} w={30} ta="right">{mProgress}%</Text>
                          <Progress value={mProgress} color={mSpent > mEst ? 'red' : 'blue'} size="sm" radius="xl" style={{ flex: 1 }} />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Text size="sm" c="dimmed">No milestones available for this project.</Text>
        )}
      </Card>
    </Stack>
  );
};

const ProjectTasks = ({
  projectId: _projectId,
  milestones,
  projectStatus,
  selectedMilestoneFilter,
  onMilestoneFilterChange,
  onEditTask,
  onDeleteTask,
  onLogTimeTask,
  onUpdateTaskStatus,
}: {
  projectId: string;
  milestones: any[];
  projectStatus?: string;
  selectedMilestoneFilter?: string | null;
  onMilestoneFilterChange?: (id: string | null) => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (task: any) => void;
  onLogTimeTask?: (task: any) => void;
  onUpdateTaskStatus?: (taskId: string, status: string) => void;
}) => {
  const { data: tasksData, isLoading } = useGetAllTasksQuery({ limit: 1000 });
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const [startTimer] = useStartTimerMutation();
  const [stopTimer] = useStopTimerMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [milestoneFilter, setMilestoneFilter] = useState<string | null>(selectedMilestoneFilter || null);
  const [liveElapsed, setLiveElapsed] = useState(0);

  const { page, limit, setPage, setLimit } = usePagination();

  useEffect(() => {
    setMilestoneFilter(selectedMilestoneFilter || null);
  }, [selectedMilestoneFilter]);

  const handleMilestoneFilterChange = (val: string | null) => {
    setMilestoneFilter(val);
    onMilestoneFilterChange?.(val);
  };

  const navigate = useNavigate();

  const activeTimer = activeTimerData?.data;
  const allTasks = tasksData?.data || [];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeTimer?.startTime) {
      const startMs = new Date(activeTimer.startTime).getTime();
      setLiveElapsed(Math.floor((Date.now() - startMs) / 1000));
      interval = setInterval(() => {
        setLiveElapsed(Math.floor((Date.now() - startMs) / 1000));
      }, 1000);
    } else {
      setLiveElapsed(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeTimer?.startTime]);

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

  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice((page - 1) * limit, page * limit);
  }, [filteredTasks, page, limit]);
  const tasksMeta = { page, limit, total: filteredTasks.length, totalPages: Math.ceil(filteredTasks.length / limit) || 1 };

  const handleStartTimer = async (taskId: string) => {
    try { await startTimer({ taskId }).unwrap(); } catch (e) { console.error(e); }
  };

  const handleStopTimer = async () => {
    try { await stopTimer({}).unwrap(); } catch (e) { console.error(e); }
  };

  // Auto-stop timer when active task hits 100% progress
  useEffect(() => {
    if (!activeTimer) return;
    const activeTask = allTasks.find((t: any) =>
      activeTimer.task === t._id || (activeTimer.task as any)?._id === t._id
    );
    if (!activeTask) return;
    const totalSpent = (activeTask.spentHours || 0) + liveElapsed / 3600;
    if (totalSpent >= activeTask.estimatedHours) {
      handleStopTimer();
    }
  }, [liveElapsed]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'gray';
      case 'in_progress': return 'blue';
      case 'in_review': return 'orange';
      case 'completed': return 'green';
      default: return 'gray';
    }
  };

  const { user } = useSelector((state: RootState) => state.auth);
  const isCompleted = projectStatus === 'completed';
  const canCreateTask = !isCompleted && (user?.role === Role.ADMIN || user?.role === Role.PM || user?.role === Role.TEAM_LEAD || user?.role === Role.TEAM_MEMBER);

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Tasks</Title>
        {canCreateTask && (
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => navigate(`/projects/${_projectId}/tasks/new`)}
            radius="md"
          >
            New Task
          </Button>
        )}
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
          onChange={handleMilestoneFilterChange}
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

      {milestoneFilter && (
        <Group justify="space-between" p="xs" mb="md" style={{ backgroundColor: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
          <Group gap="xs">
            <Text size="xs" fw={600} color="#1e40af">Showing tasks for Milestone:</Text>
            <Badge color="blue" variant="filled" radius="sm">
              {milestones.find(m => m._id === milestoneFilter)?.title || 'Selected Milestone'}
            </Badge>
          </Group>
          <Button size="xs" variant="subtle" color="blue" onClick={() => handleMilestoneFilterChange(null)}>
            Show All Project Tasks
          </Button>
        </Group>
      )}

      <PaginatedTable meta={tasksMeta} onPageChange={setPage} onLimitChange={setLimit} isLoading={isLoading}>
        <Table verticalSpacing="sm">
          <Table.Thead>
          <Table.Tr>
            <Table.Th>Task</Table.Th>
            <Table.Th>Milestone</Table.Th>
            <Table.Th>Department</Table.Th>
            <Table.Th>Assigned To</Table.Th>
            <Table.Th>Est. Time</Table.Th>
            <Table.Th>Active Hours</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Progress</Table.Th>
            <Table.Th w={150}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginatedTasks.map((task) => {
            const milestone = typeof task.milestone === 'object' ? task.milestone : null;
            const assignee = typeof task.assignedTo === 'object' ? task.assignedTo : null;
            const isTimerActive = (activeTimer?.task === task._id || (activeTimer?.task as any)?._id === task._id) && task.status !== 'completed';
            const bonusHours = isTimerActive ? liveElapsed / 3600 : 0;
            const rawSpent = (task.spentHours || 0) + bonusHours;
            const liveSpent = Math.min(rawSpent, task.estimatedHours * 1.5); // allow slight overflow display
            const liveProgress = Math.min((rawSpent / (task.estimatedHours || 1)) * 100, 100);
            const isMaxed = (task.spentHours || 0) >= task.estimatedHours;

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
                  <Text size="sm" fw={600}>{formatHours(task.estimatedHours)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600} style={{ color: rawSpent > task.estimatedHours ? '#dc2626' : '#2563eb' }}>
                    {formatHours(rawSpent)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={140} position="bottom-start">
                    <Menu.Target>
                      <Badge
                        color={getStatusColor(task.status)}
                        variant="light"
                        size="sm"
                        style={{ cursor: 'pointer' }}
                      >
                        {task.status?.replace('_', ' ') || 'assigned'} ▾
                      </Badge>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Label>Change Status</Menu.Label>
                      <Menu.Item onClick={() => onUpdateTaskStatus?.(task._id, 'assigned')}>Assigned</Menu.Item>
                      <Menu.Item onClick={() => onUpdateTaskStatus?.(task._id, 'in_progress')}>In Progress</Menu.Item>
                      <Menu.Item onClick={() => onUpdateTaskStatus?.(task._id, 'in_review')}>In Review</Menu.Item>
                      <Menu.Item onClick={() => onUpdateTaskStatus?.(task._id, 'completed')}>Completed</Menu.Item>
                      <Menu.Item onClick={() => onUpdateTaskStatus?.(task._id, 'on_hold')}>On Hold</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
                <Table.Td>
                  <Tooltip label={`${liveSpent.toFixed(2)}h / ${formatHours(task.estimatedHours)} (${Math.round(liveProgress)}%)`}>
                    <Progress value={liveProgress} size="sm" color={task.status === 'completed' ? 'green' : 'blue'} animated={isTimerActive && task.status !== 'completed'} />
                  </Tooltip>
                </Table.Td>
                <Table.Td ta="right">
                  <Group gap={6} justify="flex-end" wrap="nowrap">
                    {isTimerActive ? (
                      <Button size="xs" color="red" variant="light" leftSection={<Square size={14} />} onClick={handleStopTimer}>Stop</Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<Play size={14} />}
                        onClick={() => handleStartTimer(task._id)}
                        disabled={!!activeTimer || task.status === 'completed' || isMaxed}
                        title={isMaxed ? 'Estimated hours reached' : ''}
                      >Start</Button>
                    )}

                    {onLogTimeTask && task.status === 'in_review' && (
                      <Tooltip label="Log Time Manually" withArrow>
                        <ActionIcon variant="light" color="indigo" size="sm" onClick={() => onLogTimeTask(task)}>
                          <Clock size={15} />
                        </ActionIcon>
                      </Tooltip>
                    )}

                    {onEditTask && (
                      <Tooltip label="Edit Task" withArrow>
                        <ActionIcon variant="light" color="blue" size="sm" onClick={() => onEditTask(task)}>
                          <Edit size={15} />
                        </ActionIcon>
                      </Tooltip>
                    )}

                    {onDeleteTask && (
                      <Tooltip label="Delete Task" withArrow>
                        <ActionIcon variant="light" color="red" size="sm" onClick={() => onDeleteTask(task)}>
                          <Trash size={15} />
                        </ActionIcon>
                      </Tooltip>
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
      </PaginatedTable>
    </Card>
  );
};

const normalizeFrontendDept = (dept: string) => {
  if (!dept) return '';
  const d = dept.toLowerCase().replace(/\s+/g, '');
  if (d === 'ui/ux' || d === 'design') return 'design';
  if (d === 'fullstack' || d === 'development') return 'fullstack';
  return d;
};

const ProjectTeam = ({ projectId, projectData }: { projectId: string; projectData: any }) => {
  const { data: usersData } = useGetUsersQuery({ limit: 1000 });
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const isAdminOrPM = currentUser?.role === Role.ADMIN || currentUser?.role === Role.PM;
  const [modalOpened, setModalOpened] = useState(false);
  const { page, limit, setPage, setLimit } = usePagination();

  const team = projectData?.team || [];
  const allUsers = usersData?.data || [];

  const projectDept = normalizeFrontendDept(projectData?.type || '');

  const assignableUsers = allUsers.filter(u => {
    if (u.role !== Role.TEAM_LEAD && u.role !== Role.TEAM_MEMBER) return false;
    if (!projectDept) return true;
    const userDept = normalizeFrontendDept(u.department || '');
    return userDept === projectDept;
  });

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

      <PaginatedTable meta={{ page, limit, total: team.length, totalPages: Math.ceil(team.length / limit) || 1 }} onPageChange={setPage} onLimitChange={setLimit}>
      <Table verticalSpacing="sm" striped>
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
          {team.slice((page - 1) * limit, page * limit).map((member: any) => (
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
                  {member.department ? member.department.toUpperCase() : 'N/A'}
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
      </PaginatedTable>

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
  const { user } = useSelector((state: RootState) => state.auth);
  const isGlobalManager = user?.role === Role.ADMIN || user?.role === Role.PM;

  const { data: releasesData, isLoading } = useGetReleasesQuery({ projectId });
  const [createRelease, { isLoading: isCreating }] = useCreateReleaseMutation();
  const [updateRelease, { isLoading: isUpdating }] = useUpdateReleaseMutation();
  const [deleteRelease] = useDeleteReleaseMutation();
  const { data: usersData } = useGetUsersQuery({ limit: 1000 });
  const users = usersData?.data || [];

  const [releaseModalOpened, setReleaseModalOpened] = useState(false);
  const [editingRelease, setEditingRelease] = useState<any>(null);

  const releases = releasesData?.data || [];
  const { page, limit, setPage, setLimit } = usePagination();

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
        {isGlobalManager && (
          <Button leftSection={<Plus size={16} />} onClick={openCreateModal}>Add Release</Button>
        )}
      </Group>

      <PaginatedTable meta={{ page, limit, total: releases.length, totalPages: Math.ceil(releases.length / limit) || 1 }} onPageChange={setPage} onLimitChange={setLimit} isLoading={isLoading}>
      <Table verticalSpacing="sm" striped>
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
          {releases.slice((page - 1) * limit, page * limit).map((release) => {
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
                  <Text size="sm">{formatDateDisplay(release.releaseDate)}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={release.status === 'released' ? 'green' : release.status === 'in_review' ? 'orange' : release.status === 'scheduled' ? 'blue' : 'gray'}
                    variant="light"
                  >
                    {release.status === 'released' ? 'Released' : release.status === 'in_review' ? 'In Review' : 'Scheduled'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {isGlobalManager && (
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(release)} title="Edit">
                        <Edit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteRelease(release._id, release.details)} title="Delete">
                        <Trash size={16} />
                      </ActionIcon>
                    </Group>
                  )}
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
      </PaginatedTable>

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
              placeholder="DD Month, YYYY"
              valueFormat="DD MMMM, YYYY"
              leftSection={<Calendar size={16} color="#64748b" />}
              value={parseLocalDateString(releaseForm.values.releaseDate)}
              onChange={(val) => releaseForm.setFieldValue('releaseDate', formatLocalDateString(val))}
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
  const { page, limit, setPage, setLimit } = usePagination();

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

      <PaginatedTable meta={{ page, limit, total: invoices.length, totalPages: Math.ceil(invoices.length / limit) || 1 }} onPageChange={setPage} onLimitChange={setLimit} isLoading={isLoading}>
      <Table verticalSpacing="sm" striped>
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
          {invoices.slice((page - 1) * limit, page * limit).map((inv) => (
            <Table.Tr key={inv._id}>
              <Table.Td fw={600}>{inv.invoiceNumber}</Table.Td>
              <Table.Td>{formatDateDisplay(inv.issueDate)}</Table.Td>
              <Table.Td>{formatDateDisplay(inv.dueDate)}</Table.Td>
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
      </PaginatedTable>

      {/* Save Invoice Modal */}
      <Modal opened={invoiceModalOpened} onClose={() => setInvoiceModalOpened(false)} title={editingInvoice ? "Edit Invoice" : "Create Invoice"} radius="md">
        <form onSubmit={invoiceForm.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput label="Invoice Number" {...invoiceForm.getInputProps('invoiceNumber')} withAsterisk />
            <Group grow>
              <DatePickerInput
                label="Issue Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                leftSection={<Calendar size={16} color="#64748b" />}
                value={parseLocalDateString(invoiceForm.values.issueDate)}
                onChange={(val) => invoiceForm.setFieldValue('issueDate', formatLocalDateString(val))}
                clearable
                withAsterisk
                radius="md"
              />
              <DatePickerInput
                label="Due Date"
                placeholder="DD Month, YYYY"
                valueFormat="DD MMMM, YYYY"
                leftSection={<Calendar size={16} color="#64748b" />}
                value={parseLocalDateString(invoiceForm.values.dueDate)}
                onChange={(val) => invoiceForm.setFieldValue('dueDate', formatLocalDateString(val))}
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
            placeholder="DD Month, YYYY"
            valueFormat="DD MMMM, YYYY"
            leftSection={<Calendar size={16} color="#64748b" />}
            value={parseLocalDateString(paymentDate)}
            onChange={(val) => setPaymentDate(formatLocalDateString(val))}
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
