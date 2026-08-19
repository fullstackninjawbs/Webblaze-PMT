import { Table, Group, Text, Badge, Card } from '@mantine/core';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Link } from 'react-router-dom';

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
      <Table.ScrollContainer minWidth={1000}>
        <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#f8faff' }}>
            <Table.Tr>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Assignee</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Project</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Project's Task</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Status</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Time Logged</Table.Th>
            </Table.Tr>
          </Table.Thead>
        <Table.Tbody>
          {tasks.length > 0 ? (
            tasks.map((task: any) => (
              <Table.Tr key={task._id}>
                <Table.Td>
                  <Group gap="sm" wrap="nowrap">
                    {task.assignedTo?.avatarUrl !== undefined && (
                      <UserAvatar name={task.assignedTo?.name || 'Unassigned'} avatarUrl={task.assignedTo?.avatarUrl} size="md" />
                    )}
                    <div>
                      <Text size="sm" fw={600} style={{ color: '#0f172a' }}>
                        {task.assignedTo?.name || 'Unassigned'}
                      </Text>
                      {task.assignedTo?.department && (
                        <Text size="xs" c="dimmed" tt="uppercase" mt={2} fw={500}>
                          {task.assignedTo.department}
                        </Text>
                      )}
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Link to={task.milestone?.project?._id ? `/projects/${task.milestone.project._id}` : '#'} style={{ textDecoration: 'none' }}>
                    <Text size="sm" fw={600} style={{ color: '#2563eb' }}>
                      {task.milestone?.project?.name || 'Unknown Project'}
                    </Text>
                  </Link>
                </Table.Td>
                <Table.Td>
                  <Link to={`/tasks/${task._id}`} style={{ textDecoration: 'none' }}>
                    <Text fw={600} size="sm" style={{ color: '#2563eb' }}>{task.title}</Text>
                  </Link>
                  <Text size="xs" c="dimmed" lineClamp={2} style={{ maxWidth: 250, marginTop: '2px' }}>
                    {task.description || 'No description provided.'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={task.status === 'completed' ? 'green' : 'blue'} variant="light">
                    {task.status?.replace('_', ' ') || 'Assigned'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <Text size="sm" fw={600} style={{ color: task.spentHours > task.estimatedHours ? '#dc2626' : '#0f172a' }}>
                      {task.spentHours || 0}h
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>
                      / {task.estimatedHours || 0}h
                    </Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
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
