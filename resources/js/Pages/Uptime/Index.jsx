import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Title, Text, SimpleGrid, Badge, Group, Stack,
    Table, Paper, Progress,
} from '@mantine/core';
import { IconActivity } from '@tabler/icons-react';
import { Head } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';

const CARD_BG = '#111113';
const BORDER = 'rgba(255,255,255,0.07)';

function formatDuration(seconds) {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function Index({ auth, sites, events }) {
    const avgUptime = sites.length
        ? (sites.reduce((sum, s) => sum + parseFloat(s.uptime_pct), 0) / sites.length).toFixed(2)
        : '100.00';

    const onlineCount = sites.filter(s => s.is_online).length;

    const chartOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1a1a1a',
            borderColor: '#f38020',
            textStyle: { color: '#e5e5e5' },
        },
        legend: { data: sites.slice(0, 5).map(s => s.name), textStyle: { color: '#666' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: Array.from({ length: 30 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            }),
            axisLine: { lineStyle: { color: '#333' } },
            axisLabel: { color: '#666', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            axisLabel: { formatter: '{value}%', color: '#666', fontSize: 11 },
            splitLine: { lineStyle: { color: '#1f1f1f' } },
        },
        series: sites.slice(0, 5).map(site => ({
            name: site.name,
            type: 'line',
            smooth: true,
            data: Array.from({ length: 30 }, () => parseFloat(site.uptime_pct)),
            lineStyle: { width: 2 },
        })),
    };

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title="Uptime / SLA" />

            <Box mb={32}>
                <Title order={2} c="white" fw={600}>Uptime & SLA Monitor</Title>
                <Text c="dimmed" size="sm" mt={4}>Track availability and downtime across all proxy sites.</Text>
            </Box>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb={24}>
                {[
                    { label: 'Average Uptime', value: `${avgUptime}%`, color: '#22c55e' },
                    { label: 'Sites Online', value: `${onlineCount} / ${sites.length}`, color: 'white' },
                    { label: 'Sites with Incidents', value: sites.filter(s => s.total_downtime_seconds > 0).length, color: '#f59e0b' },
                ].map(k => (
                    <Paper key={k.label} p="lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                        <Text size="28px" fw={700} style={{ color: k.color }}>{k.value}</Text>
                        <Text size="sm" c="dimmed" mt={4}>{k.label}</Text>
                    </Paper>
                ))}
            </SimpleGrid>

            {sites.length > 0 && (
                <Paper p="xl" mb={24} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                    <Text fw={600} c="white" size="sm" mb={16}>Uptime Trend (Last 30 Days)</Text>
                    <ReactECharts option={chartOption} style={{ height: 200 }} />
                </Paper>
            )}

            <Paper style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                <Box px={20} py={16} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <Group gap={8}>
                        <IconActivity size={16} color="#f38020" />
                        <Text fw={600} c="white" size="sm">Site SLA Overview</Text>
                    </Group>
                </Box>
                <Table highlightOnHover highlightOnHoverColor="#18181b">
                    <Table.Thead>
                        <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                            {['Site', 'Status', 'Uptime %', 'Total Downtime', 'Monitoring Since', 'Last Check'].map(h => (
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
                                    <Text fw={500} size="sm" c="white">{site.name}</Text>
                                    <Text size="xs" c="dimmed">{site.domain}</Text>
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
                                <Table.Td style={{ padding: '12px 16px', minWidth: 140 }}>
                                    <Text
                                        size="sm"
                                        fw={700}
                                        c={parseFloat(site.uptime_pct) >= 99 ? 'green' : parseFloat(site.uptime_pct) >= 95 ? 'yellow' : 'red'}
                                    >
                                        {site.uptime_pct}%
                                    </Text>
                                    <Progress
                                        value={parseFloat(site.uptime_pct)}
                                        size="xs"
                                        w={100}
                                        mt={4}
                                        color={parseFloat(site.uptime_pct) >= 99 ? 'green' : parseFloat(site.uptime_pct) >= 95 ? 'yellow' : 'red'}
                                        radius="xl"
                                    />
                                </Table.Td>
                                <Table.Td style={{ padding: '12px 16px' }}>
                                    <Text size="sm" c="dimmed">{formatDuration(site.total_downtime_seconds)}</Text>
                                </Table.Td>
                                <Table.Td style={{ padding: '12px 16px' }}>
                                    <Text size="xs" c="dimmed">
                                        {site.monitoring_started_at ? new Date(site.monitoring_started_at).toLocaleDateString() : '—'}
                                    </Text>
                                </Table.Td>
                                <Table.Td style={{ padding: '12px 16px' }}>
                                    <Text size="xs" c="dimmed">
                                        {site.last_check_at ? new Date(site.last_check_at).toLocaleString() : '—'}
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {sites.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: '#52525b' }}>
                                    No sites being monitored yet.
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>
        </EnterpriseLayout>
    );
}
