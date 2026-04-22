import React from 'react';
import { Stack, Title, Text, TextInput, Button, Alert, Group, Transition } from '@mantine/core';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <Stack gap="lg" className={className}>
            <Stack gap={4}>
                <Title order={5} c="white">Profile Information</Title>
                <Text size="sm" c="dimmed">Update your account's profile information and email address.</Text>
            </Stack>

            <form onSubmit={submit}>
                <Stack gap="md" maw={480}>
                    <TextInput
                        id="name"
                        label="Name"
                        required
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        autoComplete="name"
                        error={errors.name}
                        styles={{ label: { color: '#a1a1aa' }, input: { backgroundColor: '#09090b', borderColor: '#27272a', color: 'white' } }}
                    />

                    <TextInput
                        id="email"
                        label="Email"
                        type="email"
                        required
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="username"
                        error={errors.email}
                        styles={{ label: { color: '#a1a1aa' }, input: { backgroundColor: '#09090b', borderColor: '#27272a', color: 'white' } }}
                    />

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <Stack gap="xs">
                            <Text size="sm" c="dimmed">
                                Your email address is unverified.{' '}
                                <Text component={Link} href={route('verification.send')} method="post" as="button" size="sm" c="#f38020" style={{ cursor: 'pointer' }}>
                                    Click here to re-send the verification email.
                                </Text>
                            </Text>
                            {status === 'verification-link-sent' && (
                                <Alert icon={<IconAlertCircle size={16} />} color="green" variant="light">
                                    A new verification link has been sent to your email address.
                                </Alert>
                            )}
                        </Stack>
                    )}

                    <Group gap="md" align="center">
                        <Button type="submit" loading={processing} color="#f38020" leftSection={<IconCheck size={14} />}>
                            Save
                        </Button>
                        <Transition mounted={recentlySuccessful} transition="fade" duration={400}>
                            {(styles) => (
                                <Text size="sm" c="dimmed" style={styles}>Saved.</Text>
                            )}
                        </Transition>
                    </Group>
                </Stack>
            </form>
        </Stack>
    );
}
