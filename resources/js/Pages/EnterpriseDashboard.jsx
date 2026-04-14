import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Heading, Text, Button, SimpleGrid, Badge,
    Table, Thead, Tbody, Tr, Th, Td,
    Icon, HStack, VStack, Progress, Flex, IconButton,
    Menu, MenuButton, MenuList, MenuItem,
    useDisclosure, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalCloseButton,
    FormControl, FormLabel, Input, Select, Stack, Switch,
} from '@chakra-ui/react';
import {
    Plus, Shield, Globe, RefreshCcw, MoreVertical,
    CheckCircle, Zap, ArrowUp, Settings, Trash2, Eye, X,
    ChevronRight, MapPin
} from 'lucide-react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

const CARD_BG = '#0c0d12';
const BORDER = 'rgba(255,255,255,0.08)';
const ROW_HOVER = '#1c1c1c';
const ACCENT = '#f38020';
const ACCENT_DIM = 'rgba(243,128,32,0.12)';

export default function EnterpriseDashboard({ auth, sites: initialSites, analytics, threatsByCountry = [] }) {
    const [sites, setSites] = React.useState(initialSites);
    const [liveStats, setLiveStats] = React.useState({});
    const { isOpen, onOpen, onClose } = useDisclosure();

    React.useEffect(() => {
        if (!window.Echo) return;
        window.Echo.channel('health-checks').listen('BackendHealthUpdated', (e) => {
            setSites(cur => cur.map(s =>
                s.id === e.id ? { ...s, is_online: e.is_online, last_check_at: e.last_check_at, last_error: e.last_error } : s
            ));
        });
        initialSites.forEach(site => {
            window.Echo.channel(`site.${site.id}`).listen('.traffic.updated', (e) => {
                setLiveStats(cur => ({ ...cur, [e.siteId]: e.stats }));
            });
        });
        return () => {
            window.Echo.leaveChannel('health-checks');
            initialSites.forEach(site => window.Echo.leaveChannel(`site.${site.id}`));
        };
    }, []);

    const { data, setData, post, reset } = useForm({
        name: '', domain: '', backend_url: '',
        backend_type: 'proxy', ssl_enabled: true, waf_enabled: true,
    });

    const totalBlocked = sites.reduce((a, s) => a + (s.blocked_requests || 0), 0);
    const totalRequests = sites.reduce((a, s) => a + (s.total_requests || 0), 0);
    const blockRate = totalRequests > 0 ? ((totalBlocked / totalRequests) * 100).toFixed(1) : 0;
    const onlineSites = sites.filter(s => s.is_online).length;

    const [worldJson, setWorldJson] = React.useState(null);

    React.useEffect(() => {
        fetch('/world.json')
            .then(res => res.json())
            .then(data => {
                echarts.registerMap('world', data);
                setWorldJson(data);
            });
    }, []);

    const mapOptions = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: '#1a1a1a',
            borderColor: ACCENT,
            textStyle: { color: '#e5e5e5', fontSize: 12 },
            formatter: (params) => {
                return `${params.name}: ${params.value || 0} Threats`;
            }
        },
        visualMap: {
            min: 0,
            max: Math.max(...Object.values(threatsByCountry || { 'US': 0 }), 10),
            left: 'left',
            top: 'bottom',
            text: ['High', 'Low'],
            seriesIndex: [0],
            inRange: {
                color: ['rgba(243,128,32,0.1)', 'rgba(243,128,32,0.6)', '#f38020']
            },
            calculable: true,
            textStyle: { color: '#666' }
        },
        series: [
            {
                name: 'Threats',
                type: 'map',
                map: 'world',
                roam: true,
                emphasis: {
                    label: { show: false },
                    itemStyle: { areaColor: '#4f46e5' }
                },
                data: Object.entries(threatsByCountry || {}).map(([code, count]) => ({
                    name: code === 'US' ? 'United States' : (code === 'TR' ? 'Turkey' : (code === 'CN' ? 'China' : code)),
                    value: count
                }))
            }
        ]
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('sites.store'), { onSuccess: () => { reset(); onClose(); } });
    };

    const kpis = [
        {
            label: 'Active Proxy Sites',
            value: sites.length,
            sub: `${onlineSites} online`,
            icon: Globe,
            iconBg: ACCENT_DIM,
            iconColor: ACCENT,
            progress: sites.length ? (onlineSites / sites.length) * 100 : 0,
            badge: '+12%',
            badgeColor: 'green',
        },
        {
            label: 'Threats Blocked',
            value: totalBlocked.toLocaleString(),
            sub: `${blockRate}% of traffic`,
            icon: Shield,
            iconBg: 'rgba(239,68,68,0.12)',
            iconColor: '#ef4444',
            badge: '+8%',
            badgeColor: 'red',
        },
        {
            label: 'Systems Online',
            value: `${onlineSites}/${sites.length}`,
            sub: 'Real-time status',
            icon: CheckCircle,
            iconBg: 'rgba(34,197,94,0.12)',
            iconColor: '#22c55e',
            progress: sites.length ? (onlineSites / sites.length) * 100 : 0,
            badge: 'LIVE',
            badgeColor: 'green',
        },
        {
            label: 'Total Requests',
            value: totalRequests.toLocaleString(),
            sub: `~${Math.round(totalRequests / 24)}/hr avg`,
            icon: Zap,
            iconBg: 'rgba(168,85,247,0.12)',
            iconColor: '#a855f7',
            badge: '24h',
            badgeColor: 'purple',
        },
    ];

    const view = new URLSearchParams(window.location.search).get('view');
    const showAll = !view || view === 'dashboard';

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title={view === 'sites' ? 'Proxy Sites' : 'Dashboard'} />

            {/* Header */}
            <Flex justify="space-between" align="center" mb={8}>
                <Box>
                    <Heading size="lg" color="white" fontWeight="semibold">
                        {view === 'sites' ? 'Proxy Infrastructure' : 'Security Operations Center'}
                    </Heading>
                    <Text color="gray.500" fontSize="sm" mt={1}>
                        {view === 'sites' ? 'Manage and monitor your proxy sites' : 'Real-time monitoring and threat intelligence'}
                    </Text>
                </Box>
                <Button
                    leftIcon={<Plus size={16} />}
                    bg={ACCENT}
                    color="white"
                    _hover={{ bg: '#4f46e5' }}
                    size="md"
                    onClick={onOpen}
                    fontWeight="medium"
                >
                    Add Proxy Site
                </Button>
            </Flex>

            {showAll && (
                <>
                    {/* KPI Cards */}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
                        {kpis.map((kpi) => (
                            <Box key={kpi.label} bg={CARD_BG} p={5} borderRadius="lg"
                                border="1px solid" borderColor={BORDER}>
                                <HStack justify="space-between" mb={4}>
                                    <Box p={2.5} bg={kpi.iconBg} borderRadius="md">
                                        <Icon as={kpi.icon} boxSize={5} color={kpi.iconColor} />
                                    </Box>
                                    <Badge
                                        colorScheme={kpi.badgeColor}
                                        fontSize="10px"
                                        px={2}
                                        borderRadius="full"
                                    >
                                        {kpi.badge === '+12%' || kpi.badge === '+8%'
                                            ? <HStack spacing={0.5}><ArrowUp size={9} /><Text>{kpi.badge}</Text></HStack>
                                            : kpi.badge
                                        }
                                    </Badge>
                                </HStack>
                                <Text fontSize="2xl" fontWeight="bold" color="white" mb={0.5}>
                                    {kpi.value}
                                </Text>
                                <Text fontSize="xs" color="gray.500" mb={kpi.progress !== undefined ? 3 : 0}>
                                    {kpi.label}
                                </Text>
                                {kpi.progress !== undefined && (
                                    <Progress value={kpi.progress} size="xs" colorScheme="brand"
                                        bg="#2a2a2a" borderRadius="full" />
                                )}
                            </Box>
                        ))}
                    </SimpleGrid>

                    {/* Security Intel & AI Advisor */}
                    <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={6}>
                        {/* Threat Timeline */}
                        <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER} gridColumn={{ lg: "span 2" }}>
                            <HStack justify="space-between" mb={5}>
                                <Box>
                                    <Text fontWeight="semibold" color="white" fontSize="lg">Global Threat Map</Text>
                                    <Text fontSize="xs" color="gray.500" mt={0.5}>Visualizing blocked attack attempts across regions</Text>
                                </Box>
                                <HStack spacing={4}>
                                    <HStack spacing={2}>
                                        <Box w={2} h={2} bg={ACCENT} borderRadius="full" />
                                        <Text fontSize="xs" color="gray.400">Threat Hotspots</Text>
                                    </HStack>
                                </HStack>
                            </HStack>
                            <Box height="280px">
                                {worldJson ? (
                                    <ReactECharts
                                        echarts={echarts}
                                        option={mapOptions}
                                        style={{ height: '100%', width: '100%' }}
                                    />
                                ) : (
                                    <Flex align="center" justify="center" h="100%">
                                        <VStack spacing={3}>
                                            <Progress size="xs" isIndeterminate w="150px" colorScheme="brand" bg="rgba(255,255,255,0.05)" />
                                            <Text fontSize="xs" color="gray.600">Loading Geospatial Data...</Text>
                                        </VStack>
                                    </Flex>
                                )}
                            </Box>
                        </Box>

                        {/* AI Advisor & Regional Matrix */}
                        <Stack spacing={6}>
                            {/* AI Security Advisor */}
                            <Box bg="linear-gradient(135deg, #0c0d12 0%, #1a1b26 100%)" p={5} borderRadius="xl" border="1px solid" borderColor="rgba(243,128,32,0.2)" position="relative" overflow="hidden">
                                <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px" bg={ACCENT_DIM} filter="blur(40px)" borderRadius="full" />
                                <HStack mb={4}>
                                    <Icon as={Shield} color={ACCENT} boxSize={5} />
                                    <Text fontWeight="bold" color="white" fontSize="sm" letterSpacing="wide">AI SECURITY ADVISOR</Text>
                                </HStack>
                                <VStack align="start" spacing={3}>
                                    <Box p={3} bg="rgba(0,0,0,0.3)" borderRadius="md" borderLeft="3px solid" borderLeftColor={ACCENT}>
                                        <Text fontSize="xs" color="gray.300" fontWeight="medium">
                                            {threatsByCountry.length > 0
                                                ? `High activity detected from ${threatsByCountry[0]?.country_code}. Consider enabling regional lock for this zone.`
                                                : "Security parameters look stable. No immediate action required."}
                                        </Text>
                                    </Box>
                                    <Button size="xs" variant="outline" colorScheme="brand" rightIcon={<ChevronRight size={12} />} borderColor="rgba(243,128,32,0.3)">
                                        Optimize Policies
                                    </Button>
                                </VStack>
                            </Box>

                            {/* Regional Threat Intelligence */}
                            <Box bg={CARD_BG} p={5} borderRadius="xl" border="1px solid" borderColor={BORDER} flex="1">
                                <Text fontWeight="semibold" color="white" fontSize="sm" mb={4}>Regional Intelligence</Text>
                                <Stack spacing={3}>
                                    {threatsByCountry.slice(0, 5).map((threat, i) => (
                                        <Box key={i}>
                                            <Flex justify="space-between" mb={1}>
                                                <HStack spacing={2}>
                                                    <Text fontSize="10px" color="gray.400" fontWeight="bold">{threat.country_code}</Text>
                                                    <Text fontSize="xs" color="white">{threat.country_code === 'TR' ? 'Turkey' : 'Global Origin'}</Text>
                                                </HStack>
                                                <Text fontSize="xs" fontWeight="bold" color={ACCENT}>{threat.count}</Text>
                                            </Flex>
                                            <Progress value={(threat.count / (threatsByCountry[0]?.count || 1)) * 100} size="xs" colorScheme="brand" bg="rgba(255,255,255,0.05)" borderRadius="full" />
                                        </Box>
                                    ))}
                                    {threatsByCountry.length === 0 && (
                                        <Text fontSize="xs" color="gray.600" textAlign="center" py={4}>No regional threats logged.</Text>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    </SimpleGrid>
                </>
            )}

            {/* Sites Table */}
            <Box bg={CARD_BG} borderRadius="lg" border="1px solid" borderColor={BORDER} overflow="hidden">
                <Flex px={6} py={4} borderBottom="1px solid" borderColor={BORDER}
                    justify="space-between" align="center">
                    <Box>
                        <Text fontWeight="semibold" color="white">Proxy Sites</Text>
                        <Text fontSize="xs" color="gray.500" mt={0.5}>
                            Manage and monitor your gateway infrastructure
                        </Text>
                    </Box>
                    <Button size="sm" variant="outline" borderColor={BORDER} color="gray.400"
                        _hover={{ borderColor: ACCENT, color: ACCENT }}
                        leftIcon={<RefreshCcw size={13} />}>
                        Refresh
                    </Button>
                </Flex>

                <Table variant="unstyled" size="sm">
                    <Thead>
                        <Tr borderBottom="1px solid" borderColor={BORDER}>
                            {['STATUS', 'SITE', 'BACKEND', 'PROTECTION', 'TRAFFIC', 'UPTIME', ''].map(h => (
                                <Th key={h} py={3} px={4} fontSize="10px" color="gray.600"
                                    fontWeight="semibold" letterSpacing="wider">
                                    {h}
                                </Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {sites.map((site) => {
                            const stats = liveStats[site.id] || site;
                            return (
                                <Tr key={site.id}
                                    borderBottom="1px solid" borderColor={BORDER}
                                    _hover={{ bg: ROW_HOVER }}
                                    transition="background 0.1s"
                                >
                                    <Td px={4} py={3}>
                                        <HStack spacing={2}>
                                            <Box w={2} h={2} borderRadius="full"
                                                bg={site.is_online ? '#22c55e' : '#ef4444'}
                                                boxShadow={site.is_online
                                                    ? '0 0 6px rgba(34,197,94,0.7)'
                                                    : '0 0 6px rgba(239,68,68,0.7)'}
                                            />
                                            <Text fontSize="xs" fontWeight="medium"
                                                color={site.is_online ? '#22c55e' : '#ef4444'}>
                                                {site.is_online ? 'ONLINE' : 'OFFLINE'}
                                            </Text>
                                        </HStack>
                                    </Td>
                                    <Td px={4} py={3}>
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="semibold" fontSize="sm" color="white">
                                                {site.name}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">{site.domain}</Text>
                                        </VStack>
                                    </Td>
                                    <Td px={4} py={3}>
                                        <Badge variant="outline" colorScheme="gray" fontSize="10px">
                                            {site.backend_type === 'php_fpm' ? 'PHP-FPM' : 'HTTP'}
                                        </Badge>
                                    </Td>
                                    <Td px={4} py={3}>
                                        <HStack spacing={1}>
                                            {site.ssl_enabled && <Badge colorScheme="green" fontSize="10px">SSL</Badge>}
                                            {site.waf_enabled && (
                                                <Badge fontSize="10px"
                                                    bg={ACCENT_DIM} color={ACCENT}
                                                    border="1px solid" borderColor="rgba(243,128,32,0.3)">
                                                    WAF
                                                </Badge>
                                            )}
                                            {site.auth_user && <Badge colorScheme="blue" fontSize="10px">AUTH</Badge>}
                                        </HStack>
                                    </Td>
                                    <Td px={4} py={3}>
                                        <VStack align="start" spacing={0}>
                                            <HStack spacing={1}>
                                                <Text fontSize="sm" color="white">
                                                    {(stats.total_requests || 0).toLocaleString()}
                                                </Text>
                                                {liveStats[site.id] && (
                                                    <Badge fontSize="9px" bg={ACCENT_DIM} color={ACCENT}>LIVE</Badge>
                                                )}
                                            </HStack>
                                            <Text fontSize="xs" color="#ef4444">
                                                {(stats.blocked_requests || 0).toLocaleString()} blocked
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td px={4} py={3}>
                                        <VStack align="start" spacing={1}>
                                            <Text fontSize="sm" fontWeight="medium" color={site.uptime_percentage > 9900 ? '#22c55e' : '#f38020'}>
                                                {(site.uptime_percentage / 100).toFixed(1)}%
                                            </Text>
                                            <Progress
                                                value={site.uptime_percentage / 100}
                                                size="xs"
                                                colorScheme={site.uptime_percentage > 9900 ? 'green' : 'orange'}
                                                w="50px" bg="#2a2a2a" borderRadius="full" />
                                        </VStack>
                                    </Td>
                                    <Td px={4} py={3} textAlign="right">
                                        <HStack spacing={1} justify="flex-end">
                                            <IconButton size="xs" variant="ghost" color="gray.500"
                                                _hover={{ color: 'white' }}
                                                icon={<RefreshCcw size={13} />}
                                                onClick={() => router.post(route('sites.check-health', site.id), {}, { preserveScroll: true })}
                                            />
                                            <Button as={Link} href={route('sites.show', site.id)}
                                                size="xs" variant="ghost" color={ACCENT}
                                                _hover={{ bg: ACCENT_DIM }}>
                                                Manage
                                            </Button>
                                            <Menu>
                                                <MenuButton as={IconButton} icon={<MoreVertical size={13} />}
                                                    variant="ghost" size="xs" color="gray.500"
                                                    _hover={{ color: 'white' }} />
                                                <MenuList bg="#1a1a1a" borderColor="#2a2a2a" minW="160px" zIndex={10}>
                                                    <MenuItem
                                                        as={Link}
                                                        href={route('sites.show', site.id)}
                                                        bg="transparent"
                                                        _hover={{ bg: '#2a2a2a' }}
                                                        fontSize="sm"
                                                        color="gray.300"
                                                        icon={<Icon as={Zap} size={14} />}
                                                    >
                                                        View Logs
                                                    </MenuItem>
                                                    <MenuItem
                                                        as={Link}
                                                        href={route('sites.show', site.id)}
                                                        bg="transparent"
                                                        _hover={{ bg: '#2a2a2a' }}
                                                        fontSize="sm"
                                                        color="gray.300"
                                                        icon={<Icon as={Settings} size={14} />}
                                                    >
                                                        Edit Config
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this site?')) {
                                                                router.delete(route('sites.destroy', site.id));
                                                            }
                                                        }}
                                                        bg="transparent"
                                                        _hover={{ bg: '#2a1010' }}
                                                        fontSize="sm"
                                                        color="red.400"
                                                        icon={<Icon as={Trash2} size={14} />}
                                                    >
                                                        Delete
                                                    </MenuItem>
                                                </MenuList>
                                            </Menu>
                                        </HStack>
                                    </Td>
                                </Tr>
                            );
                        })}
                        {sites.length === 0 && (
                            <Tr>
                                <Td colSpan={7} textAlign="center" py={12} color="gray.600">
                                    No proxy sites configured yet.
                                </Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </Box>

            {/* Add Site Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalOverlay backdropFilter="blur(4px)" bg="rgba(0,0,0,0.7)" />
                <ModalContent bg="#161616" border="1px solid" borderColor={BORDER}>
                    <ModalHeader color="white" borderBottom="1px solid" borderColor={BORDER} pb={4}>
                        Add New Proxy Site
                    </ModalHeader>
                    <ModalCloseButton color="gray.500" />
                    <form onSubmit={submit}>
                        <ModalBody py={6}>
                            <Stack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" color="gray.400">Site Name</FormLabel>
                                    <Input placeholder="My Application" value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        bg="#0d0d0d" borderColor={BORDER} color="white"
                                        _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }} />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" color="gray.400">Domain</FormLabel>
                                    <Input placeholder="app.example.com" value={data.domain}
                                        onChange={e => setData('domain', e.target.value)}
                                        bg="#0d0d0d" borderColor={BORDER} color="white"
                                        _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }} />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" color="gray.400">Backend URL</FormLabel>
                                    <Input placeholder="http://localhost:8000" value={data.backend_url}
                                        onChange={e => setData('backend_url', e.target.value)}
                                        bg="#0d0d0d" borderColor={BORDER} color="white"
                                        _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }} />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm" color="gray.400">Backend Type</FormLabel>
                                    <Select value={data.backend_type}
                                        onChange={e => setData('backend_type', e.target.value)}
                                        bg="#0d0d0d" borderColor={BORDER} color="white"
                                        _focus={{ borderColor: ACCENT }}>
                                        <option value="proxy">Reverse Proxy (HTTP)</option>
                                        <option value="php_fpm">PHP-FPM (FastCGI)</option>
                                    </Select>
                                </FormControl>
                                <HStack spacing={6}>
                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel mb="0" fontSize="sm" color="gray.400">Enable SSL</FormLabel>
                                        <Switch isChecked={data.ssl_enabled}
                                            onChange={e => setData('ssl_enabled', e.target.checked)}
                                            colorScheme="green" />
                                    </FormControl>
                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel mb="0" fontSize="sm" color="gray.400">Enable WAF</FormLabel>
                                        <Switch isChecked={data.waf_enabled}
                                            onChange={e => setData('waf_enabled', e.target.checked)}
                                            colorScheme="brand" />
                                    </FormControl>
                                </HStack>
                            </Stack>
                        </ModalBody>
                        <Flex px={6} py={4} borderTop="1px solid" borderColor={BORDER} justify="flex-end" gap={3}>
                            <Button variant="ghost" color="gray.400" onClick={onClose} leftIcon={<Icon as={X} size={16} />}>Cancel</Button>
                            <Button type="submit" bg={ACCENT} color="white" _hover={{ bg: '#4f46e5' }} leftIcon={<Icon as={CheckCircle} size={16} />}>
                                Create Site
                            </Button>
                        </Flex>
                    </form>
                </ModalContent>
            </Modal>
        </EnterpriseLayout>
    );
}
