import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, TextInput, Text, Group, Stack, Badge, UnstyledButton, Box, ScrollArea, Kbd, Divider } from '@mantine/core';
import { Search, Briefcase, CheckSquare, Users, DollarSign, CornerDownLeft, Clock } from 'lucide-react';
import { useGetProjectsQuery } from '../../features/projects/project.slice';
import { useGetAllTasksQuery } from '../../features/tasks/task.slice';
import { useGetClientsQuery } from '../../features/clients/client.slice';
import { useGetInvoicesQuery } from '../../features/invoices/invoice.slice';
import { useGetUsersQuery } from '../../features/users/user.slice';

const RECENT_KEY = 'pmt_recent_searches';
const MAX_RECENT = 5;

interface GlobalSearchModalProps {
  opened: boolean;
  onClose: () => void;
}

export const GlobalSearchModal = ({ opened, onClose }: GlobalSearchModalProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { data: projectsData } = useGetProjectsQuery(undefined, { skip: !opened });
  const { data: tasksData } = useGetAllTasksQuery(undefined, { skip: !opened });
  const { data: clientsData } = useGetClientsQuery(undefined, { skip: !opened });
  const { data: invoicesData } = useGetInvoicesQuery(undefined, { skip: !opened });
  const { data: usersData } = useGetUsersQuery(undefined, { skip: !opened });

  const projects = projectsData?.data || [];
  const tasks = tasksData?.data || [];
  const clients = clientsData?.data || [];
  const invoices = invoicesData?.data || [];
  const users = usersData?.data || [];

  // Load recent searches
  useEffect(() => {
    if (opened) {
      try {
        const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        setRecentSearches(stored);
      } catch {
        setRecentSearches([]);
      }
    }
  }, [opened]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(r => r !== term)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'PROJECTS' | 'TASKS' | 'CLIENTS' | 'INVOICES' | 'TEAM';
      icon: any;
      badgeText?: string;
      badgeColor?: string;
      onSelect: () => void;
    }> = [];

    // 1. Projects
    projects.forEach((p) => {
      if (p.name?.toLowerCase().includes(trimmed) || (p.client as any)?.name?.toLowerCase().includes(trimmed)) {
        items.push({
          id: `project-${p._id}`,
          title: p.name,
          subtitle: `Client: ${(p.client as any)?.name || 'Inhouse'}`,
          category: 'PROJECTS',
          icon: Briefcase,
          badgeText: p.status?.replace('_', ' '),
          badgeColor: p.status === 'active' ? 'green' : 'blue',
          onSelect: () => { navigate(`/projects/${p._id}`); saveRecentSearch(p.name); onClose(); },
        });
      }
    });

    // 2. Tasks
    tasks.forEach((t: any) => {
      if (t.title?.toLowerCase().includes(trimmed) || t.department?.toLowerCase().includes(trimmed)) {
        items.push({
          id: `task-${t._id}`,
          title: t.title,
          subtitle: `Dept: ${t.department || 'N/A'} • Status: ${t.status?.replace('_', ' ')}`,
          category: 'TASKS',
          icon: CheckSquare,
          badgeText: `${t.estimatedHours}h`,
          badgeColor: 'indigo',
          onSelect: () => { navigate(`/tasks/${t._id}`); saveRecentSearch(t.title); onClose(); },
        });
      }
    });

    // 3. Clients
    clients.forEach((c: any) => {
      if (c.name?.toLowerCase().includes(trimmed) || c.companyName?.toLowerCase().includes(trimmed) || c.email?.toLowerCase().includes(trimmed)) {
        items.push({
          id: `client-${c._id}`,
          title: c.name,
          subtitle: `${c.companyName || c.email || 'Client'}`,
          category: 'CLIENTS',
          icon: Users,
          badgeText: c.source || 'Direct',
          badgeColor: 'teal',
          onSelect: () => { navigate(`/clients/${c._id}`); saveRecentSearch(c.name); onClose(); },
        });
      }
    });

    // 4. Invoices
    invoices.forEach((inv: any) => {
      const projectName = typeof inv.project === 'object' ? inv.project?.name : '';
      if (inv.invoiceNumber?.toLowerCase().includes(trimmed) || projectName?.toLowerCase().includes(trimmed)) {
        items.push({
          id: `invoice-${inv._id}`,
          title: inv.invoiceNumber,
          subtitle: `Project: ${projectName || 'N/A'} • $${inv.totalAmount?.toLocaleString()}`,
          category: 'INVOICES',
          icon: DollarSign,
          badgeText: inv.status,
          badgeColor: inv.status === 'paid' ? 'green' : inv.status === 'overdue' ? 'red' : 'yellow',
          onSelect: () => { navigate('/invoices'); saveRecentSearch(inv.invoiceNumber); onClose(); },
        });
      }
    });

    // 5. Team Members
    users.forEach((u: any) => {
      if (u.name?.toLowerCase().includes(trimmed) || u.email?.toLowerCase().includes(trimmed) || u.role?.toLowerCase().includes(trimmed) || u.department?.toLowerCase().includes(trimmed)) {
        items.push({
          id: `user-${u._id}`,
          title: u.name,
          subtitle: `${u.role?.replace('_', ' ')} • ${u.department || u.email}`,
          category: 'TEAM',
          icon: Users,
          badgeText: u.role?.replace('_', ' '),
          badgeColor: u.role === 'admin' ? 'red' : u.role === 'pm' ? 'violet' : 'blue',
          onSelect: () => { navigate(`/team/${u._id}`); saveRecentSearch(u.name); onClose(); },
        });
      }
    });

    return items.slice(0, 15);
  }, [query, projects, tasks, clients, invoices, users, navigate, onClose]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((prev) => (prev + 1) % results.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((prev) => (prev - 1 + results.length) % results.length); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[selectedIndex]) results[selectedIndex].onSelect(); }
  };

  const categoryColors: Record<string, string> = {
    PROJECTS: '#2563eb', TASKS: '#7c3aed', CLIENTS: '#0891b2', INVOICES: '#d97706', TEAM: '#059669',
  };

  return (
    <Modal
      opened={opened}
      onClose={() => { setQuery(''); onClose(); }}
      size="lg"
      withCloseButton={false}
      radius="xl"
      padding={0}
      styles={{
        content: {
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
        },
      }}
    >
      <Box p="md" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <TextInput
          placeholder="Search projects, tasks, clients, team members..."
          leftSection={<Search size={18} color="#64748b" />}
          rightSection={<Kbd size="xs">Esc</Kbd>}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          variant="unstyled"
          styles={{ input: { fontSize: '1rem', fontWeight: 500, color: '#0f172a' } }}
        />
      </Box>

      <ScrollArea h={400} p="xs">
        {query.trim().length === 0 ? (
          <Box py="md">
            {recentSearches.length > 0 && (
              <>
                <Text size="xs" fw={700} c="dimmed" px="sm" mb="xs" tt="uppercase">Recent Searches</Text>
                <Stack gap={2} mb="md">
                  {recentSearches.map((term, i) => (
                    <UnstyledButton
                      key={i}
                      onClick={() => setQuery(term)}
                      style={{ padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 8 }}
                      styles={{ root: { '&:hover': { backgroundColor: '#f8fafc' } } }}
                    >
                      <Clock size={14} color="#94a3b8" />
                      <Text size="sm" c="dimmed">{term}</Text>
                    </UnstyledButton>
                  ))}
                </Stack>
                <Divider mb="md" />
              </>
            )}
            <Box ta="center" py="lg">
              <Search size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
              <Text size="sm" fw={600} c="#475569">Type to search across WebBlaze PMT</Text>
              <Group justify="center" gap="xs" mt="xs">
                <Badge variant="dot" size="sm" color="blue">Projects</Badge>
                <Badge variant="dot" size="sm" color="violet">Tasks</Badge>
                <Badge variant="dot" size="sm" color="teal">Clients</Badge>
                <Badge variant="dot" size="sm" color="orange">Invoices</Badge>
                <Badge variant="dot" size="sm" color="green">Team</Badge>
              </Group>
            </Box>
          </Box>
        ) : results.length === 0 ? (
          <Box py={30} ta="center">
            <Text size="sm" c="dimmed">No results found for "{query}"</Text>
          </Box>
        ) : (
          <Stack gap={2} p="xs">
            {results.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <UnstyledButton
                  key={item.id}
                  onClick={item.onSelect}
                  style={{
                    display: 'block', width: '100%', padding: '10px 12px', borderRadius: '10px',
                    backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
                    border: isSelected ? '1px solid #bae6fd' : '1px solid transparent',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <div style={{
                        width: 34, height: 34, borderRadius: '8px', flexShrink: 0,
                        backgroundColor: isSelected ? categoryColors[item.category] || '#0284c7' : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isSelected ? '#ffffff' : '#64748b',
                      }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <Text size="sm" fw={700} style={{ color: isSelected ? '#0369a1' : '#0f172a' }}>{item.title}</Text>
                        <Text size="xs" c="dimmed">{item.subtitle}</Text>
                      </div>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      {item.badgeText && (
                        <Badge size="xs" variant="light" color={item.badgeColor || 'gray'}>{item.badgeText}</Badge>
                      )}
                      <Badge size="xs" variant="outline" color="gray">{item.category}</Badge>
                      {isSelected && <CornerDownLeft size={14} color="#0284c7" />}
                    </Group>
                  </Group>
                </UnstyledButton>
              );
            })}
          </Stack>
        )}
      </ScrollArea>

      <Box p="xs" bg="#f8fafc" style={{ borderTop: '1px solid #f1f5f9' }}>
        <Group justify="space-between" px="xs">
          <Group gap="xs">
            <Text size="xs" c="dimmed">Use <Kbd size="xs">↑</Kbd> <Kbd size="xs">↓</Kbd> to navigate</Text>
            <Text size="xs" c="dimmed">• <Kbd size="xs">↵</Kbd> to select</Text>
          </Group>
          <Text size="xs" c="dimmed">WebBlaze PMT • <Kbd size="xs">Ctrl K</Kbd></Text>
        </Group>
      </Box>
    </Modal>
  );
};
