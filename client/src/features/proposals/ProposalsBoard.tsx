import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Proposal } from './types';
import { Card, Text, Group, Badge, Paper, ActionIcon, Tooltip, ThemeIcon } from '@mantine/core';
import { Target, Send, Eye, MessageCircle, Phone, CheckCircle, Trophy, XCircle, Clock, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProposalsBoardProps {
  proposals: Proposal[];
  onStageChange: (proposalId: string, newStage: string) => void;
}

const STAGES = [
  { id: 'applied', label: 'Applied', color: 'gray', icon: <Target size={14} /> },
  { id: 'sent', label: 'Sent', color: 'blue', icon: <Send size={14} /> },
  { id: 'viewed', label: 'Viewed', color: 'grape', icon: <Eye size={14} /> },
  { id: 'replied', label: 'Replied', color: 'yellow', icon: <MessageCircle size={14} /> },
  { id: 'interview', label: 'Interview', color: 'orange', icon: <Phone size={14} /> },
  { id: 'offer', label: 'Offer', color: 'teal', icon: <CheckCircle size={14} /> },
  { id: 'won', label: 'Won', color: 'green', icon: <Trophy size={14} /> },
  { id: 'lost', label: 'Lost', color: 'red', icon: <XCircle size={14} /> },
];

export const ProposalsBoard: React.FC<ProposalsBoardProps> = ({ proposals, onStageChange }) => {
  const navigate = useNavigate();

  const columns = useMemo(() => {
    const cols: Record<string, Proposal[]> = {};
    STAGES.forEach(s => cols[s.id] = []);
    cols['no_response'] = []; // Catch-all for no_response if we don't display it explicitly as a column

    proposals.forEach(p => {
      const stage = p.currentStage || 'applied';
      if (cols[stage]) {
        cols[stage].push(p);
      } else {
        cols['applied'].push(p);
      }
    });
    return cols;
  }, [proposals]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    if (source.droppableId !== destination.droppableId) {
      onStageChange(draggableId, destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', alignItems: 'flex-start', width: '100%', maxWidth: '100%', minHeight: '600px' }}>
        {STAGES.map((stage) => (
          <Paper
            key={stage.id}
            bg="#f8fafc"
            p="sm"
            radius="md"
            style={{ minWidth: '300px', width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: '75vh' }}
          >
            <Group justify="space-between" mb="md" px="xs">
              <Group gap="xs">
                <ThemeIcon color={stage.color} variant="light" size="sm" radius="xl">
                  {stage.icon}
                </ThemeIcon>
                <Text fw={700} size="sm" tt="uppercase" c="dark.4" style={{ letterSpacing: '0.05em' }}>
                  {stage.label}
                </Text>
              </Group>
              <Badge color="gray" variant="light" radius="xl" size="sm">
                {columns[stage.id]?.length || 0}
              </Badge>
            </Group>

            <Droppable droppableId={stage.id}>
              {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    flexGrow: 1,
                    minHeight: '100px',
                    padding: '4px',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: snapshot.isDraggingOver ? '#f1f5f9' : 'transparent',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin'
                  }}
                >
                  {columns[stage.id]?.map((proposal, index) => (
                    <Draggable key={proposal._id} draggableId={proposal._id} index={index}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          shadow={snapshot.isDragging ? 'md' : 'xs'}
                          radius="md"
                          p="md"
                          mb="sm"
                          withBorder
                          style={{
                            ...provided.draggableProps.style,
                            backgroundColor: '#ffffff',
                            borderColor: snapshot.isDragging ? '#3b82f6' : '#e2e8f0',
                            transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                          }}
                          onClick={() => navigate(`/proposals/${proposal._id}`)}
                        >
                          <Group justify="space-between" align="flex-start" mb="xs" wrap="nowrap">
                            <Text fw={600} size="sm" style={{ lineHeight: 1.2, wordBreak: 'break-word' }}>
                              {proposal.jobTitle || 'Untitled Job'}
                            </Text>
                            <ActionIcon size="sm" variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); }}>
                              <MoreVertical size={14} />
                            </ActionIcon>
                          </Group>
                          
                          <Text size="xs" c="dimmed" mb="md" lineClamp={1}>
                            {proposal.clientName || 'Unknown Client'}
                          </Text>
                          
                          <Group gap="xs" mb="sm">
                            <Tooltip label="Job Quality Score">
                              <Badge size="xs" variant="light" color={proposal.qualified ? 'green' : 'red'}>
                                JQS: {proposal.jobQualityScore || '-'}
                              </Badge>
                            </Tooltip>
                            {proposal.proposalQualityScore && (
                              <Tooltip label="Proposal Quality Score">
                                <Badge size="xs" variant="light" color="blue">
                                  PQS: {proposal.proposalQualityScore}
                                </Badge>
                              </Tooltip>
                            )}
                          </Group>

                          <Group justify="space-between" align="flex-end" mt="auto">
                            <div>
                              <Text size="xs" c="dimmed">Est. Value</Text>
                              <Text size="sm" fw={700} c="dark.4">
                                {proposal.estimatedProjectValue ? `$${proposal.estimatedProjectValue}` : '-'}
                              </Text>
                            </div>
                            {proposal.daysToFirstResponse !== undefined && proposal.daysToFirstResponse !== null && (
                              <Tooltip label="Days to first response">
                                <Group gap={4}>
                                  <Clock size={12} color="#94a3b8" />
                                  <Text size="xs" c="dimmed" fw={500}>{proposal.daysToFirstResponse}d</Text>
                                </Group>
                              </Tooltip>
                            )}
                          </Group>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </Paper>
        ))}
      </div>
    </DragDropContext>
  );
};
