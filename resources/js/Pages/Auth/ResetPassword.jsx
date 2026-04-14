import React from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  FormErrorMessage,
  Icon,
} from '@chakra-ui/react';
import { Head, useForm } from '@inertiajs/react';
import { Key } from 'lucide-react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} display="flex" alignItems="center" justifyContent="center">
            <Head title="Reset Password" />
            <Container maxW="md" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
                <Stack spacing="8">
                    <Stack spacing="6" align="center">
                        <Icon as={Key} w={10} h={10} color="orange.500" />
                        <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
                            <Heading size={{ base: 'xs', md: 'sm' }}>Reset Password</Heading>
                            <Text color="muted">Enter your new password below.</Text>
                        </Stack>
                    </Stack>
                    <Box
                        py={{ base: '0', sm: '8' }}
                        px={{ base: '4', sm: '10' }}
                        bg={{ base: 'transparent', sm: useColorModeValue('white', 'gray.800') }}
                        boxShadow={{ base: 'none', sm: 'md' }}
                        borderRadius={{ base: 'none', sm: 'xl' }}
                    >
                        <form onSubmit={submit}>
                            <Stack spacing="6">
                                <FormControl isRequired isInvalid={errors.email}>
                                    <FormLabel htmlFor="email">Email</FormLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
                                </FormControl>
                                <FormControl isRequired isInvalid={errors.password}>
                                    <FormLabel htmlFor="password">Password</FormLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoFocus
                                    />
                                    {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
                                </FormControl>
                                <FormControl isRequired isInvalid={errors.password_confirmation}>
                                    <FormLabel htmlFor="password_confirmation">Confirm Password</FormLabel>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                    />
                                    {errors.password_confirmation && <FormErrorMessage>{errors.password_confirmation}</FormErrorMessage>}
                                </FormControl>
                                <Button type="submit" width="full" colorScheme="orange" isLoading={processing}>
                                    Reset Password
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}
