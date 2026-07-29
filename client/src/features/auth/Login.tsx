import React, { useState } from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, setCredentials } from './auth.slice';
import { Lock, Mail, AlertCircle, CheckCircle, ArrowRight, Rocket } from 'lucide-react';
import { Container, Title, Text, TextInput, PasswordInput, Button, Alert, Box, Checkbox, Group, Anchor, Paper, Flex } from '@mantine/core';

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
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
        visibleFrom="md"
      >
        {/* Decorative ambient backdrop glows & edge bubbles */}
        <div style={{ position: 'absolute', top: '-15%', left: '-15%', width: '480px', height: '480px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-15%', width: '520px', height: '520px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', filter: 'blur(90px)', pointerEvents: 'none' }} />

        {/* Floating glassmorphic backdrop edge bubbles */}
        <div style={{
          position: 'absolute',
          top: '6%',
          right: '8%',
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), rgba(255,255,255,0.03))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.3)',
          animation: 'float-bubble 6s ease-in-out infinite',
          opacity: 0.2,
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute',
          top: '38%',
          left: '-40px',
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), rgba(255,255,255,0.02))',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.25)',
          animation: 'float-bubble-reverse 8s ease-in-out infinite',
          opacity: 0.18,
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute',
          bottom: '12%',
          right: '-30px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0.03))',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.3)',
          animation: 'float-bubble 7s ease-in-out infinite',
          opacity: 0.22,
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '12%',
          width: '75px',
          height: '75px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.28), rgba(255,255,255,0.04))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.3)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.35)',
          animation: 'float-bubble-reverse 5s ease-in-out infinite',
          opacity: 0.2,
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute',
          top: '22%',
          right: '25%',
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.35)',
          animation: 'float-bubble 9s ease-in-out infinite',
          opacity: 0.18,
          pointerEvents: 'none',
        }} />

        {/* Top Branding */}
        <Group gap="sm" style={{ zIndex: 1 }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}>
            <Rocket size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <Text fw={800} style={{ fontSize: '1.25rem', letterSpacing: '-0.04em', color: '#ffffff' }}>
              WebBlaze <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>PMS</span>
            </Text>
          </div>
        </Group>

        {/* Hero Content */}
        <Box style={{ zIndex: 1, maxWidth: '520px', margin: 'auto 0' }}>
          <Title order={1} mb="lg" style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#ffffff' }}>
            Next-Gen Project Operations & Team Workspace
          </Title>
          <Text size="md" mb={40} style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, fontSize: '1rem' }}>
            Empower your team to plan, track timelogs, manage releases, and execute projects with crystal clarity.
          </Text>

          <Flex direction="column" gap="md">
            <Group wrap="nowrap" gap="md">
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={18} color="#ffffff" />
              </div>
              <Text size="sm" fw={600} style={{ color: '#ffffff' }}>Role-Based Access Control & Financial Isolation</Text>
            </Group>
            <Group wrap="nowrap" gap="md">
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={18} color="#ffffff" />
              </div>
              <Text size="sm" fw={600} style={{ color: '#ffffff' }}>Real-Time Time Tracking & Milestones</Text>
            </Group>
            <Group wrap="nowrap" gap="md">
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={18} color="#ffffff" />
              </div>
              <Text size="sm" fw={600} style={{ color: '#ffffff' }}>Automated Invoices & Release Tracking</Text>
            </Group>
          </Flex>
        </Box>

        {/* Footer */}
        <Text size="xs" style={{ color: '#64748b', zIndex: 1 }}>
          © {new Date().getFullYear()} WebBlaze. All rights reserved.
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
              <Group gap="xs">
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Rocket size={18} color="#fff" />
                </div>
                <Text fw={800} style={{ fontSize: '1.125rem' }}>WebBlaze PMS</Text>
              </Group>
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
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
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
