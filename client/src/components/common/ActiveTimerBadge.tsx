import React, { useEffect, useState } from 'react';
import { Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { Play, Square } from 'lucide-react';
import { useGetActiveTimerQuery, useStopTimerMutation } from '../../features/timelogs/timeLog.slice';

export const ActiveTimerBadge: React.FC = () => {
  const { data: activeTimerData } = useGetActiveTimerQuery();
  const [stopTimer, { isLoading }] = useStopTimerMutation();
  const [elapsed, setElapsed] = useState(0);

  const activeTimer = activeTimerData?.data;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (activeTimer) {
      const startTime = new Date(activeTimer.startTime).getTime();
      
      // Initial calculation
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
      
      // Update every second
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
  const projectTitle = typeof activeTimer.task === 'object' && typeof activeTimer.task.milestone === 'object' && typeof activeTimer.task.milestone.project === 'object' ? activeTimer.task.milestone.project.name : '';

  return (
    <Group gap="xl" style={{ width: '100%', justifyContent: 'space-between' }}>
      <Group gap="md">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', backgroundColor: '#fff', color: '#3b82f6', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <Play size={18} fill="currentColor" style={{ marginLeft: 3 }} />
        </div>
        
        <div>
          <Text size="xs" color="dimmed" fw={600} style={{ lineHeight: 1.2 }}>Tracking: {projectTitle}</Text>
          <Text size="sm" fw={700} style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#111827' }}>
            {taskTitle}
          </Text>
        </div>
      </Group>
      
      <Group gap="lg">
        <Text fw={700} size="xl" style={{ fontFamily: 'monospace', color: '#1e293b', minWidth: '90px', textAlign: 'right', letterSpacing: '1px' }}>
          {formatTime(elapsed)}
        </Text>
        
        <Tooltip label="Stop Timer">
          <ActionIcon color="red" variant="filled" size="lg" radius="md" onClick={handleStop} loading={isLoading} style={{ boxShadow: '0 2px 5px rgba(239,68,68,0.3)' }}>
            <Square size={16} fill="currentColor" />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
};
