import React from 'react';
import { Box, Stack, Title, Text, TextInput, Button, Alert, Center } from '@mantine/core';
import { IconMail, IconSend } from '@tabler/icons-react';
import { Head, useForm } from '@inertiajs/react';

const ACCENT = '#f38020';
const BG = '#09090b';
const CARD_BG = '#18181b';
const BORDER = '#27272a';
const inputStyles = { label: { color: '#a1a1aa' }, input: { backgroundColor: '#0f0f11', borderColor: BORDER, color: 'white' } };

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <Box style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Head title="Forgot Password" />
            <Box w={420} p="xl">
                <Stack gap="xl">
                    <Center>
                        <Box style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconMail size={28} color="white" />
                        </Box>
                    </Center>

                    <Stack gap={6} style={{ textAlign: 'center' }}>
                        <Title order={3} c="white">Forgot Password</Title>
                        <Text size="sm" c="dimmed">
                            No problem. Enter your email address and we'll send you a password reset link.
                        </Text>
                    </Stack>

                    <Box style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                        {status && (
                            <Alert color="green" variant="light" mb="md">
                                {status}
                            </Alert>
                        )}

                        <form onSubmit={submit}>
                            <Stack gap="md">
                                <TextInput
                                    id="email"
                                    label="Email"
                                    type="email"
                                    required
                                    autoFocus
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                    styles={inputStyles}
                                />
                                <Button type="submit" fullWidth loading={processing} color={ACCENT} leftSection={<IconSend size={14} />}>
                                    Email Password Reset Link
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}
