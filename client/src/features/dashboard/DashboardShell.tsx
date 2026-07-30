import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../app/store';
import { Title, Text, Group, TextInput, Badge, SimpleGrid, Card, ActionIcon, Stack, Box } from '@mantine/core';
import { Search, CheckCircle, CheckSquare, Activity, Clock, Briefcase, ListTodo, Rocket, X } from 'lucide-react';
import { Role } from '../../types';

import { useGetProjectsQuery } from '../projects/project.slice';
import { useGetTasksByUserQuery, useGetAllTasksQuery } from '../tasks/task.slice';
import { useGetTodosQuery } from '../todos/todo.slice';
import { useGetReleasesQuery } from '../releases/release.slice';

import { ProjectSummaryCards } from './ProjectSummaryCards';
import { TeamTodoOverview } from './TeamTodoOverview';
import { ReleaseSheet } from './ReleaseSheet';
import { TeamTimeTrackingPanel } from './TeamTimeTrackingPanel';

export const DashboardShell: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const formattedDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

  const { data: projectsData } = useGetProjectsQuery();
  const { data: tasksData } = useGetTasksByUserQuery(user?._id || '', { skip: !user?._id });
  const { data: allTasksData } = useGetAllTasksQuery(undefined, { skip: user?.role === Role.TEAM_MEMBER });
  const { data: todosData } = useGetTodosQuery();
  const { data: releasesData } = useGetReleasesQuery();

  const [searchQuery, setSearchQuery] = useState('');

  const projects = projectsData?.data || [];
  const dbTodos = todosData?.data || [];
  const dbTasks = tasksData?.data || [];
  const releases = releasesData?.data || [];

  const openTasksCount = dbTasks.filter(t => t.status !== 'completed').length;
  const myTodosCount = dbTodos.filter(t => (typeof t.user === 'object' ? t.user._id : t.user) === user?._id && t.status !== 'done').length;

  const query = searchQuery.trim().toLowerCase();

  const matchedProjects = query
    ? projects.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        (typeof p.client === 'object' && (p.client as any)?.name?.toLowerCase().includes(query)) ||
        p.status?.toLowerCase().includes(query)
      )
    : [];

  const allTasksList = (user?.role === Role.TEAM_MEMBER ? dbTasks : (allTasksData?.data || dbTasks));
  const matchedTasks = query
    ? allTasksList.filter((t: any) =>
        t.title?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.department?.toLowerCase().includes(query) ||
        t.status?.toLowerCase().includes(query) ||
        (typeof t.assignedTo === 'object' && (t.assignedTo as any)?.name?.toLowerCase().includes(query))
      )
    : [];

  const matchedTodos = query
    ? dbTodos.filter(t =>
        t.title?.toLowerCase().includes(query) ||
        t.status?.toLowerCase().includes(query) ||
        (typeof t.user === 'object' && (t.user as any)?.name?.toLowerCase().includes(query)) ||
        (typeof t.relatedProject === 'object' && (t.relatedProject as any)?.name?.toLowerCase().includes(query))
      )
    : [];

  const matchedReleases = query
    ? releases.filter(r =>
        r.details?.toLowerCase().includes(query) ||
        r.department?.toLowerCase().includes(query) ||
        r.status?.toLowerCase().includes(query) ||
        (typeof r.project === 'object' && (r.project as any)?.name?.toLowerCase().includes(query))
      )
    : [];

  const totalMatchCount = matchedProjects.length + matchedTasks.length + matchedTodos.length + matchedReleases.length;

  const filteredProjects = query ? matchedProjects : projects;
  const filteredTodos = query ? matchedTodos : dbTodos;

  const getTasksDueThisWeekCount = (tasksList: any[]) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
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
      {/* Top Header Section — clean static layout */}
      <Group justify="space-between" align="center" mb="xl" style={{ marginBottom: '28px' }}>
        <div>
          <Title
            order={2}
            style={{
              color: '#0f172a',
              fontSize: '1.625rem',
              fontWeight: 800,
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
              color: '#334155',
              fontSize: '0.875rem',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            Good afternoon, {user?.name?.split(' ')[0]}. Here is your high-level view.
          </Text>
        </div>
        <Group gap="md" align="center">
          {/* Vibrant Cyan-Blue Brand Gradient Date Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            borderRadius: '10px',
            padding: '7px 16px',
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
            color: '#ffffff',
          }}>
            <span style={{ fontSize: '0.8125rem', color: '#ffffff', fontWeight: 600, letterSpacing: '0.01em' }}>{formattedDate}</span>
          </div>
          <TextInput
            placeholder="Search projects, tasks, todos..."
            leftSection={<Search size={15} color="#0ea5e9" />}
            rightSection={
              searchQuery ? (
                <ActionIcon variant="subtle" size="sm" onClick={() => setSearchQuery('')} color="gray">
                  <X size={14} />
                </ActionIcon>
              ) : null
            }
            radius="md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            styles={{
              input: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #7dd3fc',
                width: '280px',
                fontSize: '0.875rem',
                color: '#0f172a',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(14, 165, 233, 0.12)',
              }
            }}
          />
        </Group>
      </Group>

      {/* Live Search Results Container when query is present */}
      {query !== '' && (
        <Card shadow="md" p="lg" radius="xl" withBorder mb="xl" style={{ borderColor: '#3b82f6', backgroundColor: '#ffffff' }}>
          <Group justify="space-between" mb="lg">
            <Group gap="xs">
              <Search size={20} color="#3b82f6" />
              <Title order={4} style={{ color: '#0f172a', fontWeight: 700 }}>
                Search Results for &quot;{searchQuery}&quot;
              </Title>
              <Badge color="blue" variant="filled" size="md">
                {totalMatchCount} {totalMatchCount === 1 ? 'match' : 'matches'}
              </Badge>
            </Group>
            <ActionIcon variant="light" color="gray" radius="xl" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </ActionIcon>
          </Group>

          {totalMatchCount === 0 ? (
            <Box py="xl" style={{ textAlign: 'center' }}>
              <Text color="dimmed" size="sm" fw={500}>
                No projects, tasks, todos, or releases match your search query.
              </Text>
            </Box>
          ) : (
            <Stack gap="lg">
              {/* Projects Results */}
              {matchedProjects.length > 0 && (
                <div>
                  <Group gap="xs" mb="sm">
                    <Briefcase size={16} color="#3b82f6" />
                    <Text fw={700} size="sm" style={{ color: '#1e293b' }}>
                      Projects ({matchedProjects.length})
                    </Text>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                    {matchedProjects.map((p) => (
                      <Card
                        key={p._id}
                        withBorder
                        p="sm"
                        radius="md"
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: '#f8fafc' }}
                        onClick={() => navigate(`/projects/${p._id}`)}
                      >
                        <Group justify="space-between" wrap="nowrap" mb={4}>
                          <Text fw={600} size="sm" style={{ color: '#1d4ed8' }} truncate>
                            {p.name}
                          </Text>
                          <Badge size="xs" variant="light" color={p.status === 'active' ? 'green' : 'orange'}>
                            {p.status.replace('_', ' ')}
                          </Badge>
                        </Group>
                        <Text size="xs" color="dimmed" lineClamp={1}>
                          {p.description || 'No description provided'}
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                </div>
              )}

              {/* Tasks Results */}
              {matchedTasks.length > 0 && (
                <div>
                  <Group gap="xs" mb="sm">
                    <ListTodo size={16} color="#10b981" />
                    <Text fw={700} size="sm" style={{ color: '#1e293b' }}>
                      Tasks ({matchedTasks.length})
                    </Text>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                    {matchedTasks.map((t) => (
                      <Card
                        key={t._id}
                        withBorder
                        p="sm"
                        radius="md"
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: '#f8fafc' }}
                        onClick={() => navigate(`/tasks/${t._id}`)}
                      >
                        <Group justify="space-between" wrap="nowrap" mb={4}>
                          <Text fw={600} size="sm" style={{ color: '#047857' }} truncate>
                            {t.title}
                          </Text>
                          <Badge size="xs" variant="light" color={t.status === 'completed' ? 'green' : 'blue'}>
                            {t.status.replace('_', ' ')}
                          </Badge>
                        </Group>
                        <Text size="xs" color="dimmed">
                          Department: {t.department || 'General'}
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                </div>
              )}

              {/* Todos Results */}
              {matchedTodos.length > 0 && (
                <div>
                  <Group gap="xs" mb="sm">
                    <CheckSquare size={16} color="#6366f1" />
                    <Text fw={700} size="sm" style={{ color: '#1e293b' }}>
                      To-Dos ({matchedTodos.length})
                    </Text>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                    {matchedTodos.map((td) => (
                      <Card
                        key={td._id}
                        withBorder
                        p="sm"
                        radius="md"
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: '#f8fafc' }}
                        onClick={() => navigate('/todos/team')}
                      >
                        <Group justify="space-between" wrap="nowrap" mb={4}>
                          <Text fw={600} size="sm" style={{ color: '#4338ca' }} truncate>
                            {td.title}
                          </Text>
                          <Badge size="xs" variant="light" color={td.status === 'done' ? 'green' : 'indigo'}>
                            {td.status.replace('_', ' ')}
                          </Badge>
                        </Group>
                        <Text size="xs" color="dimmed">
                          Assigned: {typeof td.user === 'object' ? (td.user as any)?.name : 'Unassigned'}
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                </div>
              )}

              {/* Releases Results */}
              {matchedReleases.length > 0 && (
                <div>
                  <Group gap="xs" mb="sm">
                    <Rocket size={16} color="#f59e0b" />
                    <Text fw={700} size="sm" style={{ color: '#1e293b' }}>
                      Releases ({matchedReleases.length})
                    </Text>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                    {matchedReleases.map((r) => (
                      <Card
                        key={r._id}
                        withBorder
                        p="sm"
                        radius="md"
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: '#f8fafc' }}
                        onClick={() => navigate('/releases')}
                      >
                        <Group justify="space-between" wrap="nowrap" mb={4}>
                          <Text fw={600} size="sm" style={{ color: '#b45309' }} truncate>
                            {r.details}
                          </Text>
                          <Badge size="xs" variant="light" color={r.status === 'released' ? 'green' : 'amber'}>
                            {r.status.replace('_', ' ')}
                          </Badge>
                        </Group>
                        <Text size="xs" color="dimmed">
                          Department: {r.department?.toUpperCase()}
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                </div>
              )}
            </Stack>
          )}
        </Card>
      )}

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
