import React, { useEffect, useState } from 'react';
import { Drawer, Text, Group, Badge, Stack, Paper, SimpleGrid, Divider, Anchor } from '@mantine/core';
import { Calendar, Clock, Briefcase, ListChecks, StickyNote, AlertTriangle, ArrowUpRight, Target, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../../components/common/UserAvatar';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatHours } from '../../utils/formatHours';
import { DailyStatus } from './dailyStatus.slice';
import { LinkifiedText } from './LinkifiedText';
import {
  getTaskEntries,
  getNoteEntries,
  getProjectNames,
  getReportHours,
  TASK_STATUS_META,
  formatSubmittedTime,
} from './dailyStatusHelpers';

interface Props {
  log: DailyStatus | null;
  onClose: () => void;
}

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <Paper p="sm" radius="md" bg="#f8fafc" style={{ border: '1px solid #eef2f7' }}>
    <Group gap={6} mb={4}>
      {icon}
      <Text size="xs" fw={700} tt="uppercase" c="#64748b" style={{ letterSpacing: '0.05em' }}>{label}</Text>
    </Group>
    <Text size="sm" fw={700} c="#0f172a">{value}</Text>
  </Paper>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; count?: number }> = ({ icon, title, count }) => (
  <Group gap={8} mb="sm">
    {icon}
    <Text size="xs" fw={800} tt="uppercase" c="#475569" style={{ letterSpacing: '0.06em' }}>{title}</Text>
    {count !== undefined && <Badge size="xs" variant="light" color="gray">{count}</Badge>}
  </Group>
);

export const DailyStatusDetailDrawer: React.FC<Props> = ({ log: selectedLog, onClose }) => {
  const navigate = useNavigate();

  // Keep showing the last report while the drawer animates closed, so it slides out
  // on the right with its content instead of remounting empty on the default left side.
  const [lastLog, setLastLog] = useState<DailyStatus | null>(selectedLog);
  useEffect(() => {
    if (selectedLog) setLastLog(selectedLog);
  }, [selectedLog]);

  const log = selectedLog || lastLog;

  return (
    <Drawer
      opened={!!selectedLog}
      onClose={onClose}
      position="right"
      size={560}
      padding="xl"
      title={<Text fw={800} size="lg" c="#0f172a">Daily Status Report</Text>}
    >
      {log && <ReportBody log={log} onClose={onClose} navigate={navigate} />}
    </Drawer>
  );
};

