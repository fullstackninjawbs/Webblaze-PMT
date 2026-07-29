
import { Container, Title, Text, Card, Table, Badge, Group, Avatar, SimpleGrid } from '@mantine/core';
import { useGetTeamTimeLogsQuery } from './timeLog.slice';

export const TeamTimeTracking = () => {
  const { data: logsData, isLoading } = useGetTeamTimeLogsQuery();
  const logs = logsData?.data || [];

  const activeLogs = logs.filter(log => !log.endTime);
  const historicalLogs = logs.filter(log => log.endTime);

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <Container size="xl" py="xl" style={{ animation: 'fade-in 0.4s ease-out' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#111827', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Time Tracking Overview
          </Title>
          <Text color="dimmed" size="sm">Monitor active work and historical time logs across the team.</Text>
        </div>
      </Group>

      <Title order={4} mb="md" style={{ color: '#1e293b' }}>Active Work</Title>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
        {activeLogs.map((log) => {
          const user = typeof log.user === 'object' ? log.user : null;
          const task = typeof log.task === 'object' ? log.task : null;
          const project = (task?.milestone as any)?.project;

          return (
            <Card key={log._id} shadow="sm" p="md" radius="md" withBorder style={{ borderColor: '#3b82f6' }}>
              <Group justify="space-between" mb="sm">
                <Group gap="sm">
                  <Avatar src={user?.avatarUrl} radius="xl" size="sm" color="blue">
                    {user?.name?.charAt(0) || 'U'}
                  </Avatar>
                  <Text size="sm" fw={600}>{user?.name || 'Unknown User'}</Text>
                </Group>
                <Badge color="blue" variant="filled" className="pulsing-badge">Running</Badge>
              </Group>
              <Text size="sm" fw={500} lineClamp={1}>{task?.title || 'Unknown Task'}</Text>
              <Text size="xs" color="dimmed" lineClamp={1} mb="sm">{project?.name || 'Unknown Project'}</Text>
              
              <Text size="xs" color="dimmed">Started: {new Date(log.startTime).toLocaleTimeString()}</Text>
            </Card>
          );
        })}
        {activeLogs.length === 0 && !isLoading && (
          <Card shadow="sm" p="md" radius="md" withBorder style={{ borderStyle: 'dashed' }}>
            <Text c="dimmed" ta="center">No active timers right now.</Text>
          </Card>
        )}
      </SimpleGrid>

      <Title order={4} mb="md" style={{ color: '#1e293b' }}>Logged Time Summary</Title>
      <Card shadow="sm" p="0" radius="lg" withBorder>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Team Member</Table.Th>
              <Table.Th>Project / Task</Table.Th>
              <Table.Th>Start Time</Table.Th>
              <Table.Th>End Time</Table.Th>
              <Table.Th>Total Logged</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {historicalLogs.slice(0, 20).map((log) => {
              const user = typeof log.user === 'object' ? log.user : null;
              const task = typeof log.task === 'object' ? log.task : null;
              const project = (task?.milestone as any)?.project;

              return (
                <Table.Tr key={log._id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar src={user?.avatarUrl} radius="xl" size="sm">
                        {user?.name?.charAt(0) || 'U'}
                      </Avatar>
                      <Text size="sm" fw={500}>{user?.name || 'Unknown User'}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>{task?.title || 'Unknown Task'}</Text>
                    <Text size="xs" color="dimmed">{project?.name || 'Unknown Project'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{new Date(log.startTime).toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{log.endTime ? new Date(log.endTime).toLocaleString() : '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>{formatDuration(log.durationSeconds)}</Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {historicalLogs.length === 0 && !isLoading && (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  <Text color="dimmed">No historical time logs found.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        .pulsing-badge {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </Container>
  );
};
