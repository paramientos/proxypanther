import React, { useRef } from 'react';
import { Stack, Title, Text, PasswordInput, Button, Group, Transition } from '@mantine/core';
import { IconCheck, IconKey } from '@tabler/icons-react';
import { useForm } from '@inertiajs/react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    const inputStyles = { label: { color: '#a1a1aa' }, input: { backgroundColor: '#09090b', borderColor: '#27272a', color: 'white' } };

    return (
        <Stack gap="lg" className={className}>
            <Stack gap={4}>
                <Title order={5} c="white">Update Password</Title>
                <Text size="sm" c="dimmed">Ensure your account is using a long, random password to stay secure.</Text>
            </Stack>

            <form onSubmit={updatePassword}>
                <Stack gap="md" maw={480}>
                    <PasswordInput
                        id="current_password"
                        label="Current Password"
                        required
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                        error={errors.current_password}
                        styles={inputStyles}
                    />

                    <PasswordInput
                        id="password"
                        label="New Password"
                        required
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                        error={errors.password}
                        styles={inputStyles}
                    />

                    <PasswordInput
                        id="password_confirmation"
                        label="Confirm Password"
                        required
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        error={errors.password_confirmation}
                        styles={inputStyles}
                    />

                    <Group gap="md" align="center">
                        <Button type="submit" loading={processing} color="#f38020" leftSection={<IconKey size={14} />}>
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
