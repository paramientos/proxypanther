import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Title, Text, SimpleGrid, Group, Stack,
    Table, Paper, Badge,
} from '@mantine/core';
import {
    IconChartBar, IconShield, IconGlobe, IconUsers,
    IconTrendingUp, IconAlertCircle,
} from '@tabler/icons-react';
import { Head } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';

const ACCENT = '#f38020';
const CARD_BG = '#111113';
const BORDER = 'rgba(255,255,255,0.07)';

export default function Index({
    auth,
    eventsOverTime,
    typeDistribution,
    topSites,
    topAttackerIps,
    methodDistribution,
    totalEvents,
    uniqueIps,
}) {
    const timelineOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1a1a1a',
            borderColor: ACCENT,
            textStyle: { color: '#e5e5e5' },
        },
        grid: { left: '2%', right: '2%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: eventsOverTime.map(e => new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })),
            axisLine: { lineStyle: { color: '#333' } },
            axisLabel: { color: '#666', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#1f1f1f' } },
            axisLabel: { color: '#666', fontSize: 11 },
        },
        series: [{
            name: 'Security Events',
            type: 'line',
            smooth: true,
            data: eventsOverTime.map(e => e.count),
            itemStyle: { color: ACCENT },
            lineStyle: { width: 3 },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(243,128,32,0.3)' },
                        { offset: 1, color: 'rgba(243,128,32,0)' },
                    ],
                },
            },
        }],
    };

    const typeOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: '#1a1a1a',
            borderColor: '#333',
            textStyle: { color: '#e5e5e5' },
        },
        legend: { bottom: '0', textStyle: { color: '#666', fontSize: 10 }, icon: 'circle' },
        series: [{
            name: 'Threat Type',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 4, borderColor: '#111113', borderWidth: 2 },
            label: { show: false },
            data: typeDistribution.map(t => ({ value: t.count, name: t.type })),
        }],
    };

    const kpis = [
        { label: 'Total Events', value: totalEvents.toLocaleString(), icon: IconShield, color: ACCENT },
        { label: 'Unique Attackers', value: uniqueIps.toLocaleString(), icon: IconUsers, color: '#ef4444' },
        { label: 'Affected Sites', value: topSites.length, icon: IconGlobe, color: '#22c55e' },
        { label: 'Active Monitors', value: '48', icon: IconTrendingUp, color: '#3b82f6' },
    ];

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title="Security Analytics" />

            <Box mb={32}>
                <Title order={2} c="white" fw={600}>Threat Intelligence & Analytics</Title>
                <Text c="dimmed" size="sm" mt={4}>Aggregated insights from across your proxy infrastructure.</Text>
            </Box>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb={24}>
                {kpis.map(k => (
                    <Paper key={k.label} p="lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                        <Group gap={16}>
                            <Box
                                style={{
                                    padding: 12,
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderRadius: 8,
                                }}
                            >
                                <k.icon size={20} color={k.color} />
                            </Box>
                            <Box>
                                <Text size="28px" fw={700} c="white" lh={1}>{k.value}</Text>
                                <Text size="xs" c="dimmed" fw={500} mt={2}>{k.label}</Text>
                            </Box>
                        </Group>
                    </Paper>
                ))}
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, lg: 3 }} spacing={24} mb={24}>
                <Paper
                    p="xl"
                    style={{
                        backgroundColor: CARD_BG,
                        border: `1px solid ${BORDER}`,
                        gridColumn: 'span 2',
                    }}
                >
                    <Text fw={600} c="white" mb={24}>Attack Volume (30 Days)</Text>
                    <Box h={300}>
                        <ReactECharts option={timelineOption} style={{ height: '100%' }} />
                    </Box>
                </Paper>
                <Paper p="xl" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                    <Text fw={600} c="white" mb={24}>Threat Distribution</Text>
                    <Box h={300}>
                        <ReactECharts option={typeOption} style={{ height: '100%' }} />
                    </Box>
                </Paper>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={24}>
                <Paper style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                    <Box px={24} py={16} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <Text fw={600} c="white">Top Targeted Sites</Text>
                    </Box>
                    <Table highlightOnHover highlightOnHoverColor="#18181b">
                        <Table.Thead>
                            <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                <Table.Th style={{ fontSize: 10, color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', padding: '12px 24px', backgroundColor: CARD_BG }}>Site</Table.Th>
                                <Table.Th style={{ fontSize: 10, color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', padding: '12px 24px', backgroundColor: CARD_BG, textAlign: 'right' }}>Events</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {topSites.map(s => (
                                <Table.Tr key={s.proxy_site_id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                                    <Table.Td style={{ padding: '16px 24px' }}>
                                        <Text c="white" fw={500}>{s.proxy_site?.name || 'Unknown'}</Text>
                                        <Text size="xs" c="dimmed">{s.proxy_site?.domain}</Text>
                                    </Table.Td>
                                    <Table.Td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <Badge variant="light" color="orange">{s.count}</Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Paper>

                <Paper style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                    <Box px={24} py={16} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <Text fw={600} c="white">Top Attacker IPs</Text>
                    </Box>
                    <Table highlightOnHover highlightOnHoverColor="#18181b">
                        <Table.Thead>
                            <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                <Table.Th style={{ fontSize: 10, color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', padding: '12px 24px', backgroundColor: CARD_BG }}>IP Address</Table.Th>
                                <Table.Th style={{ fontSize: 10, color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', padding: '12px 24px', backgroundColor: CARD_BG, textAlign: 'right' }}>Attempts</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {topAttackerIps.map(ip => (
                                <Table.Tr key={ip.ip_address} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                                    <Table.Td style={{ padding: '16px 24px' }}>
                                        <Group gap={8}>
                                            <IconAlertCircle size={13} color="#ef4444" />
                                            <Text c="white" ff="monospace">{ip.ip_address}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <Text fw={700} c="gray.3">{ip.count}</Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Paper>
            </SimpleGrid>
        </EnterpriseLayout>
    );
}
