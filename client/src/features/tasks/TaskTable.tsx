import { Table, Group, Text, Badge, Card } from '@mantine/core';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Link } from 'react-router-dom';
import { formatHours } from '../../utils/formatHours';

const truncateText = (text: string, max: number = 48) => {
  if (!text) return '';
  return text.length > max ? text.substring(0, max) + '...' : text;
};

export const TaskTable = ({ tasks }: any) => {
  return (
    <Card
      shadow="xs"
      p={0}
      radius="xl"
      withBorder
      style={{
        borderColor: '#e8ecf4',
        boxShadow: 'none',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      <Table.ScrollContainer minWidth={800}>
        <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#f8faff' }}>
            <Table.Tr>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase', width: '25%' }}>Assignee</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Project Details</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tasks.length > 0 ? (
              Object.values(
                tasks.reduce((acc: any, task: any) => {
                  const assigneeId = task.assignedTo?._id || 'unassigned';
                  if (!acc[assigneeId]) {
                    acc[assigneeId] = { assignee: task.assignedTo, tasks: [] };
                  }
                  acc[assigneeId].tasks.push(task);
                  return acc;
                }, {})
              ).map((group: any) => {
                const { assignee, tasks: assigneeTasks } = group;
                
                // Group assignee tasks by date
                const tasksByDate = assigneeTasks.reduce((acc: any, t: any) => {
                  let dKey = 'Unscheduled';
                  if (t.startDate) {
                    const d = new Date(t.startDate);
                    if (!isNaN(d.getTime())) {
                      dKey = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                    }
                  }
                  if (!acc[dKey]) acc[dKey] = [];
                  acc[dKey].push(t);
                  return acc;
                }, {});

                // Sort dates (Unscheduled last)
                const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
                  if (a === 'Unscheduled') return 1;
                  if (b === 'Unscheduled') return -1;
                  return new Date(a).getTime() - new Date(b).getTime();
                });

                return (
                  <Table.Tr key={assignee?._id || 'unassigned'}>
                    <Table.Td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                      <Group gap="sm" wrap="nowrap">
                        {assignee?.avatarUrl !== undefined && (
                          <UserAvatar name={assignee?.name || 'Unassigned'} avatarUrl={assignee?.avatarUrl} size="md" />
                        )}
                        <div>
                          <Text size="sm" fw={600} style={{ color: '#0f172a' }}>
                            {assignee?.name || 'Unassigned'}
                          </Text>
                          {assignee?.department && (
                            <Text size="xs" c="dimmed" tt="uppercase" mt={2} fw={500}>
                              {assignee.department}
                            </Text>
                          )}
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sortedDates.map((dateStr) => {
                          const dateTasks = tasksByDate[dateStr];
                          const totalHours = dateTasks.reduce((sum: number, t: any) => sum + (Number(t.estimatedHours) || 0), 0);
                          
                          return (
                            <div key={dateStr}>
                              <Group justify="space-between" mb="xs" style={{ borderBottom: '2px solid #e8ecf4', paddingBottom: '6px' }}>
                                <Text size="sm" fw={700} style={{ color: '#dc2626' }}>{dateStr}</Text>
                                <Text size="sm" fw={700} style={{ color: '#dc2626' }}>{formatHours(totalHours)}</Text>
                              </Group>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {dateTasks.map((task: any) => (
                                  <Group key={task._id} gap="sm" wrap="nowrap" align="center">
                                    <Badge color={task.status === 'completed' ? 'green' : 'blue'} variant="light" size="sm">
                                      {task.status?.replace('_', ' ') || 'Assigned'}
                                    </Badge>
                                    <Text size="sm" c="dimmed">—</Text>
                                    <Link to={task.milestone?.project?._id ? `/projects/${task.milestone.project._id}` : '#'} style={{ textDecoration: 'none' }}>
                                      <Text size="sm" fw={700} style={{ color: '#0f172a' }} title={task.milestone?.project?.name}>
                                        {truncateText(task.milestone?.project?.name || 'Unknown Project')}
                                      </Text>
                                    </Link>
                                    <Text size="sm" c="dimmed">—</Text>
                                    <Link to={`/tasks/${task._id}`} style={{ textDecoration: 'none' }}>
                                      <Text fw={600} size="sm" style={{ color: '#2563eb' }} title={task.title}>
                                        {truncateText(task.title)}
                                      </Text>
                                    </Link>
                                    <Text size="sm" c="dimmed">—</Text>
                                    <Group gap={4} wrap="nowrap">
                                      <Text size="sm" fw={600} style={{ color: task.spentHours > task.estimatedHours ? '#dc2626' : '#0f172a' }}>
                                        {formatHours(task.spentHours)}
                                      </Text>
                                      <Text size="xs" c="dimmed" fw={500}>
                                        / {formatHours(task.estimatedHours)}
                                      </Text>
                                    </Group>
                                  </Group>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            ) : (
              <Table.Tr>
                <Table.Td colSpan={2} style={{ textAlign: 'center', padding: '40px' }}>
                  <Text c="dimmed">No tasks found</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
};
