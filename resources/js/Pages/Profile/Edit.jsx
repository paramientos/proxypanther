import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import {
  Box,
  Container,
  Stack,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ auth, mustVerifyEmail, status }) {
    return (
        <AppLayout user={auth.user}>
            <Head title="Profile" />

            <Container maxW="container.xl" py={8}>
                <Stack spacing={8}>
                    <Box>
                        <Heading size="lg">Profile</Heading>
                    </Box>

                    <Box 
                        p={{ base: 4, sm: 8 }} 
                        bg={useColorModeValue('white', 'gray.800')} 
                        shadow="base" 
                        rounded="lg"
                    >
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </Box>

                    <Box 
                        p={{ base: 4, sm: 8 }} 
                        bg={useColorModeValue('white', 'gray.800')} 
                        shadow="base" 
                        rounded="lg"
                    >
                        <UpdatePasswordForm />
                    </Box>

                    <Box 
                        p={{ base: 4, sm: 8 }} 
                        bg={useColorModeValue('white', 'gray.800')} 
                        shadow="base" 
                        rounded="lg"
                    >
                        <DeleteUserForm />
                    </Box>
                </Stack>
            </Container>
        </AppLayout>
    );
}
