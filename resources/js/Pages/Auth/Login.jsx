import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  useColorModeValue,
  FormErrorMessage,
  Icon,
} from '@chakra-ui/react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Server } from 'lucide-react';

export default function Login() {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} display="flex" alignItems="center" justifyContent="center">
      <Head title="Log in" />
      <Container maxW="md" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
        <Stack spacing="8">
          <Stack spacing="6" align="center">
            <Icon as={Server} w={10} h={10} color="blue.500" />
            <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
              <Heading size={{ base: 'xs', md: 'sm' }}>Log in to your account</Heading>
              <HStack spacing="1" justify="center">
                <Text color="muted">Don't have an account?</Text>
                <Button as={Link} href={route('register')} variant="link" colorScheme="blue">
                  Sign up
                </Button>
              </HStack>
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
                <Stack spacing="5">
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
                    />
                    {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
                  </FormControl>
                </Stack>
                <HStack justify="space-between">
                  <Checkbox
                    isChecked={data.remember}
                    onChange={(e) => setData('remember', e.target.checked)}
                  >
                    Remember me
                  </Checkbox>
                </HStack>
                <Stack spacing="6">
                  <Button type="submit" width="full" colorScheme="blue" isLoading={processing}>
                    Sign in
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
