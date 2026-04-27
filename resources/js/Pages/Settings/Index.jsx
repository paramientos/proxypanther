import React, { useState } from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Title, Text, Button, Group, Stack, TextInput,
    PasswordInput, Select, Tabs, Paper, Flex, Divider,
    Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconMail, IconSettings, IconUser, IconKey,
    IconDeviceFloppy, IconSend, IconCheck, IconAlertCircle,
} from '@tabler/icons-react';
import { Head, useForm, usePage } from '@inertiajs/react';

const CARD_BG = '#111113';
const BORDER = 'rgba(255,255,255,0.07)';
const ACCENT = '#f38020';

const inputStyles = {
    label: { color: '#71717a', fontSize: 12 },
    input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
};

function Section({ title, description, children }) {
    return (
        <Paper p={24} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
            <Box mb={20}>
                <Text fw={600} c="white" size="sm">{title}</Text>
                {description && <Text c="dimmed" size="xs" mt={2}>{description}</Text>}
            </Box>
            <Divider color={BORDER} mb={20} />
            {children}
        </Paper>
    );
}

export default function Index({ auth, smtp, app, profile }) {
    const { props } = usePage();
    const flash = props.flash || {};

    const getInitialTab = () => {
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search).get('tab') || 'profile';
        }
        return 'profile';
    };

    const [activeTab, setActiveTab] = React.useState(getInitialTab);

    const smtpForm = useForm({
        mail_mailer: smtp.mail_mailer || 'smtp',
        mail_host: smtp.mail_host || '',
        mail_port: smtp.mail_port || '587',
        mail_username: smtp.mail_username || '',
        mail_password: smtp.mail_password || '',
        mail_encryption: smtp.mail_encryption || 'tls',
        mail_from_address: smtp.mail_from_address || '',
        mail_from_name: smtp.mail_from_name || '',
    });

    const appForm = useForm({
        app_name: app.app_name || 'ProxyPanther',
        app_url: app.app_url || '',
        app_timezone: app.app_timezone || 'UTC',
    });

    const profileForm = useForm({
        name: profile.name || '',
        email: profile.email || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const testForm = useForm({ email: auth.user.email });
    const [testResult, setTestResult] = useState(null);

    const timezones = Intl.supportedValuesOf
        ? Intl.supportedValuesOf('timeZone').map(tz => ({ value: tz, label: tz }))
        : [{ value: 'UTC', label: 'UTC' }];

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title="Settings" />

            <Flex justify="space-between" align="center" mb={32}>
                <Box>
                    <Title order={2} c="white" fw={600}>Settings</Title>
                    <Text c="dimmed" size="sm" mt={4}>Manage application configuration and your account.</Text>
                </Box>
            </Flex>

            {flash.success && (
                <Alert icon={<IconCheck size={16} />} color="green" mb={20} variant="light">
                    {flash.success}
                </Alert>
            )}

            {(profileForm.errors.rate_limit || passwordForm.errors.rate_limit) && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" mb={20} variant="light">
                    {profileForm.errors.rate_limit || passwordForm.errors.rate_limit}
                </Alert>
            )}

            <Tabs value={activeTab} onChange={setActiveTab} styles={{
                tab: { color: '#71717a', '&[dataActive]': { color: ACCENT } },
                list: { borderColor: BORDER },
            }}>
                <Tabs.List mb={24}>
                    <Tabs.Tab value="profile" leftSection={<IconUser size={14} />}>Profile</Tabs.Tab>
                    <Tabs.Tab value="password" leftSection={<IconKey size={14} />}>Password</Tabs.Tab>
                    <Tabs.Tab value="smtp" leftSection={<IconMail size={14} />}>Mail / SMTP</Tabs.Tab>
                    <Tabs.Tab value="app" leftSection={<IconSettings size={14} />}>Application</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="profile">
                    <Section title="Profile Information" description="Update your name and email address.">
                        <form onSubmit={e => { e.preventDefault(); profileForm.post(route('settings.profile'), { preserveScroll: true, preserveState: true, onSuccess: () => notifications.show({ title: 'Saved', message: 'Profile updated.', color: 'green' }) }); }}>
                            <Stack gap={16} maw={480}>
                                <TextInput
                                    label="Name"
                                    required
                                    value={profileForm.data.name}
                                    onChange={e => profileForm.setData('name', e.target.value)}
                                    error={profileForm.errors.name}
                                    styles={inputStyles}
                                />
                                <TextInput
                                    label="Email Address"
                                    type="email"
                                    required
                                    value={profileForm.data.email}
                                    onChange={e => profileForm.setData('email', e.target.value)}
                                    error={profileForm.errors.email}
                                    styles={inputStyles}
                                />
                                <Group>
                                    <Button
                                        type="submit"
                                        loading={profileForm.processing}
                                        leftSection={<IconDeviceFloppy size={15} />}
                                        style={{ backgroundColor: ACCENT }}
                                    >
                                        Save Profile
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Section>
                </Tabs.Panel>

                <Tabs.Panel value="password">
                    <Section title="Change Password" description="Use a strong, unique password.">
                        <form onSubmit={e => { e.preventDefault(); passwordForm.post(route('settings.password'), { preserveScroll: true, preserveState: true, onSuccess: () => { passwordForm.reset(); notifications.show({ title: 'Saved', message: 'Password updated.', color: 'green' }); } }); }}>
                            <Stack gap={16} maw={480}>
                                <PasswordInput
                                    label="Current Password"
                                    required
                                    value={passwordForm.data.current_password}
                                    onChange={e => passwordForm.setData('current_password', e.target.value)}
                                    error={passwordForm.errors.current_password}
                                    styles={inputStyles}
                                />
                                <PasswordInput
                                    label="New Password"
                                    required
                                    value={passwordForm.data.password}
                                    onChange={e => passwordForm.setData('password', e.target.value)}
                                    error={passwordForm.errors.password}
                                    styles={inputStyles}
                                />
                                <PasswordInput
                                    label="Confirm New Password"
                                    required
                                    value={passwordForm.data.password_confirmation}
                                    onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                    error={passwordForm.errors.password_confirmation}
                                    styles={inputStyles}
                                />
                                <Group>
                                    <Button
                                        type="submit"
                                        loading={passwordForm.processing}
                                        leftSection={<IconKey size={15} />}
                                        style={{ backgroundColor: ACCENT }}
                                    >
                                        Update Password
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Section>
                </Tabs.Panel>

                <Tabs.Panel value="smtp">
                    <Stack gap={16}>
                        <Section title="Mail Configuration" description="Configure outgoing email settings for notifications and alerts.">
                            <form onSubmit={e => { e.preventDefault(); smtpForm.post(route('settings.smtp'), { preserveScroll: true, preserveState: true, onSuccess: () => notifications.show({ title: 'Saved', message: 'Mail settings saved.', color: 'green' }) }); }}>
                                <Stack gap={16} maw={560}>
                                    <Select
                                        label="Mail Driver"
                                        required
                                        value={smtpForm.data.mail_mailer}
                                        onChange={v => smtpForm.setData('mail_mailer', v)}
                                        data={[
                                            { value: 'smtp', label: 'SMTP' },
                                            { value: 'log', label: 'Log (development)' },
                                            { value: 'sendmail', label: 'Sendmail' },
                                        ]}
                                        styles={inputStyles}
                                    />
                                    {smtpForm.data.mail_mailer === 'smtp' && (
                                        <>
                                            <Group grow>
                                                <TextInput
                                                    label="SMTP Host"
                                                    placeholder="smtp.example.com"
                                                    required
                                                    value={smtpForm.data.mail_host}
                                                    onChange={e => smtpForm.setData('mail_host', e.target.value)}
                                                    error={smtpForm.errors.mail_host}
                                                    styles={inputStyles}
                                                />
                                                <TextInput
                                                    label="Port"
                                                    placeholder="587"
                                                    required
                                                    value={smtpForm.data.mail_port}
                                                    onChange={e => smtpForm.setData('mail_port', e.target.value)}
                                                    error={smtpForm.errors.mail_port}
                                                    styles={inputStyles}
                                                />
                                            </Group>
                                            <Select
                                                label="Encryption"
                                                value={smtpForm.data.mail_encryption || 'none'}
                                                onChange={v => smtpForm.setData('mail_encryption', v === 'none' ? '' : v)}
                                                data={[
                                                    { value: 'tls', label: 'TLS (recommended)' },
                                                    { value: 'ssl', label: 'SSL' },
                                                    { value: 'starttls', label: 'STARTTLS' },
                                                    { value: 'none', label: 'None' },
                                                ]}
                                                styles={inputStyles}
                                            />
                                            <TextInput
                                                label="Username"
                                                placeholder="your@email.com"
                                                required
                                                value={smtpForm.data.mail_username}
                                                onChange={e => smtpForm.setData('mail_username', e.target.value)}
                                                error={smtpForm.errors.mail_username}
                                                styles={inputStyles}
                                            />
                                            <PasswordInput
                                                label="Password"
                                                required
                                                value={smtpForm.data.mail_password}
                                                onChange={e => smtpForm.setData('mail_password', e.target.value)}
                                                error={smtpForm.errors.mail_password}
                                                styles={inputStyles}
                                            />
                                        </>
                                    )}
                                    <Divider color={BORDER} label={<Text size="xs" c="dimmed">From Address</Text>} />
                                    <Group grow>
                                        <TextInput
                                            label="From Address"
                                            placeholder="noreply@yourdomain.com"
                                            required
                                            value={smtpForm.data.mail_from_address}
                                            onChange={e => smtpForm.setData('mail_from_address', e.target.value)}
                                            error={smtpForm.errors.mail_from_address}
                                            styles={inputStyles}
                                        />
                                        <TextInput
                                            label="From Name"
                                            placeholder="ProxyPanther"
                                            required
                                            value={smtpForm.data.mail_from_name}
                                            onChange={e => smtpForm.setData('mail_from_name', e.target.value)}
                                            error={smtpForm.errors.mail_from_name}
                                            styles={inputStyles}
                                        />
                                    </Group>
                                    <Group>
                                        <Button
                                            type="submit"
                                            loading={smtpForm.processing}
                                            leftSection={<IconDeviceFloppy size={15} />}
                                            style={{ backgroundColor: ACCENT }}
                                        >
                                            Save Mail Settings
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Section>

                        <Section title="Send Test Email" description="Verify your SMTP configuration is working.">
                            <form onSubmit={e => {
                                e.preventDefault();
                                setTestResult(null);
                                testForm.post(route('settings.smtp.test'), {
                                    preserveState: true,
                                    preserveScroll: true,
                                    onSuccess: () => setTestResult({ ok: true, msg: 'Test email sent successfully.' }),
                                    onError: (errors) => setTestResult({ ok: false, msg: errors.smtp || 'Failed to send test email.' }),
                                });
                            }}>
                                <Stack gap={12} maw={480}>
                                    <Group align="flex-end">
                                        <TextInput
                                            label="Send test to"
                                            type="email"
                                            required
                                            style={{ flex: 1 }}
                                            value={testForm.data.email}
                                            onChange={e => testForm.setData('email', e.target.value)}
                                            error={testForm.errors.email}
                                            styles={inputStyles}
                                        />
                                        <Button
                                            type="submit"
                                            loading={testForm.processing}
                                            leftSection={<IconSend size={15} />}
                                            variant="outline"
                                            color="orange"
                                        >
                                            Send Test
                                        </Button>
                                    </Group>
                                    {testResult && (
                                        <Alert
                                            icon={testResult.ok ? <IconCheck size={15} /> : <IconAlertCircle size={15} />}
                                            color={testResult.ok ? 'green' : 'red'}
                                            variant="light"
                                        >
                                            {testResult.msg}
                                        </Alert>
                                    )}
                                </Stack>
                            </form>
                        </Section>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="app">
                    <Section title="Application Settings" description="General application configuration.">
                        <form onSubmit={e => { e.preventDefault(); appForm.post(route('settings.app'), { preserveScroll: true, preserveState: true, onSuccess: () => notifications.show({ title: 'Saved', message: 'Application settings saved.', color: 'green' }) }); }}>
                            <Stack gap={16} maw={480}>
                                <TextInput
                                    label="Application Name"
                                    required
                                    value={appForm.data.app_name}
                                    onChange={e => appForm.setData('app_name', e.target.value)}
                                    error={appForm.errors.app_name}
                                    styles={inputStyles}
                                />
                                <TextInput
                                    label="Application URL"
                                    placeholder="https://yourdomain.com"
                                    required
                                    value={appForm.data.app_url}
                                    onChange={e => appForm.setData('app_url', e.target.value)}
                                    error={appForm.errors.app_url}
                                    styles={inputStyles}
                                />
                                <Select
                                    label="Timezone"
                                    required
                                    searchable
                                    value={appForm.data.app_timezone}
                                    onChange={v => appForm.setData('app_timezone', v)}
                                    data={timezones}
                                    styles={inputStyles}
                                />
                                <Group>
                                    <Button
                                        type="submit"
                                        loading={appForm.processing}
                                        leftSection={<IconDeviceFloppy size={15} />}
                                        style={{ backgroundColor: ACCENT }}
                                    >
                                        Save Settings
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Section>
                </Tabs.Panel>
            </Tabs>
        </EnterpriseLayout>
    );
}
