import React, { useMemo, useState } from 'react';
import { SimpleGrid, Card, Text, Group, Badge, Stack, Button, Select, Table, Paper } from '@mantine/core';
import { useGetKpiSummaryQuery, useGetFollowUpQueueQuery } from '../proposals/proposalApi';
import { Target, TrendingUp, DollarSign, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SalesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<string>('all');
  
  const queryParams = useMemo(() => {
    if (dateRange === 'all') return {};
    const end = new Date();
    const start = new Date();
    if (dateRange === '30d') start.setDate(start.getDate() - 30);
    if (dateRange === '90d') start.setDate(start.getDate() - 90);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [dateRange]);

  const { data: kpi, isLoading: kpiLoading } = useGetKpiSummaryQuery(queryParams);
  const { data: followUps, isLoading: followUpsLoading } = useGetFollowUpQueueQuery();

  if (kpiLoading || followUpsLoading) return <div>Loading Sales KPI...</div>;

  return (
    <div className="space-y-6">
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>Sales & CRM Dashboard</Text>
        <Select 
          value={dateRange} 
          onChange={(v) => setDateRange(v || 'all')} 
          data={[
            { value: 'all', label: 'All Time' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
          ]} 
        />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              WIN RATE
            </Text>
            <Paper p={8} radius="md" bg="#f0fdf4">
              <Target size={18} color="#10b981" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
            {kpi?.winRate}%
          </Text>
          <Text size="xs" c="dimmed" mt={4} fw={500}>{kpi?.won} Won / {kpi?.lost} Lost</Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              WON REVENUE
            </Text>
            <Paper p={8} radius="md" bg="#eff6ff">
              <DollarSign size={18} color="#2563eb" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
            ${kpi?.totalRevenue?.toLocaleString()}
          </Text>
          <Text size="xs" c="dimmed" mt={4} fw={500}>Connect Cost: ${kpi?.totalConnectCost}</Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              AVG SALES CYCLE
            </Text>
            <Paper p={8} radius="md" bg="#fffbeb">
              <Clock size={18} color="#f59e0b" />
            </Paper>
          </Group>
          <Group align="flex-end" gap="xs">
            <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
              {kpi?.avgSalesCycle}
            </Text>
            <Text size="sm" c="dimmed" mb={4}>Days</Text>
          </Group>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              REPEAT CLIENTS
            </Text>
            <Paper p={8} radius="md" bg="#f5f3ff">
              <UserCheck size={18} color="#8b5cf6" />
            </Paper>
          </Group>
          <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
            {kpi?.repeatClientPercent}%
          </Text>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={2} spacing="lg" mt="xl">
        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Text size="lg" fw={700} mb="md" color="#0f172a">Quality Scores (Avg)</Text>
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={500} c="dimmed">JQS (Won Proposals)</Table.Td>
                <Table.Td align="right" fw={700}>{kpi?.avgJqsWon}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500} c="dimmed">JQS (Lost Proposals)</Table.Td>
                <Table.Td align="right" fw={700}>{kpi?.avgJqsLost}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500} c="dimmed">PQS (Won Proposals)</Table.Td>
                <Table.Td align="right" fw={700}>{kpi?.avgPqsWon}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500} c="dimmed">PQS (Lost Proposals)</Table.Td>
                <Table.Td align="right" fw={700}>{kpi?.avgPqsLost}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={700} color="#0f172a">Action Required: Follow-Up Queue</Text>
            <Badge color="red" variant="light" size="md" radius="sm" leftSection={<AlertTriangle size={12} />}>{followUps?.length || 0} Pending</Badge>
          </Group>
          
          <div className="overflow-y-auto max-h-[300px]" style={{ scrollbarWidth: 'thin' }}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ color: '#64748b' }}>Client</Table.Th>
                  <Table.Th style={{ color: '#64748b' }}>Due Date</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {followUps?.map((p: any) => (
                  <Table.Tr key={p._id}>
                    <Table.Td fw={600} color="#0f172a">{p.clientName || 'Unknown'}</Table.Td>
                    <Table.Td c="dimmed">{p.nextFollowUpDate ? new Date(p.nextFollowUpDate).toLocaleDateString() : 'Overdue'}</Table.Td>
                    <Table.Td ta="right">
                      <Button size="xs" variant="light" color="indigo" radius="md" onClick={() => navigate(`/proposals/${p._id}`)}>Act</Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {(!followUps || followUps.length === 0) && (
                  <Table.Tr>
                    <Table.Td colSpan={3} ta="center" c="dimmed" py="xl">No follow-ups due.</Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>
        </Paper>
      </SimpleGrid>
    </div>
  );
};