const ReportBody: React.FC<{ log: DailyStatus; onClose: () => void; navigate: (to: string) => void }> = ({
  log,
  onClose,
  navigate,
}) => {
  const taskEntries = getTaskEntries(log);
  const notes = getNoteEntries(log);
  const projects = getProjectNames(log);
  const hours = getReportHours(log);

  const openTask = (taskId: string) => {
    onClose();
    navigate(`/tasks/${taskId}`);
  };

  return (
      <Stack gap="lg">
        {/* Who and when */}
        <Group gap="md" wrap="nowrap">
          <UserAvatar name={log.user?.name} avatarUrl={log.user?.avatarUrl} email={log.user?.email} size={48} />
          <div>
            <Text fw={700} size="md" c="#0f172a">{log.user?.name || 'Unknown User'}</Text>
            <Group gap={6}>
              <Badge size="xs" variant="light" color="indigo" tt="capitalize">{(log.user?.role || '').replace('_', ' ')}</Badge>
              {log.user?.department && (
                <Badge size="xs" variant="outline" color="gray" tt="uppercase">{log.user.department}</Badge>
              )}
            </Group>
          </div>
        </Group>

        <SimpleGrid cols={3} spacing="sm">
          <Stat icon={<Calendar size={14} color="#2563eb" />} label="Date" value={formatDateDisplay(log.date)} />
          <Stat icon={<Clock size={14} color="#0284c7" />} label="Time Logged" value={hours > 0 ? formatHours(hours) : '-'} />
          <Stat icon={<ListChecks size={14} color="#10b981" />} label="Tasks" value={taskEntries.length} />
        </SimpleGrid>

        {projects.length > 0 && (
          <Group gap={6}>
            <Briefcase size={14} color="#64748b" />
            {projects.map((p) => (
              <Badge key={p} variant="light" color="blue" radius="sm">{p}</Badge>
            ))}
          </Group>
        )}

        <Divider color="#eef2f7" />

        {/* Task lines */}
        {taskEntries.length > 0 && (
          <div>
            <SectionTitle icon={<Target size={15} color="#2563eb" />} title="Tasks Worked On" count={taskEntries.length} />
            <Stack gap="xs">
              {taskEntries.map((e, i) => {
                const status = e.status ? TASK_STATUS_META[e.status] : undefined;
                return (
                  <Paper key={`${e.taskId}-${i}`} p="md" radius="md" withBorder style={{ borderColor: '#e8ecf4' }}>
                    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                      <div style={{ minWidth: 0 }}>
                        <Anchor
                          component="button"
                          type="button"
                          onClick={() => openTask(e.taskId!)}
                          fw={700}
                          size="sm"
                          c="#1d4ed8"
                          style={{ textAlign: 'left' }}
                        >
                          <Group gap={4} wrap="nowrap">
                            <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}>{e.title}</span>
                            <ArrowUpRight size={14} style={{ flexShrink: 0 }} />
                          </Group>
                        </Anchor>
                        <Group gap={6} mt={6}>
                          {e.projectName && <Text size="xs" c="dimmed">{e.projectName}</Text>}
                          {status && (
                            <Badge size="xs" variant="light" color={status.color}>{status.label}</Badge>
                          )}
                        </Group>
                      </div>
                      <Badge
                        size="lg"
                        variant="light"
                        color={e.hours > 0 ? 'cyan' : 'gray'}
                        leftSection={<Clock size={12} />}
                        style={{ flexShrink: 0 }}
                      >
                        {e.hours > 0 ? formatHours(e.hours) : '0m'}
                      </Badge>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </div>
        )}

        {/* Free-text lines */}
        {notes.length > 0 && (
          <div>
            <SectionTitle
              icon={<StickyNote size={15} color="#f59e0b" />}
              title={taskEntries.length > 0 ? 'Other Updates' : 'Work Completed'}
              count={notes.length}
            />
            <Paper p="md" radius="md" bg="#f8fafc" style={{ border: '1px solid #eef2f7' }}>
              <Stack gap={8}>
                {notes.map((n, i) => (
                  <Group key={i} gap={8} align="flex-start" wrap="nowrap">
                    <Text size="sm" c="#94a3b8" fw={700} style={{ lineHeight: 1.6 }}>•</Text>
                    <Text size="sm" c="#334155" style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0, flex: 1 }}><LinkifiedText text={n.title} /></Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </div>
        )}

        {log.conclusion && (
          <Paper p="md" radius="md" bg="#eff6ff" style={{ border: '1px solid #dbeafe' }}>
            <SectionTitle icon={<FileText size={15} color="#2563eb" />} title="Day Summary" />
            <Text size="sm" c="#1e3a8a" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}><LinkifiedText text={log.conclusion} /></Text>
          </Paper>
        )}

        {log.plannedWork && (
          <div>
            <SectionTitle icon={<Calendar size={15} color="#6366f1" />} title="Planned Next" />
            <Text size="sm" c="#334155" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}><LinkifiedText text={log.plannedWork} /></Text>
          </div>
        )}

        {log.blockers && (
          <Paper p="md" radius="md" bg="#fef2f2" style={{ border: '1px solid #fecaca' }}>
            <SectionTitle icon={<AlertTriangle size={15} color="#dc2626" />} title="Blockers" />
            <Text size="sm" c="#7f1d1d" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}><LinkifiedText text={log.blockers} /></Text>
          </Paper>
        )}

        <Text size="xs" c="dimmed" ta="right">
          Submitted at {formatSubmittedTime(log.createdAt)}
          {log.updatedAt && log.updatedAt !== log.createdAt ? ` · Updated at ${formatSubmittedTime(log.updatedAt)}` : ''}
        </Text>
      </Stack>
  );
};
