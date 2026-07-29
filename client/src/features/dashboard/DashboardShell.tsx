import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Title, Text, Group, TextInput, Badge, SimpleGrid, Card } from '@mantine/core';
import { Search, CheckCircle, CheckSquare, Activity, Clock } from 'lucide-react';
import { Role } from '../../types';

import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetTasksByUserQuery, useGetAllTasksQuery } from '../tasks/task.slice';
import { useGetTodosQuery } from '../todos/todo.slice';

import { ProjectSummaryCards } from './ProjectSummaryCards';
import { TeamTodoOverview } from './TeamTodoOverview';
import { ReleaseSheet } from './ReleaseSheet';
import { TeamTimeTrackingPanel } from './TeamTimeTrackingPanel';

export const DashboardShell: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const formattedDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

  const { data: projectsData } = useGetProjectsQuery();
  const { data: tasksData } = useGetTasksByUserQuery(user?._id || '', { skip: !user?._id });
  const { data: allTasksData } = useGetAllTasksQuery(undefined, { skip: user?.role === Role.TEAM_MEMBER });
  const { data: todosData } = useGetTodosQuery();

  const [searchQuery, setSearchQuery] = useState('');

  const projects = projectsData?.data || [];
  const dbTodos = todosData?.data || [];
  const dbTasks = tasksData?.data || [];

  const openTasksCount = dbTasks.filter(t => t.status !== 'completed').length;
  const myTodosCount = dbTodos.filter(t => (typeof t.user === 'object' ? t.user._id : t.user) === user?._id && t.status !== 'done').length;

  const filteredProjects = searchQuery
    ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : projects;

  const filteredTodos = searchQuery
    ? dbTodos.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : dbTodos;

  const getTasksDueThisWeekCount = (tasksList: any[]) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    return tasksList.filter(t => {
      if (!t.endDate || t.status === 'completed') return false;
      const dueDate = new Date(t.endDate);
      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    }).length;
  };

  const TLHero = () => {
    const tlTasks = allTasksData?.data || [];
    const dueThisWeek = getTasksDueThisWeekCount(tlTasks);

    return (
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
        <Card shadow="sm" p="xl" radius="lg" withBorder style={{ borderColor: '#e5e7eb', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white' }}>
          <Group justify="space-between" mb="md">
            <Activity size={32} color="rgba(255,255,255,0.8)" />
            <Badge color="rgba(255,255,255,0.2)" variant="filled" size="lg">Team Workload</Badge>
          </Group>
          <Text fw={800} size="32px">{filteredTodos.length} Open Team Todos</Text>
          <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Across all active projects</Text>
        </Card>
        <Card shadow="sm" p="xl" radius="lg" withBorder style={{ borderColor: '#e5e7eb', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
          <Group justify="space-between" mb="md">
            <Clock size={32} color="rgba(255,255,255,0.8)" />
            <Badge color="rgba(255,255,255,0.2)" variant="filled" size="lg">Deadlines</Badge>
          </Group>
          <Text fw={800} size="32px">{dueThisWeek} Critical</Text>
          <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {dueThisWeek === 1 ? 'Task due this week' : 'Tasks due this week'}
          </Text>
        </Card>
      </SimpleGrid>
    );
  };

  const TMHero = () => (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
      <Card shadow="sm" p="xl" radius="lg" withBorder style={{ borderColor: '#e5e7eb', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: 'white' }}>
        <Group justify="space-between" mb="md">
          <CheckCircle size={32} color="rgba(255,255,255,0.8)" />
          <Badge color="rgba(255,255,255,0.2)" variant="filled" size="lg">Personal Workload</Badge>
        </Group>
        <Text fw={800} size="32px">{openTasksCount} Open Tasks</Text>
        <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Assigned to you</Text>
      </Card>
      <Card shadow="sm" p="xl" radius="lg" withBorder style={{ borderColor: '#e5e7eb', background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', color: 'white' }}>
        <Group justify="space-between" mb="md">
          <CheckSquare size={32} color="rgba(255,255,255,0.8)" />
          <Badge color="rgba(255,255,255,0.2)" variant="filled" size="lg">Today's Focus</Badge>
        </Group>
        <Text fw={800} size="32px">{myTodosCount} To-Dos</Text>
        <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Pending for today</Text>
      </Card>
    </SimpleGrid>
  );

  return (
    <div style={{ animation: 'fade-in 0.4s ease-out', paddingBottom: '40px' }}>
      <Group justify="space-between" align="flex-start" mb="xl">
        <div>
          <Title order={1} style={{ color: '#111827', fontSize: '30px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Command Center
          </Title>
          <Text color="dimmed" size="sm" mt={4}>
            Good afternoon, {user?.name?.split(' ')[0]}. Here is your high-level view.
          </Text>
        </div>
        <Group>
          <Text size="sm" c="dimmed" mr="md">{formattedDate}</Text>
          <TextInput 
            placeholder="Search dashboard..." 
            rightSection={<Search size={16} color="#9ca3af" />}
            radius="md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            styles={{ input: { backgroundColor: '#fff', border: '1px solid #e5e7eb', width: '250px' } }}
          />
        </Group>
      </Group>

      {(user?.role === Role.ADMIN || user?.role === Role.PM) && (
        <ProjectSummaryCards projects={filteredProjects} />
      )}
      {user?.role === Role.TEAM_LEAD && <TLHero />}
      {user?.role === Role.TEAM_MEMBER && <TMHero />}

      {(user?.role === Role.ADMIN || user?.role === Role.PM || user?.role === Role.TEAM_LEAD) && (
        <TeamTodoOverview todos={filteredTodos} />
      )}
      
      {(user?.role === Role.ADMIN || user?.role === Role.PM) && (
        <>
          <ReleaseSheet />
          <TeamTimeTrackingPanel />
        </>
      )}
    </div>
  );
};

export default DashboardShell;
