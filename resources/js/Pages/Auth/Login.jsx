import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  FormErrorMessage,
  Icon,
  VStack,
  Divider,
} from '@chakra-ui/react';
import { Head, useForm } from '@inertiajs/react';
import { Zap, ShieldCheck, Fingerprint, Lock, Globe } from 'lucide-react';

const ACCENT = '#6366f1';
const BG = '#050508';
const CARD_BG = '#0c0d12';
const BORDER = 'rgba(255, 255, 255, 0.08)';

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
    <Flex minH="100vh" bg={BG} overflow="hidden">
      <Head title="Enterprise Login | ProxyPanther" />

      {/* Left Side: Visual & Branding (Desktop Only) */}
      <Box
        flex="1.2"
        position="relative"
        display={{ base: 'none', lg: 'block' }}
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0} left={0} right={0} bottom={0}
          bgImage="url('/images/login-bg.png')"
          bgSize="cover"
          bgPosition="center"
          filter="brightness(0.6) saturate(1.2)"
        />
        {/* Overlay Gradient */}
        <Box
          position="absolute"
          top={0} left={0} right={0} bottom={0}
          bgGradient="linear(to-r, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.4) 50%, rgba(5,5,8,0.95) 100%)"
        />

        <VStack
          position="absolute"
          top="50%" left="10%"
          transform="translateY(-50%)"
          align="start"
          spacing={6}
          maxW="500px"
          zIndex={2}
        >
          <Box
            w={16} h={16}
            bg={ACCENT}
            borderRadius="2xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow={`0 0 40px ${ACCENT}66`}
          >
            <Icon as={Zap} w={8} h={8} color="white" />
          </Box>
          <VStack align="start" spacing={2}>
            <Heading size="2xl" color="white" fontWeight="900" letterSpacing="tight">
              ProxyPanther
            </Heading>
            <Text color="brand.400" fontSize="md" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
              Next-Gen Proxy Infrastructure
            </Text>
          </VStack>
          <Text color="gray.300" fontSize="lg" lineHeight="tall">
            Elite-tier security, real-time analytics, and automatic certificate orchestration for your global backend fleet.
          </Text>

          <HStack spacing={6} pt={8}>
            <VStack align="start" spacing={0}>
              <Text color="white" fontWeight="bold" fontSize="2xl">99.99%</Text>
              <Text color="gray.500" fontSize="xs" fontWeight="bold">UPTIME SLA</Text>
            </VStack>
            <Box w="1px" h={10} bg="whiteAlpha.300" />
            <VStack align="start" spacing={0}>
              <Text color="white" fontWeight="bold" fontSize="2xl">256-bit</Text>
              <Text color="gray.500" fontSize="xs" fontWeight="bold">ENCRYPTION</Text>
            </VStack>
            <Box w="1px" h={10} bg="whiteAlpha.300" />
            <VStack align="start" spacing={0}>
              <Text color="white" fontWeight="bold" fontSize="2xl">Real-time</Text>
              <Text color="gray.500" fontSize="xs" fontWeight="bold">WAF SHIELD</Text>
            </VStack>
          </HStack>
        </VStack>

        <Text
          position="absolute"
          bottom={8} left={10}
          color="gray.500"
          fontSize="xs"
          zIndex={2}
        >
          © 2026 ProxyPanther Security Solutions. All nodes operational.
        </Text>
      </Box>

      {/* Right Side: Login Form */}
      <Flex
        flex="1"
        align="center"
        justify="center"
        px={{ base: 4, md: 24 }}
        zIndex={5}
      >
        <VStack spacing={8} w="full" maxW="400px">
          <VStack spacing={2} align={{ base: 'center', lg: 'start' }} w="full">
            <Text
              display={{ base: 'block', lg: 'none' }}
              color={ACCENT} fontWeight="bold" fontSize="lg" mb={2}
            >
              ProxyPanther
            </Text>
            <Heading color="white" size="lg">Identity Authentication</Heading>
            <Text color="gray.500" fontSize="sm">
              Please provide authorized credentials to proceed.
            </Text>
          </VStack>

          <Box
            w="full"
            bg={{ base: 'transparent', lg: 'rgba(12, 13, 18, 0.4)' }}
            backdropFilter={{ base: 'none', lg: 'blur(20px)' }}
            p={{ base: 0, lg: 8 }}
            borderRadius="2xl"
            border={{ base: 'none', lg: '1px solid' }}
            borderColor={BORDER}
          >
            <form onSubmit={submit}>
              <Stack spacing={6}>
                <Stack spacing={4}>
                  <FormControl isRequired isInvalid={errors.email}>
                    <FormLabel color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      Enterprise Identity (Email)
                    </FormLabel>
                    <Input
                      bg={BG}
                      
                      border="1px solid"
                      borderColor={BORDER}
                      _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                      _hover={{ borderColor: 'whiteAlpha.300' }}
                      type="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      placeholder="admin@panther.internal"
                      fontSize="sm"
                    />
                    {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
                  </FormControl>

                  <FormControl isRequired isInvalid={errors.password}>
                    <FormLabel color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      Access Token (Password)
                    </FormLabel>
                    <Input
                      bg={BG}
                      
                      border="1px solid"
                      borderColor={BORDER}
                      _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                      _hover={{ borderColor: 'whiteAlpha.300' }}
                      type="password"
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      placeholder="••••••••"
                      fontSize="sm"
                    />
                    {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
                  </FormControl>
                </Stack>

                <HStack justify="space-between">
                  <Checkbox
                    colorScheme="brand"
                    isChecked={data.remember}
                    onChange={(e) => setData('remember', e.target.checked)}
                  >
                    <Text fontSize="xs" color="gray.500">Maintain persistent session</Text>
                  </Checkbox>
                  {/* <Button variant="link" color={ACCENT} fontSize="xs">Recovery Key?</Button> */}
                </HStack>

                <Button
                  type="submit"
                  width="full"
                  bg={ACCENT}
                  color="white"
                  _hover={{ bg: '#4f46e5', transform: 'translateY(-1px)' }}
                  _active={{ bg: '#4338ca', transform: 'translateY(0)' }}
                  isLoading={processing}
                  leftIcon={<ShieldCheck size={18} />}
                  transition="all 0.2s"
                  fontWeight="bold"
                >
                  Confirm Identity
                </Button>
              </Stack>
            </form>
          </Box>

          <VStack spacing={4}>
            <HStack spacing={4}>
              <Icon as={ShieldCheck} color="gray.600" boxSize={3} />
              <Icon as={Lock} color="gray.600" boxSize={3} />
              <Icon as={Globe} color="gray.600" boxSize={3} />
            </HStack>
            <Text fontSize="10px" color="gray.600" textAlign="center" letterSpacing="widest">
              SYSTEM ENCRYPTED • AES-256-GCM PROXY NODE <br />
              CLIENT IP: {window.location.hostname}
            </Text>
          </VStack>
        </VStack>
      </Flex>
    </Flex>
  );
}

const SimpleGrid = ({ children, columns, spacing }) => (
  <Flex gap={spacing} w="full">
    {React.Children.map(children, child => (
      <Box flex="1">{child}</Box>
    ))}
  </Flex>
);
