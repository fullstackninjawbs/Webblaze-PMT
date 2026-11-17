import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  Container, Title, Text, Group, Tabs, Button, Select, Paper, SimpleGrid, TextInput, ActionIcon,
} from '@mantine/core';
import { Calendar, Users, Send, Search, Clock, Filter, X, FileText } from 'lucide-react';
import { RootState } from '../../app/store';
import { Role } from '../../types';
import { formatHours } from '../../utils/formatHours';
import { useGetMyDailyStatusesQuery, useGetTeamDailyStatusesQuery, DailyStatus as DailyStatusRecord } from './dailyStatus.slice';
import { DailyStatusTable } from './DailyStatusTable';
import { DailyStatusDetailDrawer } from './DailyStatusDetailDrawer';
import { EodSubmitModal } from './EodSubmitModal';
import { getEntries, getProjectNames, getReportHours } from './dailyStatusHelpers';

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

const KpiCard: React.FC<{ label: string; value: React.ReactNode; hint: string; icon: React.ReactNode; tint: string }> = ({
  label, value, hint, icon, tint,
}) => (
  <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
    <Group justify="space-between" mb="xs">
      <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>{label}</Text>
      <Paper p={8} radius="md" bg={tint}>{icon}</Paper>
    </Group>
    <Group align="flex-end" gap="xs">
      <Text fw={800} style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>{value}</Text>
      <Text size="xs" style={{ color: '#64748b' }} mb={2}>{hint}</Text>
    </Group>
  </Paper>
);

