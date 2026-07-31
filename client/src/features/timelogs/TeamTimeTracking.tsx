import { Container, Title, Text, Card, Table, Badge, Group, SimpleGrid, ActionIcon } from '@mantine/core';
import { Trash } from 'lucide-react';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useGetTeamTimeLogsQuery, useDeleteTimeLogMutation } from './timeLog.slice';

export const TeamTimeTracking = () => {
  const { data: logsData, isLoading } = useGetTeamTimeLogsQuery();
  const [deleteTimeLog] = useDeleteTimeLogMutation();
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
            Time Tracking Overview
          </Title>
          <Text
            size="sm"
            mt={4}
            style={{ color: '#64748b', letterSpacing: '-0.01em' }}
          >
            Monitor active work and historical time logs across the team.
          </Text>
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
                  <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size="sm" />
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
              <Table.Th w={60}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {historicalLogs.slice(0, 20).map((log) => {
              const user = typeof log.user === 'object' ? log.user : null;
              const task = typeof log.task === 'object' ? log.task : null;
              const project = (task?.milestone as any)?.project;
              const taskId = task?._id;

              return (
                <Table.Tr key={log._id}>
                  <Table.Td>
                    <Group gap="sm">
                      <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size="sm" />
                      <Text size="sm" fw={500}>{user?.name || 'Unknown User'}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>{task?.title || 'Unknown Task'}</Text>
                    <Text size="xs" color="dimmed">{project?.name || 'Unknown Project'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={600} c="green">
                      {new Date(log.startTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={600} c={log.endTime ? 'red' : 'blue'}>
                      {log.endTime
                        ? new Date(log.endTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                        : '● Active'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>{formatDuration(log.durationSeconds)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => deleteTimeLog({ id: log._id, taskId })}
                      title="Delete time log"
                    >
                      <Trash size={14} />
                    </ActionIcon>
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
