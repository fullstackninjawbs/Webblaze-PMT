import React from 'react';
import { Card, Text, Group, Table, Badge, Avatar, Progress } from '@mantine/core';
import { useGetTeamTimeLogsQuery } from '../timelogs/timeLog.slice';

export const TeamTimeTrackingPanel: React.FC = () => {
  const { data: logsData, isLoading } = useGetTeamTimeLogsQuery();
  const logs = logsData?.data || [];

  // Group logs by user for today's total logged time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logsByMember = logs.reduce((acc: any, log: any) => {
    const userId = typeof log.user === 'object' ? log.user._id : log.user;
    if (!acc[userId]) {
      acc[userId] = {
        user: typeof log.user === 'object' ? log.user : null,
        activeTimer: null,
        totalSecondsToday: 0,
      };
    }
    
    // Check if log is from today
    const logDate = new Date(log.startTime);
    if (logDate >= today) {
      if (log.durationSeconds) {
        acc[userId].totalSecondsToday += log.durationSeconds;
      }
    }

    if (!log.endTime) {
      acc[userId].activeTimer = log;
    }

    return acc;
  }, {});

  const members = Object.values(logsByMember) as any[];

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <Card shadow="sm" p="lg" radius="lg" withBorder mb="xl">
      <Text fw={700} size="lg" mb="md" style={{ color: '#111827' }}>Team Time Tracking</Text>
      
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Team Member</Table.Th>
            <Table.Th>Current Status</Table.Th>
            <Table.Th>Active Project / Task</Table.Th>
            <Table.Th>Total Logged Today</Table.Th>
            <Table.Th>Daily Capacity</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {members.map((member: any) => {
            const activeTimer = member.activeTimer;
            const task = activeTimer && typeof activeTimer.task === 'object' ? activeTimer.task : null;
            const milestone = task && typeof task.milestone === 'object' ? task.milestone : null;
            const project = milestone && typeof milestone.project === 'object' ? milestone.project : null;
            
            const totalHours = member.totalSecondsToday / 3600;
            const capacityPercent = Math.min((totalHours / 8) * 100, 100);

            return (
              <Table.Tr key={member.user._id}>
                <Table.Td>
                  <Group gap="sm">
                    <Avatar src={member.user.avatarUrl} radius="xl" size="sm" color="blue">
                      {member.user.name?.charAt(0)}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>{member.user.name}</Text>
                      <Text size="xs" c="dimmed">{member.user.role?.replace('_', ' ')}</Text>
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  {activeTimer ? (
                    <Badge color="blue" variant="light" size="sm">Tracking Now</Badge>
                  ) : (
                    <Badge color="gray" variant="light" size="sm">Offline</Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  {activeTimer ? (
                    <div>
                      <Text size="sm" fw={500} lineClamp={1}>{task?.title || 'Unknown Task'}</Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>{project?.name || 'Unknown Project'}</Text>
                    </div>
                  ) : (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600}>{formatTime(member.totalSecondsToday)}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Progress value={capacityPercent} color={capacityPercent >= 100 ? 'green' : 'blue'} size="sm" style={{ flex: 1 }} />
                    <Text size="xs" c="dimmed" w={35}>{Math.round(capacityPercent)}%</Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
          {members.length === 0 && !isLoading && (
            <Table.Tr>
              <Table.Td colSpan={5} ta="center" py="xl">
                <Text color="dimmed">No time logs recorded today.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Card>
  );
};
