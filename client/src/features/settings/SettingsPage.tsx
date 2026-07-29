import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { Container, Title, Text, Card, Group, Stack, TextInput, Button, Avatar, Select, Alert, Badge, Grid, UnstyledButton } from '@mantine/core';
import { User as UserIcon, Lock, Settings as SettingsIcon, AlertCircle, Check, Shield, Globe, Coins } from 'lucide-react';
import { useUpdateUserMutation } from '../users/user.slice';
import { useChangePasswordMutation, setUser } from '../auth/auth.slice';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

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
        data: { name: profileName, email: profileEmail }
      }).unwrap();
      
      if (res.success) {
        setProfileSuccess('Profile updated successfully!');
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
      setPasswordError(err?.data?.error?.message || 'Failed to update password. Verify current password.');
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
    { id: 'profile', label: 'My Profile', icon: UserIcon, desc: 'Manage your personal details' },
    { id: 'security', label: 'Security & Sign-in', icon: Lock, desc: 'Change password & credentials' },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon, desc: 'Workspace & display setups' },
  ];

  return (
    <Container size="xl" py="xl" style={{ animation: 'fade-in 0.4s ease-out' }}>
      {/* Banner / Header Card */}
      <Card 
        radius="lg" 
        mb="xl" 
        p="xl" 
        style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', 
          color: '#ffffff',
          boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.3)'
        }}
      >
        <Group align="center" gap="xl" wrap="nowrap">
          <Avatar 
            size={74} 
            src={user?.avatarUrl} 
            color="white" 
            radius="100%" 
            style={{ border: '3px solid rgba(255, 255, 255, 0.3)' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Title order={3} style={{ fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px' }}>
              {user?.name}
            </Title>
            <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
              {user?.email}
            </Text>
            <Group gap="xs">
              <Badge color="white" variant="white" size="sm" style={{ color: '#3b82f6', fontWeight: 700 }}>
                {user?.role.replace('_', ' ')}
              </Badge>
              {user?.department && (
                <Badge variant="outline" size="sm" style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
                  {user?.department}
                </Badge>
              )}
            </Group>
          </div>
        </Group>
      </Card>

      <Grid gutter="xl">
        {/* Left Navigation Sidebar */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="sm">
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
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                    borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Group gap="md" wrap="nowrap">
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? '#3b82f6' : '#e5e7eb',
                      color: isActive ? '#ffffff' : '#4b5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}>
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text fw={isActive ? 700 : 500} size="sm" c={isActive ? '#1d4ed8' : '#4b5563'}>
                        {item.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.desc}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              );
            })}
          </Stack>
        </Grid.Col>

        {/* Right Active Panel */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          {activeTab === 'profile' && (
            <Card withBorder shadow="sm" p="xl" radius="lg">
              <Group gap="sm" mb="lg">
                <UserIcon size={20} color="#3b82f6" />
                <Title order={4} style={{ color: '#111827' }}>Profile Settings</Title>
              </Group>

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
                    placeholder="e.g. John Doe"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />

                  <TextInput
                    label="Email Address"
                    placeholder="e.g. johndoe@company.com"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                    type="email"
                  />

                  <TextInput
                    label="Role"
                    value={user?.role.replace('_', ' ') || ''}
                    disabled
                    description="Contact Administrator to adjust role settings."
                  />

                  <Button type="submit" color="blue" loading={isUpdatingProfile} mt="sm" radius="md" style={{ alignSelf: 'flex-start' }}>
                    Save Changes
                  </Button>
                </Stack>
              </form>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card withBorder shadow="sm" p="xl" radius="lg">
              <Group gap="sm" mb="lg">
                <Shield size={20} color="#3b82f6" />
                <Title order={4} style={{ color: '#111827' }}>Security & Credentials</Title>
              </Group>

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

                  <TextInput
                    label="Current Password"
                    placeholder="Enter current password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />

                  <TextInput
                    label="New Password"
                    placeholder="Minimum 6 characters"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />

                  <TextInput
                    label="Confirm New Password"
                    placeholder="Repeat new password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <Button type="submit" color="blue" loading={isChangingPassword} mt="sm" radius="md" style={{ alignSelf: 'flex-start' }}>
                    Update Password
                  </Button>
                </Stack>
              </form>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card withBorder shadow="sm" p="xl" radius="lg">
              <Group gap="sm" mb="lg">
                <Globe size={20} color="#3b82f6" />
                <Title order={4} style={{ color: '#111827' }}>Workspace Customization</Title>
              </Group>

              <form onSubmit={handleSavePreferences}>
                <Stack gap="md">
                  {prefSuccess && (
                    <Alert icon={<Check size={16} />} title="Success" color="green" radius="md">
                      {prefSuccess}
                    </Alert>
                  )}

                  <Select
                    label="Default Currency Symbol"
                    description="Preferred currency symbol used inside project details & billing."
                    data={[
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'GBP', label: 'GBP (£)' },
                      { value: 'INR', label: 'INR (₹)' },
                    ]}
                    value={currency}
                    onChange={(val) => setCurrency(val || 'USD')}
                    leftSection={<Coins size={16} />}
                  />

                  <Select
                    label="Workspace Timezone"
                    description="Adjust default time formats for automatic timelogs."
                    data={[
                      { value: 'UTC', label: 'UTC (GMT+00:00)' },
                      { value: 'IST', label: 'Asia/Kolkata (GMT+05:30)' },
                      { value: 'EST', label: 'US/Eastern (GMT-05:00)' },
                      { value: 'PST', label: 'US/Pacific (GMT-08:00)' },
                    ]}
                    value={timezone}
                    onChange={(val) => setTimezone(val || 'UTC')}
                    leftSection={<Globe size={16} />}
                  />

                  <Button type="submit" color="blue" mt="sm" radius="md" style={{ alignSelf: 'flex-start' }}>
                    Save Preferences
                  </Button>
                </Stack>
              </form>
            </Card>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default SettingsPage;
