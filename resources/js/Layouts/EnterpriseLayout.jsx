import React, { useEffect } from 'react';
import {
    AppShell, Group, Text, Box, NavLink, Avatar,
    Menu, ActionIcon, Indicator, Divider, Stack,
    Badge, Tooltip, UnstyledButton, Flex,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconLayoutDashboard, IconShield, IconLogout, IconUsers,
    IconLock, IconTrendingUp, IconMenu2, IconSettings,
    IconSearch, IconChevronDown, IconGlobe,
    IconChartBar, IconFileText, IconBolt, IconCircleCheck,
} from '@tabler/icons-react';
import { Link as InertiaLink, router, usePage } from '@inertiajs/react';
import GlobalSearch from '@/Components/GlobalSearch';
import NotificationDropdown from '@/Components/NotificationDropdown';

const NAV_ITEMS = [
    { name: 'Dashboard', icon: IconLayoutDashboard, route: 'dashboard' },
    { name: 'Proxy Sites', icon: IconGlobe, route: 'dashboard', params: { view: 'sites' } },
    { name: 'Security Logs', icon: IconFileText, route: 'logs.index' },
    { name: 'IP Blacklist', icon: IconShield, route: 'banned-ips.index' },
    { name: 'SSL Certificates', icon: IconLock, route: 'ssl.index' },
    { name: 'Uptime & SLA', icon: IconTrendingUp, route: 'uptime.index' },
    { name: 'Analytics', icon: IconChartBar, route: 'analytics.index' },
    { name: 'Teams', icon: IconUsers, route: 'teams.index' },
];

const ACCENT = '#f38020';
const SIDEBAR_BG = '#0d0d0f';
const TOPBAR_BG = '#0d0d0f';
const CONTENT_BG = '#0a0a0b';
const BORDER = 'rgba(255,255,255,0.07)';
const HOVER_BG = 'rgba(255,255,255,0.04)';
const ACTIVE_BG = 'rgba(243,128,32,0.1)';

function NavItem({ item }) {
    const currentView = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('view')
        : null;
    const itemView = item.params?.view;
    const isActive = route().current(item.route) &&
        (itemView === currentView || (!itemView && !currentView));

    return (
        <Tooltip label={item.name} position="right" withArrow disabled>
            <UnstyledButton
                component={InertiaLink}
                href={route(item.route, item.params || {})}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: isActive ? ACTIVE_BG : 'transparent',
                    color: isActive ? ACCENT : '#71717a',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 13,
                    transition: 'all 0.15s',
                    position: 'relative',
                    textDecoration: 'none',
                    borderLeft: isActive ? `3px solid ${ACCENT}` : '3px solid transparent',
                }}
                onMouseEnter={e => {
                    if (!isActive) {
                        e.currentTarget.style.backgroundColor = HOVER_BG;
                        e.currentTarget.style.color = '#e4e4e7';
                    }
                }}
                onMouseLeave={e => {
                    if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#71717a';
                    }
                }}
            >
                <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.name}</span>
            </UnstyledButton>
        </Tooltip>
    );
}

