import React from 'react';
import { SimpleGrid, Card, Text, Group } from '@mantine/core';
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
    { label: 'Total Projects', value: total, icon: Briefcase, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Active Projects', value: active, icon: Activity, color: '#10b981', bg: '#ecfdf5' },
    { label: 'On-Hold Projects', value: onHold, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Maintenance', value: maintenance, icon: Server, color: '#6366f1', bg: '#eef2ff' },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
      {stats.map((stat, idx) => (
        <Card key={idx} shadow="sm" p="xl" radius="lg" withBorder>
          <Group justify="space-between" align="flex-start" mb="md">
            <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: stat.bg }}>
              <stat.icon size={24} color={stat.color} />
            </div>
            {/* Optional mini sparkline could go here, omitting for simplicity/cleanliness */}
          </Group>
          <Text fw={800} style={{ fontSize: '32px', color: '#111827', lineHeight: 1 }}>{stat.value}</Text>
          <Text size="sm" c="dimmed" fw={500} mt="sm">{stat.label}</Text>
        </Card>
      ))}
    </SimpleGrid>
  );
};
