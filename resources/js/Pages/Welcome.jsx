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
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  VStack,
  HStack,
  Divider,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { Head, Link } from '@inertiajs/react';
import {
  Server,
  Zap,
  Shield,
  LayoutDashboard,
  Activity,
  Lock,
  Globe,
  TrendingUp,
  CheckCircle,
  BarChart3,
  Clock,
  Users,
  Layers,
  Gauge,
  Network,
  Eye,
  Cpu,
} from 'lucide-react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <Box minH="100vh" bg={bgColor}>
      <Head title="Welcome to ProxyPanther" />

      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding="1.5rem"
        bg={cardBg}
        color={textColor}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={borderColor}
        position="sticky"
        top={0}
        zIndex={100}
        boxShadow="sm"
      >
        <Flex align="center" mr={5}>
          <Icon as={Shield} w={8} h={8} color="blue.500" mr={3} />
          <Heading as="h1" size="lg" letterSpacing={'tight'} fontWeight="bold" color={headingColor}>
            ProxyPanther
          </Heading>
          <Badge ml={3} colorScheme="blue" fontSize="xs">Enterprise</Badge>
        </Flex>

        <Stack direction={'row'} spacing={4}>
          {auth.user ? (
            <Button
              as={Link}
              href={route('dashboard')}
              leftIcon={<LayoutDashboard size={18} />}
              colorScheme="blue"
              variant="solid"
              size="md"
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button as={Link} href={route('login')} variant="ghost" size="md">
                Sign In
              </Button>
              <Button
                as={Link}
                href={route('register')}
                colorScheme="blue"
                variant="solid"
                size="md"
              >
                Get Started
              </Button>
            </>
          )}
        </Stack>
      </Flex>

      <Container maxW={'7xl'}>
        <Stack
          align={'center'}
          spacing={{ base: 8, md: 10 }}
          py={{ base: 16, md: 24 }}
          direction={{ base: 'column', md: 'row' }}
        >
          <Stack flex={1} spacing={{ base: 5, md: 8 }}>
            <Badge colorScheme="blue" alignSelf="start" px={3} py={1} rounded="full">
              Enterprise-Grade Security
            </Badge>
            <Heading
              lineHeight={1.1}
              fontWeight={700}
              fontSize={{ base: '3xl', sm: '4xl', lg: '6xl' }}
              color={headingColor}
            >
              <Text as={'span'}>
                Modern Reverse Proxy
              </Text>
              <br />
              <Text
                as={'span'}
                bgGradient="linear(to-r, blue.400, cyan.400)"
                bgClip="text"
              >
                with Built-in WAF
              </Text>
            </Heading>
            <Text color={textColor} fontSize={'xl'} lineHeight="tall">
              ProxyPanther brings Cloudflare-level protection to your infrastructure.
              Automatic SSL via Caddy, advanced WAF to block SQL injection and XSS attacks,
              intelligent rate limiting, and real-time monitoring—all from a single dashboard.
            </Text>
            <Stack spacing={3}>
              <HStack>
                <Icon as={CheckCircle} color="green.500" />
                <Text color={textColor}>Zero-config SSL with Let's Encrypt</Text>
              </HStack>
              <HStack>
                <Icon as={CheckCircle} color="green.500" />
                <Text color={textColor}>Enterprise WAF & DDoS protection</Text>
              </HStack>
              <HStack>
                <Icon as={CheckCircle} color="green.500" />
                <Text color={textColor}>Real-time traffic analytics</Text>
              </HStack>
            </Stack>
            <Stack
              spacing={{ base: 4, sm: 6 }}
              direction={{ base: 'column', sm: 'row' }}
            >
              <Button
                as={Link}
                href={auth.user ? route('dashboard') : route('register')}
                size={'lg'}
                fontWeight={'semibold'}
                px={8}
                colorScheme={'blue'}
                leftIcon={<Zap size={20} />}
              >
                Start Free Trial
              </Button>
              <Button
                size={'lg'}
                fontWeight={'semibold'}
                px={8}
                variant="outline"
                leftIcon={<PlayIcon h={5} w={5} />}
              >
                Watch Demo
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
              rounded={'xl'}
              boxShadow={'2xl'}
              width={'full'}
              overflow={'hidden'}
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Box bg={useColorModeValue('gray.800', 'gray.900')} p={4}>
                <Flex align="center" justify="space-between">
                  <HStack>
                    <Box w="12px" h="12px" rounded="full" bg="red.400" />
                    <Box w="12px" h="12px" rounded="full" bg="yellow.400" />
                    <Box w="12px" h="12px" rounded="full" bg="green.400" />
                  </HStack>
                  <Text fontSize="xs" color="gray.400" fontFamily="mono">
                    proxypanther.local
                  </Text>
                </Flex>
              </Box>
              <Box p={6} fontFamily="mono" fontSize="sm" color={useColorModeValue('gray.700', 'gray.200')}>
                <Text color="green.400">$ rtk proxy status</Text>
                <Text mt={3} color="cyan.400">[✓] System Status: Operational</Text>
                <Text mt={2}>[INFO] blog.com → :8001 (SSL: Active)</Text>
                <Text>[INFO] api.app.com → :8002 (WAF: Enabled)</Text>
                <Text>[INFO] shop.com → :8003 (Cache: Hit 94%)</Text>
                <Divider my={3} />
                <Text color="yellow.400">[SECURITY] Blocked 247 threats today</Text>
                <Text>[BLOCK] SQL Injection from 45.123.67.89</Text>
                <Text>[BLOCK] XSS attempt from 192.168.1.45</Text>
                <Text>[LIMIT] Rate limit exceeded: 203.0.113.0</Text>
                <Divider my={3} />
                <HStack mt={3} spacing={4}>
                  <Badge colorScheme="green">Uptime: 99.9%</Badge>
                  <Badge colorScheme="blue">Requests: 1.2M/day</Badge>
                </HStack>
              </Box>
            </Box>
          </Flex>
        </Stack>

        <Box py={16}>
          <VStack spacing={4} mb={12} textAlign="center">
            <Heading size="xl" color={headingColor}>
              Enterprise Features
            </Heading>
            <Text fontSize="lg" color={textColor} maxW="2xl">
              Everything you need to secure, monitor, and scale your infrastructure
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} mb={16}>
            <FeatureCard
              icon={Zap}
              title="Automatic SSL"
              description="Zero-config SSL certificates via Let's Encrypt. Automatic renewal, HTTPS redirect, and HTTP/3 support out of the box."
              color="yellow"
            />
            <FeatureCard
              icon={Shield}
              title="Web Application Firewall"
              description="Advanced WAF rules to block SQL injection, XSS, CSRF, and other OWASP Top 10 vulnerabilities before they reach your backend."
              color="blue"
            />
            <FeatureCard
              icon={Gauge}
              title="Smart Rate Limiting"
              description="Granular rate limits per IP, endpoint, or user. Prevent brute-force attacks and API abuse with intelligent throttling."
              color="purple"
            />
            <FeatureCard
              icon={Activity}
              title="Real-time Monitoring"
              description="Live traffic analytics, request logs, and performance metrics. Track bandwidth, response times, and error rates."
              color="green"
            />
            <FeatureCard
              icon={Globe}
              title="GeoIP Blocking"
              description="Block or allow traffic based on geographic location. Protect your services from specific regions or countries."
              color="cyan"
            />
            <FeatureCard
              icon={Network}
              title="Load Balancing"
              description="Distribute traffic across multiple backends with health checks, failover, and automatic recovery."
              color="orange"
            />
            <FeatureCard
              icon={Lock}
              title="IP Whitelisting"
              description="Restrict access to trusted IPs. Perfect for admin panels, staging environments, and internal tools."
              color="red"
            />
            <FeatureCard
              icon={Eye}
              title="Log Explorer"
              description="Search and analyze access logs with powerful filters. Export logs for compliance and security audits."
              color="teal"
            />
            <FeatureCard
              icon={Cpu}
              title="Caching Layer"
              description="Built-in HTTP caching to reduce backend load. Configure TTL, cache keys, and purge strategies."
              color="pink"
            />
          </SimpleGrid>
        </Box>

        <Box py={16} bg={cardBg} rounded="xl" px={8} mb={16}>
          <VStack spacing={8}>
            <Heading size="xl" color={headingColor} textAlign="center">
              Why ProxyPanther?
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
              <ComparisonCard
                title="Nginx Proxy Manager"
                items={[
                  { text: 'Basic reverse proxy', available: true },
                  { text: 'SSL certificates', available: true },
                  { text: 'Web Application Firewall', available: false },
                  { text: 'Rate limiting', available: false },
                  { text: 'Real-time analytics', available: false },
                  { text: 'GeoIP blocking', available: false },
                ]}
              />
              <ComparisonCard
                title="Cloudflare"
                highlight
                items={[
                  { text: 'Reverse proxy', available: true },
                  { text: 'SSL & WAF', available: true },
                  { text: 'Rate limiting', available: true },
                  { text: 'Self-hosted', available: false },
                  { text: 'Full control', available: false },
                  { text: 'No data sharing', available: false },
                ]}
              />
              <ComparisonCard
                title="ProxyPanther"
                highlight
                items={[
                  { text: 'Reverse proxy', available: true },
                  { text: 'SSL & WAF', available: true },
                  { text: 'Rate limiting', available: true },
                  { text: 'Self-hosted', available: true },
                  { text: 'Full control', available: true },
                  { text: 'No data sharing', available: true },
                ]}
              />
            </SimpleGrid>
          </VStack>
        </Box>

        <Box py={16}>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
            <StatCard
              icon={Server}
              label="Active Proxies"
              value="2,847"
              helpText="Across all users"
              color="blue"
            />
            <StatCard
              icon={TrendingUp}
              label="Requests/Day"
              value="124M"
              helpText="+12% from last month"
              color="green"
            />
            <StatCard
              icon={Shield}
              label="Threats Blocked"
              value="3.2M"
              helpText="This month"
              color="red"
            />
            <StatCard
              icon={Clock}
              label="Avg Uptime"
              value="99.97%"
              helpText="Last 30 days"
              color="purple"
            />
          </Grid>
        </Box>

        <Box py={16} textAlign="center">
          <VStack spacing={6}>
            <Heading size="xl" color={headingColor}>
              Ready to Secure Your Infrastructure?
            </Heading>
            <Text fontSize="lg" color={textColor} maxW="2xl">
              Join thousands of developers who trust ProxyPanther to protect their applications
            </Text>
            <HStack spacing={4}>
              <Button
                as={Link}
                href={auth.user ? route('dashboard') : route('register')}
                size="lg"
                colorScheme="blue"
                leftIcon={<Zap size={20} />}
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                leftIcon={<Users size={20} />}
              >
                Contact Sales
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Container>

      <Box
        bg={cardBg}
        color={textColor}
        borderTop={1}
        borderStyle={'solid'}
        borderColor={borderColor}
      >
        <Container as={Stack} maxW={'6xl'} py={10}>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
            <Stack align={'start'}>
              <Text fontWeight={'600'} fontSize={'lg'} mb={2} color={headingColor}>Product</Text>
              <Link href={'#'}>Features</Link>
              <Link href={'#'}>Pricing</Link>
              <Link href={'#'}>Tutorials</Link>
              <Link href={'#'}>Changelog</Link>
            </Stack>
            <Stack align={'start'}>
              <Text fontWeight={'600'} fontSize={'lg'} mb={2} color={headingColor}>Company</Text>
              <Link href={'#'}>About Us</Link>
              <Link href={'#'}>Blog</Link>
              <Link href={'#'}>Careers</Link>
              <Link href={'#'}>Contact</Link>
            </Stack>
            <Stack align={'start'}>
              <Text fontWeight={'600'} fontSize={'lg'} mb={2} color={headingColor}>Support</Text>
              <Link href={'#'}>Documentation</Link>
              <Link href={'#'}>API Reference</Link>
              <Link href={'#'}>Community</Link>
              <Link href={'#'}>Status</Link>
            </Stack>
            <Stack align={'start'}>
              <Text fontWeight={'600'} fontSize={'lg'} mb={2} color={headingColor}>Legal</Text>
              <Link href={'#'}>Privacy Policy</Link>
              <Link href={'#'}>Terms of Service</Link>
              <Link href={'#'}>Security</Link>
              <Link href={'#'}>Compliance</Link>
            </Stack>
          </SimpleGrid>
          <Divider my={6} />
          <Flex justify="space-between" align="center" flexWrap="wrap">
            <Text fontSize={'sm'}>
              © 2026 ProxyPanther. All rights reserved.
            </Text>
            <Text fontSize={'sm'} color={textColor}>
              Laravel v{laravelVersion} • PHP v{phpVersion}
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}

