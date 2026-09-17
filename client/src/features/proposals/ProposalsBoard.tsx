import React, { useMemo, useState } from 'react';
import { 
  DndContext, 
  useDroppable, 
  useDraggable, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent 
} from '@dnd-kit/core';
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

const ProposalCard = ({ proposal, isDragging, isOverlay }: { proposal: Proposal, isDragging?: boolean, isOverlay?: boolean }) => {
  const navigate = useNavigate();
  return (
    <Card
      radius="md"
      p="md"
      mb="sm"
      withBorder
      shadow={isOverlay ? 'xl' : 'sm'}
      style={{
        backgroundColor: '#ffffff',
        borderColor: isDragging ? '#3b82f6' : (isOverlay ? '#3b82f6' : '#e2e8f0'),
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
        transform: isOverlay ? 'scale(1.02)' : 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
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
  );
};

const DraggableItem = ({ proposal }: { proposal: Proposal }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: proposal._id,
    data: proposal
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <ProposalCard proposal={proposal} isDragging={isDragging} />
    </div>
  );
};

const DroppableColumn = ({ stage, count, children }: { stage: typeof STAGES[0], count: number, children: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <Paper
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
          {count}
        </Badge>
      </Group>

      <div
        ref={setNodeRef}
        style={{
          flexGrow: 1,
          minHeight: '100px',
          padding: '4px',
          transition: 'background-color 0.2s ease',
          backgroundColor: isOver ? '#f1f5f9' : 'transparent',
          borderRadius: '8px',
          overflowY: 'auto',
          scrollbarWidth: 'thin'
        }}
      >
        {children}
      </div>
    </Paper>
  );
};

export const ProposalsBoard: React.FC<ProposalsBoardProps> = ({ proposals, onStageChange }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const columns = useMemo(() => {
    const cols: Record<string, Proposal[]> = {};
    STAGES.forEach(s => cols[s.id] = []);
    cols['no_response'] = []; 

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

  const activeProposal = useMemo(() => proposals.find(p => p._id === activeId), [activeId, proposals]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const draggedProposalId = active.id as string;
      const targetStageId = over.id as string;
      
      const draggedProposal = proposals.find(p => p._id === draggedProposalId);
      if (draggedProposal && draggedProposal.currentStage !== targetStageId) {
        onStageChange(draggedProposalId, targetStageId);
      }
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', alignItems: 'flex-start', width: '100%', maxWidth: '100%', minHeight: '600px' }}>
        {STAGES.map((stage) => (
          <DroppableColumn key={stage.id} stage={stage} count={columns[stage.id]?.length || 0}>
            {columns[stage.id]?.map((proposal) => (
              <DraggableItem key={proposal._id} proposal={proposal} />
            ))}
          </DroppableColumn>
        ))}
      </div>
      
      <DragOverlay>
        {activeProposal ? <ProposalCard proposal={activeProposal} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
