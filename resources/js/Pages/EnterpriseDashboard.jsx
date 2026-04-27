import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Text, Button, SimpleGrid, Badge, Table,
    Group, Stack, Progress, Flex, ActionIcon,
    Menu, Modal, TextInput, Select, Switch,
    Title, Paper, Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconPlus, IconShield, IconGlobe, IconRefresh, IconDots,
    IconCircleCheck, IconBolt, IconArrowUp, IconSettings,
    IconTrash, IconEye, IconChevronRight, IconMapPin,
} from '@tabler/icons-react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import ConfirmModal from '@/Components/ConfirmModal';
import PolicyOptimizerModal from '@/Components/PolicyOptimizerModal';

const CARD_BG = '#111113';
const BORDER = 'rgba(255,255,255,0.07)';
const ROW_HOVER = '#18181b';
const ACCENT = '#f38020';
const ACCENT_DIM = 'rgba(243,128,32,0.1)';

function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, badge, badgeColor, progress }) {
    return (
        <Paper
            p="lg"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
        >
            <Flex justify="space-between" align="flex-start" mb={16}>
                <Box
                    style={{
                        padding: 10,
                        backgroundColor: iconBg,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon size={20} color={iconColor} />
                </Box>
                <Badge
                    size="xs"
                    variant="light"
                    color={badgeColor}
                    radius="xl"
                >
                    {badge}
                </Badge>
            </Flex>
            <Text size="28px" fw={700} c="white" lh={1}>{value}</Text>
            <Text size="xs" c="dimmed" mt={4} mb={progress !== undefined ? 12 : 0}>{label}</Text>
            {progress !== undefined && (
                <Progress value={progress} size="xs" color="orange" style={{ backgroundColor: '#27272a' }} radius="xl" />
            )}
        </Paper>
    );
}

export default function EnterpriseDashboard({ auth, sites: initialSites, analytics, threatsByCountry = [] }) {
    const [sites, setSites] = React.useState(initialSites);
    const [liveStats, setLiveStats] = React.useState({});
    const [opened, { open, close }] = useDisclosure(false);
    const [deleteSite, setDeleteSite] = React.useState(null);
    const [policyOptimizerOpened, { open: openPolicyOptimizer, close: closePolicyOptimizer }] = useDisclosure(false);

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
            formatter: (params) => `${params.name}: ${params.value || 0} Threats`,
        },
        visualMap: {
            min: 0,
            max: Math.max(...Object.values(threatsByCountry || { US: 0 }), 10),
            left: 'left',
            top: 'bottom',
            text: ['High', 'Low'],
            seriesIndex: [0],
            inRange: { color: ['rgba(243,128,32,0.1)', 'rgba(243,128,32,0.6)', '#f38020'] },
            calculable: true,
            textStyle: { color: '#666' },
        },
        series: [{
            name: 'Threats',
            type: 'map',
            map: 'world',
            roam: true,
            emphasis: { label: { show: false }, itemStyle: { areaColor: '#4f46e5' } },
            data: Object.entries(threatsByCountry || {}).map(([code, count]) => ({
                name: code === 'US' ? 'United States' : code === 'TR' ? 'Turkey' : code === 'CN' ? 'China' : code,
                value: count,
            })),
        }],
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('sites.store'), {
            onSuccess: () => {
                reset();
                close();
                notifications.show({ title: 'Site added', color: 'orange' });
            },
        });
    };

    const kpis = [
        {
            label: 'Active Proxy Sites',
            value: sites.length,
            sub: `${onlineSites} online`,
            icon: IconGlobe,
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
            icon: IconShield,
            iconBg: 'rgba(239,68,68,0.1)',
            iconColor: '#ef4444',
            badge: '+8%',
            badgeColor: 'red',
        },
        {
            label: 'Systems Online',
            value: `${onlineSites}/${sites.length}`,
            sub: 'Real-time status',
            icon: IconCircleCheck,
            iconBg: 'rgba(34,197,94,0.1)',
            iconColor: '#22c55e',
            progress: sites.length ? (onlineSites / sites.length) * 100 : 0,
            badge: 'LIVE',
            badgeColor: 'green',
        },
        {
            label: 'Total Requests',
            value: totalRequests.toLocaleString(),
            sub: `~${Math.round(totalRequests / 24)}/hr avg`,
            icon: IconBolt,
            iconBg: 'rgba(168,85,247,0.1)',
            iconColor: '#a855f7',
            badge: '24h',
            badgeColor: 'violet',
        },
    ];

    const view = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('view')
        : null;
    const showAll = !view || view === 'dashboard';

    return (
        <>
            <EnterpriseLayout user={auth.user}>
                <Head title={view === 'sites' ? 'Proxy Sites' : 'Dashboard'} />

                <Flex justify="space-between" align="center" mb={32}>
                    <Box>
                        <Title order={2} c="white" fw={600}>
                            {view === 'sites' ? 'Proxy Infrastructure' : 'Security Operations Center'}
                        </Title>
                        <Text c="dimmed" size="sm" mt={4}>
                            {view === 'sites'
                                ? 'Manage and monitor your proxy sites'
                                : 'Real-time monitoring and threat intelligence'}
                        </Text>
                    </Box>
                    <Button
                        leftSection={<IconPlus size={15} />}
                        onClick={open}
                        style={{ backgroundColor: ACCENT }}
                    >
                        Add Proxy Site
                    </Button>
                </Flex>

                {showAll && (
                    <>
                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb={24}>
                            {kpis.map(kpi => (
                                <StatCard key={kpi.label} {...kpi} />
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
                                <Flex justify="space-between" align="flex-start" mb={20}>
                                    <Box>
                                        <Text fw={600} c="white" size="lg">Global Threat Map</Text>
                                        <Text size="xs" c="dimmed" mt={2}>Visualizing blocked attack attempts across regions</Text>
                                    </Box>
                                    <Group gap={8}>
                                        <Box
                                            style={{
                                                width: 8, height: 8,
                                                borderRadius: '50%',
                                                backgroundColor: ACCENT,
                                            }}
                                        />
                                        <Text size="xs" c="dimmed">Threat Hotspots</Text>
                                    </Group>
                                </Flex>
                                <Box h={280}>
                                    {worldJson ? (
                                        <ReactECharts
                                            echarts={echarts}
                                            option={mapOptions}
                                            style={{ height: '100%', width: '100%' }}
                                        />
                                    ) : (
                                        <Flex align="center" justify="center" h="100%">
                                            <Stack align="center" gap={8}>
                                                <Progress size="xs" animated w={150} color="orange" />
                                                <Text size="xs" c="dimmed">Loading Geospatial Data...</Text>
                                            </Stack>
                                        </Flex>
                                    )}
                                </Box>
                            </Paper>

                            <Stack gap={24}>
                                <Paper
                                    p="lg"
                                    style={{
                                        backgroundColor: CARD_BG,
                                        border: `1px solid rgba(243,128,32,0.2)`,
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Box
                                        pos="absolute"
                                        style={{
                                            top: -20, right: -20,
                                            width: 100, height: 100,
                                            backgroundColor: ACCENT_DIM,
                                            filter: 'blur(40px)',
                                            borderRadius: '50%',
                                        }}
                                    />
                                    <Group mb={16}>
                                        <IconShield size={18} color={ACCENT} />
                                        <Text fw={700} c="white" size="xs" style={{ letterSpacing: '0.08em' }}>
                                            AI SECURITY ADVISOR
                                        </Text>
                                    </Group>
                                    <Box
                                        p={12}
                                        mb={12}
                                        style={{
                                            backgroundColor: 'rgba(0,0,0,0.3)',
                                            borderRadius: 8,
                                            borderLeft: `3px solid ${ACCENT}`,
                                        }}
                                    >
                                        <Text size="xs" c="gray.3" fw={500}>
                                            {threatsByCountry.length > 0
                                                ? `High activity detected from ${threatsByCountry[0]?.country_code}. Consider enabling regional lock.`
                                                : 'Security parameters look stable. No immediate action required.'}
                                        </Text>
                                    </Box>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        color="orange"
                                        leftSection={<IconShield size={11} />}
                                        rightSection={<IconChevronRight size={11} />}
                                        onClick={openPolicyOptimizer}
                                    >
                                        Optimize Policies
                                    </Button>
                                </Paper>

                                <Paper
                                    p="lg"
                                    style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, flex: 1 }}
                                >
                                    <Text fw={600} c="white" size="sm" mb={16}>Regional Intelligence</Text>
                                    <Stack gap={12}>
                                        {threatsByCountry.slice(0, 5).map((threat, i) => (
                                            <Box key={i}>
                                                <Flex justify="space-between" mb={4}>
                                                    <Group gap={8}>
                                                        <Text size="10px" c="dimmed" fw={700}>{threat.country_code}</Text>
                                                        <Text size="xs" c="white">
                                                            {threat.country_code === 'TR' ? 'Turkey' : 'Global Origin'}
                                                        </Text>
                                                    </Group>
                                                    <Text size="xs" fw={700} style={{ color: ACCENT }}>{threat.count}</Text>
                                                </Flex>
                                                <Progress
                                                    value={(threat.count / (threatsByCountry[0]?.count || 1)) * 100}
                                                    size="xs"
                                                    color="orange"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                    radius="xl"
                                                />
                                            </Box>
                                        ))}
                                        {threatsByCountry.length === 0 && (
                                            <Text size="xs" c="dimmed" ta="center" py={16}>No regional threats logged.</Text>
                                        )}
                                    </Stack>
                                </Paper>
                            </Stack>
                        </SimpleGrid>
                    </>
                )}

                <Paper style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                    <Flex
                        px={24} py={16}
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                        justify="space-between"
                        align="center"
                    >
                        <Box>
                            <Text fw={600} c="white">Proxy Sites</Text>
                            <Text size="xs" c="dimmed" mt={2}>Manage and monitor your gateway infrastructure</Text>
                        </Box>
                        <Button
                            size="xs"
                            variant="outline"
                            color="gray"
                            leftSection={<IconRefresh size={13} />}
                            onClick={() => router.reload()}
                        >
                            Refresh
                        </Button>
                    </Flex>

                    <Table highlightOnHover highlightOnHoverColor={ROW_HOVER} style={{ color: '#e4e4e7' }}>
                        <Table.Thead>
                            <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                {['STATUS', 'SITE', 'BACKEND', 'PROTECTION', 'TRAFFIC', 'UPTIME', ''].map(h => (
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
                            {sites.map(site => {
                                const stats = liveStats[site.id] || site;
                                return (
                                    <Table.Tr
                                        key={site.id}
                                        style={{ borderBottom: `1px solid ${BORDER}`, cursor: 'default' }}
                                    >
                                        <Table.Td style={{ padding: '12px 16px' }}>
                                            <Group gap={8}>
                                                <Box
                                                    style={{
                                                        width: 8, height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: site.is_online ? '#22c55e' : '#ef4444',
                                                        boxShadow: site.is_online
                                                            ? '0 0 6px rgba(34,197,94,0.7)'
                                                            : '0 0 6px rgba(239,68,68,0.7)',
                                                    }}
                                                />
                                                <Text size="xs" fw={600} c={site.is_online ? 'green' : 'red'}>
                                                    {site.is_online ? 'ONLINE' : 'OFFLINE'}
                                                </Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '12px 16px' }}>
                                            <Text fw={600} size="sm" c="white">{site.name}</Text>
                                            <Text size="xs" c="dimmed">{site.domain}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '12px 16px' }}>
                                            <Badge variant="outline" color="gray" size="xs">
                                                {site.backend_type === 'php_fpm' ? 'PHP-FPM' : 'HTTP'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '12px 16px' }}>
                                            <Group gap={4}>
                                                {site.ssl_enabled && <Badge color="green" size="xs">SSL</Badge>}
                                                {site.waf_enabled && (
                                                    <Badge
                                                        size="xs"
                                                        style={{
                                                            backgroundColor: ACCENT_DIM,
                                                            color: ACCENT,
                                                            border: `1px solid rgba(243,128,32,0.3)`,
                                                        }}
                                                    >
                                                        WAF
                                                    </Badge>
                                                )}
                                                {site.auth_user && <Badge color="blue" size="xs">AUTH</Badge>}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '12px 16px' }}>
                                            <Group gap={4}>
                                                <Text size="sm" c="white">
                                                    {(stats.total_requests || 0).toLocaleString()}
                                                </Text>
                                                {liveStats[site.id] && (
                                                    <Badge size="xs" style={{ backgroundColor: ACCENT_DIM, color: ACCENT }}>
                                                        LIVE
                                                    </Badge>
                                                )}
                                            </Group>
                                            <Text size="xs" c="red">{(stats.blocked_requests || 0).toLocaleString()} blocked</Text>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '12px 16px' }}>
                                            <Text
                                                size="sm"
                                                fw={600}
                                                c={site.uptime_percentage > 9900 ? 'green' : 'orange'}
                                            >
                                                {(site.uptime_percentage / 100).toFixed(1)}%
                                            </Text>
                                            <Progress
                                                value={site.uptime_percentage / 100}
                                                size="xs"
                                                color={site.uptime_percentage > 9900 ? 'green' : 'orange'}
                                                w={50}
                                                mt={4}
                                                radius="xl"
                                            />
                                        </Table.Td>
                                        <Table.Td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <Group gap={4} justify="flex-end">
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    color="gray"
                                                    onClick={() => router.post(route('sites.check-health', site.id), {}, { preserveScroll: true })}
                                                >
                                                    <IconRefresh size={13} />
                                                </ActionIcon>
                                                <Button
                                                    component={Link}
                                                    href={route('sites.show', site.id)}
                                                    size="xs"
                                                    variant="subtle"
                                                    color="orange"
                                                >
                                                    Manage
                                                </Button>
                                                <Menu shadow="md" width={160} position="bottom-end">
                                                    <Menu.Target>
                                                        <ActionIcon size="sm" variant="subtle" color="gray">
                                                            <IconDots size={13} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown style={{ backgroundColor: '#18181b', border: `1px solid ${BORDER}` }}>
                                                        <Menu.Item
                                                            leftSection={<IconBolt size={13} />}
                                                            component={Link}
                                                            href={route('sites.show', site.id)}
                                                            style={{ color: '#a1a1aa' }}
                                                        >
                                                            View Logs
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconSettings size={13} />}
                                                            component={Link}
                                                            href={route('sites.show', site.id)}
                                                            style={{ color: '#a1a1aa' }}
                                                        >
                                                            Edit Config
                                                        </Menu.Item>
                                                        <Menu.Divider style={{ borderColor: BORDER }} />
                                                        <Menu.Item
                                                            leftSection={<IconTrash size={13} />}
                                                            color="red"
                                                            onClick={() => setDeleteSite(site)}
                                                        >
                                                            Delete
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                            {sites.length === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: '#52525b' }}>
                                        No proxy sites configured yet.
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Paper>

                <Modal
                    opened={opened}
                    onClose={close}
                    title={<Text fw={600} c="white">Add New Proxy Site</Text>}
                    size="lg"
                    styles={{
                        content: { backgroundColor: '#111113', border: `1px solid ${BORDER}` },
                        header: { backgroundColor: '#111113', borderBottom: `1px solid ${BORDER}` },
                    }}
                >
                    <form onSubmit={submit}>
                        <Stack gap={16} pt={8}>
                            <TextInput
                                label="Site Name"
                                placeholder="My Application"
                                required
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                styles={{
                                    label: { color: '#71717a', fontSize: 12 },
                                    input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
                                }}
                            />
                            <TextInput
                                label="Domain"
                                placeholder="app.example.com"
                                required
                                value={data.domain}
                                onChange={e => setData('domain', e.target.value)}
                                styles={{
                                    label: { color: '#71717a', fontSize: 12 },
                                    input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
                                }}
                            />
                            <TextInput
                                label="Backend URL"
                                placeholder="http://localhost:8000"
                                required
                                value={data.backend_url}
                                onChange={e => setData('backend_url', e.target.value)}
                                styles={{
                                    label: { color: '#71717a', fontSize: 12 },
                                    input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
                                }}
                            />
                            <Select
                                label="Backend Type"
                                value={data.backend_type}
                                onChange={v => setData('backend_type', v)}
                                data={[
                                    { value: 'proxy', label: 'Reverse Proxy (HTTP)' },
                                    { value: 'php_fpm', label: 'PHP-FPM (FastCGI)' },
                                ]}
                                styles={{
                                    label: { color: '#71717a', fontSize: 12 },
                                    input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
                                }}
                            />
                            <Group grow>
                                <Switch
                                    label="SSL Enabled"
                                    checked={data.ssl_enabled}
                                    onChange={e => setData('ssl_enabled', e.currentTarget.checked)}
                                    color="orange"
                                />
                                <Switch
                                    label="WAF Enabled"
                                    checked={data.waf_enabled}
                                    onChange={e => setData('waf_enabled', e.currentTarget.checked)}
                                    color="orange"
                                />
                            </Group>
                            <Divider color={BORDER} />
                            <Group justify="flex-end">
                                <Button variant="subtle" color="gray" onClick={close}>Cancel</Button>
                                <Button
                                    type="submit"
                                    leftSection={<IconPlus size={15} />}
                                    style={{ backgroundColor: ACCENT }}
                                >
                                    Add Site
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Modal>
            </EnterpriseLayout>

            <ConfirmModal
                opened={!!deleteSite}
                onClose={() => setDeleteSite(null)}
                onConfirm={() => router.delete(route('sites.destroy', deleteSite.id), { onSuccess: () => setDeleteSite(null) })}
                title={`Delete "${deleteSite?.name}"?`}
                description="This will permanently remove the site and all its configuration from ProxyPanther."
                confirmWord={deleteSite?.name}
            />

            <PolicyOptimizerModal
                opened={policyOptimizerOpened}
                onClose={closePolicyOptimizer}
            />
        </>
    );
}
