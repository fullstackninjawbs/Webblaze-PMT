import React from 'react';
import { Table, Text, Group, Badge, Card, Tooltip } from '@mantine/core';
import { ChevronRight, Clock, ListChecks } from 'lucide-react';
import { UserAvatar } from '../../components/common/UserAvatar';
import { PaginatedTable, usePagination } from '../../components/common/PaginatedTable';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatHours } from '../../utils/formatHours';
import { DailyStatus } from './dailyStatus.slice';
import { getEntries, getProjectNames, getReportHours, getTaskEntries, formatSubmittedTime } from './dailyStatusHelpers';

interface DailyStatusTableProps {
  logs: DailyStatus[];
  showMember: boolean;
  isLoading?: boolean;
  paginationPrefix: string;
  emptyMessage: string;
  onSelect: (log: DailyStatus) => void;
}

const headerStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

export const DailyStatusTable: React.FC<DailyStatusTableProps> = ({
  logs,
  showMember,
  isLoading,
  paginationPrefix,
  emptyMessage,
  onSelect,
}) => {
  const { page, limit, setPage, setLimit } = usePagination(10, paginationPrefix);
  const pageLogs = logs.slice((page - 1) * limit, page * limit);
  const meta = { page, limit, total: logs.length, totalPages: Math.ceil(logs.length / limit) || 1 };
  const columnCount = showMember ? 6 : 5;

  return (
    <Card withBorder radius="lg" p={0} style={{ borderColor: '#e8ecf4', overflow: 'hidden' }}>
      <PaginatedTable meta={meta} onPageChange={setPage} onLimitChange={setLimit} isLoading={isLoading}>
        <Table.ScrollContainer minWidth={860}>
          <Table verticalSpacing="md" horizontalSpacing="lg" striped={false} highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#f8fafc' }}>
              <Table.Tr>
                {showMember && <Table.Th style={headerStyle}>Team Member</Table.Th>}
                <Table.Th style={headerStyle}>Date</Table.Th>
                <Table.Th style={{ ...headerStyle, width: '38%' }}>Tasks Worked On</Table.Th>
                <Table.Th style={headerStyle}>Project</Table.Th>
                <Table.Th style={headerStyle}>Time Logged</Table.Th>
                <Table.Th style={{ ...headerStyle, width: 40 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pageLogs.map((log) => {
                const entries = getEntries(log);
                const taskEntries = getTaskEntries(log);
                const projects = getProjectNames(log);
                const hours = getReportHours(log);
                const preview = (taskEntries.length > 0 ? taskEntries : entries).slice(0, 2);
                const remaining = entries.length - preview.length;

                return (
                  <Table.Tr key={log._id} onClick={() => onSelect(log)} style={{ cursor: 'pointer' }}>
                    {showMember && (
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <UserAvatar name={log.user?.name} avatarUrl={log.user?.avatarUrl} email={log.user?.email} size="sm" />
                          <div style={{ minWidth: 0 }}>
                            <Text size="sm" fw={600} c="#0f172a" truncate>{log.user?.name || 'Unknown User'}</Text>
                            <Text size="xs" c="dimmed" tt="capitalize">{(log.user?.role || '').replace('_', ' ')}</Text>
                          </div>
                        </Group>
                      </Table.Td>
                    )}

                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      <Text size="sm" fw={600} c="#0f172a">{formatDateDisplay(log.date)}</Text>
                      <Text size="xs" c="dimmed">Submitted {formatSubmittedTime(log.createdAt)}</Text>
                    </Table.Td>

                    <Table.Td>
                      {preview.length === 0 ? (
                        <Text size="sm" c="dimmed">No details</Text>
                      ) : (
                        <div>
                          {preview.map((e, i) => (
                            <Group key={i} gap={6} wrap="nowrap">
                              <ListChecks size={13} color={e.taskId ? '#2563eb' : '#94a3b8'} style={{ flexShrink: 0 }} />
                              <Text size="sm" c="#334155" truncate style={{ maxWidth: 380 }}>{e.title}</Text>
                            </Group>
                          ))}
                          {remaining > 0 && (
                            <Text size="xs" c="blue" fw={600} mt={2}>+{remaining} more</Text>
                          )}
                        </div>
                      )}
                    </Table.Td>

                    <Table.Td>
                      {projects.length === 0 ? (
                        <Badge variant="outline" color="gray" radius="sm">General</Badge>
                      ) : (
                        <Group gap={4}>
                          <Badge variant="light" color="blue" radius="sm" style={{ maxWidth: 180 }}>{projects[0]}</Badge>
                          {projects.length > 1 && (
                            <Tooltip label={projects.slice(1).join(', ')} withArrow>
                              <Badge variant="light" color="gray" radius="sm">+{projects.length - 1}</Badge>
                            </Tooltip>
                          )}
                        </Group>
                      )}
                    </Table.Td>

                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      {hours > 0 ? (
                        <Group gap={6} wrap="nowrap">
                          <Clock size={14} color="#0284c7" />
                          <Text size="sm" fw={700} c="#0369a1">{formatHours(hours)}</Text>
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">-</Text>
                      )}
                    </Table.Td>

                    <Table.Td>
                      <ChevronRight size={16} color="#94a3b8" />
                    </Table.Td>
                  </Table.Tr>
                );
              })}

              {logs.length === 0 && !isLoading && (
                <Table.Tr>
                  <Table.Td colSpan={columnCount} ta="center" py={48}>
                    <Text c="dimmed" fw={500}>{emptyMessage}</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </PaginatedTable>
    </Card>
  );
};
