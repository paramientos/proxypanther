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
import { Lock } from 'lucide-react';

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
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} display="flex" alignItems="center" justifyContent="center">
            <Head title="Confirm Password" />
            <Container maxW="md" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
                <Stack spacing="8">
                    <Stack spacing="6" align="center">
                        <Icon as={Lock} w={10} h={10} color="orange.500" />
                        <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
                            <Heading size={{ base: 'xs', md: 'sm' }}>Confirm Password</Heading>
                            <Text color="muted">This is a secure area. Please confirm your password.</Text>
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
                                <Button type="submit" width="full" colorScheme="orange" isLoading={processing}>
                                    Confirm
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}
