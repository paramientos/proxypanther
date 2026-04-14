import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Box, Heading, Text, SimpleGrid, Badge, HStack, VStack,
    Stat, StatLabel, StatNumber, StatHelpText,
    Table, Thead, Tbody, Tr, Th, Td,
    useColorModeValue, Progress, Tooltip, Icon,
} from '@chakra-ui/react';
import { Activity, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
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
        tooltip: { trigger: 'axis' },
        legend: { data: sites.slice(0, 5).map(s => s.name), textStyle: { color: '#718096' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: Array.from({ length: 30 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (29 - i));
                return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            }),
            axisLine: { lineStyle: { color: '#718096' } },
        },
        yAxis: {
            type: 'value', min: 0, max: 100,
            axisLabel: { formatter: '{value}%' },
            splitLine: { lineStyle: { color: 'rgba(113,128,150,0.2)' } },
        },
        series: sites.slice(0, 5).map(site => ({
            name: site.name,
            type: 'line',
            smooth: true,
            data: Array.from({ length: 30 }, () => parseFloat(site.uptime_pct)),
        })),
    };

    return (
        <AppLayout user={auth.user}>
            <Head title="Uptime / SLA" />

            <Box mb={6}>
                <Heading size="lg">Uptime & SLA Monitor</Heading>
                <Text color="gray.500">Track availability and downtime across all proxy sites.</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                <Stat px={5} py={4} bg={bg} shadow="base" rounded="lg">
                    <StatLabel>Average Uptime</StatLabel>
                    <StatNumber color="green.400">{avgUptime}%</StatNumber>
                    <StatHelpText>Across all monitored sites</StatHelpText>
                </Stat>
                <Stat px={5} py={4} bg={bg} shadow="base" rounded="lg">
                    <StatLabel>Sites Online</StatLabel>
                    <StatNumber>{onlineCount} / {sites.length}</StatNumber>
                    <StatHelpText>Currently responding</StatHelpText>
                </Stat>
                <Stat px={5} py={4} bg={bg} shadow="base" rounded="lg">
                    <StatLabel>Sites with Incidents</StatLabel>
                    <StatNumber color="orange.400">{sites.filter(s => s.total_downtime_seconds > 0).length}</StatNumber>
                    <StatHelpText>Had at least one downtime</StatHelpText>
                </Stat>
            </SimpleGrid>

            {sites.length > 0 && (
                <Box bg={bg} shadow="base" rounded="lg" p={6} mb={8}>
                    <Heading size="sm" mb={4}>Uptime Trend (Last 30 Days)</Heading>
                    <ReactECharts option={chartOption} style={{ height: '220px' }} />
                </Box>
            )}

            <Box bg={bg} shadow="base" rounded="lg" overflow="hidden">
                <Box px={6} py={4} borderBottom="1px" borderColor={useColorModeValue('gray.100', 'gray.700')}>
                    <HStack>
                        <Icon as={Activity} color="blue.400" />
                        <Heading size="sm">Site SLA Overview</Heading>
                    </HStack>
                </Box>
                <Table variant="simple" size="sm">
                    <Thead bg={headBg}>
                        <Tr>
                            <Th>Site</Th>
                            <Th>Status</Th>
                            <Th>Uptime %</Th>
                            <Th>Total Downtime</Th>
                            <Th>Monitoring Since</Th>
                            <Th>Last Check</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {sites.map(site => (
                            <Tr key={site.id}>
                                <Td>
                                    <VStack align="start" spacing={0}>
                                        <Text fontWeight="medium" fontSize="sm">{site.name}</Text>
                                        <Text fontSize="xs" color="gray.500">{site.domain}</Text>
                                    </VStack>
                                </Td>
                                <Td>
                                    <HStack spacing={1}>
                                        <Icon
                                            as={site.is_online ? CheckCircle : AlertTriangle}
                                            color={site.is_online ? 'green.400' : 'red.400'}
                                            boxSize={4}
                                        />
                                        <Badge colorScheme={site.is_online ? 'green' : 'red'}>
                                            {site.is_online ? 'Online' : 'Offline'}
                                        </Badge>
                                    </HStack>
                                </Td>
                                <Td minW="160px">
                                    <VStack align="start" spacing={1}>
                                        <Text fontSize="sm" fontWeight="bold"
                                            color={parseFloat(site.uptime_pct) >= 99 ? 'green.400' : parseFloat(site.uptime_pct) >= 95 ? 'yellow.400' : 'red.400'}>
                                            {site.uptime_pct}%
                                        </Text>
                                        <Progress
                                            value={parseFloat(site.uptime_pct)}
                                            size="xs"
                                            w="120px"
                                            colorScheme={parseFloat(site.uptime_pct) >= 99 ? 'green' : parseFloat(site.uptime_pct) >= 95 ? 'yellow' : 'red'}
                                        />
                                    </VStack>
                                </Td>
                                <Td fontSize="sm">{formatDuration(site.total_downtime_seconds)}</Td>
                                <Td fontSize="xs" color="gray.500">
                                    {site.monitoring_started_at ? new Date(site.monitoring_started_at).toLocaleDateString() : '—'}
                                </Td>
                                <Td fontSize="xs" color="gray.500">
                                    {site.last_check_at ? new Date(site.last_check_at).toLocaleString() : '—'}
                                </Td>
                            </Tr>
                        ))}
                        {sites.length === 0 && (
                            <Tr>
                                <Td colSpan={6} textAlign="center" py={10} color="gray.500">
                                    No sites being monitored yet.
                                </Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </Box>
        </AppLayout>
    );
}
