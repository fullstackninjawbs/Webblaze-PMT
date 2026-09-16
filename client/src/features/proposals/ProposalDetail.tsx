import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Card, Text, Tabs, Button, Group, Badge, SimpleGrid, TextInput, NumberInput, Select, Checkbox, Loader, Center, Paper, Stack, Grid, RingProgress, ActionIcon, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useGetProposalByIdQuery, useUpdateProposalMutation, useConvertToProjectMutation } from './proposalApi';
import { ArrowLeft, Target, Briefcase, FileText, Activity, CheckCircle, TrendingUp, Save, Clock, Trophy } from 'lucide-react';
import { Proposal } from './types';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Role } from '../../types';

export const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: proposal, isLoading } = useGetProposalByIdQuery(id as string, { skip: !id });
  const [updateProposal, { isLoading: isUpdating }] = useUpdateProposalMutation();
  const [convertToProject, { isLoading: isConverting }] = useConvertToProjectMutation();

  const form = useForm<Partial<Proposal>>({
    initialValues: {},
  });

  useEffect(() => {
    if (proposal) {
      // Load only editable fields, omitting server-calculated read-only fields
      const { 
        _id, currentStage, jobQualityScore, qualified, proposalQualityScore, 
        totalConnects, nextFollowUpDate, daysToFirstResponse, salesCycleDays, 
        followUpsRequired, followUpsCompleted, weekStarting, month, dayApplied, 
        repeatClient, dateClosed, convertedProjectId, createdAt, updatedAt, 
        ...editableFields 
      } = proposal as any;
      
      form.setValues(editableFields);
    }
  }, [proposal]);

  const handleSubmit = async (values: Partial<Proposal>) => {
    try {
      await updateProposal({ id: id as string, data: values }).unwrap();
    } catch (err) {
      console.error('Failed to update proposal', err);
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

  const jqsColor = proposal.qualified ? 'green' : 'red';
  const pqsColor = (proposal.proposalQualityScore || 0) >= 7 ? 'blue' : 'gray';

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
              <Badge 
                size="sm" 
                color={proposal.currentStage === 'won' ? 'green' : 'blue'} 
                variant="light"
              >
                {proposal.currentStage?.replace('_', ' ').toUpperCase()}
              </Badge>
            </Group>
          </div>
        </Group>
        
        <Group>
          {(user?.role === Role.ADMIN || user?.role === Role.SALES_MANAGER) && proposal.currentStage === 'won' && !proposal.convertedProjectId && (
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
          <Button 
            onClick={() => form.onSubmit(handleSubmit)()} 
            loading={isUpdating}
            leftSection={<Save size={16} />}
            color="indigo"
            radius="md"
          >
            Save Changes
          </Button>
        </Group>
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
        <Paper p="lg" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#64748b', letterSpacing: '0.05em' }}>
              Job Quality Score
            </Text>
            <Paper p={8} radius="md" bg={proposal.qualified ? '#f0fdf4' : '#fef2f2'}>
              <Target size={18} color={proposal.qualified ? '#10b981' : '#ef4444'} />
            </Paper>
          </Group>
          <Group align="flex-end" gap="xs">
            <Text fw={800} style={{ fontSize: '1.75rem', color: jqsColor === 'green' ? '#059669' : '#dc2626', lineHeight: 1 }}>
              {proposal.jobQualityScore || '-'}
            </Text>
            <Text size="sm" c="dimmed" mb={4}>/ 10</Text>
          </Group>
          <Badge mt="md" color={jqsColor} variant="light" size="sm" radius="sm">
            {proposal.qualified ? 'Qualified' : 'Unqualified'}
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
            <Text fw={800} style={{ fontSize: '1.75rem', color: pqsColor === 'blue' ? '#2563eb' : '#475569', lineHeight: 1 }}>
              {proposal.proposalQualityScore || '-'}
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
            {proposal.totalConnects || '-'}
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
              {proposal.salesCycleDays !== null && proposal.salesCycleDays !== undefined ? proposal.salesCycleDays : '-'}
            </Text>
            {proposal.salesCycleDays !== null && proposal.salesCycleDays !== undefined && (
              <Text size="sm" c="dimmed" mb={4}>days</Text>
            )}
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Main Form Area */}
      <Paper shadow="sm" radius="md" withBorder p="0" bg="white">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Tabs defaultValue="discovery" variant="pills" p="md" keepMounted={false}>
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
                    <TextInput label="Job Title" placeholder="Enter job title" {...form.getInputProps('jobTitle')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Job URL" placeholder="Upwork URL" {...form.getInputProps('jobUrl')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Client Name" placeholder="e.g. John Doe" {...form.getInputProps('clientName')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Client Country" placeholder="e.g. US" {...form.getInputProps('clientCountry')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select label="Job Type" data={[{value:'fixed_price', label:'Fixed Price'}, {value:'hourly', label:'Hourly'}]} {...form.getInputProps('jobType')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput label="Job Budget" leftSection={<TrendingUp size={14}/>} placeholder="0.00" {...form.getInputProps('jobBudget')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput label="Est. Project Value" leftSection={<TrendingUp size={14}/>} placeholder="0.00" {...form.getInputProps('estimatedProjectValue')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Service Category" placeholder="e.g. Web Development" {...form.getInputProps('serviceCategory')} />
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
                    <NumberInput label="Connects Required" placeholder="0" {...form.getInputProps('connectsRequired')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput label="Boost Connects" placeholder="0" {...form.getInputProps('boostConnects')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput label="Connect Cost (USD)" placeholder="0.00" decimalScale={2} {...form.getInputProps('connectCostUsd')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput label="Upwork Fee %" placeholder="10" {...form.getInputProps('upworkFeePercentage')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput label="Won Revenue" placeholder="0.00" leftSection={<TrendingUp size={14}/>} decimalScale={2} {...form.getInputProps('wonRevenue')} />
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>
            </Box>
          </Tabs>
        </form>
      </Paper>
    </Container>
  );
};
