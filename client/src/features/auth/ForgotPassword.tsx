import React, { useState } from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from './auth.slice';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Container, Title, Text, TextInput, Button, Alert, Box, Paper, Flex, Group } from '@mantine/core';
import { BlazeLogo } from '../../components/common/BlazeLogo';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ForgotPassword: React.FC = () => {
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: typeof form.values) => {
    try {
      await forgotPassword({ email: values.email }).unwrap();
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to request password reset', err);
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
          background: 'linear-gradient(135deg, #173775 0%, #2563eb 50%, #4f46e5 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
        visibleFrom="md"
      >
        {/* Decorative ambient backdrop glows & edge bubbles */}
        <div style={{ position: 'absolute', top: '-15%', left: '-15%', width: '480px', height: '480px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.12)', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-15%', width: '520px', height: '520px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', filter: 'blur(100px)', pointerEvents: 'none' }} />

        {/* Subtle glass bubbles on edges */}
        <div style={{
          position: 'absolute',
          top: '8%',
          right: '10%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), rgba(255,255,255,0.03))',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
          animation: 'float-bubble 6s ease-in-out infinite',
          opacity: 0.2,
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute',
          bottom: '15%',
          right: '-20px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0.03))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.22)',
          animation: 'float-bubble 7s ease-in-out infinite',
          opacity: 0.22,
          pointerEvents: 'none',
        }} />

        {/* Top Branding */}
        <Box style={{ zIndex: 1 }}>
          <BlazeLogo variant="light" size="lg" />
        </Box>

        {/* Hero Content */}
        <Box style={{ zIndex: 1, maxWidth: '520px', margin: 'auto 0' }}>
          <Title order={1} mb="lg" style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.18, letterSpacing: '-0.03em', color: '#ffffff' }}>
            Account Recovery & Security Assurance
          </Title>
          <Text size="md" mb={40} style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, fontSize: '1rem' }}>
            Don't worry! We will send you an encrypted password reset link to safely regain access to your WebBlaze workspace.
          </Text>

          <Flex direction="column" gap="md">
            <Group wrap="nowrap" gap="md" style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '12px 16px',
              borderRadius: '12px',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={20} color="#ffffff" />
              </div>
              <div>
                <Text size="sm" fw={600} style={{ color: '#ffffff' }}>Secure Token Authentication</Text>
                <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Time-bound single-use reset tokens</Text>
              </div>
            </Group>

            <Group wrap="nowrap" gap="md" style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '12px 16px',
              borderRadius: '12px',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={20} color="#ffffff" />
              </div>
              <div>
                <Text size="sm" fw={600} style={{ color: '#ffffff' }}>1-Hour Expiration</Text>
                <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Automatic token invalidation after 60 minutes</Text>
              </div>
            </Group>
          </Flex>
        </Box>

        {/* Footer */}
        <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.7)', zIndex: 1 }}>
          © {new Date().getFullYear()} WebBlaze. All rights reserved.
        </Text>
      </Box>

      {/* Right Panel: Forgot Password Form */}
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
            p={40} 
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
              <BlazeLogo variant="dark" size="md" />
            </Flex>

            {submitted ? (
              <Box style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                
                <Title order={2} mb={8} style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: 700 }}>
                  Check your email
                </Title>

                <Text size="sm" mb={24} style={{ color: '#64748b', lineHeight: 1.6 }}>
                  If an account exists for <strong>{form.values.email}</strong>, we have sent a password reset link to your inbox.
                </Text>

                <Alert color="blue" variant="light" radius="md" mb={24} style={{ textAlign: 'left' }}>
                  <Text size="xs" style={{ color: '#1e40af' }}>
                    Please check your spam or junk folder if you do not receive the email within a few minutes.
                  </Text>
                </Alert>

                <Button 
                  component={Link}
                  to="/login"
                  fullWidth 
                  size="md" 
                  radius="md" 
                  variant="outline"
                  leftSection={<ArrowLeft size={16} />}
                >
                  Back to Sign In
                </Button>
              </Box>
            ) : (
              <>
                <Title order={2} ta="center" mb={6} style={{ color: '#0f172a', fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
                  Forgot Password?
                </Title>
                <Text size="sm" ta="center" mb={32} style={{ color: '#64748b' }}>
                  Enter your account email and we'll send you a password reset link
                </Text>

                {errorMessage && (
                  <Alert icon={<AlertCircle size={16} />} title="Request Failed" color="red" mb="xl" variant="light" radius="md">
                    {errorMessage}
                  </Alert>
                )}

                <form onSubmit={form.onSubmit(onSubmit)}>
                  <TextInput
                    label={<Text size="xs" fw={600} mb={6} style={{ color: '#0f172a' }}>Email Address</Text>}
                    placeholder="name@webblaze.com"
                    leftSection={<Mail size={16} color="#94a3b8" />}
                    {...form.getInputProps('email')}
                    radius="md"
                    size="md"
                    mb="xl"
                    error={form.errors.email}
                  />

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
                      fontSize: '0.9375rem',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                      marginBottom: '16px',
                    }}
                  >
                    Send Reset Link
                  </Button>

                  <Flex justify="center" align="center" mt="md">
                    <Link to="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
                      <ArrowLeft size={16} /> Back to Sign In
                    </Link>
                  </Flex>
                </form>
              </>
            )}
          </Paper>
        </Container>
      </Box>

    </Box>
  );
};

export default ForgotPassword;
