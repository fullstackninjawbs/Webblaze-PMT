import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useGetProjectsQuery } from '../projects/project.slice';
import { Title, Text, SimpleGrid, Card, Group, TextInput, Table, Badge, Progress, Tabs, Button } from '@mantine/core';
import { Search, ArrowRight, LayoutList } from 'lucide-react';
import { Role, ProjectStatus } from '../../types';

export const DashboardShell: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: projectsData } = useGetProjectsQuery();

  const isAdminOrPM = user?.role === Role.ADMIN || user?.role === Role.PM;
  
  // Format date like "27 July 2026"
  const formattedDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

  const projects = projectsData?.data || [];

  // Mock data for the mockup
  const teamTodos = [
    { task: 'Homepage redesign', project: 'Orbitway', assigned: 'Kapil W.', due: 'Today', status: 'In Progress' },
    { task: 'Mobile responsiveness', project: 'Noxor', assigned: 'Alex M.', due: 'Tomorrow', status: 'Pending' },
    { task: 'QA Testing', project: 'VIP PT', assigned: 'John D.', due: '29 Jul 2026', status: 'Review' },
    { task: 'API Integration', project: 'Trade Planet', assigned: 'Rohit S.', due: '02 Aug 2026', status: 'In Progress' },
    { task: 'Content updates', project: 'Orbitway', assigned: 'Priya K.', due: '31 Jul 2026', status: 'Not Started' },
  ];

  const upcomingReleases = [
    { date: '12 AUG', project: 'Orbitway Website', desc: 'Development Complete' },
    { date: '18 AUG', project: 'VIP PT Redesign', desc: 'Final QA & Deployment' },
    { date: '02 SEP', project: 'Noxor Platform', desc: 'Production Release' },
    { date: '10 SEP', project: 'Trade Planet Portal', desc: 'Feature Release' },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In Progress': return 'red';
      case 'Pending': return 'orange';
      case 'Review': return 'grape';
      case 'Not Started': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <div style={{ animation: 'fade-in 0.4s ease-out', paddingBottom: '40px' }}>
      
      {/* Header Section */}
      <Group justify="space-between" align="flex-start" mb="xl">
        <div>
          <Title order={1} style={{ color: '#111827', fontSize: '30px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Good afternoon, {user?.name?.split(' ')[0]}
          </Title>
          <Text color="dimmed" size="sm" mt={4}>
            Here's what's happening with your projects today.
          </Text>
        </div>
        <Group>
          <Text size="sm" c="dimmed" mr="md">{formattedDate}</Text>
          <TextInput 
            placeholder="Search projects, tasks..." 
            rightSection={<Search size={16} color="#9ca3af" />}
            radius="md"
            styles={{ input: { backgroundColor: '#fff', border: '1px solid #e5e7eb', width: '250px' } }}
          />
        </Group>
      </Group>

      {/* 4 Stat Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
        <Card shadow="sm" p="xl" radius="lg" withBorder style={{ borderColor: '#e5e7eb', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
          <Text fw={800} style={{ fontSize: '32px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>12</Text>
          <Text size="sm" c="dimmed" mb="lg" fw={500}>Active Projects</Text>
          <Group gap="xs" style={{ cursor: 'pointer' }}>
            <Text size="sm" c="blue" fw={600}>View all projects</Text>
            <ArrowRight size={14} color="#3b82f6" />
          </Group>
        </Card>

        <Card shadow="sm" p="xl" radius="lg" withBorder style={{ borderColor: '#e5e7eb', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
          <Text fw={800} style={{ fontSize: '32px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>28</Text>
          <Text size="sm" c="dimmed" mb="lg" fw={500}>Open Tasks</Text>
          <Group gap="xs" style={{ cursor: 'pointer' }}>
            <Text size="sm" c="blue" fw={600}>View all tasks</Text>
            <ArrowRight size={14} color="#3b82f6" />
          </Group>
        </Card>

        <Card shadow="sm" p="xl" radius="lg" withBorder style={{ borderColor: '#e5e7eb', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
          <Text fw={800} style={{ fontSize: '32px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>£24,500</Text>
          <Text size="sm" c="dimmed" mb="lg" fw={500}>Pending Amount</Text>
          <Group gap="xs" style={{ cursor: 'pointer' }}>
            <Text size="sm" c="blue" fw={600}>View payments</Text>
            <ArrowRight size={14} color="#3b82f6" />
          </Group>
        </Card>

        <Card shadow="sm" p="xl" radius="lg" withBorder style={{ borderColor: '#e5e7eb', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
          <Text fw={800} style={{ fontSize: '32px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>03</Text>
          <Text size="sm" c="dimmed" mb="lg" fw={500}>Releases This Week</Text>
          <Group gap="xs" style={{ cursor: 'pointer' }}>
            <Text size="sm" c="blue" fw={600}>View releases</Text>
            <ArrowRight size={14} color="#3b82f6" />
          </Group>
        </Card>
      </SimpleGrid>

      {/* Middle Section: To-Dos and Releases */}
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg" mb="xl">
        
        {/* Team To-Dos */}
        <Card shadow="sm" p="lg" radius="lg" withBorder style={{ borderColor: '#e5e7eb', gridColumn: 'span 2' }}>
          <Group justify="space-between" mb="md">
            <Text fw={700} size="sm" tt="uppercase" style={{ letterSpacing: '0.5px', color: '#1e293b' }}>Team To-Dos</Text>
            <Group gap="xs" style={{ cursor: 'pointer' }}>
              <Text size="sm" c="blue" fw={600}>View all tasks</Text>
              <ArrowRight size={14} color="#3b82f6" />
            </Group>
          </Group>
          
          <Table verticalSpacing="sm" style={{ borderTop: '1px solid #f3f4f6' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Task</Table.Th>
                <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Project</Table.Th>
                <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Assigned To</Table.Th>
                <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Due Date</Table.Th>
                <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {teamTodos.map((todo, i) => (
                <Table.Tr key={i}>
                  <Table.Td><Text size="sm" color="#111827">{todo.task}</Text></Table.Td>
                  <Table.Td><Text size="sm" color="#4b5563">{todo.project}</Text></Table.Td>
                  <Table.Td><Text size="sm" color="#4b5563">{todo.assigned}</Text></Table.Td>
                  <Table.Td><Text size="sm" color="#4b5563">{todo.due}</Text></Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={getStatusColor(todo.status)} radius="sm">
                      {todo.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>

        {/* Upcoming Releases */}
        <Card shadow="sm" p="lg" radius="lg" withBorder style={{ borderColor: '#e5e7eb' }}>
          <Group justify="space-between" mb="md">
            <Text fw={700} size="sm" tt="uppercase" style={{ letterSpacing: '0.5px', color: '#1e293b' }}>Upcoming Releases</Text>
            <Group gap="xs" style={{ cursor: 'pointer' }}>
              <Text size="sm" c="blue" fw={600}>View all releases</Text>
              <ArrowRight size={14} color="#3b82f6" />
            </Group>
          </Group>
          
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
            {upcomingReleases.map((release, i) => (
              <Group key={i} wrap="nowrap" mb="lg" align="flex-start">
                <div style={{ textAlign: 'center', width: '40px' }}>
                  <Text fw={800} size="lg" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{release.date.split(' ')[0]}</Text>
                  <Text size="xs" fw={700} tt="uppercase" color="#64748b">{release.date.split(' ')[1]}</Text>
                </div>
                <div style={{ width: '2px', height: '100%', backgroundColor: '#e5e7eb', margin: '0 8px', position: 'relative' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d1d5db', position: 'absolute', top: '6px', left: '-3px' }} />
                </div>
                <div>
                  <Text size="sm" fw={600} color="#111827">{release.project}</Text>
                  <Text size="xs" color="dimmed">{release.desc}</Text>
                </div>
              </Group>
            ))}
          </div>
        </Card>
      </SimpleGrid>

      {/* Projects Overview */}
      <Card shadow="sm" p="lg" radius="lg" withBorder style={{ borderColor: '#e5e7eb' }}>
        <Group justify="space-between" mb="lg">
          <Text fw={700} size="sm" tt="uppercase" style={{ letterSpacing: '0.5px', color: '#1e293b' }}>Projects Overview</Text>
          <Group gap="sm">
            <Button variant="default" radius="md" leftSection={<LayoutList size={16} />}>Table View</Button>
            <Button radius="md" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', border: 'none', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }} leftSection={<Text size="lg" style={{ marginTop: '-2px' }}>+</Text>}>New Project</Button>
          </Group>
        </Group>

        <Tabs defaultValue="all" color="blue">
          <Tabs.List style={{ borderBottom: '1px solid #e5e7eb' }} mb="md">
            <Tabs.Tab value="all" fw={500}>All Projects</Tabs.Tab>
            <Tabs.Tab value="active" fw={500}>Active</Tabs.Tab>
            <Tabs.Tab value="planning" fw={500}>Planning</Tabs.Tab>
            <Tabs.Tab value="onhold" fw={500}>On Hold</Tabs.Tab>
            <Tabs.Tab value="completed" fw={500}>Completed</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="all">
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Project Name</Table.Th>
                  <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Status</Table.Th>
                  {isAdminOrPM && (
                    <>
                      <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Estimated Hours</Table.Th>
                      <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Total Budget</Table.Th>
                      <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Received</Table.Th>
                      <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Pending</Table.Th>
                    </>
                  )}
                  <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Release Date</Table.Th>
                  <Table.Th style={{ color: '#4b5563', fontWeight: 600 }}>Progress</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {/* We map the actual projects from the DB, and if empty, we fall back to mockup data so the UI looks great for the user. */}
                {projects.length > 0 ? projects.map((p) => (
                  <Table.Tr key={p._id}>
                    <Table.Td><Text size="sm" color="#111827">{p.name}</Text></Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={p.status === ProjectStatus.ACTIVE ? 'blue' : 'orange'} radius="sm">
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </Table.Td>
                    {isAdminOrPM && (
                      <>
                        <Table.Td><Text size="sm" color="#4b5563">120 hrs</Text></Table.Td>
                        <Table.Td><Text size="sm" color="#4b5563">{p.totalBudget ? `£${p.totalBudget}` : '-'}</Text></Table.Td>
                        <Table.Td><Text size="sm" color="teal" fw={500}>£0</Text></Table.Td>
                        <Table.Td><Text size="sm" color="blue" fw={500}>{p.totalBudget ? `£${p.totalBudget}` : '-'}</Text></Table.Td>
                      </>
                    )}
                    <Table.Td><Text size="sm" color="#4b5563">TBD</Text></Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="sm" color="#111827" style={{ width: '35px' }}>0%</Text>
                        <Progress value={0} color="blue" size="sm" radius="xl" style={{ flex: 1 }} />
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                )) : (
                  // Hardcoded fallback UI representing the mockup exactly if DB is empty
                  <>
                    <Table.Tr>
                      <Table.Td><Text size="sm" color="#111827">Orbitway</Text></Table.Td>
                      <Table.Td><Badge variant="light" color="blue" radius="sm">In Progress</Badge></Table.Td>
                      {isAdminOrPM && (
                        <>
                          <Table.Td><Text size="sm" color="#4b5563">120 hrs</Text></Table.Td>
                          <Table.Td><Text size="sm" color="#111827">£12,000</Text></Table.Td>
                          <Table.Td><Text size="sm" color="teal" fw={500}>£8,000</Text></Table.Td>
                          <Table.Td><Text size="sm" color="blue" fw={500}>£4,000</Text></Table.Td>
                        </>
                      )}
                      <Table.Td><Text size="sm" color="#4b5563">12 Aug 2026</Text></Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Text size="sm" color="#111827" style={{ width: '35px' }}>70%</Text>
                          <Progress value={70} color="blue" size="sm" radius="xl" style={{ flex: 1 }} />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td><Text size="sm" color="#111827">VIP PT</Text></Table.Td>
                      <Table.Td><Badge variant="light" color="blue" radius="sm">In Progress</Badge></Table.Td>
                      {isAdminOrPM && (
                        <>
                          <Table.Td><Text size="sm" color="#4b5563">80 hrs</Text></Table.Td>
                          <Table.Td><Text size="sm" color="#111827">£8,500</Text></Table.Td>
                          <Table.Td><Text size="sm" color="teal" fw={500}>£5,000</Text></Table.Td>
                          <Table.Td><Text size="sm" color="blue" fw={500}>£3,500</Text></Table.Td>
                        </>
                      )}
                      <Table.Td><Text size="sm" color="#4b5563">18 Aug 2026</Text></Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Text size="sm" color="#111827" style={{ width: '35px' }}>78%</Text>
                          <Progress value={78} color="blue" size="sm" radius="xl" style={{ flex: 1 }} />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  </>
                )}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>
        </Tabs>
      </Card>

    </div>
  );
};

export default DashboardShell;
