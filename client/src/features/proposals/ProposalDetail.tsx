import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Tabs, Button, Group, Badge, SimpleGrid, TextInput, NumberInput, Select, Checkbox, Loader, Center, Paper, Grid, ActionIcon, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useGetProposalByIdQuery, useUpdateProposalMutation, useConvertToProjectMutation, useDeleteProposalMutation } from './proposalApi';
import { ArrowLeft, Target, Briefcase, FileText, Activity, CheckCircle, TrendingUp, Clock, Trash2, Send, FileEdit } from 'lucide-react';
import { Proposal } from './types';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';
import { notifications } from '@mantine/notifications';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

const toDateInputString = (val?: string | Date | null) => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const sanitizeProposalPayload = (values: Partial<Proposal>) => {
  const payload: any = { ...values };

  // Remove server computed / read-only fields
  delete payload._id;
  delete payload.proposalCode;
  delete payload.jobQualityScore;
  delete payload.qualified;
  delete payload.proposalQualityScore;
  delete payload.totalConnects;
  delete payload.salesCycleDays;
  delete payload.daysToFirstResponse;
  delete payload.followUpsRequired;
  delete payload.followUpsCompleted;
  delete payload.weekStarting;
  delete payload.month;
  delete payload.dayApplied;
  delete payload.repeatClient;
  delete payload.dateClosed;
  delete payload.convertedProjectId;
  delete payload.createdAt;
  delete payload.updatedAt;

  // Clean empty string dates to undefined
  const dateKeys = ['dateFound', 'dateApplied', 'replyDate', 'interviewDate', 'viewDate', 'nextFollowUpDate'];
  for (const k of dateKeys) {
    if (payload[k] === '' || payload[k] === null) {
      payload[k] = undefined;
    }
  }

  // Clean JQS empty/NaN values
  if (payload.jqs) {
    const cleanJqs: any = {};
    for (const [k, v] of Object.entries(payload.jqs)) {
      if (typeof v === 'number' && !isNaN(v) && v > 0) {
        cleanJqs[k] = v;
      }
    }
    payload.jqs = Object.keys(cleanJqs).length > 0 ? cleanJqs : undefined;
  }

  // Clean PQS empty/NaN values
  if (payload.pqs) {
    const cleanPqs: any = {};
    for (const [k, v] of Object.entries(payload.pqs)) {
      if (typeof v === 'number' && !isNaN(v) && v > 0) {
        cleanPqs[k] = v;
      }
    }
    payload.pqs = Object.keys(cleanPqs).length > 0 ? cleanPqs : undefined;
  }

  // Numeric fields
  const numKeys = [
    'jobBudget', 'estimatedProjectValue', 'jobPostedAgeHrs', 
    'clientHiringHistory', 'clientSpendOnUpwork', 'proposalCompetitionCount',
    'proposalLengthWords', 'connectsUsed', 'boostConnects', 'connectCost', 'wonRevenue'
  ];
  for (const k of numKeys) {
    if (payload[k] === '' || payload[k] === null || isNaN(Number(payload[k]))) {
      payload[k] = undefined;
    } else {
      payload[k] = Number(payload[k]);
    }
  }

  // Enums: if empty string, set undefined
  if (payload.clientActivityLevel === '') payload.clientActivityLevel = undefined;
  if (payload.personalizationLevel === '') payload.personalizationLevel = undefined;
  if (payload.jobType === '') payload.jobType = undefined;
  if (payload.lostReason === '') payload.lostReason = undefined;
  // ObjectId references: map objects to string _id or delete
  if (payload.salesExec) {
    if (typeof payload.salesExec === 'object' && (payload.salesExec as any)._id) {
      payload.salesExec = (payload.salesExec as any)._id;
    } else if (typeof payload.salesExec !== 'string' || (payload.salesExec as any) === '[object Object]') {
      delete payload.salesExec;
    }
  }

  if (payload.proposalWriter) {
    if (typeof payload.proposalWriter === 'object' && (payload.proposalWriter as any)._id) {
      payload.proposalWriter = (payload.proposalWriter as any)._id;
    } else if (typeof payload.proposalWriter !== 'string' || (payload.proposalWriter as any) === '[object Object]') {
      delete payload.proposalWriter;
    }
  }

  return payload;
};

