import React, { useState } from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useResetPasswordMutation } from './auth.slice';
import { Lock, ArrowRight, ShieldCheck, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Container, Title, Text, PasswordInput, Button, Alert, Box, Paper, Flex, Group } from '@mantine/core';
import { BlazeLogo } from '../../components/common/BlazeLogo';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters long'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();
  const [success, setSuccess] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const form = useForm({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validate: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: typeof form.values) => {
    if (!token) return;
    try {
      await resetPassword({
        token,
        newPassword: values.newPassword,
      }).unwrap();
      setSuccess(true);
    } catch (err) {
      console.error('Failed to reset password', err);
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
        {/* Decorative ambient backdrop glows */}
        <div style={{ position: 'absolute', top: '-15%', left: '-15%', width: '480px', height: '480px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.12)', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-15%', width: '520px', height: '520px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', filter: 'blur(100px)', pointerEvents: 'none' }} />

        {/* Top Branding */}
        <Box style={{ zIndex: 1 }}>
          <BlazeLogo variant="light" size="lg" />
        </Box>

        {/* Hero Content */}
        <Box style={{ zIndex: 1, maxWidth: '520px', margin: 'auto 0' }}>
          <Title order={1} mb="lg" style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.18, letterSpacing: '-0.03em', color: '#ffffff' }}>
            Set a New Secure Password
          </Title>
          <Text size="md" mb={40} style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, fontSize: '1rem' }}>
            Your account security is paramount. Create a strong password containing letters, numbers, and symbols.
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
                <Text size="sm" fw={600} style={{ color: '#ffffff' }}>Bcrypt Password Hashing</Text>
                <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Industry standard cryptographic protection</Text>
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
                <Text size="sm" fw={600} style={{ color: '#ffffff' }}>Instant Password Invalidation</Text>
                <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Old credentials are immediately disabled</Text>
              </div>
            </Group>
          </Flex>
        </Box>

        {/* Footer */}
        <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.7)', zIndex: 1 }}>
          © {new Date().getFullYear()} WebBlaze. All rights reserved.
        </Text>
      </Box>

      {/* Right Panel: Reset Password Form */}
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

            {!token ? (
              <Box style={{ textAlign: 'center' }}>
                <Alert icon={<AlertCircle size={16} />} title="Invalid Reset Link" color="red" mb="xl" variant="light" radius="md">
                  No password reset token was provided in the URL. Please request a new password reset link.
                </Alert>
                <Button 
                  component={Link}
                  to="/forgot-password"
                  fullWidth 
                  size="md" 
                  radius="md" 
                  variant="outline"
                >
                  Request New Link
                </Button>
              </Box>
            ) : success ? (
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
                  Password Reset Complete!
                </Title>

                <Text size="sm" mb={24} style={{ color: '#64748b', lineHeight: 1.6 }}>
                  Your password has been successfully updated. You can now sign in with your new credentials.
                </Text>

                <Button 
                  onClick={() => navigate('/login', { replace: true })}
                  fullWidth 
                  size="md" 
                  radius="md" 
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    fontWeight: 600,
                  }}
                  rightSection={<ArrowRight size={16} />}
                >
                  Sign In Now
                </Button>
              </Box>
            ) : (
              <>
                <Title order={2} ta="center" mb={6} style={{ color: '#0f172a', fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
                  Reset Password
                </Title>
                <Text size="sm" ta="center" mb={32} style={{ color: '#64748b' }}>
                  Enter your new password below to update your account
                </Text>

                {errorMessage && (
                  <Alert icon={<AlertCircle size={16} />} title="Reset Failed" color="red" mb="xl" variant="light" radius="md">
                    {errorMessage}
                  </Alert>
                )}

                <form onSubmit={form.onSubmit(onSubmit)}>
                  <PasswordInput
                    label={<Text size="xs" fw={600} mb={6} style={{ color: '#0f172a' }}>New Password</Text>}
                    placeholder="At least 6 characters"
                    leftSection={<Lock size={16} color="#94a3b8" />}
                    {...form.getInputProps('newPassword')}
                    radius="md"
                    size="md"
                    mb="md"
                    error={form.errors.newPassword}
                  />

                  <PasswordInput
                    label={<Text size="xs" fw={600} mb={6} style={{ color: '#0f172a' }}>Confirm New Password</Text>}
                    placeholder="Re-enter your password"
                    leftSection={<Lock size={16} color="#94a3b8" />}
                    {...form.getInputProps('confirmPassword')}
                    radius="md"
                    size="md"
                    mb="xl"
                    error={form.errors.confirmPassword}
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
                    }}
                  >
                    Reset Password
                  </Button>
                </form>
              </>
            )}
          </Paper>
        </Container>
      </Box>

    </Box>
  );
};

export default ResetPassword;
