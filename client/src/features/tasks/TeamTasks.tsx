import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useGetAllTasksQuery, useUpdateTaskMutation } from './task.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { Container, Title, Text, Group, Select, Loader, Center, Stack, TextInput } from '@mantine/core';
import { Search } from 'lucide-react';
import { Role, DEPARTMENT_OPTIONS } from '../../types';
import { TaskTable } from './TaskTable';

export const TeamTasks = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { data: tasksData, isLoading: isTasksLoading } = useGetAllTasksQuery();
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery();
  const [updateTask] = useUpdateTaskMutation();

  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (d.includes('design') || d.includes('ui') || d.includes('ux')) return 'design';
    if (d.includes('sales')) return 'sales';
    if (d.includes('hr')) return 'hr';
    return d;
  };

  const teamMembers = useMemo(() => {
    if (isGlobalManager) {
      return users.filter((u: any) => u.role === Role.TEAM_LEAD || u.role === Role.TEAM_MEMBER);
    }
    const myDept = getNormalizedDepartment(currentUser?.department);
    return users.filter((u: any) => {
      if (u.role !== Role.TEAM_LEAD && u.role !== Role.TEAM_MEMBER) return false;
      const memberDept = getNormalizedDepartment(u.department);
      if (myDept) {
        return memberDept === myDept;
      }
      return false;
    });
  }, [users, isGlobalManager, currentUser]);

  const teamOptions = useMemo(() => {
    return teamMembers.map((u: any) => ({
      value: u._id,
      label: u.name,
      fullName: u.name,
      department: u.department,
      avatarUrl: u.avatarUrl
    }));
  }, [teamMembers]);

  const filterMemberOptions = useMemo(() => {
    return teamMembers.map((m: any) => ({ value: m._id, label: m.name }));
  }, [teamMembers]);

  const getTaskDepartment = (task: any) => {
    const taskDept = getNormalizedDepartment(task.department);
    if (taskDept) return taskDept;
    
    const projType = getNormalizedDepartment(task.milestone?.project?.type);
    if (projType) return projType;

    const assignedDept = getNormalizedDepartment(task.assignedTo?.department);
    if (assignedDept) return assignedDept;

    return 'other';
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    
    // Sort logic to bubble Unassigned to the top
    result.sort((a, b) => {
      if (!a.assignedTo && b.assignedTo) return -1;
      if (a.assignedTo && !b.assignedTo) return 1;
      return 0;
    });

    if (selectedFilter) {
      if (isGlobalManager) {
        result = result.filter(t => getTaskDepartment(t) === selectedFilter);
      } else {
        result = result.filter(t => {
          const assignedId = typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo;
          return assignedId === selectedFilter;
        });
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => {
        const anyT = t as any;
        const title = anyT.title?.toLowerCase() || '';
        const description = anyT.description?.toLowerCase() || '';
        const project = anyT.milestone?.project?.name?.toLowerCase() || '';
        const assignee = (typeof anyT.assignedTo === 'object' ? anyT.assignedTo?.name : '')?.toLowerCase() || '';
        const status = anyT.status?.replace('_', ' ').toLowerCase() || '';
        const estHours = anyT.estimatedHours?.toString() || '';
        
        return title.includes(q) || description.includes(q) || project.includes(q) || assignee.includes(q) || status.includes(q) || estHours.includes(q);
      });
    }

    return result;
  }, [tasks, selectedFilter, searchQuery, isGlobalManager]);

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
        <Group gap="sm">
          <Select
            placeholder={isGlobalManager ? 'Filter by Department' : 'Filter by Team Member'}
            data={isGlobalManager ? DEPARTMENT_OPTIONS : filterMemberOptions}
            value={selectedFilter}
            onChange={setSelectedFilter}
            clearable
            searchable={!isGlobalManager}
            style={{ width: 200 }}
            radius="md"
          />
          <TextInput
            placeholder="Search tasks..."
            leftSection={<Search size={16} color="#94a3b8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ width: 240 }}
            radius="md"
          />
        </Group>
      </Group>

      {isGlobalManager ? (
        <Stack gap="xl">
          {DEPARTMENT_OPTIONS.map((dept) => {
            const deptTasks = filteredTasks.filter(t => getTaskDepartment(t) === dept.value);
            if (deptTasks.length === 0) return null;
            
            const currentAssigneeIds = new Set(deptTasks.map((t: any) => typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo).filter(Boolean));
            const filteredTeamOptions = teamOptions.filter((opt: any) => getNormalizedDepartment(opt.department) === dept.value || currentAssigneeIds.has(opt.value));
            
            return (
              <div key={dept.value}>
                <Title order={4} mb="md" style={{ color: '#334155' }}>{dept.label} Tasks ({deptTasks.length})</Title>
                <TaskTable 
                  tasks={deptTasks} 
                  teamOptions={filteredTeamOptions} 
                  isGlobalManager={isGlobalManager} 
                  handleAssignTask={handleAssignTask} 
                />
              </div>
            );
          })}
          
          {/* Other/Uncategorized Tasks */}
          {(() => {
            const otherTasks = filteredTasks.filter(t => {
              const dept = getTaskDepartment(t);
              return !DEPARTMENT_OPTIONS.find(d => d.value === dept);
            });
            
            if (otherTasks.length === 0) return null;
            
            return (
              <div key="other">
                <Title order={4} mb="md" style={{ color: '#334155' }}>Other Tasks ({otherTasks.length})</Title>
                <TaskTable 
                  tasks={otherTasks} 
                  teamOptions={teamOptions} 
                  isGlobalManager={isGlobalManager} 
                  handleAssignTask={handleAssignTask} 
                />
              </div>
            );
          })()}
        </Stack>
      ) : (
        <Stack gap="xl">
          <div>
            <Title order={4} mb="md" style={{ color: '#334155' }}>All Tasks ({filteredTasks.length})</Title>
            <TaskTable 
              tasks={filteredTasks} 
              teamOptions={teamOptions} 
              isGlobalManager={isGlobalManager} 
              handleAssignTask={handleAssignTask} 
            />
          </div>
        </Stack>
      )}
    </Container>
  );
};