export default function EnterpriseLayout({ children, user }) {
    const { props } = usePage();
    const unreadNotifications = props.unreadNotifications ?? 0;
    const [opened, { toggle }] = useDisclosure();
    const [searchOpened, { open: openSearch, close: closeSearch }] = useDisclosure(false);

    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <>
            <AppShell
                navbar={{ width: 240, breakpoint: 'md', collapsed: { mobile: !opened } }}
                header={{ height: 60 }}
                styles={{
                    root: { backgroundColor: CONTENT_BG },
                    navbar: {
                        backgroundColor: SIDEBAR_BG,
                        borderRight: `1px solid ${BORDER}`,
                    },
                    header: {
                        backgroundColor: TOPBAR_BG,
                        borderBottom: `1px solid ${BORDER}`,
                    },
                    main: {
                        backgroundColor: CONTENT_BG,
                        minHeight: '100vh',
                    },
                }}
            >
                <AppShell.Header>
                    <Flex h="100%" px={20} align="center" justify="space-between">
                        <Group gap={12}>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                hiddenFrom="md"
                                onClick={toggle}
                                size="md"
                            >
                                <IconMenu2 size={18} />
                            </ActionIcon>

                            <Box
                                visibleFrom="md"
                                onClick={openSearch}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    backgroundColor: '#18181b',
                                    border: `1px solid ${BORDER}`,
                                    padding: '6px 14px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    minWidth: 280,
                                }}
                            >
                                <IconSearch size={14} color="#52525b" />
                                <Text size="sm" c="dimmed">Search sites, logs, IPs...</Text>
                                <Box
                                    ml="auto"
                                    style={{
                                        padding: '1px 6px',
                                        backgroundColor: '#27272a',
                                        borderRadius: 4,
                                        fontSize: 10,
                                        color: '#52525b',
                                    }}
                                >
                                    ⌘K
                                </Box>
                            </Box>
                        </Group>

                        <Group gap={8}>
                            <NotificationDropdown
                                initialUnread={unreadNotifications}
                                userId={user?.id}
                            />

                            <Divider orientation="vertical" color={BORDER} />

                            <Menu shadow="md" width={180} position="bottom-end">
                                <Menu.Target>
                                    <UnstyledButton>
                                        <Group gap={8} style={{ cursor: 'pointer' }}>
                                            <Avatar
                                                size={30}
                                                radius="md"
                                                color="orange"
                                                style={{ backgroundColor: ACCENT }}
                                            >
                                                {user?.name?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                            <Box visibleFrom="md">
                                                <Text size="sm" fw={500} c="white" lh={1.2}>
                                                    {user?.name}
                                                </Text>
                                                <Text size="xs" c="dimmed" lh={1.2}>Administrator</Text>
                                            </Box>
                                            <IconChevronDown size={13} color="#52525b" />
                                        </Group>
                                    </UnstyledButton>
                                </Menu.Target>
                                <Menu.Dropdown
                                    style={{
                                        backgroundColor: '#18181b',
                                        border: `1px solid ${BORDER}`,
                                    }}
                                >
                                    <Menu.Item
                                        leftSection={<IconSettings size={14} />}
                                        style={{ color: '#a1a1aa' }}
                                        component={InertiaLink}
                                        href={route('settings.index')}
                                    >
                                        Settings
                                    </Menu.Item>
                                    <Menu.Item
                                        leftSection={<IconUsers size={14} />}
                                        style={{ color: '#a1a1aa' }}
                                        component={InertiaLink}
                                        href={route('teams.index')}
                                    >
                                        Teams
                                    </Menu.Item>
                                    <Menu.Divider style={{ borderColor: BORDER }} />
                                    <Menu.Item
                                        leftSection={<IconLogout size={14} />}
                                        color="red"
                                        onClick={() => router.post(route('logout'))}
                                    >
                                        Logout
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    </Flex>
                </AppShell.Header>

                <AppShell.Navbar p={0}>
                    <Box p={16} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <Group gap={10}>
                            <Box
                                style={{
                                    width: 32, height: 32,
                                    backgroundColor: ACCENT,
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 0 16px rgba(243,128,32,0.3)`,
                                }}
                            >
                                <IconBolt size={18} color="white" />
                            </Box>
                            <Box>
                                <Text size="sm" fw={700} c="white" lh={1.2}>ProxyPanther</Text>
                                <Text size="10px" c="dimmed" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                    Enterprise
                                </Text>
                            </Box>
                        </Group>
                    </Box>

                    <Box p={8} style={{ flex: 1, overflowY: 'auto' }}>
                        <Text
                            size="10px"
                            c="dimmed"
                            fw={600}
                            style={{ letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 12px 6px' }}
                        >
                            Navigation
                        </Text>
                        <Stack gap={2}>
                            {NAV_ITEMS.map(item => (
                                <NavItem key={item.name} item={item} />
                            ))}
                        </Stack>
                    </Box>

                    <Box p={12} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <Box
                            style={{
                                padding: '10px 12px',
                                borderRadius: 8,
                                backgroundColor: '#18181b',
                                border: `1px solid ${BORDER}`,
                            }}
                        >
                            <Group gap={8}>
                                <Box
                                    style={{
                                        width: 8, height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: '#22c55e',
                                        boxShadow: '0 0 6px rgba(34,197,94,0.8)',
                                        flexShrink: 0,
                                    }}
                                />
                                <Box>
                                    <Text size="10px" c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        System Status
                                    </Text>
                                    <Text size="xs" c="white" fw={500}>All Systems Operational</Text>
                                </Box>
                            </Group>
                        </Box>
                    </Box>
                </AppShell.Navbar>

                <AppShell.Main>
                    <Box p={32}>
                        {children}
                    </Box>
                </AppShell.Main>
            </AppShell>

            <GlobalSearch opened={searchOpened} onClose={closeSearch} />
        </>
    );
}
