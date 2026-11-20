import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, Title, Text, Group, Paper, Stack, ActionIcon, Button, Badge, Loader, Center, Tooltip, Anchor, Textarea,
} from '@mantine/core';
import { Sparkles, Send, Trash2, Clock, ExternalLink, ListChecks, PenLine } from 'lucide-react';
import { useGetMyEodSummaryQuery, EodTask } from '../timelogs/timeLog.slice';
import { useSubmitDailyStatusMutation } from './dailyStatus.slice';
import { formatHours } from '../../utils/formatHours';
import { TASK_STATUS_META } from './dailyStatusHelpers';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** True when the user already submitted a report today; submitting updates it. */
  isUpdate?: boolean;
}

interface Row {
  key: string;
  text: string;
  taskId?: string;
  projectName?: string;
  status?: string;
  hoursToday?: number;
  isRunning?: boolean;
  movedToReview?: boolean;
  inReview?: boolean;
  /** Total hours ever logged on the task. */
  totalLogged?: number;
}

let rowSeq = 0;
const newKey = () => `row-${++rowSeq}`;
const emptyRow = (): Row => ({ key: newKey(), text: '' });

/** There is always exactly one blank line at the end for adding a new point. */
const withTrailingBlank = (rows: Row[]): Row[] => {
  const last = rows[rows.length - 1];
  if (!last || last.text.trim() !== '' || last.taskId) return [...rows, emptyRow()];
  return rows;
};

const rowsFromTasks = (projects: { name: string; tasks: EodTask[] }[]): Row[] =>
  projects.flatMap((p) =>
    p.tasks.map((t) => ({
      key: newKey(),
      // The review comment says what was done; fall back to the task title
      text: t.reviewNote || t.title,
      movedToReview: t.movedToReviewToday,
      inReview: t.inReview,
      totalLogged: t.spentHours,
      taskId: t.id,
      projectName: p.name,
      status: t.status,
      hoursToday: t.hoursToday,
      isRunning: t.isRunning,
    }))
  );

