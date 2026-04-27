import React, { useState, useEffect, useCallback } from 'react';
import {
    Popover, ActionIcon, Indicator, Stack, Text, Box,
    Group, Button, ScrollArea, Divider, Badge, UnstyledButton,
} from '@mantine/core';
import {
    IconBell, IconCheck, IconChecks, IconShield,
    IconServer, IconAlertTriangle, IconInfoCircle,
} from '@tabler/icons-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

const CARD_BG = '#111113';
const BORDER = 'rgba(255,255,255,0.07)';
const ACCENT = '#f38020';

const ICON_MAP = {
    shield: { icon: IconShield, color: '#f03e3e' },
    server: { icon: IconServer, color: '#f38020' },
    warning: { icon: IconAlertTriangle, color: '#f59f00' },
    check: { icon: IconCheck, color: '#2f9e44' },
    bell: { icon: IconBell, color: '#1971c2' },
    info: { icon: IconInfoCircle, color: '#1971c2' },
};

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationDropdown({ initialUnread = 0, userId }) {
    const [opened, setOpened] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(initialUnread);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('notifications.index'));
            setNotifications(data);
            setUnread(data.filter(n => !n.read_at).length);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!userId || !window.Echo) return;

        const channel = window.Echo.private(`notifications.${userId}`);
        channel.listen('.notification.sent', (data) => {
            setNotifications(prev => [data, ...prev]);
            setUnread(prev => prev + 1);
        });

        return () => {
            window.Echo.leave(`notifications.${userId}`);
        };
    }, [userId]);

    useEffect(() => {
        if (opened) fetchNotifications();
    }, [opened]);

    const markRead = async (notification) => {
        if (notification.read_at) {
            if (notification.link) router.visit(notification.link);
            return;
        }
        await axios.post(route('notifications.read', notification.id));
        setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)
        );
        setUnread(prev => Math.max(0, prev - 1));
        if (notification.link) router.visit(notification.link);
    };

    const markAllRead = async () => {
        await axios.post(route('notifications.read-all'));
        setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        setUnread(0);
    };

    return (
        <Popover
            opened={opened}
            onChange={setOpened}
            position="bottom-end"
            width={360}
            shadow="xl"
            offset={8}
        >
            <Popover.Target>
                <Indicator
                    color="orange"
                    size={unread > 0 ? 8 : 0}
                    offset={4}
                    processing={unread > 0}
                >
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="md"
                        onClick={() => setOpened(o => !o)}
                    >
                        <IconBell size={17} />
                    </ActionIcon>
                </Indicator>
            </Popover.Target>

            <Popover.Dropdown
                p={0}
                style={{
                    backgroundColor: CARD_BG,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                }}
            >
                <Group justify="space-between" px={16} py={12} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <Group gap={8}>
                        <Text fw={600} size="sm" c="white">Notifications</Text>
                        {unread > 0 && (
                            <Badge size="xs" color="orange" variant="filled">{unread}</Badge>
                        )}
                    </Group>
                    {unread > 0 && (
                        <Button
                            size="xs"
                            variant="subtle"
                            color="gray"
                            leftSection={<IconChecks size={13} />}
                            onClick={markAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </Group>

                <ScrollArea h={380} scrollbarSize={4}>
                    {loading && (
                        <Text c="dimmed" size="xs" ta="center" py={40}>Loading...</Text>
                    )}
                    {!loading && notifications.length === 0 && (
                        <Stack align="center" gap={8} py={48}>
                            <IconBell size={28} color="#3f3f46" />
                            <Text c="dimmed" size="xs">No notifications yet</Text>
                        </Stack>
                    )}
                    {!loading && notifications.map((n, i) => {
                        const def = ICON_MAP[n.icon] || ICON_MAP.bell;
                        const Icon = def.icon;
                        const isUnread = !n.read_at;

                        return (
                            <React.Fragment key={n.id}>
                                <UnstyledButton
                                    w="100%"
                                    onClick={() => markRead(n)}
                                    style={{
                                        display: 'block',
                                        padding: '12px 16px',
                                        backgroundColor: isUnread ? 'rgba(243,128,32,0.04)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = isUnread ? 'rgba(243,128,32,0.04)' : 'transparent'}
                                >
                                    <Group gap={12} align="flex-start" wrap="nowrap">
                                        <Box
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                backgroundColor: def.color + '22',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Icon size={15} color={def.color} />
                                        </Box>
                                        <Box style={{ flex: 1, minWidth: 0 }}>
                                            <Group justify="space-between" gap={4} wrap="nowrap">
                                                <Text
                                                    size="xs"
                                                    fw={isUnread ? 600 : 400}
                                                    c={isUnread ? 'white' : '#a1a1aa'}
                                                    style={{ lineHeight: 1.4 }}
                                                    lineClamp={1}
                                                >
                                                    {n.title}
                                                </Text>
                                                {isUnread && (
                                                    <Box
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: '50%',
                                                            backgroundColor: ACCENT,
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                )}
                                            </Group>
                                            {n.body && (
                                                <Text size="xs" c="dimmed" mt={2} lineClamp={2} style={{ lineHeight: 1.4 }}>
                                                    {n.body}
                                                </Text>
                                            )}
                                            <Text size="10px" c="#52525b" mt={4}>
                                                {timeAgo(n.created_at)}
                                            </Text>
                                        </Box>
                                    </Group>
                                </UnstyledButton>
                                {i < notifications.length - 1 && <Divider color={BORDER} />}
                            </React.Fragment>
                        );
                    })}
                </ScrollArea>
            </Popover.Dropdown>
        </Popover>
    );
}
