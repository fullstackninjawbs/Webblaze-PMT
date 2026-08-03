import React, { useEffect, useRef, useState } from 'react';
import { Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
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
    <>
      <style>{`
        @keyframes timerPulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        @keyframes liveDotPulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes clockRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <Group gap="md" style={{ width: '100%', justifyContent: 'space-between' }} wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              color: progressPct >= 100 ? '#ef4444' : '#2563eb',
              boxShadow: '0 2px 6px rgba(37,99,235,0.15)',
              animation: 'timerPulseGlow 2s infinite ease-in-out',
              flexShrink: 0,
            }}
          >
            <Clock
              size={17}
              style={{
                animation: 'clockRotate 12s linear infinite',
              }}
            />
          </div>

          <div>
            <Group gap={6} align="center" wrap="nowrap" mb={1}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: progressPct >= 100 ? '#ef4444' : '#10b981',
                  animation: 'liveDotPulse 1.5s infinite ease-in-out',
                }}
              />
              <Text size="xs" fw={700} style={{ color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.1 }}>
                Tracking
              </Text>
              {projectTitle && (
                <Text size="xs" fw={600} style={{ color: '#64748b', lineHeight: 1.1 }}>
                  • {projectTitle}
                </Text>
              )}
            </Group>
            <Group gap="xs" align="center" wrap="nowrap">
              <Text
                size="sm"
                fw={700}
                style={{
                  maxWidth: 360,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#0f172a',
                  lineHeight: 1.2,
                }}
              >
                {taskTitle}
              </Text>
              {activeTask && (
                <Badge
                  size="xs"
                  variant="light"
                  color={progressPct >= 100 ? 'red' : 'blue'}
                  radius="sm"
                >
                  {progressPct >= 100 ? '⚠ Cap Reached' : formatTimeShort(remainingSec)}
                </Badge>
              )}
            </Group>
          </div>
        </Group>

        <Group gap="md" wrap="nowrap">
          <Text
            fw={700}
            size="md"
            style={{
              fontFamily: 'monospace',
              color: progressPct >= 100 ? '#ef4444' : '#0369a1',
              letterSpacing: '0.5px',
              background: 'rgba(224, 242, 254, 0.75)',
              padding: '3px 10px',
              borderRadius: '6px',
              border: '1px solid #bae6fd',
              display: 'inline-block',
              lineHeight: 1.2,
            }}
          >
            {formatTime(elapsed)}
          </Text>

          <Tooltip label="Stop Timer">
            <ActionIcon
              color="red"
              variant="filled"
              size="md"
              radius="md"
              onClick={handleStop}
              loading={isLoading}
              style={{ boxShadow: '0 2px 6px rgba(239,68,68,0.3)' }}
            >
              <Square size={14} fill="currentColor" />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </>
  );
};
