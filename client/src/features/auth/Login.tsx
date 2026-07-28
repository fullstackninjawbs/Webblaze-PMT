import React from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, setCredentials } from './auth.slice';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { Container, Paper, Title, Text, TextInput, PasswordInput, Button, Alert, Box, ThemeIcon, Center } from '@mantine/core';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading, error }] = useLoginMutation();

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
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Failed to log in', err);
    }
  };

  const errorMessage = (error as { data?: { error?: { message?: string } } })?.data?.error?.message;

  return (
    <Box 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative ambient blobs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)' }} />

      <Container size={440} w="100%" style={{ zIndex: 1 }}>
        <Paper 
          radius="xl" 
          p={50} 
          style={{ 
            background: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(20px)', 
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <Center mb="xl">
            <ThemeIcon size={80} radius={24} variant="light" color="blue" style={{ backgroundColor: '#EFF6FF', color: '#3B82F6', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)' }}>
              <Lock size={38} strokeWidth={1.5} />
            </ThemeIcon>
          </Center>
          
          <Title order={1} ta="center" mb={8} style={{ color: '#111827', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Welcome Back
          </Title>
          <Text size="md" ta="center" mb={35} style={{ color: '#6B7280' }}>
            Sign in to your Webblaze account
          </Text>

          {errorMessage && (
            <Alert icon={<AlertCircle size={16} />} title="Authentication Failed" color="red" mb="xl" variant="light" style={{ borderRadius: '12px' }}>
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
              styles={{
                input: { 
                  background: '#F9FAFB', 
                  border: '1px solid #E5E7EB', 
                  color: '#111827',
                  transition: 'all 0.2s ease',
                  '&:focus': { borderColor: '#3b82f6', backgroundColor: '#fff', boxShadow: '0 0 0 2px rgba(59,130,246,0.1)' }
                }
              }}
            />
            
            <PasswordInput
              label={<Text size="sm" fw={600} mb={4} style={{ color: '#374151' }}>Password</Text>}
              placeholder="Your password"
              leftSection={<Lock size={18} color="#9CA3AF" />}
              {...form.getInputProps('password')}
              radius="md"
              size="lg"
              mb={35}
              styles={{
                input: { 
                  background: '#F9FAFB', 
                  border: '1px solid #E5E7EB', 
                  color: '#111827',
                  transition: 'all 0.2s ease',
                  '&:focus-within': { borderColor: '#3b82f6', backgroundColor: '#fff', boxShadow: '0 0 0 2px rgba(59,130,246,0.1)' }
                },
                innerInput: { color: '#111827' }
              }}
            />

            <Button 
              fullWidth 
              size="lg" 
              radius="md" 
              type="submit" 
              loading={isLoading}
              color="blue"
              style={{ 
                border: 'none', 
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)',
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}
            >
              Sign In
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
