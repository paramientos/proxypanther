import React from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
  useColorModeValue,
  SimpleGrid,
  chakra,
  VisuallyHidden,
} from '@chakra-ui/react';
import { Head, Link } from '@inertiajs/react';
import { Server, Zap, Shield, RotateCcw, LayoutDashboard, Activity } from 'lucide-react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Head title="Welcome to ProxyPanther" />
      
      {/* Navbar */}
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding="1.5rem"
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Flex align="center" mr={5}>
          <Icon as={Shield} w={6} h={6} color="blue.500" mr={2} />
          <Heading as="h1" size="md" letterSpacing={'tighter'} fontWeight="bold">
            ProxyPanther
          </Heading>
        </Flex>

        <Stack direction={'row'} spacing={4}>
          {auth.user ? (
            <Button
              as={Link}
              href={route('dashboard')}
              leftIcon={<LayoutDashboard size={18} />}
              colorScheme="blue"
              variant="solid"
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button as={Link} href={route('login')} variant="ghost">
                Sign In
              </Button>
              <Button
                as={Link}
                href={route('register')}
                colorScheme="blue"
                variant="solid"
              >
                Get Started
              </Button>
            </>
          )}
        </Stack>
      </Flex>

      {/* Hero Section */}
      <Container maxW={'7xl'}>
        <Stack
          align={'center'}
          spacing={{ base: 8, md: 10 }}
          py={{ base: 20, md: 28 }}
          direction={{ base: 'column', md: 'row' }}
        >
          <Stack flex={1} spacing={{ base: 5, md: 10 }}>
            <Heading
              lineHeight={1.1}
              fontWeight={600}
              fontSize={{ base: '3xl', sm: '4xl', lg: '6xl' }}
            >
              <Text
                as={'span'}
                position={'relative'}
                _after={{
                  content: "''",
                  width: 'full',
                  height: '30%',
                  position: 'absolute',
                  bottom: 1,
                  left: 0,
                  bg: 'blue.400',
                  zIndex: -1,
                }}
              >
                Deploy with
              </Text>
              <br />
              <Text as={'span'} color={'blue.400'}>
                Confidence
              </Text>
            </Heading>
            <Text color={'gray.500'} fontSize={'xl'}>
              ProxyPanther is your server's security guard and traffic police. 
              Modern reverse proxy with automatic SSL via Caddy, built-in WAF 
              to block attacks, and enterprise-grade rate limiting.
            </Text>
            <Stack
              spacing={{ base: 4, sm: 6 }}
              direction={{ base: 'column', sm: 'row' }}
            >
              <Button
                as={Link}
                href={auth.user ? route('dashboard') : route('register')}
                rounded={'full'}
                size={'lg'}
                fontWeight={'normal'}
                px={6}
                colorScheme={'blue'}
                bg={'blue.400'}
                _hover={{ bg: 'blue.500' }}
              >
                Get Started
              </Button>
              <Button
                rounded={'full'}
                size={'lg'}
                fontWeight={'normal'}
                px={6}
                leftIcon={<PlayIcon h={4} w={4} color={'gray.300'} />}
              >
                How it works
              </Button>
            </Stack>
          </Stack>
          <Flex
            flex={1}
            justify={'center'}
            align={'center'}
            position={'relative'}
            w={'full'}
          >
            <Box
              position={'relative'}
              height={'300px'}
              rounded={'2xl'}
              boxShadow={'2xl'}
              width={'full'}
              overflow={'hidden'}
              bg={useColorModeValue('white', 'gray.700')}
              p={8}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.600')}
            >
              <Stack spacing={4}>
                <Flex align="center">
                  <Box w="12px" h="12px" rounded="full" bg="red.400" mr={2} />
                  <Box w="12px" h="12px" rounded="full" bg="yellow.400" mr={2} />
                  <Box w="12px" h="12px" rounded="full" bg="green.400" />
                </Flex>
                <Box fontFamily="mono" fontSize="sm" color={useColorModeValue('gray.700', 'gray.200')}>
                  <Text color="green.400">$ rtk proxy list</Text>
                  <Text mt={2}>[INFO] blog.com → :8001 (SSL: OK)</Text>
                  <Text>[INFO] app.com → :8002 (WAF: ACTIVE)</Text>
                  <Text>[WARN] Blocked SQLi attempt from 192.168.1.45</Text>
                  <Text color="blue.400" mt={2}>Status: All systems protected</Text>
                </Box>
              </Stack>
            </Box>
          </Flex>
        </Stack>

        {/* Features Section */}
        <Box p={4}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} mb={20}>
            <Feature
              icon={<Icon as={Zap} w={10} h={10} />}
              title={'Automatic SSL'}
              text={'Forget about certbot and manual renewals. Caddy handles Let\'s Encrypt SSL automatically for all your domains.'}
            />
            <Feature
              icon={<Icon as={Shield} w={10} h={10} />}
              title={'Built-in WAF'}
              text={'Advanced protection against SQL Injection, XSS, and malicious bots. Secure your backend before it gets hit.'}
            />
            <Feature
              icon={<Icon as={Activity} w={10} h={10} />}
              title={'Smart Rate Limiting'}
              text={'Set granular request limits per IP to prevent brute-force attacks and resource exhaustion.'}
            />
          </SimpleGrid>
        </Box>
      </Container>
      
      {/* Footer */}
      <Box
        bg={useColorModeValue('gray.50', 'gray.900')}
        color={useColorModeValue('gray.700', 'gray.200')}
        borderTop={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Container as={Stack} maxW={'6xl'} py={10}>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
            <Stack align={'start'}>
              <Text fontWeight={'500'} fontSize={'lg'} mb={2}>Product</Text>
              <Link href={'#'}>Features</Link>
              <Link href={'#'}>Pricing</Link>
              <Link href={'#'}>Tutorials</Link>
            </Stack>
            <Stack align={'start'}>
              <Text fontWeight={'500'} fontSize={'lg'} mb={2}>Company</Text>
              <Link href={'#'}>About Us</Link>
              <Link href={'#'}>Contact Us</Link>
            </Stack>
            <Stack align={'start'}>
              <Text fontWeight={'500'} fontSize={'lg'} mb={2}>Support</Text>
              <Link href={'#'}>Help Center</Link>
              <Link href={'#'}>Documentation</Link>
            </Stack>
            <Stack align={'start'}>
              <Text fontWeight={'500'} fontSize={'lg'} mb={2}>Legal</Text>
              <Link href={'#'}>Privacy Policy</Link>
              <Link href={'#'}>Terms of Service</Link>
            </Stack>
          </SimpleGrid>
          <Text pt={6} fontSize={'sm'} textAlign={'center'}>
            Laravel v{laravelVersion} (PHP v{phpVersion})
          </Text>
        </Container>
      </Box>
    </Box>
  );
}

const Feature = ({ title, text, icon }) => {
  return (
    <Stack align={'center'} textAlign={'center'}>
      <Flex
        w={16}
        h={16}
        align={'center'}
        justify={'center'}
        color={'white'}
        rounded={'full'}
        bg={'blue.500'}
        mb={1}
      >
        {icon}
      </Flex>
      <Text fontWeight={600} fontSize={'lg'}>{title}</Text>
      <Text color={'gray.600'}>{text}</Text>
    </Stack>
  );
};

const PlayIcon = (props) => {
  return (
    <chakra.svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M7 6v12l10-6L7 6z" />
    </chakra.svg>
  );
};
