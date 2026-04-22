import React from 'react';
import { Box, Stack, Title, Text, TextInput, PasswordInput, Button, Center } from '@mantine/core';
import { IconKey, IconCheck } from '@tabler/icons-react';
import { Head, useForm } from '@inertiajs/react';

const ACCENT = '#f38020';
const BG = '#09090b';
const CARD_BG = '#18181b';
const BORDER = '#27272a';
const inputStyles = { label: { color: '#a1a1aa' }, input: { backgroundColor: '#0f0f11', borderColor: BORDER, color: 'white' } };

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <Box style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Head title="Reset Password" />
            <Box w={420} p="xl">
                <Stack gap="xl">
                    <Center>
                        <Box style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconKey size={28} color="white" />
                        </Box>
                    </Center>

                    <Stack gap={6} style={{ textAlign: 'center' }}>
                        <Title order={3} c="white">Reset Password</Title>
                        <Text size="sm" c="dimmed">Enter your new password below.</Text>
                    </Stack>

                    <Box style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                        <form onSubmit={submit}>
                            <Stack gap="md">
                                <TextInput
                                    id="email"
                                    label="Email"
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                    styles={inputStyles}
                                />
                                <PasswordInput
                                    id="password"
                                    label="New Password"
                                    required
                                    autoFocus
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                    styles={inputStyles}
                                />
                                <PasswordInput
                                    id="password_confirmation"
                                    label="Confirm Password"
                                    required
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    error={errors.password_confirmation}
                                    styles={inputStyles}
                                />
                                <Button type="submit" fullWidth loading={processing} color={ACCENT} leftSection={<IconCheck size={14} />}>
                                    Reset Password
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}
