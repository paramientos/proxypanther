import React from 'react';
import {
    Box,
    Button,
    Container,
    Heading,
    Stack,
    Text,
    useColorModeValue,
    Icon,
    Alert,
    AlertIcon,
} from '@chakra-ui/react';
import { Head, Link, useForm } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} display="flex" alignItems="center" justifyContent="center">
            <Head title="Email Verification" />
            <Container maxW="md" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
                <Stack spacing="8">
                    <Stack spacing="6" align="center">
                        <Icon as={MailCheck} w={10} h={10} color="orange.500" />
                        <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
                            <Heading size={{ base: 'xs', md: 'sm' }}>Verify Email</Heading>
                            <Text color="muted">Thanks for signing up! Please verify your email address by clicking the link we sent you.</Text>
                        </Stack>
                    </Stack>
                    <Box
                        py={{ base: '0', sm: '8' }}
                        px={{ base: '4', sm: '10' }}
                        bg={{ base: 'transparent', sm: useColorModeValue('white', 'gray.800') }}
                        boxShadow={{ base: 'none', sm: 'md' }}
                        borderRadius={{ base: 'none', sm: 'xl' }}
                    >
                        {status === 'verification-link-sent' && (
                            <Alert status="success" mb={4} borderRadius="md">
                                <AlertIcon />
                                A new verification link has been sent to your email.
                            </Alert>
                        )}
                        <form onSubmit={submit}>
                            <Stack spacing="6">
                                <Button type="submit" width="full" colorScheme="orange" isLoading={processing}>
                                    Resend Verification Email
                                </Button>
                                <Button
                                    as={Link}
                                    href={route('logout')}
                                    method="post"
                                    variant="link"
                                    width="full"
                                    size="sm"
                                >
                                    Log Out
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}
