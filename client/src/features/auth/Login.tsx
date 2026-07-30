import React, { useState } from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, setCredentials } from './auth.slice';
import { Lock, Mail, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Container, Title, Text, TextInput, PasswordInput, Button, Alert, Box, Checkbox, Group, Anchor, Paper, Flex } from '@mantine/core';
import { BlazeLogo } from '../../components/common/BlazeLogo';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading, error }] = useLoginMutation();

  const [rememberMe, setRememberMe] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: zodResolver(loginSchema),
  });

  const onSubmit = async (values: typeof form.values) => {
    try {
      const result = await login(values).unwrap();
      dispatch(setCredentials({ user: result.data.user, accessToken: result.data.accessToken }));

      if (rememberMe) {
        localStorage.setItem('remember_user', values.email);
      }

      navigate(from, { replace: true });
    } catch (err) {
      console.error('Failed to log in', err);
    }
  };

  const errorMessage = (error as { data?: { error?: { message?: string } } })?.data?.error?.message;

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', background: '#f4f6fb' }}>
      
      {/* Left Panel: Branding & Benefits */}
      <Box 
        style={{ 
          flex: 1.1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          padding: '4rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%), url("/bg-blaze.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
        visibleFrom="md"
      >
        {/* Decorative ambient backdrop glows & edge bubbles */}
        <div style={{ position: 'absolute', top: '-15%', left: '-15%', width: '480px', height: '480px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-15%', width: '520px', height: '520px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.12)', filter: 'blur(90px)', pointerEvents: 'none' }} />

        {/* Top Branding */}
        <Group gap="sm" style={{ zIndex: 1 }}>
          <BlazeLogo variant="dark" size="md" />
        </Group>

        {/* Hero Content */}
        <Box style={{ zIndex: 1, maxWidth: '520px', margin: 'auto 0' }}>
          <Title order={1} mb="lg" style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#ffffff' }}>
            Blaze Softtech Operations & PMT Workspace
          </Title>
          <Text size="md" mb={40} style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, fontSize: '1rem' }}>
            Empower your team to plan, track timelogs, manage releases, and execute projects with crystal clarity.
          </Text>

          <Flex direction="column" gap="md">
            <Group wrap="nowrap" gap="md">
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={18} color="#38bdf8" />
              </div>
              <Text size="sm" fw={600} style={{ color: '#ffffff' }}>Role-Based Access Control & Financial Isolation</Text>
            </Group>
            <Group wrap="nowrap" gap="md">
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(250, 204, 21, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={18} color="#facc15" />
              </div>
              <Text size="sm" fw={600} style={{ color: '#ffffff' }}>Real-Time Time Tracking & Milestones</Text>
            </Group>
            <Group wrap="nowrap" gap="md">
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(244, 63, 94, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={18} color="#f43f5e" />
              </div>
              <Text size="sm" fw={600} style={{ color: '#ffffff' }}>Automated Invoices & Release Tracking</Text>
            </Group>
          </Flex>
        </Box>

        {/* Footer */}
        <Text size="xs" style={{ color: '#94a3b8', zIndex: 1 }}>
          © {new Date().getFullYear()} Blaze Softtech. All rights reserved.
        </Text>
      </Box>

      {/* Right Panel: Login Form */}
      <Box 
        style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2.5rem',
          backgroundColor: '#f4f6fb',
        }}
      >
        <Container size={420} w="100%">
          <Paper 
            p={36} 
            radius="xl" 
            withBorder 
            style={{ 
              backgroundColor: '#ffffff',
              borderColor: '#e8ecf4',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)'
            }}
          >
            {/* Logo on small screens */}
            <Flex hiddenFrom="md" justify="center" mb="lg">
              <BlazeLogo variant="light" size="md" />
            </Flex>
            
            <Title order={2} ta="center" mb={6} style={{ color: '#0f172a', fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
              Welcome back
            </Title>
            <Text size="sm" ta="center" mb={28} style={{ color: '#64748b' }}>
              Sign in to your WebBlaze account to continue
            </Text>

            {errorMessage && (
              <Alert icon={<AlertCircle size={16} />} title="Authentication Failed" color="red" mb="xl" variant="light" radius="md">
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={form.onSubmit(onSubmit)}>
              <TextInput
                label={<Text size="xs" fw={600} mb={4} style={{ color: '#0f172a' }}>Email Address</Text>}
                placeholder="name@webblaze.com"
                leftSection={<Mail size={16} color="#94a3b8" />}
                {...form.getInputProps('email')}
                radius="md"
                size="md"
                mb="md"
                error={form.errors.email}
              />
              
              <PasswordInput
                label={<Text size="xs" fw={600} mb={4} style={{ color: '#0f172a' }}>Password</Text>}
                placeholder="Your password"
                leftSection={<Lock size={16} color="#94a3b8" />}
                {...form.getInputProps('password')}
                radius="md"
                size="md"
                mb="sm"
                error={form.errors.password}
              />

              <Group justify="space-between" mb="xl" mt="xs">
                <Checkbox 
                  label={<Text size="xs" style={{ color: '#475569' }}>Remember me</Text>}
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.currentTarget.checked)}
                />
                <Anchor href="#" size="xs" fw={600} style={{ color: '#2563eb' }}>
                  Forgot password?
                </Anchor>
              </Group>

              <Button 
                fullWidth 
                size="md" 
                radius="md" 
                type="submit" 
                loading={isLoading}
                rightSection={<ArrowRight size={16} />}
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
                }}
              >
                Sign In
              </Button>
            </form>
          </Paper>
        </Container>
      </Box>

    </Box>
  );
};

export default Login;
