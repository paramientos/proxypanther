import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Stack, Title, Paper } from '@mantine/core';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ auth, mustVerifyEmail, status }) {
    return (
        <AppLayout user={auth.user}>
            <Head title="Profile" />

            <Stack gap="xl">
                <Title order={3} c="white">Profile</Title>

                <Paper p="xl" radius="md" style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}>
                    <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />
                </Paper>

                <Paper p="xl" radius="md" style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}>
                    <UpdatePasswordForm />
                </Paper>

                <Paper p="xl" radius="md" style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}>
                    <DeleteUserForm />
                </Paper>
            </Stack>
        </AppLayout>
    );
}
