import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Heading, Text, SimpleGrid, HStack, VStack,
    Table, Thead, Tbody, Tr, Th, Td, Badge, Icon,
} from '@chakra-ui/react';
import { BarChart3, Shield, Globe, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Head } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';

const ACCENT = '#6366f1';
const CARD_BG = '#0c0d12';
const BORDER = 'rgba(255,255,255,0.08)';

export default function Index({ 
    auth, 
    eventsOverTime, 
    typeDistribution, 
    topSites, 
    topAttackerIps, 
    methodDistribution,
    totalEvents,
    uniqueIps
}) {
    
    const timelineOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: '#1a1a1a', borderColor: ACCENT, textStyle: { color: '#e5e5e5' } },
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
                    colorStops: [{ offset: 0, color: 'rgba(99,102,241,0.3)' }, { offset: 1, color: 'rgba(99,102,241,0)' }]
                }
            }
        }]
    };

    const typeOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', backgroundColor: '#1a1a1a', borderColor: '#333', textStyle: { color: '#e5e5e5' } },
        legend: { bottom: '0', textStyle: { color: '#666', fontSize: 10 }, icon: 'circle' },
        series: [{
            name: 'Threat Type',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 4, borderColor: '#161616', borderWidth: 2 },
            label: { show: false },
            data: typeDistribution.map(t => ({ value: t.count, name: t.type }))
        }]
    };

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title="Security Analytics" />

            <Box mb={8}>
                <Heading size="lg" color="white" fontWeight="semibold">Threat Intelligence & Analytics</Heading>
                <Text color="gray.500" fontSize="sm" mt={1}>Aggregated insights from across your proxy infrastructure.</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
                {[
                    { label: 'Total Events', value: totalEvents.toLocaleString(), icon: Shield, color: ACCENT },
                    { label: 'Unique Attackers', value: uniqueIps.toLocaleString(), icon: Users, color: '#ef4444' },
                    { label: 'Affected Sites', value: topSites.length, icon: Globe, color: '#22c55e' },
                    { label: 'Active Monitors', value: '48', icon: TrendingUp, color: '#3b82f6' },
                ].map(k => (
                    <Box key={k.label} bg={CARD_BG} p={5} rounded="lg" border="1px solid" borderColor={BORDER}>
                        <HStack spacing={4}>
                            <Box p={3} bg="rgba(255,255,255,0.03)" rounded="md">
                                <Icon as={k.icon} color={k.color} boxSize={5} />
                            </Box>
                            <VStack align="start" spacing={0}>
                                <Text fontSize="2xl" fontWeight="bold" color="white">{k.value}</Text>
                                <Text fontSize="xs" color="gray.500" fontWeight="medium">{k.label}</Text>
                            </VStack>
                        </HStack>
                    </Box>
                ))}
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={6}>
                <Box colSpan={{ lg: 2 }} bg={CARD_BG} p={6} rounded="lg" border="1px solid" borderColor={BORDER} style={{ gridColumn: 'span 2' }}>
                    <Text fontWeight="semibold" color="white" mb={6}>Attack Volume (30 Days)</Text>
                    <Box height="300px">
                        <ReactECharts option={timelineOption} style={{ height: '100%' }} />
                    </Box>
                </Box>
                <Box bg={CARD_BG} p={6} rounded="lg" border="1px solid" borderColor={BORDER}>
                    <Text fontWeight="semibold" color="white" mb={6}>Threat Distribution</Text>
                    <Box height="300px">
                        <ReactECharts option={typeOption} style={{ height: '100%' }} />
                    </Box>
                </Box>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Box bg={CARD_BG} rounded="lg" border="1px solid" borderColor={BORDER}>
                    <Box px={6} py={4} borderBottom="1px solid" borderColor={BORDER}>
                        <Text fontWeight="semibold" color="white">Top Targeted Sites</Text>
                    </Box>
                    <Table variant="unstyled" size="sm">
                        <Thead>
                            <Tr borderBottom="1px solid" borderColor={BORDER}>
                                <Th py={3} px={6} color="gray.600">Site</Th>
                                <Th py={3} px={6} color="gray.600" isNumeric>Events</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {topSites.map(s => (
                                <Tr key={s.proxy_site_id} borderBottom="1px solid" borderColor="#1a1a1a" _hover={{ bg: '#1c1c1c' }}>
                                    <Td px={6} py={4}>
                                        <VStack align="start" spacing={0}>
                                            <Text color="white" fontWeight="medium">{s.proxy_site?.name || 'Unknown'}</Text>
                                            <Text fontSize="xs" color="gray.600">{s.proxy_site?.domain}</Text>
                                        </VStack>
                                    </Td>
                                    <Td px={6} py={4} isNumeric>
                                        <Badge variant="subtle" colorScheme="orange">{s.count}</Badge>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>

                <Box bg={CARD_BG} rounded="lg" border="1px solid" borderColor={BORDER}>
                    <Box px={6} py={4} borderBottom="1px solid" borderColor={BORDER}>
                        <Text fontWeight="semibold" color="white">Top Attacker IPs</Text>
                    </Box>
                    <Table variant="unstyled" size="sm">
                        <Thead>
                            <Tr borderBottom="1px solid" borderColor={BORDER}>
                                <Th py={3} px={6} color="gray.600">IP Address</Th>
                                <Th py={3} px={6} color="gray.600" isNumeric>Attempts</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {topAttackerIps.map(ip => (
                                <Tr key={ip.ip_address} borderBottom="1px solid" borderColor="#1a1a1a" _hover={{ bg: '#1c1c1c' }}>
                                    <Td px={6} py={4}>
                                        <HStack spacing={2}>
                                            <Icon as={AlertCircle} color="#ef4444" boxSize={3} />
                                            <Text color="white" fontFamily="mono">{ip.ip_address}</Text>
                                        </HStack>
                                    </Td>
                                    <Td px={6} py={4} isNumeric>
                                        <Text fontWeight="bold" color="gray.300">{ip.count}</Text>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </SimpleGrid>
        </EnterpriseLayout>
    );
}
