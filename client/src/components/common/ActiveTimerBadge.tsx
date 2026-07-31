import React, { useEffect, useRef, useState } from 'react';
import { Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { Clock, Square } from 'lucide-react';
import { useGetActiveTimerQuery, useStopTimerMutation } from '../../features/timelogs/timeLog.slice';
import { useGetTaskByIdQuery } from '../../features/tasks/task.slice';

export const ActiveTimerBadge: React.FC = () => {
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const [stopTimer, { isLoading }] = useStopTimerMutation();
  const [elapsed, setElapsed] = useState(0);
  const autoStoppedRef = useRef(false); // prevent double-fire

  const activeTimer = activeTimerData?.data;
  const activeTaskId = activeTimer
    ? typeof activeTimer.task === 'object'
      ? activeTimer.task._id
      : activeTimer.task
    : undefined;

  // Fetch the active task to get estimatedHours & spentHours
  const { data: activeTaskData } = useGetTaskByIdQuery(activeTaskId!, {
    skip: !activeTaskId,
  });
  const activeTask = activeTaskData?.data;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (activeTimer) {
      autoStoppedRef.current = false; // reset on new timer
      const startTime = new Date(activeTimer.startTime).getTime();

      setElapsed(Math.floor((Date.now() - startTime) / 1000));

      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  // Auto-stop when progress reaches 100%
  useEffect(() => {
    if (!activeTimer || !activeTask || autoStoppedRef.current) return;
    const totalSpent = (activeTask.spentHours || 0) + elapsed / 3600;
    if (totalSpent >= activeTask.estimatedHours && activeTask.status !== 'completed') {
      autoStoppedRef.current = true;
      stopTimer({}).catch(console.error);
    }
  }, [elapsed]);

  const handleStop = async () => {
    try {
      await stopTimer({}).unwrap();
    } catch (error) {
      console.error('Failed to stop timer', error);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hDisplay = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
    const mDisplay = `${minutes.toString().padStart(2, '0')}:`;
    const sDisplay = `${seconds.toString().padStart(2, '0')}`;

    return `${hDisplay}${mDisplay}${sDisplay}`;
  };

  if (!activeTimer) return null;

  const taskTitle = typeof activeTimer.task === 'object' ? activeTimer.task.title : 'Unknown Task';
  const projectTitle =
    typeof activeTimer.task === 'object' &&
    typeof activeTimer.task.milestone === 'object' &&
    typeof activeTimer.task.milestone.project === 'object'
      ? activeTimer.task.milestone.project.name
      : '';

  // Progress percentage for display
  const estimatedSec = activeTask ? activeTask.estimatedHours * 3600 : 0;
  const spentSec = activeTask ? (activeTask.spentHours || 0) * 3600 : 0;
  const remainingSec = Math.max(estimatedSec - spentSec - elapsed, 0);
  const progressPct = estimatedSec > 0 ? Math.min(((spentSec + elapsed) / estimatedSec) * 100, 100) : 0;

  const formatTimeShort = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  };

  return (
    <Group gap="xl" style={{ width: '100%', justifyContent: 'space-between' }}>
      <Group gap="md">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: '#fff',
            color: progressPct >= 100 ? '#ef4444' : '#3b82f6',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          }}
        >
          <Clock size={18} />
        </div>

        <div>
          <Text size="xs" color="dimmed" fw={600} style={{ lineHeight: 1.2 }}>
            Tracking: {projectTitle}
          </Text>
          <Text
            size="sm"
            fw={700}
            style={{
              maxWidth: 300,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#111827',
            }}
          >
            {taskTitle}
          </Text>
          {activeTask && (
            <Text size="xs" style={{ color: progressPct >= 100 ? '#ef4444' : '#64748b' }}>
              {progressPct >= 100 ? '⚠ Estimated hours reached — auto-stopping…' : formatTimeShort(remainingSec)}
            </Text>
          )}
        </div>
      </Group>

      <Group gap="lg">
        <Text
          fw={700}
          size="xl"
          style={{
            fontFamily: 'monospace',
            color: progressPct >= 100 ? '#ef4444' : '#1e293b',
            minWidth: '90px',
            textAlign: 'right',
            letterSpacing: '1px',
          }}
        >
          {formatTime(elapsed)}
        </Text>

        <Tooltip label="Stop Timer">
          <ActionIcon
            color="red"
            variant="filled"
            size="lg"
            radius="md"
            onClick={handleStop}
            loading={isLoading}
            style={{ boxShadow: '0 2px 5px rgba(239,68,68,0.3)' }}
          >
            <Square size={16} fill="currentColor" />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
};
