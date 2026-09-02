import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useGetAllTasksQuery } from './task.slice';
import { useGetUsersQuery } from '../users/user.slice';
import { Container, Title, Text, Group, Select, Loader, Center, TextInput } from '@mantine/core';
import { Search } from 'lucide-react';
import { Role, DEPARTMENT_OPTIONS } from '../../types';
import { TaskTable } from './TaskTable';
import { PaginatedTable, usePagination } from '../../components/common/PaginatedTable';

export const TeamTasks = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery({ limit: 1000 });
  
  const { page, limit, setPage, setLimit, resetPage } = usePagination();
  const isGlobalManager = currentUser?.role === Role.ADMIN || currentUser?.role === Role.PM;
  
  const { data: tasksData, isLoading: isTasksLoading } = useGetAllTasksQuery({
    page,
    limit,
    search: searchQuery,
    department: isGlobalManager && selectedFilter ? selectedFilter : undefined,
    userId: !isGlobalManager && selectedFilter ? selectedFilter : undefined
  });

  const tasks = tasksData?.data || [];
  const meta = tasksData?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 };

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
      return (usersData?.data || []).filter((u: any) => u.role === Role.TEAM_LEAD || u.role === Role.TEAM_MEMBER);
    }
    const myDept = getNormalizedDepartment(currentUser?.department);
    return (usersData?.data || []).filter((u: any) => {
      if (u.role !== Role.TEAM_LEAD && u.role !== Role.TEAM_MEMBER) return false;
      const memberDept = getNormalizedDepartment(u.department);
      if (myDept) {
        return memberDept === myDept;
      }
      return false;
    });
  }, [usersData, isGlobalManager, currentUser]);

  const filterMemberOptions = useMemo(() => {
    return teamMembers.map((m: any) => ({ value: m._id, label: m.name }));
  }, [teamMembers]);

  const handleFilterChange = (val: string | null) => {
    setSelectedFilter(val);
    resetPage();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.currentTarget.value);
    resetPage();
  };

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
            onChange={handleFilterChange}
            clearable
            searchable={!isGlobalManager}
            style={{ width: 200 }}
            radius="md"
          />
          <TextInput
            placeholder="Search tasks..."
            leftSection={<Search size={16} color="#94a3b8" />}
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ width: 240 }}
            radius="md"
          />
        </Group>
      </Group>
      <PaginatedTable meta={meta} onPageChange={setPage} onLimitChange={setLimit} isLoading={isTasksLoading}>
        <TaskTable tasks={tasks} />
      </PaginatedTable>
    </Container>
  );
};
