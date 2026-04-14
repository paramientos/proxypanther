import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box,
    Heading,
    Text,
    Button,
    SimpleGrid,
    Badge,
    useColorModeValue,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Icon,
    HStack,
    VStack,
    Progress,
    Flex,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Select,
    Stack,
    Switch,
} from '@chakra-ui/react';
import {
    Plus,
    Shield,
    Globe,
    Activity,
    AlertTriangle,
    TrendingUp,
    RefreshCcw,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';

export default function EnterpriseDashboard({ auth, sites: initialSites, bannedIps, analytics, recentEvents }) {
    const [sites, setSites] = React.useState(initialSites);
    const [liveStats, setLiveStats] = React.useState({});
    const { isOpen, onOpen, onClose } = useDisclosure();

    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const statBg = useColorModeValue('gray.50', 'gray.900');

    React.useEffect(() => {
        if (!window.Echo) return;

        const healthChannel = window.Echo.channel('health-checks');
        healthChannel.listen('BackendHealthUpdated', (e) => {
            setSites(cur => cur.map(s =>
                s.id === e.id ? { ...s, is_online: e.is_online, last_check_at: e.last_check_at, last_error: e.last_error } : s
            ));
        });

        const siteChannels = initialSites.map(site => {
            const ch = window.Echo.channel(`site.${site.id}`);
            ch.listen('.traffic.updated', (e) => {
                setLiveStats(cur => ({ ...cur, [e.siteId]: e.stats }));
            });
            return ch;
        });

        return () => {
            window.Echo.leaveChannel('health-checks');
            initialSites.forEach(site => window.Echo.leaveChannel(`site.${site.id}`));
        };
    }, []);

    const { data, setData, post, reset } = useForm({
        name: '',
        domain: '',
        backend_url: '',
        backend_type: 'proxy',
        ssl_enabled: true,
        waf_enabled: true,
    });

    const handleManualCheck = (siteId) => {
        router.post(route('sites.check-health', siteId), {}, { preserveScroll: true });
    };

    const totalBlocked = sites.reduce((acc, s) => acc + s.blocked_requests, 0);
    const totalRequests = sites.reduce((acc, s) => acc + s.total_requests, 0);
    const blockRate = totalRequests > 0 ? ((totalBlocked / totalRequests) * 100).toFixed(2) : 0;
    const onlineSites = sites.filter(s => s.is_online).length;

    const chartOptions = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderColor: '#3182ce',
            textStyle: { color: '#fff' },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: analytics.map(a => new Date(a.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })),
            axisLine: { lineStyle: { color: '#4A5568' } },
            axisLabel: { color: '#A0AEC0' },
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#4A5568' } },
            splitLine: { lineStyle: { color: 'rgba(74, 85, 104, 0.2)' } },
            axisLabel: { color: '#A0AEC0' },
        },
        series: [
            {
                name: 'Security Events',
                type: 'line',
                smooth: true,
                data: analytics.map(a => a.count),
                itemStyle: { color: '#F56565' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(245, 101, 101, 0.4)' },
                            { offset: 1, color: 'rgba(245, 101, 101, 0)' }
                        ]
                    }
                },
                lineStyle: { width: 3 },
            },
        ],
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('sites.store'), {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title="Dashboard" />

            {/* Header */}
            <Flex justify="space-between" align="center" mb={8}>
                <Box>
                    <Heading size="lg" mb={1}>
                        Security Operations Center
                    </Heading>
                    <Text color="gray.500" fontSize="sm">
                        Real-time monitoring and threat intelligence
                    </Text>
                </Box>
                <Button leftIcon={<Plus size={18} />} colorScheme="blue" size="lg" onClick={onOpen}>
                    Add Proxy Site
                </Button>
            </Flex>

            {/* KPI Cards */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
                <Box bg={cardBg} p={6} borderRadius="lg" border="1px" borderColor={borderColor} position="relative" overflow="hidden">
                    <HStack justify="space-between" mb={4}>
                        <Box p={3} bg="blue.50" borderRadius="lg">
                            <Icon as={Globe} boxSize={6} color="blue.500" />
                        </Box>
                        <Badge colorScheme="green" fontSize="xs">
                            <HStack spacing={1}>
                                <ArrowUp size={10} />
                                <Text>12%</Text>
                            </HStack>
                        </Badge>
                    </HStack>
                    <Text fontSize="3xl" fontWeight="bold" mb={1}>
                        {sites.length}
                    </Text>
                    <Text color="gray.500" fontSize="sm">
                        Active Proxy Sites
                    </Text>
                    <Progress value={(onlineSites / sites.length) * 100} size="xs" colorScheme="green" mt={3} borderRadius="full" />
                </Box>

                <Box bg={cardBg} p={6} borderRadius="lg" border="1px" borderColor={borderColor}>
                    <HStack justify="space-between" mb={4}>
                        <Box p={3} bg="red.50" borderRadius="lg">
                            <Icon as={Shield} boxSize={6} color="red.500" />
                        </Box>
                        <Badge colorScheme="red" fontSize="xs">
                            <HStack spacing={1}>
                                <ArrowUp size={10} />
                                <Text>8%</Text>
                            </HStack>
                        </Badge>
                    </HStack>
                    <Text fontSize="3xl" fontWeight="bold" mb={1}>
                        {totalBlocked.toLocaleString()}
                    </Text>
                    <Text color="gray.500" fontSize="sm">
                        Threats Blocked
                    </Text>
                    <Text fontSize="xs" color="gray.400" mt={2}>
                        {blockRate}% of total traffic
                    </Text>
                </Box>

                <Box bg={cardBg} p={6} borderRadius="lg" border="1px" borderColor={borderColor}>
                    <HStack justify="space-between" mb={4}>
                        <Box p={3} bg="green.50" borderRadius="lg">
                            <Icon as={CheckCircle} boxSize={6} color="green.500" />
                        </Box>
                        <Badge colorScheme="green" fontSize="xs">LIVE</Badge>
                    </HStack>
                    <Text fontSize="3xl" fontWeight="bold" mb={1}>
                        {onlineSites}/{sites.length}
                    </Text>
                    <Text color="gray.500" fontSize="sm">
                        Systems Online
                    </Text>
                    <Progress value={(onlineSites / sites.length) * 100} size="xs" colorScheme="green" mt={3} borderRadius="full" />
                </Box>

                <Box bg={cardBg} p={6} borderRadius="lg" border="1px" borderColor={borderColor}>
                    <HStack justify="space-between" mb={4}>
                        <Box p={3} bg="purple.50" borderRadius="lg">
                            <Icon as={Zap} boxSize={6} color="purple.500" />
                        </Box>
                        <Badge colorScheme="blue" fontSize="xs">24h</Badge>
                    </HStack>
                    <Text fontSize="3xl" fontWeight="bold" mb={1}>
                        {totalRequests.toLocaleString()}
                    </Text>
                    <Text color="gray.500" fontSize="sm">
                        Total Requests
                    </Text>
                    <Text fontSize="xs" color="gray.400" mt={2}>
                        Avg {Math.round(totalRequests / 24)}/hour
                    </Text>
                </Box>
            </SimpleGrid>

            {/* Chart */}
            <Box bg={cardBg} p={6} borderRadius="lg" border="1px" borderColor={borderColor} mb={8}>
                <HStack justify="space-between" mb={6}>
                    <Box>
                        <Heading size="md" mb={1}>
                            Security Events Timeline
                        </Heading>
                        <Text fontSize="sm" color="gray.500">
                            Last 7 days threat activity
                        </Text>
                    </Box>
                    <HStack>
                        <Badge colorScheme="red">High Priority</Badge>
                        <IconButton size="sm" variant="ghost" icon={<RefreshCcw size={16} />} />
                    </HStack>
                </HStack>
                <Box height="280px">
                    <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} />
                </Box>
            </Box>

            {/* Sites Table */}
            <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflow="hidden">
                <Box px={6} py={4} borderBottom="1px" borderColor={borderColor}>
                    <HStack justify="space-between">
                        <Box>
                            <Heading size="md" mb={1}>
                                Proxy Sites
                            </Heading>
                            <Text fontSize="sm" color="gray.500">
                                Manage and monitor your gateway infrastructure
                            </Text>
                        </Box>
                        <HStack>
                            <Button size="sm" variant="outline" leftIcon={<RefreshCcw size={14} />}>
                                Refresh
                            </Button>
                        </HStack>
                    </HStack>
                </Box>

                <Table variant="simple" size="md">
                    <Thead bg={statBg}>
                        <Tr>
                            <Th>STATUS</Th>
                            <Th>SITE</Th>
                            <Th>BACKEND</Th>
                            <Th>PROTECTION</Th>
                            <Th>TRAFFIC</Th>
                            <Th>UPTIME</Th>
                            <Th textAlign="right">ACTIONS</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {sites.map((site) => {
                            const stats = liveStats[site.id] || site;
                            return (
                                <Tr key={site.id} _hover={{ bg: statBg }}>
                                    <Td>
                                        <HStack spacing={3}>
                                            <Box
                                                w={3}
                                                h={3}
                                                borderRadius="full"
                                                bg={site.is_online ? 'green.400' : 'red.400'}
                                                boxShadow={site.is_online ? '0 0 8px rgba(72, 187, 120, 0.6)' : '0 0 8px rgba(245, 101, 101, 0.6)'}
                                            />
                                            <VStack align="start" spacing={0}>
                                                <Badge
                                                    colorScheme={site.is_online ? 'green' : 'red'}
                                                    fontSize="xs"
                                                    fontWeight="bold"
                                                >
                                                    {site.is_online ? 'ONLINE' : 'OFFLINE'}
                                                </Badge>
                                                {!site.is_online && (
                                                    <Text fontSize="xs" color="gray.500">
                                                        {site.last_error?.substring(0, 20)}...
                                                    </Text>
                                                )}
                                            </VStack>
                                        </HStack>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold" fontSize="sm">
                                                {site.name}
                                            </Text>
                                            <HStack spacing={2}>
                                                <Icon as={Globe} boxSize={3} color="gray.400" />
                                                <Text fontSize="xs" color="gray.500">
                                                    {site.domain}
                                                </Text>
                                            </HStack>
                                        </VStack>
                                    </Td>
                                    <Td>
                                        <Badge variant="outline" colorScheme="gray" fontSize="xs">
                                            {site.backend_type === 'php_fpm' ? 'PHP-FPM' : 'HTTP'}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <HStack spacing={1}>
                                            {site.ssl_enabled && (
                                                <Badge colorScheme="green" fontSize="xs">
                                                    SSL
                                                </Badge>
                                            )}
                                            {site.waf_enabled && (
                                                <Badge colorScheme="purple" fontSize="xs">
                                                    WAF
                                                </Badge>
                                            )}
                                            {site.auth_user && (
                                                <Badge colorScheme="blue" fontSize="xs">
                                                    AUTH
                                                </Badge>
                                            )}
                                        </HStack>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={0}>
                                            <HStack>
                                                <Text fontSize="sm" fontWeight="medium">
                                                    {(stats.total_requests || 0).toLocaleString()}
                                                </Text>
                                                {liveStats[site.id] && (
                                                    <Badge colorScheme="blue" fontSize="9px">
                                                        LIVE
                                                    </Badge>
                                                )}
                                            </HStack>
                                            <Text fontSize="xs" color="red.500">
                                                {(stats.blocked_requests || 0).toLocaleString()} blocked
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={1}>
                                            <Text fontSize="sm" fontWeight="medium" color="green.500">
                                                99.9%
                                            </Text>
                                            <Progress value={99.9} size="xs" colorScheme="green" w="60px" borderRadius="full" />
                                        </VStack>
                                    </Td>
                                    <Td textAlign="right">
                                        <HStack spacing={2} justify="flex-end">
                                            <IconButton
                                                size="sm"
                                                variant="ghost"
                                                icon={<RefreshCcw size={14} />}
                                                onClick={() => handleManualCheck(site.id)}
                                                title="Health Check"
                                            />
                                            <Button
                                                as={Link}
                                                href={route('sites.show', site.id)}
                                                size="sm"
                                                colorScheme="blue"
                                                variant="ghost"
                                            >
                                                Manage
                                            </Button>
                                            <Menu>
                                                <MenuButton
                                                    as={IconButton}
                                                    icon={<MoreVertical size={14} />}
                                                    variant="ghost"
                                                    size="sm"
                                                />
                                                <MenuList>
                                                    <MenuItem>View Logs</MenuItem>
                                                    <MenuItem>Edit Configuration</MenuItem>
                                                    <MenuItem color="red.500">Delete</MenuItem>
                                                </MenuList>
                                            </Menu>
                                        </HStack>
                                    </Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>
            </Box>

            {/* Add Site Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay backdropFilter="blur(4px)" />
                <ModalContent>
                    <ModalHeader>Add New Proxy Site</ModalHeader>
                    <ModalCloseButton />
                    <form onSubmit={submit}>
                        <ModalBody>
                            <Stack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Site Name</FormLabel>
                                    <Input
                                        placeholder="My Application"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Domain</FormLabel>
                                    <Input
                                        placeholder="app.example.com"
                                        value={data.domain}
                                        onChange={e => setData('domain', e.target.value)}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Backend URL</FormLabel>
                                    <Input
                                        placeholder="http://localhost:8000"
                                        value={data.backend_url}
                                        onChange={e => setData('backend_url', e.target.value)}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Backend Type</FormLabel>
                                    <Select value={data.backend_type} onChange={e => setData('backend_type', e.target.value)}>
                                        <option value="proxy">Reverse Proxy (HTTP)</option>
                                        <option value="php_fpm">PHP-FPM (FastCGI)</option>
                                    </Select>
                                </FormControl>
                                <HStack>
                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel mb="0">Enable SSL</FormLabel>
                                        <Switch
                                            isChecked={data.ssl_enabled}
                                            onChange={e => setData('ssl_enabled', e.target.checked)}
                                            colorScheme="green"
                                        />
                                    </FormControl>
                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel mb="0">Enable WAF</FormLabel>
                                        <Switch
                                            isChecked={data.waf_enabled}
                                            onChange={e => setData('waf_enabled', e.target.checked)}
                                            colorScheme="purple"
                                        />
                                    </FormControl>
                                </HStack>
                            </Stack>
                        </ModalBody>
                        <Box px={6} py={4} borderTop="1px" borderColor={borderColor}>
                            <HStack justify="flex-end">
                                <Button variant="ghost" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button colorScheme="blue" type="submit">
                                    Create Site
                                </Button>
                            </HStack>
                        </Box>
                    </form>
                </ModalContent>
            </Modal>
        </EnterpriseLayout>
    );
}
