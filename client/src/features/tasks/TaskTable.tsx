import { Table, Group, Text, Badge, Select, ActionIcon, Stack, Card } from '@mantine/core';
import { UserAvatar } from '../../components/common/UserAvatar';
import { formatDateDisplay } from '../../utils/dateUtils';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TaskTable = ({ tasks, teamOptions, isGlobalManager, handleAssignTask }: any) => {
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
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Task & Description</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Project</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Est. Hours</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Dates</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Status</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Assignee</Table.Th>
              <Table.Th style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
        <Table.Tbody>
          {tasks.length > 0 ? (
            tasks.map((task: any) => (
              <Table.Tr key={task._id}>
                <Table.Td>
                  <Text fw={600} size="sm">{task.title}</Text>
                  <Text size="xs" c="dimmed" lineClamp={2} style={{ maxWidth: 250 }}>
                    {task.description || 'No description provided.'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>{task.milestone?.project?.name || 'Unknown'}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{task.estimatedHours}h</Text>
                </Table.Td>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="xs"><Text component="span" c="dimmed">Start:</Text> {formatDateDisplay(task.startDate)}</Text>
                    <Text size="xs"><Text component="span" c="dimmed">End:</Text> {formatDateDisplay(task.endDate)}</Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Badge color={task.status === 'completed' ? 'green' : 'blue'} variant="light">
                    {task.status?.replace('_', ' ') || 'Assigned'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Select
                    placeholder="Assign to..."
                    data={teamOptions}
                    searchable
                    size="xs"
                    w={190}
                    radius="md"
                    value={task.assignedTo?._id || task.assignedTo || null}
                    onChange={(val) => handleAssignTask(task._id, val)}
                    comboboxProps={{ width: 260, withinPortal: true, zIndex: 1000, shadow: 'md' }}
                    renderOption={({ option }) => {
                      const opt = teamOptions.find((o: any) => o.value === option.value);
                      return (
                        <Group justify="space-between" wrap="nowrap" w="100%" gap="xs" style={{ padding: '2px 4px' }}>
                          <Group gap="xs">
                            {opt?.avatarUrl !== undefined && (
                              <UserAvatar name={opt.fullName || option.label} avatarUrl={opt.avatarUrl} size="xs" />
                            )}
                            <Text size="xs" fw={600} style={{ color: '#0f172a' }}>
                              {opt?.fullName || option.label}
                            </Text>
                          </Group>
                          {isGlobalManager && opt?.department && (
                            <Badge size="xs" variant="light" color="blue" radius="sm">
                              {opt.department.toUpperCase()}
                            </Badge>
                          )}
                        </Group>
                      );
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  {task.milestone?.project?._id ? (
                    <ActionIcon 
                      component={Link} 
                      to={`/projects/${task.milestone.project._id}`} 
                      variant="light" 
                      color="blue"
                    >
                      <Eye size={16} />
                    </ActionIcon>
                  ) : (
                    <ActionIcon variant="light" color="gray" disabled>
                      <Eye size={16} />
                    </ActionIcon>
                  )}
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Text c="dimmed" ta="center" py="md">No tasks found.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
    </Card>
  );
};
