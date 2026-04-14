import React from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Stack,
    Text,
    useColorModeValue,
    FormErrorMessage,
    Heading,
    Alert,
    AlertIcon,
    Fade,
} from '@chakra-ui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <Box as="section" className={className}>
            <Stack spacing={1} mb={6}>
                <Heading size="md">Profile Information</Heading>
                <Text color="gray.500" fontSize="sm">
                    Update your account's profile information and email address.
                </Text>
            </Stack>

            <form onSubmit={submit}>
                <Stack spacing={6} maxW="xl">
                    <FormControl isRequired isInvalid={errors.name}>
                        <FormLabel htmlFor="name">Name</FormLabel>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoComplete="name"
                        />
                        {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
                    </FormControl>

                    <FormControl isRequired isInvalid={errors.email}>
                        <FormLabel htmlFor="email">Email</FormLabel>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="username"
                        />
                        {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
                    </FormControl>

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <Box>
                            <Text fontSize="sm" mt={2}>
                                Your email address is unverified.{' '}
                                <Button
                                    as={Link}
                                    href={route('verification.send')}
                                    method="post"
                                    variant="link"
                                    size="sm"
                                    colorScheme="orange"
                                >
                                    Click here to re-send the verification email.
                                </Button>
                            </Text>

                            {status === 'verification-link-sent' && (
                                <Alert status="success" mt={2} size="sm">
                                    <AlertIcon />
                                    A new verification link has been sent to your email address.
                                </Alert>
                            )}
                        </Box>
                    )}

                    <Box display="flex" alignItems="center" gap={4}>
                        <Button type="submit" colorScheme="orange" isLoading={processing}>
                            Save
                        </Button>

                        <Fade in={recentlySuccessful}>
                            <Text fontSize="sm" color="gray.500">
                                Saved.
                            </Text>
                        </Fade>
                    </Box>
                </Stack>
            </form>
        </Box>
    );
}
