import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Target, Send, Eye, MessageCircle, Phone, CheckCircle, Trophy, XCircle, Search, ArrowRight, Clock, LayoutList, LayoutDashboard } from 'lucide-react';
import { useGetProposalsQuery, useCreateProposalMutation, useUpdateProposalMutation } from './proposalApi';
import { PaginatedTable, usePagination } from '../../components/common/PaginatedTable';
import { Proposal } from './types';
import { Group, Title, Button, Card, Select, Badge, Table, Text, TextInput, Box, Stack, ActionIcon, Progress, ThemeIcon, Avatar, SegmentedControl } from '@mantine/core';
import { ProposalsBoard } from './ProposalsBoard';

// Badges for Proposal Stages with Icons and Premium Colors
const StageBadge: React.FC<{ stage?: Proposal['currentStage'] }> = ({ stage }) => {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    applied: { color: 'gray', icon: <Target size={12} />, label: 'Applied' },
    sent: { color: 'blue', icon: <Send size={12} />, label: 'Sent' },
    viewed: { color: 'grape', icon: <Eye size={12} />, label: 'Viewed' },
    replied: { color: 'yellow', icon: <MessageCircle size={12} />, label: 'Replied' },
    interview: { color: 'orange', icon: <Phone size={12} />, label: 'Interview' },
    offer: { color: 'teal', icon: <CheckCircle size={12} />, label: 'Offer' },
    won: { color: 'green', icon: <Trophy size={12} />, label: 'Won' },
    lost: { color: 'red', icon: <XCircle size={12} />, label: 'Lost' },
    no_response: { color: 'dark', icon: <Filter size={12} />, label: 'No Response' },
  };

  const current = stage ? config[stage] || config.applied : config.applied;

  return (
    <Badge 
      color={current.color} 
      variant="light" 
      size="md"
      radius="xl"
      leftSection={current.icon}
      styles={{
        root: { padding: '4px 12px', height: 'auto', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }
      }}
    >
      {current.label}
    </Badge>
  );
};