const FeatureCard = ({ icon, title, description, color }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      p={6}
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      rounded="lg"
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
    >
      <Flex
        w={12}
        h={12}
        align={'center'}
        justify={'center'}
        color={'white'}
        rounded={'md'}
        bg={`${color}.500`}
        mb={4}
      >
        <Icon as={icon} w={6} h={6} />
      </Flex>
      <Heading size="md" mb={2}>{title}</Heading>
      <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
        {description}
      </Text>
    </Box>
  );
};

const ComparisonCard = ({ title, items, highlight }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      p={6}
      bg={cardBg}
      borderWidth={highlight ? '2px' : '1px'}
      borderColor={highlight ? 'blue.500' : borderColor}
      rounded="lg"
      position="relative"
    >
      {highlight && (
        <Badge
          position="absolute"
          top="-3"
          right="4"
          colorScheme="blue"
          fontSize="xs"
        >
          Recommended
        </Badge>
      )}
      <Heading size="md" mb={4} textAlign="center">{title}</Heading>
      <List spacing={3}>
        {items.map((item, idx) => (
          <ListItem key={idx} display="flex" alignItems="center">
            <ListIcon
              as={item.available ? CheckCircle : chakra.span}
              color={item.available ? 'green.500' : 'red.500'}
              fontSize="lg"
            >
              {!item.available && '✕'}
            </ListIcon>
            <Text fontSize="sm">{item.text}</Text>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

const StatCard = ({ icon, label, value, helpText, color }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      p={6}
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      rounded="lg"
    >
      <Stat>
        <Flex justify="space-between" align="center" mb={2}>
          <StatLabel fontSize="sm">{label}</StatLabel>
          <Icon as={icon} w={5} h={5} color={`${color}.500`} />
        </Flex>
        <StatNumber fontSize="3xl" fontWeight="bold">{value}</StatNumber>
        <StatHelpText fontSize="xs">{helpText}</StatHelpText>
      </Stat>
    </Box>
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
