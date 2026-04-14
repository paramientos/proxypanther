import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Heading, Text, SimpleGrid, Badge, HStack, VStack,
    Table, Thead, Tbody, Tr, Th, Td,
    Progress, Icon, useColorModeValue,
} from '@chakra-ui/react';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';

function formatDuration(seconds) {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function Index({ auth, sites, events }) {
    const bg = useColorModeValue('white', 'gray.800');
    const headBg = useColorModeValue('gray.50', 'gray.700');

    const avgUptime = sites.length
        ? (sites.reduce((sum, s) => sum + parseFloat(s.uptime_pct), 0) / sites.length).toFixed(2)
        : '100.00';

    const onlineCount = sites.filter(s => s.is_online).length;

    const chartOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: '#1a1a1a', borderColor: '#6366f1', textStyle: { color: '#e5e5e5' } },
        legend: { data: sites.slice(0, 5).map(s => s.name), textStyle: { color: '#666' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: Array.from({ length: 30 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (29 - i));
                return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            }),
            axisLine: { lineStyle: { color: '#333' } },
            axisLabel: { color: '#666', fontSize: 11 },
        },
        yAxis: {
            type: 'value', min: 0, max: 100,
            axisLabel: { formatter: '{value}%', color: '#666', fontSize: 11 },
            splitLine: { lineStyle: { color: '#1f1f1f' } },
        },
        series: sites.slice(0, 5).map((site, i) => ({
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

            <Box mb={6}>
                <Heading size="lg" color="white">Uptime & SLA Monitor</Heading>
                <Text color="gray.500" fontSize="sm">Track availability and downtime across all proxy sites.</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                {[
                    { label: 'Average Uptime', value: `${avgUptime}%`, color: '#22c55e' },
                    { label: 'Sites Online', value: `${onlineCount} / ${sites.length}`, color: 'white' },
                    { label: 'Sites with Incidents', value: sites.filter(s => s.total_downtime_seconds > 0).length, color: '#f59e0b' },
                ].map(k => (
                    <Box key={k.label} bg="#161616" p={5} rounded="lg" border="1px solid" borderColor="#242424">
                        <Text fontSize="2xl" fontWeight="bold" color={k.color}>{k.value}</Text>
                        <Text fontSize="sm" color="gray.500" mt={1}>{k.label}</Text>
                    </Box>
                ))}
            </SimpleGrid>

            {sites.length > 0 && (
                <Box bg="#161616" rounded="lg" border="1px solid" borderColor="#242424" p={5} mb={6}>
                    <Text fontWeight="semibold" color="white" fontSize="sm" mb={4}>Uptime Trend (Last 30 Days)</Text>
                    <ReactECharts option={chartOption} style={{ height: '200px' }} />
                </Box>
            )}

            <Box bg="#161616" rounded="lg" border="1px solid" borderColor="#242424" overflow="hidden">
                <Box px={5} py={4} borderBottom="1px solid" borderColor="#242424">
                    <HStack>
                        <Icon as={Activity} color="#6366f1" boxSize={4} />
                        <Text fontWeight="semibold" color="white" fontSize="sm">Site SLA Overview</Text>
                    </HStack>
                </Box>
                <Table variant="unstyled" size="sm">
                    <Thead>
                        <Tr borderBottom="1px solid" borderColor="#242424">
                            {['Site', 'Status', 'Uptime %', 'Total Downtime', 'Monitoring Since', 'Last Check'].map(h => (
                                <Th key={h} py={3} px={4} fontSize="10px" color="gray.600" fontWeight="semibold" letterSpacing="wider">{h}</Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {sites.map(site => (
                            <Tr key={site.id} borderBottom="1px solid" borderColor="#1a1a1a" _hover={{ bg: '#1c1c1c' }}>
                                <Td px={4} py={3}>
                                    <VStack align="start" spacing={0}>
                                        <Text fontWeight="medium" fontSize="sm" color="white">{site.name}</Text>
                                        <Text fontSize="xs" color="gray.600">{site.domain}</Text>
                                    </VStack>
                                </Td>
                                <Td px={4} py={3}>
                                    <HStack spacing={1.5}>
                                        <Box w={1.5} h={1.5} borderRadius="full"
                                            bg={site.is_online ? '#22c55e' : '#ef4444'}
                                            boxShadow={site.is_online ? '0 0 5px rgba(34,197,94,0.7)' : '0 0 5px rgba(239,68,68,0.7)'} />
                                        <Text fontSize="xs" color={site.is_online ? '#22c55e' : '#ef4444'}>
                                            {site.is_online ? 'Online' : 'Offline'}
                                        </Text>
                                    </HStack>
                                </Td>
                                <Td px={4} py={3} minW="140px">
                                    <VStack align="start" spacing={1}>
                                        <Text fontSize="sm" fontWeight="bold"
                                            color={parseFloat(site.uptime_pct) >= 99 ? '#22c55e' : parseFloat(site.uptime_pct) >= 95 ? '#f59e0b' : '#ef4444'}>
                                            {site.uptime_pct}%
                                        </Text>
                                        <Progress value={parseFloat(site.uptime_pct)} size="xs" w="100px"
                                            bg="#2a2a2a" borderRadius="full"
                                            colorScheme={parseFloat(site.uptime_pct) >= 99 ? 'green' : parseFloat(site.uptime_pct) >= 95 ? 'yellow' : 'red'} />
                                    </VStack>
                                </Td>
                                <Td px={4} py={3} fontSize="sm" color="gray.400">{formatDuration(site.total_downtime_seconds)}</Td>
                                <Td px={4} py={3} fontSize="xs" color="gray.600">
                                    {site.monitoring_started_at ? new Date(site.monitoring_started_at).toLocaleDateString() : '—'}
                                </Td>
                                <Td px={4} py={3} fontSize="xs" color="gray.600">
                                    {site.last_check_at ? new Date(site.last_check_at).toLocaleString() : '—'}
                                </Td>
                            </Tr>
                        ))}
                        {sites.length === 0 && (
                            <Tr><Td colSpan={6} textAlign="center" py={12} color="gray.600">No sites being monitored yet.</Td></Tr>
                        )}
                    </Tbody>
                </Table>
            </Box>
        </EnterpriseLayout>
    );
}
