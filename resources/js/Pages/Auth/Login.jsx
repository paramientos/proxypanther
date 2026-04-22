import React from 'react';
import {
  Box, Button, Checkbox, Flex, TextInput, PasswordInput,
  Text, Stack, Group, Divider,
} from '@mantine/core';
import { Head, useForm } from '@inertiajs/react';
import {
  IconBolt, IconShieldCheck, IconLock, IconGlobe, IconFingerprint,
} from '@tabler/icons-react';

const ACCENT = '#f38020';
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
    post(route('login'), { onFinish: () => reset('password') });
  };

  return (
    <Flex mih="100vh" style={{ backgroundColor: BG, overflow: 'hidden' }}>
      <Head title="Enterprise Login | ProxyPanther" />

      <Box
        flex="1.2"
        pos="relative"
        visibleFrom="lg"
        style={{ overflow: 'hidden' }}
      >
        <Box
          pos="absolute"
          top={0} left={0} right={0} bottom={0}
          style={{
            backgroundImage: "url('/images/login-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.6) saturate(1.2)',
          }}
        />
        <Box
          pos="absolute"
          top={0} left={0} right={0} bottom={0}
          style={{
            background: 'linear-gradient(to right, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.4) 50%, rgba(5,5,8,0.95) 100%)',
          }}
        />

        <Box
          pos="absolute"
          style={{ top: '50%', left: '10%', transform: 'translateY(-50%)', zIndex: 2, maxWidth: 500 }}
        >
          <Stack gap={24}>
            <Box
              style={{
                width: 64, height: 64,
                backgroundColor: ACCENT,
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 40px ${ACCENT}66`,
              }}
            >
              <IconBolt size={32} color="white" />
            </Box>

            <Box>
              <Text size="42px" fw={900} c="white" lh={1.1} style={{ letterSpacing: '-0.02em' }}>
                ProxyPanther
              </Text>
              <Text size="sm" fw={700} style={{ color: ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 6 }}>
                Next-Gen Proxy Infrastructure
              </Text>
            </Box>

            <Text c="gray.3" size="lg" lh={1.7}>
              Elite-tier security, real-time analytics, and automatic certificate orchestration for your global backend fleet.
            </Text>

            <Group gap={32} mt={16}>
              {[
                { value: '99.99%', label: 'UPTIME SLA' },
                { value: '256-bit', label: 'ENCRYPTION' },
                { value: 'Real-time', label: 'WAF SHIELD' },
              ].map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && <Divider orientation="vertical" color="rgba(255,255,255,0.15)" />}
                  <Box>
                    <Text c="white" fw={700} size="xl">{stat.value}</Text>
                    <Text c="dimmed" size="xs" fw={700}>{stat.label}</Text>
                  </Box>
                </React.Fragment>
              ))}
            </Group>
          </Stack>
        </Box>

        <Text
          pos="absolute"
          style={{ bottom: 32, left: 40, zIndex: 2 }}
          c="dimmed"
          size="xs"
        >
          © 2026 ProxyPanther Security Solutions. All nodes operational.
        </Text>
      </Box>

      <Flex flex={1} align="center" justify="center" px={{ base: 16, md: 64 }} style={{ zIndex: 5 }}>
        <Stack gap={32} w="100%" maw={400}>
          <Box>
            <Text c={ACCENT} fw={700} size="lg" mb={4} hiddenFrom="lg">ProxyPanther</Text>
            <Text c="white" size="xl" fw={700}>Identity Authentication</Text>
            <Text c="dimmed" size="sm" mt={4}>
              Please provide authorized credentials to proceed.
            </Text>
          </Box>

          <Box
            p={32}
            style={{
              backgroundColor: 'rgba(12,13,18,0.4)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
            }}
          >
            <form onSubmit={submit}>
              <Stack gap={20}>
                <TextInput
                  label="Enterprise Identity (Email)"
                  placeholder="admin@panther.internal"
                  type="email"
                  value={data.email}
                  onChange={e => setData('email', e.target.value)}
                  error={errors.email}
                  required
                  styles={{
                    label: { color: '#71717a', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
                    input: {
                      backgroundColor: BG,
                      borderColor: BORDER,
                      color: '#e4e4e7',
                      '&:focus': { borderColor: ACCENT },
                    },
                  }}
                />

                <PasswordInput
                  label="Access Token (Password)"
                  placeholder="••••••••"
                  value={data.password}
                  onChange={e => setData('password', e.target.value)}
                  error={errors.password}
                  required
                  styles={{
                    label: { color: '#71717a', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
                    input: {
                      backgroundColor: BG,
                      borderColor: BORDER,
                      color: '#e4e4e7',
                    },
                  }}
                />

                <Checkbox
                  label={<Text size="xs" c="dimmed">Maintain persistent session</Text>}
                  checked={data.remember}
                  onChange={e => setData('remember', e.currentTarget.checked)}
                  color="orange"
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={processing}
                  leftSection={<IconShieldCheck size={17} />}
                  style={{ backgroundColor: ACCENT, fontWeight: 700 }}
                  size="md"
                >
                  Confirm Identity
                </Button>
              </Stack>
            </form>
          </Box>

          <Stack gap={8} align="center">
            <Group gap={16}>
              <IconShieldCheck size={13} color="#3f3f46" />
              <IconLock size={13} color="#3f3f46" />
              <IconGlobe size={13} color="#3f3f46" />
            </Group>
            <Text size="10px" c="dimmed" ta="center" style={{ letterSpacing: '0.1em' }}>
              SYSTEM ENCRYPTED • AES-256-GCM PROXY NODE
            </Text>
          </Stack>
        </Stack>
      </Flex>
    </Flex>
  );
}