export const ProposalsList: React.FC = () => {
  const navigate = useNavigate();
  const { page, limit, setPage, setLimit } = usePagination();
  const [filters, setFilters] = useState<{ currentStage?: string; qualified?: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  
  const { data, isLoading } = useGetProposalsQuery(viewMode === 'list' ? { page, limit, ...filters } : { page: 1, limit: 500, ...filters });
  const [createProposal, { isLoading: isCreating }] = useCreateProposalMutation();
  const [updateProposal] = useUpdateProposalMutation();

  const handleCreate = async () => {
    try {
      const res = await createProposal({ 
        jobTitle: 'New Premium Proposal', 
        proposalCode: `P-${Math.floor(Math.random() * 10000)}` 
      }).unwrap();
      navigate(`/proposals/${res._id}`);
    } catch (err) {
      console.error('Failed to create proposal', err);
    }
  };

  // Filter local search for now if backend doesn't support search param yet
  const filteredData = data?.data?.filter(p => 
    !searchQuery || 
    p.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleStageChange = async (proposalId: string, newStage: string) => {
    // Map stage to boolean flags
    const payload: Partial<Proposal> = {};
    if (newStage === 'applied') {
      payload.proposalSent = false;
      payload.proposalViewed = false;
      payload.clientReplied = false;
      payload.interviewScheduled = false;
      payload.offerReceived = false;
      payload.hired = false;
      payload.lost = false;
    } else if (newStage === 'sent') {
      payload.proposalSent = true;
      payload.proposalViewed = false;
      payload.clientReplied = false;
      payload.interviewScheduled = false;
      payload.offerReceived = false;
      payload.hired = false;
      payload.lost = false;
    } else if (newStage === 'viewed') {
      payload.proposalSent = true;
      payload.proposalViewed = true;
      payload.clientReplied = false;
      payload.interviewScheduled = false;
      payload.offerReceived = false;
      payload.hired = false;
      payload.lost = false;
    } else if (newStage === 'replied') {
      payload.proposalSent = true;
      payload.clientReplied = true;
      payload.interviewScheduled = false;
      payload.offerReceived = false;
      payload.hired = false;
      payload.lost = false;
    } else if (newStage === 'interview') {
      payload.proposalSent = true;
      payload.clientReplied = true;
      payload.interviewScheduled = true;
      payload.offerReceived = false;
      payload.hired = false;
      payload.lost = false;
    } else if (newStage === 'offer') {
      payload.proposalSent = true;
      payload.clientReplied = true;
      payload.offerReceived = true;
      payload.hired = false;
      payload.lost = false;
    } else if (newStage === 'won') {
      payload.proposalSent = true;
      payload.clientReplied = true;
      payload.hired = true;
      payload.lost = false;
    } else if (newStage === 'lost') {
      payload.lost = true;
      payload.hired = false;
    }
    
    try {
      await updateProposal({ id: proposalId, data: payload }).unwrap();
    } catch (err) {
      console.error('Failed to update stage', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '48px', animation: 'fade-in 0.4s ease-out' }}>
      
      {/* Premium Header Banner */}
      <Box 
        p="xl" 
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          color: '#0f172a',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', filter: 'blur(30px)' }} />
        
        <Group justify="space-between" align="center" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <Title order={1} style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Sales Pipeline</Title>
            <Text opacity={0.9} mt={4} size="md">Track, manage, and convert your active proposals.</Text>
          </div>
          <Button
            onClick={handleCreate}
            loading={isCreating}
            leftSection={<Plus size={18} />}
            color="indigo"
            size="md"
            radius="md"
            style={{ 
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.2)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Create Proposal
          </Button>
        </Group>
      </Box>

      {/* Modern Filter & Search Bar */}
      <Card shadow="sm" radius="lg" p="md" withBorder style={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9' }}>
        <Group justify="space-between" align="center">
          <Group gap="md">
            <TextInput
              placeholder="Search clients or jobs..."
              leftSection={<Search size={16} color="#94a3b8" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              radius="md"
              w={{ base: '100%', sm: 300 }}
              styles={{ input: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', transition: 'all 0.2s ease', '&:focus': { borderColor: '#3b82f6', backgroundColor: '#fff', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' } } }}
            />
            
            <Select
              placeholder="All Stages"
              data={[
                { value: 'applied', label: 'Applied' },
                { value: 'sent', label: 'Sent' },
                { value: 'viewed', label: 'Viewed' },
                { value: 'replied', label: 'Replied' },
                { value: 'interview', label: 'Interview' },
                { value: 'offer', label: 'Offer' },
                { value: 'won', label: 'Won' },
                { value: 'lost', label: 'Lost' },
                { value: 'no_response', label: 'No Response' },
              ]}
              value={filters.currentStage || null}
              onChange={(val) => setFilters(prev => ({ ...prev, currentStage: val || undefined }))}
              clearable
              radius="md"
              w={200}
              styles={{ input: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' } }}
              leftSection={<Filter size={14} color="#94a3b8" />}
            />

            <Select
              placeholder="Qualification"
              data={[
                { value: 'true', label: 'Qualified (JQS >= 7)' },
                { value: 'false', label: 'Unqualified (JQS < 7)' }
              ]}
              value={filters.qualified !== undefined ? String(filters.qualified) : null}
              onChange={(val) => setFilters(prev => ({ ...prev, qualified: val === null ? undefined : val === 'true' }))}
              clearable
              radius="md"
              w={200}
              styles={{ input: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' } }}
            />
          </Group>
          
          <SegmentedControl
            value={viewMode}
            onChange={(val) => setViewMode(val as 'list' | 'board')}
            data={[
              { label: <Group gap="xs"><LayoutList size={16} /><Text size="sm">List</Text></Group>, value: 'list' },
              { label: <Group gap="xs"><LayoutDashboard size={16} /><Text size="sm">Board</Text></Group>, value: 'board' },
            ]}
            radius="md"
            size="sm"
            color="indigo"
          />
        </Group>
      </Card>

      {/* Main Content Area */}
      {viewMode === 'board' ? (
        <ProposalsBoard proposals={filteredData} onStageChange={handleStageChange} />
      ) : (
      <Card shadow="sm" radius="lg" p={0} withBorder style={{ borderColor: '#f1f5f9', overflow: 'hidden' }}>
        <PaginatedTable
          meta={data?.meta || { page, limit, total: 0, totalPages: 0 }}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isLoading={isLoading}
        >
          <Table verticalSpacing="lg" horizontalSpacing="xl" style={{ minWidth: 800 }}>
            <Table.Thead bg="#f8fafc">
              <Table.Tr>
                <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client & Job details</Table.Th>
                <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Stage</Table.Th>
                <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quality Scores</Table.Th>
                <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</Table.Th>
                <Table.Th ta="right" style={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredData.map((proposal) => {
                const jqs = proposal.jobQualityScore || 0;
                const pqs = proposal.proposalQualityScore || 0;
                
                return (
                  <Table.Tr 
                    key={proposal._id} 
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => navigate(`/proposals/${proposal._id}`)}
                    className="hover-row"
                  >
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Avatar color="indigo" radius="md" size="md">
                          {(proposal.clientName || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={700} c="gray.9" style={{ lineHeight: 1.2 }}>
                            {proposal.clientName || 'Unknown Client'}
                          </Text>
                          <Text size="xs" c="dimmed" mt={2} truncate style={{ maxWidth: 250 }}>
                            {proposal.jobTitle || 'Untitled Job'}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    
                    <Table.Td>
                      <StageBadge stage={proposal.currentStage} />
                    </Table.Td>
                    
                    <Table.Td>
                      <Group gap="xl">
                        <div>
                          <Text size="xs" c="dimmed" fw={600} mb={2}>JQS</Text>
                          <Group gap="xs">
                            <Text size="sm" fw={700} c={proposal.qualified ? 'green.6' : 'gray.6'}>{jqs}/10</Text>
                            <Progress value={jqs * 10} color={proposal.qualified ? 'green' : 'gray'} size="xs" w={50} />
                          </Group>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" fw={600} mb={2}>PQS</Text>
                          <Group gap="xs">
                            <Text size="sm" fw={700} c={pqs >= 7 ? 'blue.6' : 'gray.6'}>{pqs}/10</Text>
                            <Progress value={pqs * 10} color={pqs >= 7 ? 'blue' : 'gray'} size="xs" w={50} />
                          </Group>
                        </div>
                      </Group>
                    </Table.Td>
                    
                    <Table.Td>
                      <Stack gap={2}>
                        <Group gap={4}>
                          <Clock size={12} color="#94a3b8" />
                          <Text size="xs" c="dimmed" fw={500}>
                            Applied: {proposal.dateApplied ? new Date(proposal.dateApplied).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                          </Text>
                        </Group>
                        {proposal.nextFollowUpDate && (
                          <Group gap={4}>
                            <Target size={12} color="#f59e0b" />
                            <Text size="xs" c="orange.7" fw={600}>
                              Follow-up: {new Date(proposal.nextFollowUpDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Text>
                          </Group>
                        )}
                      </Stack>
                    </Table.Td>
                    
                    <Table.Td ta="right">
                      <ActionIcon 
                        variant="light" 
                        color="indigo" 
                        radius="xl"
                        size="lg"
                        style={{ transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                        onClick={(e) => { e.stopPropagation(); navigate(`/proposals/${proposal._id}`); }}
                      >
                        <ArrowRight size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {filteredData.length === 0 && !isLoading && (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center" py={60}>
                    <Stack align="center" gap="xs">
                      <ThemeIcon size={48} radius="xl" variant="light" color="gray">
                        <Target size={24} />
                      </ThemeIcon>
                      <Text fw={600} size="lg" c="gray.7" mt="md">No proposals found</Text>
                      <Text c="dimmed" size="sm">Adjust your filters or create a new proposal to get started.</Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </PaginatedTable>
      </Card>
      )}

      {/* Dynamic CSS for Hover Effects */}
      <style>{`
        .hover-row:hover {
          background-color: #f8fafc !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          z-index: 10;
          position: relative;
        }
      `}</style>
    </div>
  );
};
