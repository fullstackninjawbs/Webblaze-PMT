import React, { useEffect, useState } from 'react';
import { Badge, Group, Text, Tooltip } from '@mantine/core';
import { formatSecondsClock } from '../../utils/formatHours';

interface Props {
  startTime: string;
  /** Name of the person whose timer is running, shown in the tooltip. */
  userName?: string;
  size?: 'xs' | 'sm';
}

/** "Running" badge with a live clock counting from `startTime`. */
export const LiveTimer: React.FC<Props> = ({ startTime, userName, size = 'sm' }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));

  return (
    <Tooltip label={userName ? `${userName}'s timer is running` : 'Timer running'} withArrow>
      <Group gap={6} wrap="nowrap">
        <Badge color="blue" variant="filled" size={size} className="live-timer-badge">
          Running
        </Badge>
        <Text size={size} fw={700} c="blue.7" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {formatSecondsClock(elapsed)}
        </Text>
        <style>{`
          @keyframes liveTimerPulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
          .live-timer-badge { animation: liveTimerPulse 1.5s infinite; }
        `}</style>
      </Group>
    </Tooltip>
  );
};
