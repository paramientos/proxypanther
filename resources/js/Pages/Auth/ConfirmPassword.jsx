import React from 'react';
import { Box, Stack, Title, Text, PasswordInput, Button, Center } from '@mantine/core';
import { IconLock, IconCheck } from '@tabler/icons-react';
import { Head, useForm } from '@inertiajs/react';

const ACCENT = '#f38020';
const BG = '#09090b';
const CARD_BG = '#18181b';
const BORDER = '#27272a';
const inputStyles = { label: { color: '#a1a1aa' }, input: { backgroundColor: '#0f0f11', borderColor: BORDER, color: 'white' } };

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <Box style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Head title="Confirm Password" />
            <Box w={420} p="xl">
                <Stack gap="xl">
                    <Center>
                        <Box style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconLock size={28} color="white" />
                        </Box>
                    </Center>

                    <Stack gap={6} style={{ textAlign: 'center' }}>
                        <Title order={3} c="white">Confirm Password</Title>
                        <Text size="sm" c="dimmed">This is a secure area. Please confirm your password to continue.</Text>
                    </Stack>

                    <Box style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                        <form onSubmit={submit}>
                            <Stack gap="md">
                                <PasswordInput
                                    id="password"
                                    label="Password"
                                    required
                                    autoFocus
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                    styles={inputStyles}
                                />
                                <Button type="submit" fullWidth loading={processing} color={ACCENT} leftSection={<IconCheck size={14} />}>
                                    Confirm
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}
