import React, { useRef, useState } from 'react';
import { Stack, Title, Text, PasswordInput, Button, Group, Modal } from '@mantine/core';
import { IconTrash, IconX } from '@tabler/icons-react';
import { useForm } from '@inertiajs/react';

export default function DeleteUserForm({ className = '' }) {
    const [opened, setOpened] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({
        password: '',
    });

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setOpened(false);
        clearErrors();
        reset();
    };

    return (
        <Stack gap="lg" className={className}>
            <Stack gap={4}>
                <Title order={5} c="white">Delete Account</Title>
                <Text size="sm" c="dimmed">
                    Once your account is deleted, all of its resources and data will be permanently deleted.
                </Text>
            </Stack>

            <Button
                color="red"
                variant="light"
                leftSection={<IconTrash size={14} />}
                onClick={() => setOpened(true)}
                w="fit-content"
            >
                Delete Account
            </Button>

            <Modal
                opened={opened}
                onClose={closeModal}
                title={<Text fw={600} c="white">Delete Account</Text>}
                styles={{
                    content: { backgroundColor: '#18181b', border: '1px solid #27272a' },
                    header: { backgroundColor: '#18181b', borderBottom: '1px solid #27272a' },
                }}
            >
                <form onSubmit={deleteUser}>
                    <Stack gap="md">
                        <Text size="sm" c="dimmed">
                            Once your account is deleted, all of its resources and data will be permanently deleted.
                            Please enter your password to confirm.
                        </Text>

                        <PasswordInput
                            id="password"
                            label="Password"
                            required
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Enter your password"
                            error={errors.password}
                            styles={{ label: { color: '#a1a1aa' }, input: { backgroundColor: '#09090b', borderColor: '#27272a', color: 'white' } }}
                        />

                        <Group justify="flex-end" gap="sm">
                            <Button variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button type="submit" color="red" loading={processing} leftSection={<IconTrash size={14} />}>
                                Delete Account
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Stack>
    );
}
