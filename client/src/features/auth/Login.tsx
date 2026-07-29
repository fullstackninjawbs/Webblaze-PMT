import React, { useState } from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, setCredentials } from './auth.slice';
import { Lock, Mail, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
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
      
      // If remember me is checked, in a real app we'd configure persistent vs session storage
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
    <Box style={{ minHeight: '100vh', display: 'flex', background: '#F9FAFB' }}>
      
      {/* Left Panel: Branding & Benefits */}
      <Box 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          padding: '4rem',
          background: '#4F46E5',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
        visibleFrom="md" // Mantine prop to hide on small screens
      >
        {/* Subtle decorative circles */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(60px)' }} />

        <Box style={{ zIndex: 1, maxWidth: '500px', margin: '0 auto' }}>
          <Title order={1} mb="xl" style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1 }}>
            Project Management & Team Operations Platform
          </Title>
          <Text size="lg" mb={50} style={{ color: 'rgba(255,255,255,0.8)' }}>
            Empower your team to plan, track, and execute with absolute clarity. Experience the next generation of team collaboration.
          </Text>

          <Flex direction="column" gap="lg">
            <Group wrap="nowrap">
              <CheckCircle size={24} color="#818CF8" style={{ flexShrink: 0 }} />
              <Text size="md" fw={500}>Role-Based Control & Security</Text>
            </Group>
            <Group wrap="nowrap">
              <CheckCircle size={24} color="#818CF8" style={{ flexShrink: 0 }} />
              <Text size="md" fw={500}>Comprehensive Time Tracking</Text>
            </Group>
            <Group wrap="nowrap">
              <CheckCircle size={24} color="#818CF8" style={{ flexShrink: 0 }} />
              <Text size="md" fw={500}>Automated Invoicing & Releases</Text>
            </Group>
          </Flex>
        </Box>
      </Box>

      {/* Right Panel: Login Form */}
      <Box 
        style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <Container size={440} w="100%">
          <Paper p={40} radius="xl" withBorder style={{ backgroundColor: '#fff' }}>
            
            <Title order={2} ta="center" mb={5} style={{ color: '#111827', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Welcome back
            </Title>
            <Text size="sm" ta="center" mb={35} style={{ color: '#6B7280' }}>
              Sign in to your Webblaze account to continue
            </Text>

            {errorMessage && (
              <Alert icon={<AlertCircle size={16} />} title="Authentication Failed" color="red" mb="xl" variant="light" radius="md">
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={form.onSubmit(onSubmit)}>
              <TextInput
                label={<Text size="sm" fw={600} mb={4} style={{ color: '#374151' }}>Email Address</Text>}
                placeholder="name@webblaze.com"
                leftSection={<Mail size={18} color="#9CA3AF" />}
                {...form.getInputProps('email')}
                radius="md"
                size="lg"
                mb="lg"
                error={form.errors.email}
              />
              
              <PasswordInput
                label={<Text size="sm" fw={600} mb={4} style={{ color: '#374151' }}>Password</Text>}
                placeholder="Your password"
                leftSection={<Lock size={18} color="#9CA3AF" />}
                {...form.getInputProps('password')}
                radius="md"
                size="lg"
                mb="md"
                error={form.errors.password}
              />

              <Group justify="space-between" mb="xl">
                <Checkbox 
                  label={<Text size="sm" style={{ color: '#4B5563' }}>Remember me</Text>}
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.currentTarget.checked)}
                />
                <Anchor href="#" size="sm" fw={500} style={{ color: '#4F46E5' }}>
                  Forgot password?
                </Anchor>
              </Group>

              <Button 
                fullWidth 
                size="lg" 
                radius="md" 
                type="submit" 
                loading={isLoading}
                rightSection={<ArrowRight size={18} />}
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