/** Matches a search string against member, task lines and projects. */
const matchesSearch = (log: DailyStatusRecord, query: string) => {
  if (!query) return true;
  const haystack = [
    log.user?.name,
    log.user?.email,
    ...getEntries(log).map((e) => e.title),
    ...getProjectNames(log),
    log.workDone,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
};

export const DailyStatus: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);

  const isManagement = user?.role === Role.ADMIN || user?.role === Role.PM || user?.role === Role.TEAM_LEAD;

  const [activeTab, setActiveTab] = useState<string | null>(isManagement ? 'team-status' : 'my-status');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [submitModalOpened, setSubmitModalOpened] = useState(searchParams.get('openEod') === 'true');
  React.useEffect(() => {
    if (searchParams.get('openEod')) {
      const next = new URLSearchParams(searchParams);
      next.delete('openEod');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedLog, setSelectedLog] = useState<DailyStatusRecord | null>(null);

  const { data: myLogsData, isLoading: isMyLogsLoading } = useGetMyDailyStatusesQuery();
  const { data: teamLogsData, isLoading: isTeamLogsLoading } = useGetTeamDailyStatusesQuery(undefined, { skip: !isManagement });

  const myLogs = myLogsData?.data || [];
  const teamLogs = teamLogsData?.data || [];

  const visibleSource = activeTab === 'team-status' ? teamLogs : myLogs;
  const query = searchQuery.trim().toLowerCase();

  // Project filter options come from the reports themselves
  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    visibleSource.forEach((log) => getProjectNames(log).forEach((n) => names.add(n)));
    return Array.from(names).sort().map((n) => ({ value: n, label: n }));
  }, [visibleSource]);

  const filterLogs = (logs: DailyStatusRecord[]) =>
    logs.filter((log) => matchesSearch(log, query) && (!projectFilter || getProjectNames(log).includes(projectFilter)));

  const filteredMyLogs = useMemo(() => filterLogs(myLogs), [myLogs, query, projectFilter]);
  const filteredTeamLogs = useMemo(() => filterLogs(teamLogs), [teamLogs, query, projectFilter]);

  const myToday = myLogs.find((l) => isToday(l.date));
  const teamToday = teamLogs.filter((l) => isToday(l.date));
  const teamHoursToday = teamToday.reduce((sum, l) => sum + getReportHours(l), 0);

  const handleTabChange = (val: string | null) => {
    setActiveTab(val);
    setProjectFilter(null);
  };

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* Header */}
      <Group justify="space-between" align="center" mb="xl">
        <div>
          <Title order={1} style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Daily Work Status
          </Title>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            End-of-day reports with the tasks worked on and time logged.
          </Text>
        </div>
        <Button
          leftSection={<Send size={16} />}
          onClick={() => setSubmitModalOpened(true)}
          size="md"
          radius="md"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
          }}
        >
          {myToday ? "Update Today's Report" : 'Submit EOD Report'}
        </Button>
      </Group>

      {/* KPIs */}
      <SimpleGrid cols={{ base: 1, sm: isManagement ? 3 : 2 }} spacing="md" mb="xl">
        <KpiCard
          label="My Reports"
          value={myLogs.length}
          hint={myToday ? 'Submitted today' : 'Not submitted today'}
          icon={<FileText size={18} color="#2563eb" />}
          tint="#eff6ff"
        />
        <KpiCard
          label="My Time Today"
          value={myToday ? formatHours(getReportHours(myToday)) : '-'}
          hint="from today's report"
          icon={<Clock size={18} color="#0284c7" />}
          tint="#ecfeff"
        />
        {isManagement && (
          <KpiCard
            label="Team Check-ins Today"
            value={teamToday.length}
            hint={teamHoursToday > 0 ? `${formatHours(teamHoursToday)} reported` : 'reports submitted'}
            icon={<Users size={18} color="#10b981" />}
            tint="#f0fdf4"
          />
        )}
      </SimpleGrid>

      <Tabs value={activeTab} onChange={handleTabChange} radius="lg">
        <Tabs.List style={{ borderBottom: '1px solid #e8ecf4' }} mb="lg">
          {isManagement && (
            <Tabs.Tab value="team-status" leftSection={<Users size={16} />}>
              Team Reports ({teamLogs.length})
            </Tabs.Tab>
          )}
          <Tabs.Tab value="my-status" leftSection={<Calendar size={16} />}>
            My Reports ({myLogs.length})
          </Tabs.Tab>
        </Tabs.List>

        {/* Shared search and filter */}
        <Paper p="md" radius="lg" withBorder mb="md" style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" wrap="wrap" gap="sm">
            <TextInput
              placeholder={activeTab === 'team-status' ? 'Search member, task or project...' : 'Search task or project...'}
              leftSection={<Search size={16} color="#94a3b8" />}
              rightSection={
                searchQuery ? (
                  <ActionIcon variant="subtle" size="sm" color="gray" onClick={() => setSearchQuery('')}>
                    <X size={14} />
                  </ActionIcon>
                ) : null
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              w={{ base: '100%', sm: 340 }}
              radius="md"
            />
            <Group gap="sm">
              <Filter size={16} color="#64748b" />
              <Select
                placeholder="All Projects"
                value={projectFilter}
                onChange={setProjectFilter}
                data={projectOptions}
                clearable
                searchable
                w={220}
                radius="md"
              />
            </Group>
          </Group>
        </Paper>

        {isManagement && (
          <Tabs.Panel value="team-status">
            <DailyStatusTable
              logs={filteredTeamLogs}
              showMember
              isLoading={isTeamLogsLoading}
              paginationPrefix="team_"
              emptyMessage={query || projectFilter ? 'No team reports match your filters.' : 'No team reports yet.'}
              onSelect={setSelectedLog}
            />
          </Tabs.Panel>
        )}

        <Tabs.Panel value="my-status">
          <DailyStatusTable
            logs={filteredMyLogs}
            showMember={false}
            isLoading={isMyLogsLoading}
            paginationPrefix="my_"
            emptyMessage={query || projectFilter ? 'No reports match your filters.' : 'You have not submitted any reports yet.'}
            onSelect={setSelectedLog}
          />
        </Tabs.Panel>
      </Tabs>

      <DailyStatusDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      <EodSubmitModal opened={submitModalOpened} onClose={() => setSubmitModalOpened(false)} isUpdate={!!myToday} />
    </Container>
  );
};

export default DailyStatus;
