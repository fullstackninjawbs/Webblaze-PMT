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
        <Card shadow="sm" p="xl" radius="lg" withBorder>
          <Group justify="space-between" mb="md">
            <Activity size={32} color="#4F46E5" />
            <Badge color="indigo" variant="light" size="lg">Team Workload</Badge>
          </Group>
          <Text fw={800} size="32px" color="#111827">{filteredTodos.length} Open Team Todos</Text>
          <Text size="sm" color="#4B5563">Across all active projects</Text>
        </Card>
        <Card shadow="sm" p="xl" radius="lg" withBorder>
          <Group justify="space-between" mb="md">
            <Clock size={32} color="#F59E0B" />
            <Badge color="orange" variant="light" size="lg">Deadlines</Badge>
          </Group>
          <Text fw={800} size="32px" color="#111827">{dueThisWeek} Critical</Text>
          <Text size="sm" color="#4B5563">
            {dueThisWeek === 1 ? 'Task due this week' : 'Tasks due this week'}
          </Text>
        </Card>
      </SimpleGrid>
    );
  };

  const TMHero = () => (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
      <Card shadow="sm" p="xl" radius="lg" withBorder>
        <Group justify="space-between" mb="md">
          <CheckCircle size={32} color="#0EA5E9" />
          <Badge color="blue" variant="light" size="lg">Personal Workload</Badge>
        </Group>
        <Text fw={800} size="32px" color="#111827">{openTasksCount} Open Tasks</Text>
        <Text size="sm" color="#4B5563">Assigned to you</Text>
      </Card>
      <Card shadow="sm" p="xl" radius="lg" withBorder>
        <Group justify="space-between" mb="md">
          <CheckSquare size={32} color="#EC4899" />
          <Badge color="pink" variant="light" size="lg">Today's Focus</Badge>
        </Group>
        <Text fw={800} size="32px" color="#111827">{myTodosCount} To-Dos</Text>
        <Text size="sm" color="#4B5563">Pending for today</Text>
      </Card>
    </SimpleGrid>
  );

  return (
    <div style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)', paddingBottom: '48px' }}>
      <Group justify="space-between" align="flex-start" mb="xl" style={{ marginBottom: '28px' }}>
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
            Command Center
          </Title>
          <Text
            size="sm"
            mt={4}
            style={{
              color: '#64748b',
              fontSize: '0.875rem',
              fontWeight: 400,
              letterSpacing: '-0.01em',
            }}
          >
            Good afternoon, {user?.name?.split(' ')[0]}. Here is your high-level view.
          </Text>
        </div>
        <Group gap="md" align="center">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            border: '1px solid #e8ecf4',
            borderRadius: '10px',
            padding: '7px 14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500, letterSpacing: '-0.01em' }}>{formattedDate}</span>
          </div>
          <TextInput
            placeholder="Search dashboard..."
            rightSection={<Search size={15} color="#94a3b8" />}
            radius="md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            styles={{
              input: {
                backgroundColor: '#ffffff',
                border: '1px solid #e8ecf4',
                width: '240px',
                fontSize: '0.875rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }
            }}
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
