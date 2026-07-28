import { useGetTeamTimeLogsQuery } from './timeLog.slice';
import { Container, Title, Text, Card, Table, Badge, Group, Avatar, Loader } from '@mantine/core';

export const TeamTimeTracking = () => {
  const { data: logsData, isLoading } = useGetTeamTimeLogsQuery();
  const logs = logsData?.data || [];

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#111827' }}>Team Time Tracking</Title>
          <Text color="dimmed" size="sm">Monitor active and recent timers across the team</Text>
        </div>
      </Group>

      <Card shadow="sm" radius="md" withBorder>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader color="blue" />
          </div>
        ) : (
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Task</Table.Th>
                <Table.Th>Project</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Start Time</Table.Th>
                <Table.Th>Duration</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {logs.map((log) => {
                const user = log.user as any;
                const task = log.task as any;
                const milestone = task?.milestone;
                const project = milestone?.project;
                const isActive = !log.endTime;

                return (
                  <Table.Tr key={log._id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar src={user?.avatarUrl} radius="xl" size="sm" />
                        <div>
                          <Text size="sm" fw={500}>{user?.name}</Text>
                          <Text size="xs" color="dimmed" tt="uppercase">{user?.role?.replace('_', ' ')}</Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>{task?.title || 'Unknown Task'}</Text>
                      <Text size="xs" color="dimmed">{log.description || 'No description'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{project?.name || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      {isActive ? (
                        <Badge color="blue" variant="light" className="pulsing-badge">
                          Running
                        </Badge>
                      ) : (
                        <Badge color="gray" variant="light">
                          Stopped
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(log.startTime).toLocaleString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      {isActive ? (
                        <Text size="sm" color="blue" fw={600}>Active</Text>
                      ) : (
                        <Text size="sm">{formatDuration(log.durationSeconds)}</Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {logs.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    <Text color="dimmed">No recent time logs found.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .pulsing-badge {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </Container>
  );
};
