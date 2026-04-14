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
  Fade,
} from '@chakra-ui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <Box as="section" className={className}>
            <Stack spacing={1} mb={6}>
                <Heading size="md">Update Password</Heading>
                <Text color="gray.500" fontSize="sm">
                    Ensure your account is using a long, random password to stay secure.
                </Text>
            </Stack>

            <form onSubmit={updatePassword}>
                <Stack spacing={6} maxW="xl">
                    <FormControl isRequired isInvalid={errors.current_password}>
                        <FormLabel htmlFor="current_password">Current Password</FormLabel>
                        <Input
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            type="password"
                            autoComplete="current-password"
                        />
                        {errors.current_password && <FormErrorMessage>{errors.current_password}</FormErrorMessage>}
                    </FormControl>

                    <FormControl isRequired isInvalid={errors.password}>
                        <FormLabel htmlFor="password">New Password</FormLabel>
                        <Input
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type="password"
                            autoComplete="new-password"
                        />
                        {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
                    </FormControl>

                    <FormControl isRequired isInvalid={errors.password_confirmation}>
                        <FormLabel htmlFor="password_confirmation">Confirm Password</FormLabel>
                        <Input
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            type="password"
                            autoComplete="new-password"
                        />
                        {errors.password_confirmation && <FormErrorMessage>{errors.password_confirmation}</FormErrorMessage>}
                    </FormControl>

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