export const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: proposal, isLoading } = useGetProposalByIdQuery(id as string, { skip: !id });
  const [updateProposal, { isLoading: isUpdating }] = useUpdateProposalMutation();
  const [convertToProject, { isLoading: isConverting }] = useConvertToProjectMutation();
  const [deleteProposal, { isLoading: isDeleting }] = useDeleteProposalMutation();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('discovery');

  const form = useForm<Partial<Proposal>>({
    initialValues: {
      jobTitle: '',
      jobUrl: '',
      clientName: '',
      clientCountry: '',
      jobType: 'fixed_price',
      serviceCategory: '',
      jobBudget: undefined,
      estimatedProjectValue: undefined,
      jobPostedAgeHrs: undefined,
      clientHiringHistory: undefined,
      clientSpendOnUpwork: undefined,
      paymentVerified: false,
      clientActivityLevel: undefined,
      // JQS
      jqs: {
        skillFit: undefined,
        budgetFit: undefined,
        clientQuality: undefined,
        jobClarity: undefined,
        portfolioFit: undefined,
        hiringProbability: undefined,
        competitionScore: undefined,
        timingScore: undefined,
        historicalActivity: undefined,
      },
      qualifiedOverride: null,
      // PQS
      proposalWriter: '',
      proposalTemplate: '',
      personalizationLevel: undefined,
      proposalLengthWords: undefined,
      openingHookUsed: false,
      relevantCaseStudyUsed: false,
      portfolioLinkUsed: false,
      ctaUsed: false,
      pqs: {
        jobFit: undefined,
        personalization: undefined,
        relevantProof: undefined,
        solutionClarity: undefined,
        ctaStrength: undefined,
        painPointAlignment: undefined,
      },
      // Pipeline
      proposalSent: false,
      proposalViewed: false,
      clientReplied: false,
      interviewScheduled: false,
      offerReceived: false,
      hired: false,
      lost: false,
      dateApplied: '',
      replyDate: '',
      interviewDate: '',
      nextAction: '',
      nextFollowUpDate: '',
      followUp1Done: false,
      followUp2Done: false,
      followUp3Done: false,
      lostReason: '',
      // Financials
      connectsUsed: 0,
      boostConnects: 0,
      connectCost: 0,
      wonRevenue: 0,
    },
    validate: {
      jobTitle: (val) => (!val || !val.trim() ? 'Job title is required' : null),
      jobUrl: (val) => (!val || !val.trim() ? 'Job URL is required' : null),
      clientName: (val) => (!val || !val.trim() ? 'Client name is required' : null),
      clientCountry: (val) => (!val || !val.trim() ? 'Client country is required' : null),
      jobType: (val) => (!val ? 'Job type is required' : null),
      serviceCategory: (val) => (!val || !val.trim() ? 'Service category is required' : null),
    },
  });

  useEffect(() => {
    if (proposal) {
      const { 
        _id, salesExec, currentStage, jobQualityScore, qualified, proposalQualityScore, 
        totalConnects, daysToFirstResponse, salesCycleDays, 
        followUpsRequired, followUpsCompleted, weekStarting, month, dayApplied, 
        repeatClient, dateClosed, convertedProjectId, createdAt, updatedAt, 
        ...rawEditable 
      } = proposal as any;
      
      form.setValues({
        ...rawEditable,
        dateFound: toDateInputString(rawEditable.dateFound),
        dateApplied: toDateInputString(rawEditable.dateApplied),
        replyDate: toDateInputString(rawEditable.replyDate),
        interviewDate: toDateInputString(rawEditable.interviewDate),
        nextFollowUpDate: toDateInputString(rawEditable.nextFollowUpDate),
        jqs: {
          skillFit: rawEditable.jqs?.skillFit ?? undefined,
          budgetFit: rawEditable.jqs?.budgetFit ?? undefined,
          clientQuality: rawEditable.jqs?.clientQuality ?? undefined,
          jobClarity: rawEditable.jqs?.jobClarity ?? undefined,
          portfolioFit: rawEditable.jqs?.portfolioFit ?? undefined,
          hiringProbability: rawEditable.jqs?.hiringProbability ?? undefined,
          competitionScore: rawEditable.jqs?.competitionScore ?? undefined,
          timingScore: rawEditable.jqs?.timingScore ?? undefined,
          historicalActivity: rawEditable.jqs?.historicalActivity ?? undefined,
        },
        pqs: {
          jobFit: rawEditable.pqs?.jobFit ?? undefined,
          personalization: rawEditable.pqs?.personalization ?? undefined,
          relevantProof: rawEditable.pqs?.relevantProof ?? undefined,
          solutionClarity: rawEditable.pqs?.solutionClarity ?? undefined,
          ctaStrength: rawEditable.pqs?.ctaStrength ?? undefined,
          painPointAlignment: rawEditable.pqs?.painPointAlignment ?? undefined,
        },
        connectsUsed: rawEditable.connectsUsed ?? 0,
        boostConnects: rawEditable.boostConnects ?? 0,
        connectCost: rawEditable.connectCost ?? 0,
        wonRevenue: rawEditable.wonRevenue ?? 0,
        qualifiedOverride: rawEditable.qualifiedOverride ?? null,
      });
    }
  }, [proposal]);

  const areRequiredFieldsFilled = Boolean(
    form.values.jobTitle?.trim() &&
    form.values.jobUrl?.trim() &&
    form.values.clientName?.trim() &&
    form.values.clientCountry?.trim() &&
    form.values.jobType &&
    form.values.serviceCategory?.trim()
  );

  // Real-time calculated metrics
  const jqsScores = form.values.jqs
    ? (Object.values(form.values.jqs).filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0))
    : [];
  const realtimeJqs = jqsScores.length > 0
    ? Number((jqsScores.reduce((a, b) => a + b, 0) / jqsScores.length).toFixed(1))
    : (proposal?.jobQualityScore ?? null);

  const realtimeQualified = form.values.qualifiedOverride !== null && form.values.qualifiedOverride !== undefined
    ? form.values.qualifiedOverride
    : (realtimeJqs !== null ? realtimeJqs >= 6.5 : (proposal?.qualified ?? false));

  const pqsScores = form.values.pqs
    ? (Object.values(form.values.pqs).filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0))
    : [];
  const realtimePqs = pqsScores.length > 0
    ? Number((pqsScores.reduce((a, b) => a + b, 0) / pqsScores.length).toFixed(1))
    : (proposal?.proposalQualityScore ?? null);

  const realtimeTotalConnects = (Number(form.values.connectsUsed) || 0) + (Number(form.values.boostConnects) || 0);

  let realtimeSalesCycle: number | null = null;
  if (form.values.dateApplied) {
    const appliedTime = new Date(form.values.dateApplied).getTime();
    if (!isNaN(appliedTime)) {
      const isClosed = form.values.hired || form.values.lost;
      const closedTime = isClosed
        ? (proposal?.dateClosed ? new Date(proposal.dateClosed).getTime() : Date.now())
        : (form.values.replyDate ? new Date(form.values.replyDate).getTime() : Date.now());
      if (!isNaN(closedTime) && closedTime >= appliedTime) {
        realtimeSalesCycle = Math.max(0, Math.floor((closedTime - appliedTime) / (1000 * 60 * 60 * 24)));
      }
    }
  }
  if (realtimeSalesCycle === null && proposal?.salesCycleDays !== undefined && proposal?.salesCycleDays !== null) {
    realtimeSalesCycle = proposal.salesCycleDays;
  }

  const handleSaveDraft = async () => {
    try {
      const values = sanitizeProposalPayload(form.values);
      await updateProposal({ 
        id: id as string, 
        data: { 
          ...values, 
          isDraft: true,
          currentStage: 'draft' 
        } 
      }).unwrap();
      notifications.show({
        title: 'Draft Saved',
        message: 'Proposal saved as draft successfully.',
        color: 'teal',
      });
    } catch (err: any) {
      console.error('Failed to save draft', err);
      notifications.show({
        title: 'Error Saving Draft',
        message: err?.data?.message || err?.message || 'Failed to save draft.',
        color: 'red',
      });
    }
  };

  const handleSubmitProposal = () => {
    form.onSubmit(
      async (values) => {
        try {
          const sanitized = sanitizeProposalPayload(values);
          await updateProposal({ 
            id: id as string, 
            data: { 
              ...sanitized, 
              isDraft: false,
              currentStage: proposal?.currentStage === 'draft' ? 'applied' : proposal?.currentStage || 'applied'
            } 
          }).unwrap();
          notifications.show({
            title: 'Submitted',
            message: 'Proposal submitted successfully!',
            color: 'teal',
          });
        } catch (err: any) {
          console.error('Failed to submit proposal', err);
          notifications.show({
            title: 'Submission Error',
            message: err?.data?.message || err?.message || 'Failed to submit proposal.',
            color: 'red',
          });
        }
      },
      (validationErrors) => {
        notifications.show({
          title: 'Validation Error',
          message: 'Please fill in all mandatory fields marked with an asterisk (*)',
          color: 'red',
        });
        const discoveryKeys = ['jobTitle', 'jobUrl', 'clientName', 'clientCountry', 'jobType', 'serviceCategory'];
        if (Object.keys(validationErrors).some((k) => discoveryKeys.includes(k))) {
          setActiveTab('discovery');
        }
      }
    )();
  };

  const handleDeleteProposal = async () => {
    try {
      await deleteProposal(id as string).unwrap();
      notifications.show({
        title: 'Deleted',
        message: 'Proposal deleted successfully',
        color: 'teal',
      });
      navigate('/proposals');
    } catch (err) {
      console.error('Failed to delete proposal', err);
    }
  };

  const handleConvert = async () => {
    if (window.confirm('Are you sure you want to convert this won proposal into a Project?')) {
      try {
        const res = await convertToProject(id as string).unwrap();
        navigate(`/projects/${res._id}`);
      } catch (err) {
        console.error('Conversion failed', err);
        alert('Failed to convert. Ensure the proposal is WON and not already converted.');
      }
    }
  };

  if (isLoading || !proposal) {
    return <Center h="100vh"><Loader size="lg" color="indigo" /></Center>;
  }

  return (
    <Container size="xl" py="xl">
      {/* Header Section */}
      <Group mb="xl" justify="space-between" align="flex-start">
        <Group align="center">
          <ActionIcon 
            variant="light" 
            color="gray" 
            size="lg" 
            radius="md" 
            onClick={() => navigate('/proposals')}
          >
            <ArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Title order={2} style={{ color: '#0f172a' }}>
              {proposal.jobTitle || proposal.proposalCode}
            </Title>
            <Group gap="xs" mt={4}>
              <Badge size="sm" variant="dot" color="indigo">{proposal.clientName || 'Unknown Client'}</Badge>
              {proposal.proposalCode && (
                <Badge size="sm" variant="outline" color="gray">
                  {proposal.proposalCode}
                </Badge>
              )}
              <Badge 
                size="sm" 
                color={
                  proposal.currentStage === 'won' ? 'green' : 
                  proposal.currentStage === 'draft' ? 'violet' : 'blue'
                } 
                variant="light"
              >
                {(proposal.currentStage || 'draft').replace('_', ' ').toUpperCase()}
              </Badge>
              {typeof proposal.salesExec === 'object' && proposal.salesExec?.name && (
                <Badge size="sm" variant="light" color="cyan">
                  Sales Rep: {proposal.salesExec.name}
                </Badge>
              )}
            </Group>
          </div>
        </Group>
        
        <Group>
          <Button 
            variant="light"
            color="red"
            leftSection={<Trash2 size={16} />}
            onClick={() => setDeleteConfirmOpen(true)}
            loading={isDeleting}
            radius="md"
          >
            Delete
          </Button>
          {(user?.role === Role.ADMIN || user?.role === Role.SALES_MANAGER || (user?.role === Role.TEAM_LEAD && user?.department?.toLowerCase() === 'sales')) && proposal.currentStage === 'won' && !proposal.convertedProjectId && (
            <Button 
              color="teal" 
              leftSection={<CheckCircle size={16} />} 
              onClick={handleConvert} 
              loading={isConverting}
              radius="md"
            >
              Convert to Project
            </Button>
          )}
          {areRequiredFieldsFilled ? (
            <Group gap="xs">
              <Button 
                variant="subtle"
                color="gray"
                leftSection={<FileEdit size={16} />}
                onClick={handleSaveDraft}
                loading={isUpdating}
                radius="md"
              >
                Save as Draft
              </Button>
              <Button 
                onClick={handleSubmitProposal} 
                loading={isUpdating}
                leftSection={<Send size={16} />}
                color="indigo"
                radius="md"
              >
                Submit
              </Button>
            </Group>
          ) : (
            <Button 
              onClick={handleSaveDraft} 
              loading={isUpdating}
              leftSection={<FileEdit size={16} />}
              color="blue"
              radius="md"
            >
              Save as Draft
            </Button>
          )}
        </Group>
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Job Quality Score
            </Text>
            <Paper p={8} radius="md" bg={realtimeQualified ? '#f0fdf4' : '#fef2f2'}>
              <Target size={18} color={realtimeQualified ? '#10b981' : '#ef4444'} />
            </Paper>
          </Group>
          <Group align="flex-end" gap="xs">
            <Text fw={800} style={{ fontSize: '1.75rem', color: realtimeQualified ? '#059669' : '#dc2626', lineHeight: 1 }}>
              {realtimeJqs !== null ? realtimeJqs : '-'}
            </Text>
            <Text size="sm" c="dimmed" mb={4}>/ 10</Text>
          </Group>
          <Badge mt="md" color={realtimeQualified ? 'green' : 'red'} variant="light" size="sm" radius="sm">
            {realtimeQualified ? 'Qualified' : 'Unqualified'}
          </Badge>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Proposal Quality
            </Text>
            <Paper p={8} radius="md" bg="#eff6ff">
              <FileText size={18} color="#2563eb" />
            </Paper>
          </Group>
          <Group align="flex-end" gap="xs">
            <Text fw={800} style={{ fontSize: '1.75rem', color: (realtimePqs || 0) >= 7 ? '#2563eb' : '#475569', lineHeight: 1 }}>
              {realtimePqs !== null ? realtimePqs : '-'}
            </Text>
            <Text size="sm" c="dimmed" mb={4}>/ 10</Text>
          </Group>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Total Connects
            </Text>
            <Paper p={8} radius="md" bg="#f5f3ff">
              <Activity size={18} color="#8b5cf6" />
            </Paper>
          </Group>
          <Text fw={800} mt="xs" style={{ fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>
            {realtimeTotalConnects > 0 ? realtimeTotalConnects : (proposal.totalConnects || '-')}
          </Text>
        </Paper>

        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Sales Cycle
            </Text>
            <Paper p={8} radius="md" bg="#fffbeb">
              <Clock size={18} color="#f59e0b" />
            </Paper>
          </Group>
          <Group align="flex-end" gap="xs" mt="xs">
            <Text fw={800} style={{ fontSize: '1.75rem', color: '#d97706', lineHeight: 1 }}>
              {realtimeSalesCycle !== null ? realtimeSalesCycle : '-'}
            </Text>
            {realtimeSalesCycle !== null && (
              <Text size="sm" c="dimmed" mb={4}>days</Text>
            )}
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Main Form Area */}
      <Paper shadow="sm" radius="md" withBorder p="0" bg="white">
        <form onSubmit={(e) => { e.preventDefault(); areRequiredFieldsFilled ? handleSubmitProposal() : handleSaveDraft(); }}>
          <Tabs value={activeTab} onChange={setActiveTab} variant="pills" p="md" keepMounted={true}>
            <Tabs.List pb="md" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <Tabs.Tab value="discovery" leftSection={<Briefcase size={14} />}>Discovery & Client</Tabs.Tab>
              <Tabs.Tab value="jqs" leftSection={<Target size={14} />}>Job Quality (JQS)</Tabs.Tab>
              <Tabs.Tab value="proposal" leftSection={<FileText size={14} />}>Proposal & PQS</Tabs.Tab>
              <Tabs.Tab value="pipeline" leftSection={<Activity size={14} />}>Pipeline</Tabs.Tab>
              <Tabs.Tab value="financials" leftSection={<TrendingUp size={14} />}>Financials</Tabs.Tab>
            </Tabs.List>

            <Box p="md" mt="sm">
              <Tabs.Panel value="discovery">
                <Grid gutter="lg">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput 
                      label="Job Title" 
                      placeholder="Enter job title" 
                      withAsterisk 
                      required 
                      {...form.getInputProps('jobTitle')} 
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput 
                      label="Job URL" 
                      placeholder="Upwork URL" 
                      withAsterisk 
                      required 
                      {...form.getInputProps('jobUrl')} 
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput 
                      label="Client Name" 
                      placeholder="e.g. John Doe" 
                      withAsterisk 
                      required 
                      {...form.getInputProps('clientName')} 
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput 
                      label="Client Country" 
                      placeholder="e.g. US" 
                      withAsterisk 
                      required 
                      {...form.getInputProps('clientCountry')} 
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select 
                      label="Job Type" 
                      data={[{value:'fixed_price', label:'Fixed Price'}, {value:'hourly', label:'Hourly'}]} 
                      withAsterisk 
                      required 
                      {...form.getInputProps('jobType')} 
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput 
                      label={form.values.jobType === 'hourly' ? 'Budget per hour' : 'Job Budget'} 
                      leftSection={<TrendingUp size={14}/>} 
                      placeholder={form.values.jobType === 'hourly' ? 'e.g. 25.00' : '0.00'} 
                      {...form.getInputProps('jobBudget')} 
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput label="Est. Project Value" leftSection={<TrendingUp size={14}/>} placeholder="0.00" {...form.getInputProps('estimatedProjectValue')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput 
                      label="Service Category" 
                      placeholder="e.g. Web Development" 
                      withAsterisk 
                      required 
                      {...form.getInputProps('serviceCategory')} 
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput label="Job Posted Age (Hrs)" placeholder="e.g. 24" {...form.getInputProps('jobPostedAgeHrs')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput label="Client Hiring History" placeholder="Jobs hired" {...form.getInputProps('clientHiringHistory')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput label="Client Spend on Upwork" placeholder="Total spend" {...form.getInputProps('clientSpendOnUpwork')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select label="Client Activity Level" data={[{value:'very_active', label:'Very Active'}, {value:'moderate', label:'Moderate'}, {value:'low', label:'Low'}]} {...form.getInputProps('clientActivityLevel')} />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Checkbox label="Payment Verified" size="md" {...form.getInputProps('paymentVerified', { type: 'checkbox' })} />
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="jqs">
                <Text c="dimmed" size="sm" mb="xl">Rate the following parameters from 1 to 10 to automatically calculate the Job Quality Score.</Text>
                <Grid gutter="xl">
                  {[
                    { key: 'skillFit', label: 'Skill Fit' },
                    { key: 'budgetFit', label: 'Budget Fit' },
                    { key: 'clientQuality', label: 'Client Quality' },
                    { key: 'jobClarity', label: 'Job Clarity' },
                    { key: 'portfolioFit', label: 'Portfolio Fit' },
                    { key: 'hiringProbability', label: 'Hiring Probability' },
                    { key: 'competitionScore', label: 'Competition Score' },
                    { key: 'timingScore', label: 'Timing Score' },
                    { key: 'historicalActivity', label: 'Historical Activity' }
                  ].map((field) => (
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={field.key}>
                      <NumberInput 
                        label={field.label} 
                        min={1} 
                        max={10} 
                        {...form.getInputProps(`jqs.${field.key}`)} 
                      />
                    </Grid.Col>
                  ))}
                </Grid>
                <Box mt={40} pt="lg" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <Title order={5} mb="xs">Manual Override</Title>
                  <Select 
                    w={{ base: '100%', md: 300 }} 
                    placeholder="Auto-calculated" 
                    data={[{value: 'true', label:'Force Qualified'}, {value: 'false', label:'Force Unqualified'}]} 
                    value={form.values.qualifiedOverride !== null && form.values.qualifiedOverride !== undefined ? String(form.values.qualifiedOverride) : null} 
                    onChange={(val) => form.setFieldValue('qualifiedOverride', val === null ? null : val === 'true')} 
                    clearable 
                  />
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="proposal">
                <Grid gutter="lg" mb="xl">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Proposal Writer" {...form.getInputProps('proposalWriter')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Proposal Template Used" {...form.getInputProps('proposalTemplate')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select label="Personalization Level" data={['low', 'medium', 'high']} {...form.getInputProps('personalizationLevel')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput label="Proposal Length (Words)" {...form.getInputProps('proposalLengthWords')} />
                  </Grid.Col>
                </Grid>

                <Paper withBorder p="md" radius="md" bg="gray.0" mb="xl">
                  <Title order={6} mb="md" c="dimmed">Proposal Components Included</Title>
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                    <Checkbox label="Opening Hook" {...form.getInputProps('openingHookUsed', { type: 'checkbox' })} />
                    <Checkbox label="Relevant Case Study" {...form.getInputProps('relevantCaseStudyUsed', { type: 'checkbox' })} />
                    <Checkbox label="Portfolio Link" {...form.getInputProps('portfolioLinkUsed', { type: 'checkbox' })} />
                    <Checkbox label="Call to Action (CTA)" {...form.getInputProps('ctaUsed', { type: 'checkbox' })} />
                  </SimpleGrid>
                </Paper>

                <Title order={5} mb="md">Proposal Quality Score (1-10)</Title>
                <Grid gutter="xl">
                  {[
                    { key: 'jobFit', label: 'Job Fit' },
                    { key: 'personalization', label: 'Personalization' },
                    { key: 'relevantProof', label: 'Relevant Proof' },
                    { key: 'solutionClarity', label: 'Solution Clarity' },
                    { key: 'ctaStrength', label: 'CTA Strength' },
                    { key: 'painPointAlignment', label: 'Pain Point Alignment' }
                  ].map((field) => (
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={field.key}>
                      <NumberInput 
                        label={field.label} 
                        min={1} 
                        max={10} 
                        {...form.getInputProps(`pqs.${field.key}`)} 
                      />
                    </Grid.Col>
                  ))}
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="pipeline">
                <Paper withBorder p="lg" radius="md" bg="gray.0" mb="xl">
                  <Title order={6} mb="md" c="dimmed">Stage Checkpoints</Title>
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                    <Checkbox size="md" label="Proposal Sent" {...form.getInputProps('proposalSent', { type: 'checkbox' })} />
                    <Checkbox size="md" label="Proposal Viewed" {...form.getInputProps('proposalViewed', { type: 'checkbox' })} />
                    <Checkbox size="md" label="Client Replied" {...form.getInputProps('clientReplied', { type: 'checkbox' })} />
                    <Checkbox size="md" label="Interview Scheduled" {...form.getInputProps('interviewScheduled', { type: 'checkbox' })} />
                    <Checkbox size="md" label="Offer Received" {...form.getInputProps('offerReceived', { type: 'checkbox' })} />
                    <Checkbox size="md" label="Hired" color="green" {...form.getInputProps('hired', { type: 'checkbox' })} />
                    <Checkbox size="md" label="Lost" color="red" {...form.getInputProps('lost', { type: 'checkbox' })} />
                  </SimpleGrid>
                </Paper>

                <Grid gutter="xl" mb="xl">
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput label="Date Applied" placeholder="YYYY-MM-DD" {...form.getInputProps('dateApplied')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput label="Reply Date" placeholder="YYYY-MM-DD" {...form.getInputProps('replyDate')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput label="Interview Date" placeholder="YYYY-MM-DD" {...form.getInputProps('interviewDate')} />
                  </Grid.Col>
                </Grid>

                <Title order={5} mb="md">Follow-up Tracking</Title>
                <Grid gutter="xl">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Next Action" placeholder="e.g. Send portfolio" {...form.getInputProps('nextAction')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Next Follow Up Date" placeholder="YYYY-MM-DD" {...form.getInputProps('nextFollowUpDate')} />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Group mt="xs">
                      <Checkbox label="Follow-up 1 Done" {...form.getInputProps('followUp1Done', { type: 'checkbox' })} />
                      <Checkbox label="Follow-up 2 Done" {...form.getInputProps('followUp2Done', { type: 'checkbox' })} />
                      <Checkbox label="Follow-up 3 Done" {...form.getInputProps('followUp3Done', { type: 'checkbox' })} />
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TextInput label="Lost Reason" placeholder="If lost, explain why..." {...form.getInputProps('lostReason')} />
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="financials">
                <Grid gutter="xl">
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput label="Connects Required" placeholder="0" min={0} {...form.getInputProps('connectsUsed')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput label="Boost Connects" placeholder="0" min={0} {...form.getInputProps('boostConnects')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput label="Connect Cost (USD)" placeholder="0.00" min={0} decimalScale={2} {...form.getInputProps('connectCost')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput label="Upwork Fee %" placeholder="10" min={0} max={100} {...form.getInputProps('upworkFeePercentage')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput label="Won Revenue ($)" placeholder="0.00" min={0} leftSection={<TrendingUp size={14}/>} decimalScale={2} {...form.getInputProps('wonRevenue')} />
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>
            </Box>
          </Tabs>
        </form>
      </Paper>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteProposal}
        title="Delete Proposal"
        itemName={proposal?.jobTitle || proposal?.proposalCode}
        loading={isDeleting}
      />
    </Container>
  );
};
