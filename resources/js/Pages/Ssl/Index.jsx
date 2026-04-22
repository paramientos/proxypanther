import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Title, Text, SimpleGrid, Badge, Group, Button,
    Table, Paper, ThemeIcon, Code,
} from '@mantine/core';
import { IconLock, IconCircleCheck, IconAlertTriangle } from '@tabler/icons-react';
import { Head, Link } from '@inertiajs/react';

const CARD_BG = '#111113';
const BORDER = 'rgba(255,255,255,0.07)';

export default function Index({ auth, sites, certs }) {
    const sslSites = sites.filter(s => s.ssl_enabled !== false);
    const onlineSites = sslSites.filter(s => s.is_online);

    const kpis = [
        { label: 'SSL-Enabled Sites', value: sslSites.length, sub: 'Auto-managed by Caddy', color: '#f38020' },
        { label: 'Online & Healthy', value: onlineSites.length, sub: 'Responding to health checks', color: '#22c55e' },
        { label: 'HTTP-Only Sites', value: sites.filter(s => !s.ssl_enabled).length, sub: 'No SSL configured', color: '#f59e0b' },
    ];

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title="SSL Certificates" />

            <Box mb={32}>
                <Title order={2} c="white" fw={600}>SSL Certificate Panel</Title>
                <Text c="dimmed" size="sm" mt={4}>Caddy manages all certificates automatically via Let's Encrypt.</Text>
            </Box>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb={24}>
                {kpis.map(k => (
                    <Paper key={k.label} p="lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                        <Text size="28px" fw={700} style={{ color: k.color }}>{k.value}</Text>
                        <Text size="sm" c="white" fw={500} mt={4}>{k.label}</Text>
                        <Text size="xs" c="dimmed" mt={2}>{k.sub}</Text>
                    </Paper>
                ))}
            </SimpleGrid>

            <Paper p="md" mb={24} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                <Group gap={8}>
                    <IconLock size={16} color="#f38020" />
                    <Text size="sm" c="dimmed">
                        Caddy automatically renews certificates 30 days before expiry. Certificate data is served from the Caddy Admin API at{' '}
                        <Code style={{ backgroundColor: '#27272a', color: '#f38020', fontSize: 11 }}>localhost:2019</Code>.
                    </Text>
                </Group>
            </Paper>

            <Paper style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                <Box px={20} py={16} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <Group gap={8}>
                        <IconLock size={16} color="#f38020" />
                        <Text fw={600} c="white" size="sm">Site SSL Status</Text>
                    </Group>
                </Box>
                <Table highlightOnHover highlightOnHoverColor="#18181b">
                    <Table.Thead>
                        <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                            {['Domain', 'SSL', 'Backend Status', 'Last Check', ''].map(h => (
                                <Table.Th
                                    key={h}
                                    style={{
                                        fontSize: 10,
                                        color: '#52525b',
                                        fontWeight: 600,
                                        letterSpacing: '0.08em',
                                        padding: '12px 16px',
                                        backgroundColor: CARD_BG,
                                    }}
                                >
                                    {h}
                                </Table.Th>
                            ))}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sites.map(site => (
                            <Table.Tr key={site.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                                <Table.Td style={{ padding: '12px 16px' }}>
                                    <Text fw={500} c="white" size="sm">{site.domain}</Text>
                                </Table.Td>
                                <Table.Td style={{ padding: '12px 16px' }}>
                                    {site.ssl_enabled ? (
                                        <Group gap={6}>
                                            <IconCircleCheck size={14} color="#22c55e" />
                                            <Badge color="green" size="xs">HTTPS / Auto</Badge>
                                        </Group>
                                    ) : (
                                        <Group gap={6}>
                                            <IconAlertTriangle size={14} color="#f59e0b" />
                                            <Badge color="yellow" size="xs">HTTP Only</Badge>
                                        </Group>
                                    )}
                                </Table.Td>
                                <Table.Td style={{ padding: '12px 16px' }}>
                                    <Group gap={6}>
                                        <Box
                                            style={{
                                                width: 6, height: 6,
                                                borderRadius: '50%',
                                                backgroundColor: site.is_online ? '#22c55e' : '#ef4444',
                                                boxShadow: site.is_online
                                                    ? '0 0 5px rgba(34,197,94,0.7)'
                                                    : '0 0 5px rgba(239,68,68,0.7)',
                                            }}
                                        />
                                        <Text size="xs" c={site.is_online ? 'green' : 'red'}>
                                            {site.is_online ? 'Online' : 'Offline'}
                                        </Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td style={{ padding: '12px 16px' }}>
                                    <Text size="xs" c="dimmed">
                                        {site.last_check_at ? new Date(site.last_check_at).toLocaleString() : '—'}
                                    </Text>
                                </Table.Td>
                                <Table.Td style={{ padding: '12px 16px' }}>
                                    <Button
                                        component={Link}
                                        href={route('sites.show', site.id)}
                                        size="xs"
                                        variant="subtle"
                                        color="orange"
                                    >
                                        Configure →
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {sites.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: '#52525b' }}>
                                    No proxy sites configured yet.
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>

            {certs && Object.keys(certs).length > 0 && (
                <Paper p="xl" mt={16} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                    <Text fw={600} c="white" size="sm" mb={12}>Caddy Admin API Response</Text>
                    <Code block style={{ backgroundColor: '#0a0a0b', color: '#a1a1aa', fontSize: 11, maxHeight: 300, overflow: 'auto' }}>
                        {JSON.stringify(certs, null, 2)}
                    </Code>
                </Paper>
            )}
        </EnterpriseLayout>
    );
}
