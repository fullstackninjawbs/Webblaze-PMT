import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useGetAllTasksQuery } from './task.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { Container, Title, Text, Group, Select, Loader, Center, Stack, TextInput } from '@mantine/core';
import { Search } from 'lucide-react';
import { Role, DEPARTMENT_OPTIONS } from '../../types';
import { TaskTable } from './TaskTable';

export const TeamTasks = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { data: tasksData, isLoading: isTasksLoading } = useGetAllTasksQuery();
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery();
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
    // Only show tasks that are assigned to a team member AND belong to a valid project
    let result = tasks.filter((t: any) => !!t.assignedTo && !!t.milestone?.project?._id);
    
    // Sort alphabetically by assignee name
    result.sort((a: any, b: any) => {
      const nameA = (typeof a.assignedTo === 'object' ? a.assignedTo?.name : '') || '';
      const nameB = (typeof b.assignedTo === 'object' ? b.assignedTo?.name : '') || '';
      return nameA.localeCompare(nameB);
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


  if (isTasksLoading || isUsersLoading) return <Center h={400}><Loader color="blue" /></Center>;

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <Group justify="space-between" mb="xl" style={{ marginBottom: '28px' }}>
        <div>
          <Group align="center" gap="sm">
            <Title order={1} style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Team Todos
            </Title>
          </Group>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            Manage and assign todos across all your projects.
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
            
            return (
              <div key={dept.value}>
                <Title order={4} mb="md" style={{ color: '#334155' }}>{dept.label} Todos ({deptTasks.length})</Title>
                <TaskTable tasks={deptTasks} />
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
                <Title order={4} mb="md" style={{ color: '#334155' }}>Other Todos ({otherTasks.length})</Title>
                <TaskTable tasks={otherTasks} />
              </div>
            );
          })()}
        </Stack>
      ) : (
        <Stack gap="xl">
          <div>
            <Title order={4} mb="md" style={{ color: '#334155' }}>All Todos ({filteredTasks.length})</Title>
            <TaskTable tasks={filteredTasks} />
          </div>
        </Stack>
      )}
    </Container>
  );
};
