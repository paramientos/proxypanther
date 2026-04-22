import React from 'react';
import {
  Box, Button, Container, Flex, Title, Text, Badge, Group,
  SimpleGrid, Stack, Divider, Paper, ThemeIcon, Grid,
} from '@mantine/core';
import {
  IconShield, IconBolt, IconLayoutDashboard, IconActivity, IconLock,
  IconGlobe, IconTrendingUp, IconCircleCheck, IconCircleX, IconServer,
  IconGauge, IconNetwork, IconEye, IconCpu, IconUsers, IconClock,
} from '@tabler/icons-react';
import { Head, Link } from '@inertiajs/react';

const ACCENT = '#f38020';
const BG = '#09090b';
const CARD_BG = '#18181b';
const BORDER = '#27272a';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
  return (
    <Box style={{ minHeight: '100vh', backgroundColor: BG }}>
      <Head title="Welcome to ProxyPanther" />

      <Box style={{ backgroundColor: CARD_BG, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <Container size="xl">
          <Flex align="center" justify="space-between" h={60}>
            <Group gap="xs">
              <IconShield size={22} color={ACCENT} />
              <Text fw={700} size="lg" c="white">ProxyPanther</Text>
              <Badge color="orange" variant="light" size="xs">Enterprise</Badge>
            </Group>
            <Group>
              {auth.user ? (
                <Button component={Link} href={route('dashboard')} color={ACCENT} leftSection={<IconLayoutDashboard size={14} />}>
                  Dashboard
                </Button>
              ) : (
                <Button component={Link} href={route('login')} variant="subtle" color="gray" leftSection={<IconLock size={14} />}>
                  Sign In
                </Button>
              )}
            </Group>
          </Flex>
        </Container>
      </Box>

      <Container size="xl">
        <Grid gutter="xl" py={80} align="center">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="lg">
              <Badge color="orange" variant="light" w="fit-content">Enterprise-Grade Security</Badge>
              <Title order={1} c="white" style={{ fontSize: 48, lineHeight: 1.1 }}>
                Modern Reverse Proxy{' '}
                <Text component="span" style={{ color: ACCENT }}>with Built-in WAF</Text>
              </Title>
              <Text c="dimmed" size="lg" lh={1.7}>
                ProxyPanther brings Cloudflare-level protection to your infrastructure.
                Automatic SSL via Caddy, advanced WAF, intelligent rate limiting, and
                real-time monitoring — all from a single dashboard.
              </Text>
              <Stack gap="xs">
                {[
                  'Zero-config SSL with Let\'s Encrypt',
                  'Enterprise WAF & DDoS protection',
                  'Real-time traffic analytics',
                ].map((item) => (
                  <Group key={item} gap="xs">
                    <IconCircleCheck size={16} color="#22c55e" />
                    <Text size="sm" c="dimmed">{item}</Text>
                  </Group>
                ))}
              </Stack>
              <Group>
                <Button
                  component={Link}
                  href={auth.user ? route('dashboard') : route('login')}
                  size="md"
                  color={ACCENT}
                  leftSection={<IconBolt size={16} />}
                >
                  Get Started
                </Button>
              </Group>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper style={{ backgroundColor: '#111113', border: `1px solid ${BORDER}` }} radius="lg" overflow="hidden">
              <Box style={{ backgroundColor: '#0a0a0b', borderBottom: `1px solid ${BORDER}`, padding: '12px 16px' }}>
                <Flex align="center" justify="space-between">
                  <Group gap="xs">
                    <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#eab308' }} />
                    <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  </Group>
                  <Text size="xs" c="dimmed" ff="monospace">proxypanther.local</Text>
                </Flex>
              </Box>
              <Box p="lg" ff="monospace" style={{ fontSize: 13 }}>
                <Text c="#22c55e">$ proxy status</Text>
                <Text mt="xs" c="#22d3ee">[✓] System Status: Operational</Text>
                <Text c="dimmed">[INFO] blog.com → :8001 (SSL: Active)</Text>
                <Text c="dimmed">[INFO] api.app.com → :8002 (WAF: Enabled)</Text>
                <Text c="dimmed">[INFO] shop.com → :8003 (Cache: Hit 94%)</Text>
                <Divider my="sm" color={BORDER} />
                <Text c="#eab308">[SECURITY] Blocked 247 threats today</Text>
                <Text c="dimmed">[BLOCK] SQL Injection from 45.123.67.89</Text>
                <Text c="dimmed">[BLOCK] XSS attempt from 192.168.1.45</Text>
                <Text c="dimmed">[LIMIT] Rate limit exceeded: 203.0.113.0</Text>
                <Divider my="sm" color={BORDER} />
                <Group gap="xs" mt="xs">
                  <Badge color="green" variant="light" size="xs">Uptime: 99.9%</Badge>
                  <Badge color="blue" variant="light" size="xs">Requests: 1.2M/day</Badge>
                </Group>
              </Box>
            </Paper>
          </Grid.Col>
        </Grid>

        <Box py={64}>
          <Stack gap={4} mb={48} style={{ textAlign: 'center' }}>
            <Title order={2} c="white">Enterprise Features</Title>
            <Text c="dimmed" size="lg" maw={600} mx="auto">
              Everything you need to secure, monitor, and scale your infrastructure
            </Text>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {FEATURES.map((f) => (
              <Paper key={f.title} p="lg" radius="md" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                <ThemeIcon size={40} radius="md" color={f.color} variant="light" mb="md">
                  <f.icon size={20} />
                </ThemeIcon>
                <Text fw={600} c="white" mb={6}>{f.title}</Text>
                <Text size="sm" c="dimmed" lh={1.6}>{f.description}</Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>

        <Box py={64}>
          <Stack gap={4} mb={48} style={{ textAlign: 'center' }}>
            <Title order={2} c="white">Why ProxyPanther?</Title>
          </Stack>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {COMPARISON.map((col) => (
              <Paper key={col.title} p="lg" radius="md" style={{ backgroundColor: CARD_BG, border: `1px solid ${col.highlight ? ACCENT : BORDER}`, position: 'relative' }}>
                {col.highlight && (
                  <Badge color="orange" variant="filled" size="xs" style={{ position: 'absolute', top: -10, right: 16 }}>
                    Recommended
                  </Badge>
                )}
                <Text fw={700} c="white" mb="md" style={{ textAlign: 'center' }}>{col.title}</Text>
                <Stack gap="xs">
                  {col.items.map((item) => (
                    <Group key={item.text} gap="xs">
                      {item.available
                        ? <IconCircleCheck size={15} color="#22c55e" />
                        : <IconCircleX size={15} color="#ef4444" />
                      }
                      <Text size="sm" c="dimmed">{item.text}</Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>

        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg" py={32}>
          {STATS.map((s) => (
            <Paper key={s.label} p="lg" radius="md" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed">{s.label}</Text>
                <ThemeIcon size={28} radius="md" color={s.color} variant="light">
                  <s.icon size={14} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="white">{s.value}</Text>
              <Text size="xs" c="dimmed" mt={2}>{s.helpText}</Text>
            </Paper>
          ))}
        </SimpleGrid>

        <Box py={64} style={{ textAlign: 'center' }}>
          <Stack gap="md" align="center">
            <Title order={2} c="white">Ready to Secure Your Infrastructure?</Title>
            <Text c="dimmed" size="lg" maw={500}>
              Join thousands of developers who trust ProxyPanther to protect their applications
            </Text>
            <Group>
              <Button
                component={Link}
                href={auth.user ? route('dashboard') : route('login')}
                size="md"
                color={ACCENT}
                leftSection={<IconBolt size={16} />}
              >
                Get Started Free
              </Button>
              <Button size="md" variant="subtle" color="gray" leftSection={<IconUsers size={16} />}>
                Contact Sales
              </Button>
            </Group>
          </Stack>
        </Box>
      </Container>

      <Box style={{ backgroundColor: CARD_BG, borderTop: `1px solid ${BORDER}` }}>
        <Container size="xl" py="xl">
          <Flex justify="space-between" align="center" wrap="wrap" gap="sm">
            <Text size="sm" c="dimmed">© 2026 ProxyPanther. All rights reserved.</Text>
            <Text size="sm" c="dimmed">Laravel v{laravelVersion} · PHP v{phpVersion}</Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}

const FEATURES = [
  { icon: IconBolt, title: 'Automatic SSL', description: "Zero-config SSL certificates via Let's Encrypt. Automatic renewal, HTTPS redirect, and HTTP/3 support.", color: 'yellow' },
  { icon: IconShield, title: 'Web Application Firewall', description: 'Advanced WAF rules to block SQL injection, XSS, CSRF, and other OWASP Top 10 vulnerabilities.', color: 'blue' },
  { icon: IconGauge, title: 'Smart Rate Limiting', description: 'Granular rate limits per IP, endpoint, or user. Prevent brute-force attacks and API abuse.', color: 'violet' },
  { icon: IconActivity, title: 'Real-time Monitoring', description: 'Live traffic analytics, request logs, and performance metrics. Track bandwidth and error rates.', color: 'green' },
  { icon: IconGlobe, title: 'GeoIP Blocking', description: 'Block or allow traffic based on geographic location. Protect services from specific regions.', color: 'cyan' },
  { icon: IconNetwork, title: 'Load Balancing', description: 'Distribute traffic across multiple backends with health checks, failover, and automatic recovery.', color: 'orange' },
  { icon: IconLock, title: 'IP Whitelisting', description: 'Restrict access to trusted IPs. Perfect for admin panels, staging environments, and internal tools.', color: 'red' },
  { icon: IconEye, title: 'Log Explorer', description: 'Search and analyze access logs with powerful filters. Export logs for compliance and security audits.', color: 'teal' },
  { icon: IconCpu, title: 'Caching Layer', description: 'Built-in HTTP caching to reduce backend load. Configure TTL, cache keys, and purge strategies.', color: 'pink' },
];

const COMPARISON = [
  {
    title: 'Nginx Proxy Manager',
    items: [
      { text: 'Basic reverse proxy', available: true },
      { text: 'SSL certificates', available: true },
      { text: 'Web Application Firewall', available: false },
      { text: 'Rate limiting', available: false },
      { text: 'Real-time analytics', available: false },
      { text: 'GeoIP blocking', available: false },
    ],
  },
  {
    title: 'Cloudflare',
    items: [
      { text: 'Reverse proxy', available: true },
      { text: 'SSL & WAF', available: true },
      { text: 'Rate limiting', available: true },
      { text: 'Self-hosted', available: false },
      { text: 'Full control', available: false },
      { text: 'No data sharing', available: false },
    ],
  },
  {
    title: 'ProxyPanther',
    highlight: true,
    items: [
      { text: 'Reverse proxy', available: true },
      { text: 'SSL & WAF', available: true },
      { text: 'Rate limiting', available: true },
      { text: 'Self-hosted', available: true },
      { text: 'Full control', available: true },
      { text: 'No data sharing', available: true },
    ],
  },
];

const STATS = [
  { icon: IconServer, label: 'Active Proxies', value: '2,847', helpText: 'Across all users', color: 'blue' },
  { icon: IconTrendingUp, label: 'Requests/Day', value: '124M', helpText: '+12% from last month', color: 'green' },
  { icon: IconShield, label: 'Threats Blocked', value: '3.2M', helpText: 'This month', color: 'red' },
  { icon: IconClock, label: 'Avg Uptime', value: '99.97%', helpText: 'Last 30 days', color: 'violet' },
];