export const EodSubmitModal: React.FC<Props> = ({ opened, onClose, isUpdate = false }) => {
  const { data, isFetching } = useGetMyEodSummaryQuery(undefined, { skip: !opened });
  const [submitDailyStatus, { isLoading: isSubmitting }] = useSubmitDailyStatusMutation();

  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState('');
  const prefilled = useRef(false);

  const projects = data?.data?.projects || [];
  const totalHours = data?.data?.totalHours || 0;
  const taskCount = projects.reduce((sum, p) => sum + p.tasks.length, 0);

  // Prefill once per opening, after today's summary has loaded
  useEffect(() => {
    if (!opened) {
      prefilled.current = false;
      setRows([emptyRow()]);
      setError(null);
      setConclusion('');
      return;
    }
    if (isFetching || !data || prefilled.current) return;
    prefilled.current = true;
    setRows(withTrailingBlank(rowsFromTasks(data.data.projects)));
  }, [opened, isFetching, data]);

  const updateText = (key: string, text: string) => {
    setError(null);
    setRows((prev) => withTrailingBlank(prev.map((r) => (r.key === key ? { ...r, text } : r))));
  };

  const removeRow = (key: string) => {
    setRows((prev) => withTrailingBlank(prev.filter((r) => r.key !== key)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filled = rows.filter((r) => r.text.trim() !== '');
    if (filled.length === 0) {
      setError('Add at least one point describing your work');
      return;
    }

    try {
      const res = await submitDailyStatus({
        workDone: filled.map((r) => `- ${r.text.trim()}`).join('\n'),
        entries: filled.map((r) => ({ task: r.taskId, title: r.text.trim() })),
        conclusion: conclusion.trim() || undefined,
      }).unwrap();
      notifications.show({
        color: 'green',
        title: res.updated ? 'Report updated' : 'Report submitted',
        message: res.updated ? "Your points were added to today's report." : 'Your end-of-day report was submitted.',
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit status:', err);
    }
  };

  const lastIndex = rows.length - 1;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      radius="xl"
      centered
      title={
        <Group gap="xs">
          <Paper p={6} radius="md" bg="#eff6ff">
            <Sparkles size={18} color="#2563eb" />
          </Paper>
          <Title order={4} style={{ color: '#0f172a', fontWeight: 800 }}>
            {isUpdate ? "Update Today's EOD Report" : 'Submit End-of-Day (EOD) Report'}
          </Title>
        </Group>
      }
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {isUpdate && (
            <Paper p="sm" radius="md" bg="#fffbeb" style={{ border: '1px solid #fde68a' }}>
              <Text size="xs" c="#92400e">
                You already submitted a report today. These points will be added to it, and task hours will be refreshed. Your earlier points are kept.
              </Text>
            </Paper>
          )}
          {/* Today at a glance */}
          <Paper p="md" radius="lg" bg="#f8fafc" style={{ border: '1px solid #eef2f7' }}>
            {isFetching ? (
              <Center><Loader size="sm" /></Center>
            ) : (
              <Group justify="space-between">
                <Group gap="xs">
                  <ListChecks size={16} color="#2563eb" />
                  <Text size="sm" fw={600} c="#0f172a">
                    {taskCount > 0
                      ? `${taskCount} task${taskCount === 1 ? '' : 's'} worked on today`
                      : 'No time logged today'}
                  </Text>
                </Group>
                <Badge size="lg" variant="light" color="cyan" leftSection={<Clock size={12} />}>
                  {formatHours(totalHours)} logged today
                </Badge>
              </Group>
            )}
          </Paper>

          <Text size="sm" fw={600} c="#0f172a">
            Work Completed Today <Text component="span" c="red">*</Text>
          </Text>
          <Text size="xs" c="dimmed" mt={-12}>
            Tasks you logged time on today are added for you. Edit the text to describe what you did, or use the blank line to add anything else.
          </Text>

          <Stack gap="sm">
            {rows.map((row, index) => {
              const isTrailingBlank = index === lastIndex && !row.taskId && row.text.trim() === '';
              const status = row.status ? TASK_STATUS_META[row.status] : undefined;

              return (
                <Paper
                  key={row.key}
                  p="sm"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: row.taskId ? '#bfdbfe' : '#e8ecf4',
                    background: row.taskId ? '#f8fbff' : '#ffffff',
                    borderStyle: isTrailingBlank ? 'dashed' : 'solid',
                  }}
                >
                  {row.taskId && (
                    <Group justify="space-between" mb={6} wrap="nowrap">
                      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                        <Tooltip label="Open task in a new tab" withArrow>
                          <Anchor
                            href={`/tasks/${row.taskId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="xs"
                            fw={700}
                            c="#1d4ed8"
                          >
                            <Group gap={4} wrap="nowrap">
                              <ExternalLink size={12} />
                              <span>View task</span>
                            </Group>
                          </Anchor>
                        </Tooltip>
                        {row.projectName && (
                          <Text size="xs" c="dimmed" truncate>• {row.projectName}</Text>
                        )}
                        {status && <Badge size="xs" variant="light" color={status.color}>{status.label}</Badge>}
                      </Group>
                      <Group gap={6} wrap="nowrap">
                        {row.movedToReview ? (
                          <Badge size="xs" color="grape" variant="filled">Sent to review today</Badge>
                        ) : row.inReview ? (
                          <Badge size="xs" color="grape" variant="light">In review</Badge>
                        ) : null}
                        {row.isRunning && (
                          <Badge size="xs" color="blue" variant="filled">Running</Badge>
                        )}
                        <Badge size="sm" variant="light" color="cyan" leftSection={<Clock size={11} />}>
                          {formatHours(row.hoursToday || 0)} today
                        </Badge>
                        <Tooltip label="Total time logged on this task" withArrow>
                          <Badge size="sm" variant="outline" color="gray">
                            {formatHours(row.totalLogged || 0)} total
                          </Badge>
                        </Tooltip>
                      </Group>
                    </Group>
                  )}

                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    <Textarea
                      autosize
                      minRows={1}
                      maxRows={8}
                      style={{ flexGrow: 1 }}
                      variant={row.taskId ? 'filled' : 'default'}
                      leftSection={row.taskId ? <ListChecks size={14} color="#2563eb" /> : <PenLine size={14} color="#94a3b8" />}
                      placeholder={isTrailingBlank ? 'Add another point, e.g. Reviewed PR for checkout flow' : 'Describe the work'}
                      radius="md"
                      value={row.text}
                      onChange={(e) => updateText(row.key, e.currentTarget.value)}
                    />
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeRow(row.key)}
                      disabled={isTrailingBlank}
                      aria-label="Remove point"
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Group>
                </Paper>
              );
            })}
          </Stack>

          {error && <Text c="red" size="xs">{error}</Text>}

          <Textarea
            label="Day summary (optional)"
            description="A short conclusion for the day: overall progress, what's next, anything the PM should know."
            placeholder="E.g., Checkout redesign is ready for review; tomorrow I start on the mobile menu."
            value={conclusion}
            onChange={(e) => setConclusion(e.currentTarget.value)}
            autosize
            minRows={2}
            maxRows={5}
            radius="md"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={onClose} radius="md">
              Cancel
            </Button>
            <Button
              type="submit"
              leftSection={<Send size={16} />}
              loading={isSubmitting}
              size="md"
              radius="md"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
              }}
            >
              {isUpdate ? 'Update Report' : 'Submit EOD Report'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
