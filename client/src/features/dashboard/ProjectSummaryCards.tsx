import React from 'react';
import { Card, Text, Group, Box } from '@mantine/core';
import { Briefcase, Activity, Clock, Server } from 'lucide-react';
import { Project } from '../projects/project.slice';

interface Props {
  projects: Project[];
}

export const ProjectSummaryCards: React.FC<Props> = ({ projects }) => {
  const total = projects.length;
  const active = projects.filter((p) => p.status === 'active').length;
  const onHold = projects.filter((p) => p.status === 'on_hold').length;
  const maintenance = projects.filter((p) => p.status === 'maintenance').length;

  const stats = [
    { label: 'Total Projects', value: total, icon: Briefcase, color: '#0ea5e9', bg: '#f0f9ff' },
    { label: 'Active Projects', value: active, icon: Activity, color: '#eab308', bg: '#fefce8' },
    { label: 'On-Hold Projects', value: onHold, icon: Clock, color: '#f43f5e', bg: '#fff1f2' },
    { label: 'Maintenance', value: maintenance, icon: Server, color: '#6366f1', bg: '#eef2ff' },
  ];

  return (
    <Box
      mb="lg"
      style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        pb: '8px',
        scrollbarWidth: 'thin',
      }}
    >
      {stats.map((stat, idx) => (
        <Card
          key={idx}
          shadow="sm"
          p="md"
          radius="lg"
          withBorder
          style={{
            flex: '1 1 220px',
            minWidth: '220px',
          }}
        >
          <Group justify="space-between" align="flex-start" mb="xs">
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: stat.bg }}>
              <stat.icon size={20} color={stat.color} />
            </div>
          </Group>
          <Text fw={800} style={{ fontSize: '28px', color: '#111827', lineHeight: 1 }}>{stat.value}</Text>
          <Text size="xs" c="dimmed" fw={600} mt={6}>{stat.label}</Text>
        </Card>
      ))}
    </Box>
  );
};
