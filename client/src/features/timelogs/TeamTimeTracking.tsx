import { useState, useMemo } from 'react';
import { Container, Title, Text, Card, Table, Badge, Group, ActionIcon, TextInput, Tabs } from '@mantine/core';
import { Search, X } from 'lucide-react';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useGetTeamTimeLogsQuery } from './timeLog.slice';

export const TeamTimeTracking = () => {
  const { data: logsData, isLoading } = useGetTeamTimeLogsQuery();
  const [searchQuery, setSearchQuery] = useState('');

  const logs = logsData?.data || [];
  const query = searchQuery.trim().toLowerCase();

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatDateTime = (dateStr?: string | Date) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const filteredLogs = useMemo(() => {
    if (!query) return logs;
    return logs.filter((log) => {
      const user = typeof log.user === 'object' ? log.user : null;
      const task = typeof log.task === 'object' ? log.task : null;
      const milestone = task && typeof task.milestone === 'object' ? task.milestone : null;
      const project = (milestone as any)?.project || (task as any)?.project;

      // Column 1: TEAM MEMBER
      const col1_teamMember = `${user?.name || ''} ${user?.role || ''} ${user?.email || ''}`.toLowerCase();

      // Column 2: PROJECT / TASK
      const col2_projectTask = `${task?.title || ''} ${(task as any)?.name || ''} ${milestone?.title || ''} ${typeof project === 'object' ? project?.name || '' : ''}`.toLowerCase();

      // Column 3: START TIME
      const col3_startTime = formatDateTime(log.startTime).toLowerCase();

      // Column 4: END TIME
      const col4_endTime = log.endTime ? formatDateTime(log.endTime).toLowerCase() : 'active running';

      // Column 5: TOTAL LOGGED
      const durationFormatted = formatDuration(log.durationSeconds).toLowerCase();
      const col5_totalLogged = `${durationFormatted} ${log.durationSeconds || 0}`.toLowerCase();

      // Search match across all 5 columns
      return (
        col1_teamMember.includes(query) ||
        col2_projectTask.includes(query) ||
        col3_startTime.includes(query) ||
        col4_endTime.includes(query) ||
        col5_totalLogged.includes(query)
      );
    });
  }, [logs, query]);

  const activeLogs = filteredLogs.filter(log => !log.endTime);
  const historicalLogs = filteredLogs.filter(log => log.endTime);

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <Group justify="space-between" align="center" mb="xl" style={{ marginBottom: '28px' }} wrap="wrap">
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

        {/* Real-Time Search Bar */}
        <TextInput
          placeholder="Search member, task, project, time..."
          leftSection={<Search size={16} color="#0ea5e9" />}
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
          w={{ base: '100%', sm: 320 }}
          styles={{
            input: {
              backgroundColor: '#ffffff',
              border: '1px solid #0ea5e9',
              fontSize: '0.875rem',
              color: '#0f172a',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(14, 165, 233, 0.12)',
            }
          }}
        />
      </Group>

      {/* Visual Search Indicator Banner when Query is Active */}
      {query !== '' && (
        <Card shadow="xs" p="sm" radius="md" mb="lg" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }} withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Search size={16} color="#0284c7" />
              <Text size="xs" fw={600} style={{ color: '#0369a1' }}>
                Showing search results for &quot;{searchQuery}&quot; ({filteredLogs.length} matching logs found)
              </Text>
            </Group>
            <ActionIcon size="xs" variant="subtle" color="blue" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </ActionIcon>
          </Group>
        </Card>
      )}

      <Tabs defaultValue="running" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="running" color="blue" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            Running ({activeLogs.length})
          </Tabs.Tab>
          <Tabs.Tab value="not-running" color="gray" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            Not Running ({historicalLogs.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="running">
          <Card shadow="sm" p="0" radius="lg" withBorder>
            <Table verticalSpacing="sm">
              <Table.Thead bg="#f8fafc">
                <Table.Tr>
                  <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>Team Member</Table.Th>
                  <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>Project / Task</Table.Th>
                  <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>Start Time</Table.Th>
                  <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>End Time</Table.Th>
                  <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>Total Logged</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {activeLogs.map((log) => {
                  const user = typeof log.user === 'object' ? log.user : null;
                  const task = typeof log.task === 'object' ? log.task : null;
                  const project = (task?.milestone as any)?.project;

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
                        <Group gap="xs">
                          <Badge color="blue" variant="filled" className="pulsing-badge">Running</Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600}>{formatDuration(log.durationSeconds)}</Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {activeLogs.length === 0 && !isLoading && (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      <Text color="dimmed">
                        {query ? `No active timers matching "${searchQuery}".` : 'No active timers right now.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="not-running">
          <Card shadow="sm" p="0" radius="lg" withBorder>
            <Table verticalSpacing="sm">
              <Table.Thead bg="#f8fafc">
                <Table.Tr>
                  <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>Team Member</Table.Th>
                  <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>Project / Task</Table.Th>
                  <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>Start Time</Table.Th>
                  <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>End Time</Table.Th>
                  <Table.Th style={{ fontSize: '0.75rem', fontWeight: 700 }}>Total Logged</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {historicalLogs.map((log) => {
                  const user = typeof log.user === 'object' ? log.user : null;
                  const task = typeof log.task === 'object' ? log.task : null;
                  const project = (task?.milestone as any)?.project;

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
                    </Table.Tr>
                  );
                })}
                {historicalLogs.length === 0 && !isLoading && (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      <Text color="dimmed">
                        {query ? `No logged time records matching "${searchQuery}".` : 'No historical time logs found.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>

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
