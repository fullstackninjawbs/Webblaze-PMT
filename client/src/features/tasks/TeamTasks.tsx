import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useGetAllTasksQuery, useUpdateTaskMutation } from './task.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { Container, Title, Card, Text, Group, Badge, Select, Loader, Center, Grid, Stack, Tooltip } from '@mantine/core';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Role } from '../../types';

export const TeamTasks = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { data: tasksData, isLoading: isTasksLoading } = useGetAllTasksQuery();
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery();
  const [updateTask] = useUpdateTaskMutation();

  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const tasks = tasksData?.data || [];
  const users = usersData?.data || [];

  const isGlobalManager = currentUser?.role === Role.ADMIN || currentUser?.role === Role.PM;

  const getNormalizedDepartment = (dept?: string): string => {
    if (!dept) return '';
    const d = dept.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (d.includes('full')) return 'fullstack';
    if (d.includes('shop')) return 'shopify';
    if (d.includes('word')) return 'wordpress';
    if (d.includes('seo')) return 'seo';
    if (d.includes('design') || d.includes('ui') || d.includes('ux')) return 'ui_ux';
    if (d.includes('sales')) return 'sales';
    if (d.includes('hr')) return 'hr';
    return d;
  };

  const teamMembers = useMemo(() => {
    if (isGlobalManager) {
      return users.filter((u) => u.role === Role.TEAM_LEAD || u.role === Role.TEAM_MEMBER);
    }

    const myDept = getNormalizedDepartment(currentUser?.department);
    return users.filter((u) => {
      if (u.role !== Role.TEAM_LEAD && u.role !== Role.TEAM_MEMBER) return false;
      const memberDept = getNormalizedDepartment(u.department);
      if (myDept) {
        return memberDept === myDept;
      }
      return false;
    });
  }, [users, isGlobalManager, currentUser]);

  const teamOptions = useMemo(() => {
    return teamMembers.map((u) => {
      return {
        value: u._id,
        label: u.name,
        fullName: u.name,
        department: u.department,
      };
    });
  }, [teamMembers]);

  const filterMemberOptions = useMemo(() => {
    return teamMembers.map((m) => ({ value: m._id, label: m.name }));
  }, [teamMembers]);

  const matchesDept = (task: any, dept: string) => {
    const target = dept.toLowerCase().replace(/[^a-z0-9]/g, '');
    const taskDept = task.department?.toLowerCase() || '';
    const projType = task.milestone?.project?.type?.toLowerCase() || '';
    const assignedDept = task.assignedTo?.department?.toLowerCase() || '';
    return taskDept.includes(target) || projType.includes(target) || assignedDept.includes(target);
  };

  const unassignedTasks = useMemo(() => {
    let result = tasks.filter(t => !t.assignedTo);
    if (selectedFilter && isGlobalManager) {
      result = result.filter(t => matchesDept(t, selectedFilter));
    }
    return result;
  }, [tasks, selectedFilter, isGlobalManager]);

  const assignedTasks = useMemo(() => {
    let result = tasks.filter(t => t.assignedTo);
    if (selectedFilter) {
      if (isGlobalManager) {
        result = result.filter(t => matchesDept(t, selectedFilter));
      } else {
        result = result.filter(t => {
          const assignedId = typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo;
          return assignedId === selectedFilter;
        });
      }
    }
    return result;
  }, [tasks, selectedFilter, isGlobalManager]);

  const handleAssignTask = async (taskId: string, userId: string | null) => {
    try {
      await updateTask({ _id: taskId, assignedTo: userId || undefined }).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  if (isTasksLoading || isUsersLoading) return <Center h={400}><Loader color="blue" /></Center>;

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <Group justify="space-between" mb="xl" style={{ marginBottom: '28px' }}>
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
            Team Tasks
          </Title>
          <Text
            size="sm"
            mt={4}
            style={{ color: '#64748b', letterSpacing: '-0.01em' }}
          >
            Manage and assign tasks across all your projects.
          </Text>
        </div>
        <Select
          placeholder={isGlobalManager ? 'Filter by Department' : 'Filter by Team Member'}
          data={isGlobalManager ? ['Shopify', 'WordPress', 'Full Stack', 'SEO', 'UI/UX'] : filterMemberOptions}
          value={selectedFilter}
          onChange={setSelectedFilter}
          clearable
          searchable={!isGlobalManager}
          style={{ width: 220 }}
          radius="md"
        />
      </Group>

      <Grid gutter="xl">
        {/* Unassigned Tasks */}
        <Grid.Col span={6}>
          <Title order={4} mb="md">Unassigned ({unassignedTasks.length})</Title>
          <Stack gap="md">
            {unassignedTasks.length > 0 ? (
              unassignedTasks.map((task: any) => (
                <Card key={task._id} shadow="sm" p="md" radius="md" withBorder style={{ overflow: 'visible' }}>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600}>{task.title}</Text>
                    <Badge color="gray" variant="light">Unassigned</Badge>
                  </Group>
                  <Text size="sm" color="dimmed" mb="md" lineClamp={2}>
                    {task.description || 'No description provided.'}
                  </Text>
                  
                  <Group justify="space-between" align="flex-end">
                    <div>
                      <Text size="xs" color="dimmed">Project</Text>
                      <Text size="sm" fw={500}>{task.milestone?.project?.name || 'Unknown'}</Text>
                    </div>
                    <div>
                      <Text size="xs" color="dimmed">Est. Hours</Text>
                      <Text size="sm" fw={500}>{task.estimatedHours}h</Text>
                    </div>
                    <Select
                      placeholder="Assign to..."
                      data={teamOptions}
                      searchable
                      size="xs"
                      w={190}
                      radius="md"
                      value={null}
                      onChange={(val) => handleAssignTask(task._id, val)}
                      comboboxProps={{ width: 260, withinPortal: true, zIndex: 1000, shadow: 'md' }}
                      renderOption={({ option }) => {
                        const opt = teamOptions.find((o) => o.value === option.value);
                        return (
                          <Group justify="space-between" wrap="nowrap" w="100%" gap="xs" style={{ padding: '2px 4px' }}>
                            <Text size="xs" fw={600} style={{ color: '#0f172a' }}>
                              {opt?.fullName || option.label}
                            </Text>
                            {isGlobalManager && opt?.department && (
                              <Badge size="xs" variant="light" color="blue" radius="sm">
                                {opt.department.toUpperCase()}
                              </Badge>
                            )}
                          </Group>
                        );
                      }}
                    />
                  </Group>
                </Card>
              ))
            ) : (
              <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                <Text color="dimmed">No unassigned tasks.</Text>
              </Card>
            )}
          </Stack>
        </Grid.Col>

        {/* Assigned Tasks */}
        <Grid.Col span={6}>
          <Title order={4} mb="md">Assigned ({assignedTasks.length})</Title>
          <Stack gap="md">
            {assignedTasks.length > 0 ? (
              assignedTasks.map((task: any) => (
                <Card key={task._id} shadow="sm" p="md" radius="md" withBorder style={{ overflow: 'visible' }}>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600}>{task.title}</Text>
                    <Badge color={task.status === 'completed' ? 'green' : 'blue'} variant="light">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </Group>
                  <Text size="sm" color="dimmed" mb="md" lineClamp={2}>
                    {task.description || 'No description provided.'}
                  </Text>
                  
                  <Group justify="space-between" align="flex-end">
                    <div>
                      <Text size="xs" color="dimmed">Project</Text>
                      <Text size="sm" fw={500}>{task.milestone?.project?.name || 'Unknown'}</Text>
                    </div>
                    
                    <Group gap="xs">
                      <Text size="xs" color="dimmed">Assigned to</Text>
                      <Tooltip 
                        label={
                          <div>
                            <Text size="sm" fw={500}>{task.assignedTo.name}</Text>
                            <Text size="xs">{task.assignedTo.role.replace('_', ' ')}</Text>
                            <Text size="xs" mt={4} color="gray">Workload: Normal</Text>
                          </div>
                        } 
                        withArrow 
                        position="top"
                      >
                        <UserAvatar name={task.assignedTo.name} avatarUrl={task.assignedTo.avatarUrl} size="sm" />
                      </Tooltip>
                    </Group>

                    <Select
                      placeholder="Reassign"
                      data={teamOptions}
                      searchable
                      size="xs"
                      w={190}
                      radius="md"
                      value={task.assignedTo?._id || task.assignedTo}
                      onChange={(val) => handleAssignTask(task._id, val)}
                      comboboxProps={{ width: 260, withinPortal: true, zIndex: 1000, shadow: 'md' }}
                      renderOption={({ option }) => {
                        const opt = teamOptions.find((o) => o.value === option.value);
                        return (
                          <Group justify="space-between" wrap="nowrap" w="100%" gap="xs" style={{ padding: '2px 4px' }}>
                            <Text size="xs" fw={600} style={{ color: '#0f172a' }}>
                              {opt?.fullName || option.label}
                            </Text>
                            {isGlobalManager && opt?.department && (
                              <Badge size="xs" variant="light" color="blue" radius="sm">
                                {opt.department.toUpperCase()}
                              </Badge>
                            )}
                          </Group>
                        );
                      }}
                    />
                  </Group>
                </Card>
              ))
            ) : (
              <Card withBorder p="xl" ta="center" radius="md" bg="#F9FAFB">
                <Text color="dimmed">No assigned tasks.</Text>
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
};
