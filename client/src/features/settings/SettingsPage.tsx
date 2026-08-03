import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Select,
  Alert,
  Badge,
  Grid,
  UnstyledButton,
  Paper,
  Divider,
} from '@mantine/core';
import { UserAvatar } from '../../components/common/UserAvatar';
import {
  User as UserIcon,
  Lock,
  Settings as SettingsIcon,
  AlertCircle,
  Check,
  ShieldCheck,
  Globe,
  Coins,
  Mail,
  Shield,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { useUpdateUserMutation } from '../users/user.slice';
import { useChangePasswordMutation, setUser } from '../auth/auth.slice';
import { Role } from '../../types';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const isAdminOrPM = user?.role === Role.ADMIN || user?.role === Role.PM;

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('profile');

  // Profile State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preference States
  const [currency, setCurrency] = useState(localStorage.getItem('pref_currency') || 'USD');
  const [timezone, setTimezone] = useState(localStorage.getItem('pref_timezone') || 'UTC');

  // Messages
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [prefSuccess, setPrefSuccess] = useState('');

  // Mutation hooks
  const [updateUser, { isLoading: isUpdatingProfile }] = useUpdateUserMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!user?._id) return;

    try {
      const res = await updateUser({
        id: user._id,
        data: { name: profileName, email: profileEmail },
      }).unwrap();

      if (res.success) {
        setProfileSuccess('Profile details updated successfully!');
        dispatch(setUser(res.data));
      }
    } catch (err: any) {
      setProfileError(err?.data?.error?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      const res = await changePassword({ currentPassword, newPassword }).unwrap();
      if (res.success) {
        setPasswordSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err?.data?.error?.message || 'Failed to update password. Please verify your current password.');
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSuccess('');
    localStorage.setItem('pref_currency', currency);
    localStorage.setItem('pref_timezone', timezone);
    setPrefSuccess('Workspace preferences saved successfully!');
    setTimeout(() => setPrefSuccess(''), 3000);
  };

  const sidebarItems = [
    { id: 'profile', label: 'My Profile', icon: UserIcon, desc: 'Personal info & details' },
    { id: 'security', label: 'Security & Password', icon: Lock, desc: 'Password & credentials' },
    ...(isAdminOrPM ? [{ id: 'preferences', label: 'Preferences', icon: SettingsIcon, desc: 'Display & localization' }] : []),
  ];

  return (
    <Container size="xl" style={{ animation: 'fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* Top Page Header */}
      <Group justify="space-between" align="center" mb="xl">
        <div>
          <Title
            order={1}
            style={{
              color: '#0f172a',
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            Account & Settings
          </Title>
          <Text size="sm" mt={4} style={{ color: '#64748b' }}>
            Manage your personal profile, security credentials, and workspace preferences.
          </Text>
        </div>
      </Group>

      {/* User Header Profile Card */}
      <Paper
        p="xl"
        radius="xl"
        withBorder
        mb="xl"
        style={{
          borderColor: '#e8ecf4',
          background: '#ffffff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        }}
      >
        <Group align="center" gap="xl" wrap="nowrap">
          <UserAvatar
            size={72}
            name={user?.name}
            avatarUrl={user?.avatarUrl}
          />
          <div style={{ flex: 1 }}>
            <Group gap="sm" mb={4} align="center">
              <Title order={3} style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.25rem' }}>
                {user?.name}
              </Title>
              <Badge variant="filled" color="blue" size="md" radius="sm">
                {user?.role?.replace('_', ' ').toUpperCase()}
              </Badge>
              {user?.department && (
                <Badge variant="light" color="gray" size="md" radius="sm">
                  {user?.department.toUpperCase()}
                </Badge>
              )}
            </Group>
            <Group gap="md">
              <Group gap="xs">
                <Mail size={14} color="#64748b" />
                <Text size="sm" style={{ color: '#64748b' }}>{user?.email}</Text>
              </Group>
              <Group gap="xs">
                <ShieldCheck size={14} color="#10b981" />
                <Text size="sm" fw={600} style={{ color: '#10b981' }}>Active Account</Text>
              </Group>
            </Group>
          </div>
        </Group>
      </Paper>

      {/* Main Grid Content */}
      <Grid gutter="xl">
        {/* Left Navigation Sidebar */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
            <Stack gap="xs">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <UnstyledButton
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: isActive ? '#eff6ff' : 'transparent',
                      border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <Group gap="md" wrap="nowrap">
                      <Paper
                        p={8}
                        radius="md"
                        bg={isActive ? '#2563eb' : '#f1f5f9'}
                        style={{
                          color: isActive ? '#ffffff' : '#64748b',
                          transition: 'all 0.18s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={18} color={isActive ? '#ffffff' : '#64748b'} />
                      </Paper>
                      <div style={{ flex: 1 }}>
                        <Text
                          fw={isActive ? 700 : 500}
                          style={{
                            fontSize: '0.875rem',
                            color: isActive ? '#1d4ed8' : '#334155',
                            lineHeight: 1.3,
                          }}
                        >
                          {item.label}
                        </Text>
                        <Text style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                          {item.desc}
                        </Text>
                      </div>
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Right Content Panel */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          {activeTab === 'profile' && (
            <Paper p="xl" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
              <Group gap="xs" mb="xs">
                <Paper p={6} radius="md" bg="#eff6ff">
                  <UserIcon size={18} color="#2563eb" />
                </Paper>
                <Title order={4} style={{ color: '#0f172a', fontWeight: 800 }}>
                  Profile Information
                </Title>
              </Group>
              <Text size="sm" style={{ color: '#64748b' }} mb="xl">
                Update your personal name and communication email address.
              </Text>

              <form onSubmit={handleUpdateProfile}>
                <Stack gap="md">
                  {profileSuccess && (
                    <Alert icon={<Check size={16} />} title="Success" color="green" radius="md">
                      {profileSuccess}
                    </Alert>
                  )}
                  {profileError && (
                    <Alert icon={<AlertCircle size={16} />} title="Error" color="red" radius="md">
                      {profileError}
                    </Alert>
                  )}

                  <TextInput
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    radius="md"
                    leftSection={<UserIcon size={16} color="#64748b" />}
                  />

                  <TextInput
                    label="Email Address"
                    placeholder="Enter email address"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                    type="email"
                    radius="md"
                    leftSection={<Mail size={16} color="#64748b" />}
                  />

                  <TextInput
                    label="Assigned System Role"
                    value={user?.role?.replace('_', ' ').toUpperCase() || ''}
                    disabled
                    radius="md"
                    leftSection={<Shield size={16} color="#94a3b8" />}
                    description="Roles and system permissions are managed by Administrators."
                  />

                  <Divider my="xs" style={{ borderColor: '#f1f5f9' }} />

                  <Group justify="flex-end">
                    <Button
                      type="submit"
                      loading={isUpdatingProfile}
                      size="md"
                      radius="md"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        fontWeight: 600,
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                      }}
                    >
                      Save Changes
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Paper>
          )}

          {activeTab === 'security' && (
            <Paper p="xl" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
              <Group gap="xs" mb="xs">
                <Paper p={6} radius="md" bg="#eff6ff">
                  <KeyRound size={18} color="#2563eb" />
                </Paper>
                <Title order={4} style={{ color: '#0f172a', fontWeight: 800 }}>
                  Security & Password
                </Title>
              </Group>
              <Text size="sm" style={{ color: '#64748b' }} mb="xl">
                Ensure your account is using a strong password to protect your workspace data.
              </Text>

              <form onSubmit={handleChangePassword}>
                <Stack gap="md">
                  {passwordSuccess && (
                    <Alert icon={<Check size={16} />} title="Success" color="green" radius="md">
                      {passwordSuccess}
                    </Alert>
                  )}
                  {passwordError && (
                    <Alert icon={<AlertCircle size={16} />} title="Error" color="red" radius="md">
                      {passwordError}
                    </Alert>
                  )}

                  <PasswordInput
                    label="Current Password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    radius="md"
                    leftSection={<Lock size={16} color="#64748b" />}
                  />

                  <PasswordInput
                    label="New Password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    radius="md"
                    leftSection={<Lock size={16} color="#64748b" />}
                  />

                  <PasswordInput
                    label="Confirm New Password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    radius="md"
                    leftSection={<Lock size={16} color="#64748b" />}
                  />

                  <Divider my="xs" style={{ borderColor: '#f1f5f9' }} />

                  <Group justify="flex-end">
                    <Button
                      type="submit"
                      loading={isChangingPassword}
                      size="md"
                      radius="md"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        fontWeight: 600,
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                      }}
                    >
                      Update Password
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Paper>
          )}

          {activeTab === 'preferences' && isAdminOrPM && (
            <Paper p="xl" radius="xl" withBorder style={{ borderColor: '#e8ecf4', background: '#ffffff' }}>
              <Group gap="xs" mb="xs">
                <Paper p={6} radius="md" bg="#eff6ff">
                  <Sparkles size={18} color="#2563eb" />
                </Paper>
                <Title order={4} style={{ color: '#0f172a', fontWeight: 800 }}>
                  Workspace Preferences
                </Title>
              </Group>
              <Text size="sm" style={{ color: '#64748b' }} mb="xl">
                Customize local currency and time zone formats for your view.
              </Text>

              <form onSubmit={handleSavePreferences}>
                <Stack gap="md">
                  {prefSuccess && (
                    <Alert icon={<Check size={16} />} title="Success" color="green" radius="md">
                      {prefSuccess}
                    </Alert>
                  )}

                  <Select
                    label="Default Currency Format"
                    description="Used across total project amounts, invoices, and billing screens."
                    data={[
                      { value: 'USD', label: 'USD ($) - US Dollar' },
                      { value: 'EUR', label: 'EUR (€) - Euro' },
                      { value: 'GBP', label: 'GBP (£) - British Pound' },
                      { value: 'INR', label: 'INR (₹) - Indian Rupee' },
                    ]}
                    value={currency}
                    onChange={(val) => setCurrency(val || 'USD')}
                    leftSection={<Coins size={16} color="#64748b" />}
                    radius="md"
                  />

                  <Select
                    label="Workspace Time Zone"
                    description="Adjust time formats for automatic time tracking and log entries."
                    data={[
                      { value: 'UTC', label: 'UTC (GMT+00:00)' },
                      { value: 'IST', label: 'Asia/Kolkata (GMT+05:30)' },
                      { value: 'EST', label: 'US/Eastern (GMT-05:00)' },
                      { value: 'PST', label: 'US/Pacific (GMT-08:00)' },
                    ]}
                    value={timezone}
                    onChange={(val) => setTimezone(val || 'UTC')}
                    leftSection={<Globe size={16} color="#64748b" />}
                    radius="md"
                  />

                  <Divider my="xs" style={{ borderColor: '#f1f5f9' }} />

                  <Group justify="flex-end">
                    <Button
                      type="submit"
                      size="md"
                      radius="md"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        fontWeight: 600,
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                      }}
                    >
                      Save Preferences
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Paper>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default SettingsPage;
