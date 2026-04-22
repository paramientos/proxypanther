import React from 'react';
import { Box, Stack, Title, Text, Button, Alert, Center } from '@mantine/core';
import { IconMailCheck, IconLogout } from '@tabler/icons-react';
import { Head, Link, useForm } from '@inertiajs/react';

const ACCENT = '#f38020';
const BG = '#09090b';
const CARD_BG = '#18181b';
const BORDER = '#27272a';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <Box style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Head title="Email Verification" />
            <Box w={420} p="xl">
                <Stack gap="xl">
                    <Center>
                        <Box style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconMailCheck size={28} color="white" />
                        </Box>
                    </Center>

                    <Stack gap={6} style={{ textAlign: 'center' }}>
                        <Title order={3} c="white">Verify Your Email</Title>
                        <Text size="sm" c="dimmed">
                            Thanks for signing up! Please verify your email address by clicking the link we sent you.
                        </Text>
                    </Stack>

                    <Box style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                        {status === 'verification-link-sent' && (
                            <Alert color="green" variant="light" mb="md">
                                A new verification link has been sent to your email.
                            </Alert>
                        )}

                        <form onSubmit={submit}>
                            <Stack gap="sm">
                                <Button
                                    type="submit"
                                    fullWidth
                                    loading={processing}
                                    color={ACCENT}
                                    leftSection={<IconMailCheck size={14} />}
                                >
                                    Resend Verification Email
                                </Button>
                                <Button
                                    component={Link}
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    fullWidth
                                    variant="subtle"
                                    color="gray"
                                    leftSection={<IconLogout size={14} />}
                                >
                                    Log Out
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}
