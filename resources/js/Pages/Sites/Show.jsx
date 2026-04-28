import React, { useState, useCallback } from 'react';
import {
    Box, Text, Button, Badge, Group, Stack, Flex, Paper,
    Tabs, TextInput, Switch, Select, Textarea, SimpleGrid,
    Table, ActionIcon, Modal, NumberInput, Title, Divider,
    Code, Tooltip, Progress, ThemeIcon, Anchor,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconGlobe, IconShield, IconSettings, IconChartBar,
    IconFileText, IconPalette, IconHistory, IconRefresh,
    IconTrash, IconPlus, IconCheck, IconX, IconAlertTriangle,
    IconLock, IconBolt, IconServer, IconArrowRight,
    IconEdit, IconCopy, IconDownload, IconUpload, IconEye,
    IconEyeOff, IconRotateClockwise, IconBan, IconCircleCheck,
    IconWifi, IconCpu, IconDatabase, IconKey, IconCode,
    IconMap, IconFilter, IconArrowsExchange, IconBug,
    IconCloudUpload, IconNetwork, IconShieldCheck, IconRocket,
    IconActivity, IconClock, IconUser, IconTag,
} from '@tabler/icons-react';
import { Head, useForm, router } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import ConfirmModal from '@/Components/ConfirmModal';

const CARD_BG = '#111113';
const BORDER = 'rgba(255,255,255,0.07)';
const ACCENT = '#f38020';
const ACCENT_DIM = 'rgba(243,128,32,0.1)';
const INPUT_STYLES = {
    label: { color: '#71717a', fontSize: 12, marginBottom: 4 },
    input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
    description: { color: '#52525b', fontSize: 11 },
};
const SECTION_LABEL = {
    fontSize: 10,
    color: '#52525b',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 12,
};

function SectionCard({ title, description, children, action }) {
    return (
        <Paper p="xl" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }} mb={16}>
            <Flex justify="space-between" align="flex-start" mb={20}>
                <Box>
                    <Text fw={600} c="white" size="sm">{title}</Text>
                    {description && <Text size="xs" c="dimmed" mt={2}>{description}</Text>}
                </Box>
                {action}
            </Flex>
            {children}
        </Paper>
    );
}

function StatusDot({ online }) {
    return (
        <Box
            style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                backgroundColor: online ? '#22c55e' : '#ef4444',
                boxShadow: online ? '0 0 6px rgba(34,197,94,0.7)' : '0 0 6px rgba(239,68,68,0.7)',
            }}
        />
    );
}

function ToggleRow({ label, description, checked, onChange, disabled }) {
    return (
        <Flex justify="space-between" align="center" py={12} style={{ borderBottom: `1px solid ${BORDER}` }}>
            <Box>
                <Text size="sm" c="white" fw={500}>{label}</Text>
                {description && <Text size="xs" c="dimmed" mt={2}>{description}</Text>}
            </Box>
            <Switch
                checked={!!checked}
                onChange={e => onChange(e.currentTarget.checked)}
                color="orange"
                disabled={disabled}
            />
        </Flex>
    );
}

function KeyValueEditor({ label, description, value, onChange, keyPlaceholder = 'KEY', valuePlaceholder = 'value' }) {
    const pairs = Array.isArray(value) ? value : (value ? Object.entries(value).map(([k, v]) => ({ key: k, value: v })) : []);

    const addRow = () => onChange([...pairs, { key: '', value: '' }]);
    const removeRow = (i) => onChange(pairs.filter((_, idx) => idx !== i));
    const updateRow = (i, field, val) => {
        const updated = pairs.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
        onChange(updated);
    };

    return (
        <Box>
            <Text style={SECTION_LABEL}>{label}</Text>
            {description && <Text size="xs" c="dimmed" mb={8}>{description}</Text>}
            <Stack gap={6}>
                {pairs.map((pair, i) => (
                    <Group key={i} gap={8}>
                        <TextInput
                            placeholder={keyPlaceholder}
                            value={pair.key || ''}
                            onChange={e => updateRow(i, 'key', e.target.value)}
                            style={{ flex: 1 }}
                            styles={INPUT_STYLES}
                        />
                        <TextInput
                            placeholder={valuePlaceholder}
                            value={pair.value || ''}
                            onChange={e => updateRow(i, 'value', e.target.value)}
                            style={{ flex: 2 }}
                            styles={INPUT_STYLES}
                        />
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => removeRow(i)}
                        >
                            <IconX size={13} />
                        </ActionIcon>
                    </Group>
                ))}
            </Stack>
            <Button
                size="xs"
                variant="subtle"
                color="orange"
                leftSection={<IconPlus size={12} />}
                mt={8}
                onClick={addRow}
            >
                Add Row
            </Button>
        </Box>
    );
}

function IpListEditor({ label, description, value, onChange }) {
    const list = Array.isArray(value) ? value.join('\n') : (value || '');
    return (
        <Box>
            <Textarea
                label={label}
                description={description}
                placeholder="One IP or CIDR per line&#10;192.168.1.0/24&#10;10.0.0.1"
                value={list}
                onChange={e => onChange(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                minRows={4}
                styles={INPUT_STYLES}
                autosize
            />
        </Box>
    );
}

function WafRuleRow({ rule, onRemove }) {
    return (
        <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            <Table.Td style={{ padding: '10px 12px' }}>
                <Badge size="xs" variant="outline" color="gray">{rule.type}</Badge>
            </Table.Td>
            <Table.Td style={{ padding: '10px 12px' }}>
                <Code style={{ backgroundColor: '#0a0a0b', color: '#a1a1aa', fontSize: 11 }}>{rule.pattern}</Code>
            </Table.Td>
            <Table.Td style={{ padding: '10px 12px' }}>
                {rule.header_name && (
                    <Text size="xs" c="dimmed">{rule.header_name}</Text>
                )}
            </Table.Td>
            <Table.Td style={{ padding: '10px 12px' }}>
                <Badge size="xs" color={rule.action === 'block' ? 'red' : 'yellow'}>{rule.action}</Badge>
            </Table.Td>
            <Table.Td style={{ padding: '10px 12px', textAlign: 'right' }}>
                <ActionIcon size="sm" variant="subtle" color="red" onClick={onRemove}>
                    <IconTrash size={12} />
                </ActionIcon>
            </Table.Td>
        </Table.Tr>
    );
}

function PageRuleRow({ rule, siteId, onDelete }) {
    return (
        <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            <Table.Td style={{ padding: '10px 12px' }}>
                <Code style={{ backgroundColor: '#0a0a0b', color: '#e4e4e7', fontSize: 11 }}>{rule.path}</Code>
            </Table.Td>
            <Table.Td style={{ padding: '10px 12px' }}>
                <Badge
                    size="xs"
                    color={rule.type === 'redirect' ? 'blue' : rule.type === 'rewrite' ? 'violet' : 'teal'}
                >
                    {rule.type}
                </Badge>
            </Table.Td>
            <Table.Td style={{ padding: '10px 12px' }}>
                <Text size="xs" c="dimmed" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rule.value}
                </Text>
            </Table.Td>
            <Table.Td style={{ padding: '10px 12px' }}>
                <Badge size="xs" color={rule.is_active ? 'green' : 'gray'}>{rule.is_active ? 'Active' : 'Inactive'}</Badge>
            </Table.Td>
            <Table.Td style={{ padding: '10px 12px', textAlign: 'right' }}>
                <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => {
                        if (confirm('Delete this page rule?')) {
                            router.delete(route('sites.page-rules.destroy', { site: siteId, rule: rule.id }), {
                                preserveScroll: true,
                            });
                        }
                    }}
                >
                    <IconTrash size={12} />
                </ActionIcon>
            </Table.Td>
        </Table.Tr>
    );
}

function AuditRow({ audit, siteId }) {
    const [expanded, setExpanded] = useState(false);
    const actionColor = { create: 'green', update: 'blue', toggle: 'yellow', rollback: 'orange', delete: 'red' };

    return (
        <>
            <Table.Tr style={{ borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
                <Table.Td style={{ padding: '10px 12px' }}>
                    <Badge size="xs" color={actionColor[audit.action] || 'gray'}>{audit.action}</Badge>
                </Table.Td>
                <Table.Td style={{ padding: '10px 12px' }}>
                    <Text size="xs" c="white">{audit.user?.name || 'System'}</Text>
                </Table.Td>
                <Table.Td style={{ padding: '10px 12px' }}>
                    <Text size="xs" c="dimmed">{new Date(audit.created_at).toLocaleString()}</Text>
                </Table.Td>
                <Table.Td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <Group gap={4} justify="flex-end">
                        {audit.before_state && (
                            <Button
                                size="xs"
                                variant="subtle"
                                color="orange"
                                leftSection={<IconRotateClockwise size={12} />}
                                onClick={e => {
                                    e.stopPropagation();
                                    if (confirm('Roll back to this configuration?')) {
                                        router.post(route('sites.audits.rollback', { site: siteId, audit: audit.id }), {}, { preserveScroll: true });
                                    }
                                }}
                            >
                                Rollback
                            </Button>
                        )}
                        <ActionIcon size="sm" variant="subtle" color="gray">
                            {expanded ? <IconX size={12} /> : <IconEye size={12} />}
                        </ActionIcon>
                    </Group>
                </Table.Td>
            </Table.Tr>
            {expanded && (
                <Table.Tr style={{ backgroundColor: '#0a0a0b' }}>
                    <Table.Td colSpan={4} style={{ padding: '12px 16px' }}>
                        <SimpleGrid cols={2} spacing={12}>
                            {audit.before_state && (
                                <Box>
                                    <Text style={SECTION_LABEL}>Before</Text>
                                    <Code block style={{ backgroundColor: '#111113', color: '#a1a1aa', fontSize: 11, maxHeight: 200, overflow: 'auto' }}>
                                        {JSON.stringify(audit.before_state, null, 2)}
                                    </Code>
                                </Box>
                            )}
                            {audit.after_state && (
                                <Box>
                                    <Text style={SECTION_LABEL}>After</Text>
                                    <Code block style={{ backgroundColor: '#111113', color: '#e4e4e7', fontSize: 11, maxHeight: 200, overflow: 'auto' }}>
                                        {JSON.stringify(audit.after_state, null, 2)}
                                    </Code>
                                </Box>
                            )}
                        </SimpleGrid>
                    </Table.Td>
                </Table.Tr>
            )}
        </>
    );
}

export default function Show({ auth, site, analytics, bandwidth, wafPresets, errorTemplates, healthLogs, sslCertificates }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [showPassword, setShowPassword] = useState(false);
    const [wafModalOpen, { open: openWafModal, close: closeWafModal }] = useDisclosure(false);
    const [pageRuleModalOpen, { open: openPageRuleModal, close: closePageRuleModal }] = useDisclosure(false);
    const [newWafRule, setNewWafRule] = useState({ type: 'path', pattern: '', action: 'block', header_name: '' });
    const [confirmState, setConfirmState] = useState({ opened: false, type: null, target: null });

    const openConfirm = (type, target) => setConfirmState({ opened: true, type, target });
    const closeConfirm = () => setConfirmState({ opened: false, type: null, target: null });

    const handleConfirm = () => {
        const { type, target } = confirmState;
        if (type === 'delete_rule') {
            router.delete(route('sites.page-rules.destroy', { site: site.id, rule: target.id }), {
                preserveScroll: true,
                onSuccess: closeConfirm,
            });
        } else if (type === 'rollback') {
            router.post(route('sites.audits.rollback', { site: site.id, audit: target.id }), {}, {
                preserveScroll: true,
                onSuccess: closeConfirm,
            });
        }
    };

    const { data, setData, post: postForm, processing } = useForm({
        name: site.name || '',
        domain: site.domain || '',
        backend_url: site.backend_url || '',
        backup_backend_url: site.backup_backend_url || '',
        backend_type: site.backend_type || 'proxy',
        root_path: site.root_path || '',
        ssl_enabled: !!site.ssl_enabled,
        waf_enabled: !!site.waf_enabled,
        rate_limit_rps: site.rate_limit_rps || 100,
        auth_user: site.auth_user || '',
        auth_password: site.auth_password || '',
        protect_sensitive_files: !!site.protect_sensitive_files,
        notification_webhook_url: site.notification_webhook_url || '',
        cache_enabled: !!site.cache_enabled,
        cache_ttl: site.cache_ttl || 3600,
        is_maintenance: !!site.is_maintenance,
        maintenance_message: site.maintenance_message || '',
        custom_waf_rules: site.custom_waf_rules || [],
        env_vars: site.env_vars || [],
        custom_error_403: site.custom_error_403 || '',
        custom_error_503: site.custom_error_503 || '',
        ip_allowlist: site.ip_allowlist || [],
        ip_denylist: site.ip_denylist || [],
        block_common_bad_bots: !!site.block_common_bad_bots,
        bot_challenge_mode: !!site.bot_challenge_mode,
        bot_fight_mode: !!site.bot_fight_mode,
        under_attack_mode: !!site.under_attack_mode,
        brotli_enabled: !!site.brotli_enabled,
        hsts_enabled: !!site.hsts_enabled,
        performance_level: site.performance_level || 'balanced',
        circuit_breaker_enabled: !!site.circuit_breaker_enabled,
        circuit_breaker_threshold: site.circuit_breaker_threshold || 5,
        circuit_breaker_retry_seconds: site.circuit_breaker_retry_seconds || 30,
        geoip_enabled: !!site.geoip_enabled,
        geoip_allowlist: site.geoip_allowlist || [],
        geoip_denylist: site.geoip_denylist || [],
        header_rules: site.header_rules || [],
        redirect_rules: site.redirect_rules || [],
        rate_limit_burst: site.rate_limit_burst || 0,
        rate_limit_action: site.rate_limit_action || 'block',
        bot_challenge_force: !!site.bot_challenge_force,
        route_policies: site.route_policies || [],
    });

    const pageRuleForm = useForm({
        path: '',
        type: 'redirect',
        value: '',
    });

    const save = useCallback(() => {
        postForm(route('sites.update', site.id), {
            preserveScroll: true,
            onSuccess: () => notifications.show({
                title: 'Configuration saved',
                message: 'Caddy has been reloaded with the new settings.',
                color: 'orange',
                icon: <IconCheck size={16} />,
            }),
            onError: () => notifications.show({
                title: 'Save failed',
                message: 'Please check the form for errors.',
                color: 'red',
                icon: <IconX size={16} />,
            }),
        });
    }, [data]);

    const applyPreset = (presetKey) => {
        router.post(route('sites.apply-preset', { site: site.id, preset: presetKey }), {}, {
            preserveScroll: true,
            onSuccess: () => notifications.show({
                title: 'Preset applied',
                message: `${wafPresets[presetKey]?.name} rules have been merged.`,
                color: 'orange',
                icon: <IconShieldCheck size={16} />,
            }),
        });
    };

    const applyErrorTemplate = (templateKey, code) => {
        router.post(route('sites.apply-error-template', site.id), { template: templateKey, code }, {
            preserveScroll: true,
            onSuccess: () => notifications.show({
                title: 'Template applied',
                message: `Error ${code} page updated.`,
                color: 'orange',
                icon: <IconCheck size={16} />,
            }),
        });
    };

    const addWafRule = () => {
        if (!newWafRule.pattern) return;
        setData('custom_waf_rules', [...(data.custom_waf_rules || []), { ...newWafRule }]);
        setNewWafRule({ type: 'path', pattern: '', action: 'block', header_name: '' });
        closeWafModal();
    };

    const removeWafRule = (i) => {
        setData('custom_waf_rules', data.custom_waf_rules.filter((_, idx) => idx !== i));
    };

    const submitPageRule = (e) => {
        e.preventDefault();
        pageRuleForm.post(route('sites.page-rules.store', site.id), {
            preserveScroll: true,
            onSuccess: () => {
                pageRuleForm.reset();
                closePageRuleModal();
                notifications.show({ title: 'Page rule added', color: 'orange', icon: <IconCheck size={16} /> });
            },
        });
    };

    const analyticsOptions = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1a1a1a',
            borderColor: ACCENT,
            textStyle: { color: '#e5e5e5', fontSize: 12 },
        },
        legend: {
            data: ['Requests', 'Blocked'],
            textStyle: { color: '#71717a', fontSize: 11 },
            top: 0,
        },
        grid: { left: 40, right: 20, top: 36, bottom: 30 },
        xAxis: {
            type: 'category',
            data: analytics.map(d => d.date),
            axisLine: { lineStyle: { color: BORDER } },
            axisLabel: { color: '#52525b', fontSize: 10 },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: BORDER } },
            axisLabel: { color: '#52525b', fontSize: 10 },
        },
        series: [
            {
                name: 'Requests',
                type: 'line',
                data: analytics.map(d => d.total),
                smooth: true,
                lineStyle: { color: ACCENT, width: 2 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(243,128,32,0.3)' },
                        { offset: 1, color: 'rgba(243,128,32,0.02)' },
                    ])
                },
                symbol: 'none',
            },
            {
                name: 'Blocked',
                type: 'line',
                data: analytics.map(d => d.blocked),
                smooth: true,
                lineStyle: { color: '#ef4444', width: 2 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(239,68,68,0.2)' },
                        { offset: 1, color: 'rgba(239,68,68,0.02)' },
                    ])
                },
                symbol: 'none',
            },
        ],
    };

    const bandwidthOptions = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1a1a1a',
            borderColor: ACCENT,
            textStyle: { color: '#e5e5e5', fontSize: 12 },
        },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: bandwidth.map(d => d.date),
            axisLine: { lineStyle: { color: BORDER } },
            axisLabel: { color: '#52525b', fontSize: 10 },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: BORDER } },
            axisLabel: { color: '#52525b', fontSize: 10 },
        },
        series: [{
            name: 'Requests',
            type: 'bar',
            data: bandwidth.map(d => d.requests),
            itemStyle: { color: ACCENT, borderRadius: [3, 3, 0, 0] },
            barMaxWidth: 24,
        }],
    };

    const healthStatusOptions = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1a1a1a',
            borderColor: BORDER,
            textStyle: { color: '#e5e5e5', fontSize: 12 },
        },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: healthLogs.map(l => new Date(l.created_at).toLocaleTimeString()),
            axisLine: { lineStyle: { color: BORDER } },
            axisLabel: { color: '#52525b', fontSize: 9, rotate: 30 },
        },
        yAxis: {
            type: 'value',
            name: 'ms',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: BORDER } },
            axisLabel: { color: '#52525b', fontSize: 10 },
        },
        series: [{
            name: 'Response Time',
            type: 'line',
            data: healthLogs.map(l => l.response_time_ms || 0),
            smooth: true,
            lineStyle: { color: '#22c55e', width: 2 },
            symbol: 'none',
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(34,197,94,0.2)' },
                    { offset: 1, color: 'rgba(34,197,94,0.02)' },
                ])
            },
        }],
    };

    const totalRequests = analytics.reduce((a, d) => a + (d.total || 0), 0);
    const totalBlocked = analytics.reduce((a, d) => a + (d.blocked || 0), 0);
    const blockRate = totalRequests > 0 ? ((totalBlocked / totalRequests) * 100).toFixed(1) : 0;
    const recentHealth = healthLogs[0];

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title={`${site.name} — Site Management`} />

            <Flex justify="space-between" align="flex-start" mb={28}>
                <Box>
                    <Group gap={12} mb={6}>
                        <StatusDot online={site.is_online} />
                        <Title order={2} c="white" fw={600}>{site.name}</Title>
                        {site.is_maintenance && (
                            <Badge color="yellow" size="sm" leftSection={<IconAlertTriangle size={11} />}>
                                Maintenance
                            </Badge>
                        )}
                        {site.under_attack_mode && (
                            <Badge color="red" size="sm" leftSection={<IconShield size={11} />}>
                                Under Attack Mode
                            </Badge>
                        )}
                    </Group>
                    <Group gap={8}>
                        <Text size="sm" c="dimmed">{site.domain}</Text>
                        <Text c="dimmed" size="sm">→</Text>
                        <Text size="sm" c="dimmed">{site.backend_url}</Text>
                    </Group>
                </Box>
                <Group gap={8}>
                    <Button
                        size="sm"
                        variant="outline"
                        color="gray"
                        leftSection={<IconRefresh size={14} />}
                        onClick={() => router.post(route('sites.check-health', site.id), {}, { preserveScroll: true })}
                    >
                        Health Check
                    </Button>
                    <Button
                        size="sm"
                        style={{ backgroundColor: ACCENT }}
                        leftSection={<IconCheck size={14} />}
                        onClick={save}
                        loading={processing}
                    >
                        Save Changes
                    </Button>
                </Group>
            </Flex>

            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb={24}>
                {[
                    {
                        label: 'Total Requests',
                        value: totalRequests.toLocaleString(),
                        icon: IconActivity,
                        color: ACCENT,
                        bg: ACCENT_DIM,
                    },
                    {
                        label: 'Threats Blocked',
                        value: totalBlocked.toLocaleString(),
                        icon: IconShield,
                        color: '#ef4444',
                        bg: 'rgba(239,68,68,0.1)',
                        sub: `${blockRate}% block rate`,
                    },
                    {
                        label: 'Uptime',
                        value: `${((site.uptime_percentage || 0) / 100).toFixed(2)}%`,
                        icon: IconCircleCheck,
                        color: '#22c55e',
                        bg: 'rgba(34,197,94,0.1)',
                    },
                    {
                        label: 'Avg Latency',
                        value: recentHealth?.response_time_ms ? `${recentHealth.response_time_ms}ms` : '—',
                        icon: IconClock,
                        color: '#a855f7',
                        bg: 'rgba(168,85,247,0.1)',
                    },
                ].map(stat => (
                    <Paper key={stat.label} p="lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                        <Flex justify="space-between" align="center" mb={12}>
                            <Box style={{ padding: 8, backgroundColor: stat.bg, borderRadius: 8 }}>
                                <stat.icon size={18} color={stat.color} />
                            </Box>
                        </Flex>
                        <Text size="xl" fw={700} c="white" lh={1}>{stat.value}</Text>
                        <Text size="xs" c="dimmed" mt={4}>{stat.label}</Text>
                        {stat.sub && <Text size="xs" style={{ color: stat.color }} mt={2}>{stat.sub}</Text>}
                    </Paper>
                ))}
            </SimpleGrid>

            <Tabs
                value={activeTab}
                onChange={setActiveTab}
                color="orange"
                styles={{
                    root: { '--tabs-color': ACCENT },
                    tab: {
                        color: '#71717a',
                        fontSize: 13,
                        fontWeight: 500,
                        '&[dataActive]': { color: ACCENT },
                    },
                    list: { borderBottom: `1px solid ${BORDER}`, marginBottom: 24 },
                }}
            >
                <Tabs.List>
                    <Tabs.Tab value="overview" leftSection={<IconGlobe size={14} />}>Overview</Tabs.Tab>
                    <Tabs.Tab value="configuration" leftSection={<IconSettings size={14} />}>Configuration</Tabs.Tab>
                    <Tabs.Tab value="security" leftSection={<IconShield size={14} />}>Security Shield</Tabs.Tab>
                    <Tabs.Tab value="pagerules" leftSection={<IconFilter size={14} />}>Page Rules</Tabs.Tab>
                    <Tabs.Tab value="traffic" leftSection={<IconChartBar size={14} />}>Traffic Insights</Tabs.Tab>
                    <Tabs.Tab value="branding" leftSection={<IconPalette size={14} />}>Branding & Errors</Tabs.Tab>
                    <Tabs.Tab value="audit" leftSection={<IconHistory size={14} />}>Audit Logs</Tabs.Tab>
                </Tabs.List>

                {/* ── OVERVIEW TAB ── */}
                <Tabs.Panel value="overview">
                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={16} mb={16}>
                        <SectionCard title="Traffic (30 Days)" description="Requests vs blocked threats">
                            <Box h={220}>
                                <ReactECharts echarts={echarts} option={analyticsOptions} style={{ height: '100%', width: '100%' }} />
                            </Box>
                        </SectionCard>

                        <SectionCard title="Request Volume" description="Daily request distribution">
                            <Box h={220}>
                                <ReactECharts echarts={echarts} option={bandwidthOptions} style={{ height: '100%', width: '100%' }} />
                            </Box>
                        </SectionCard>
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={16} mb={16}>
                        <SectionCard title="Health Monitor" description="Response time over last 48 checks">
                            <Box h={180}>
                                <ReactECharts echarts={echarts} option={healthStatusOptions} style={{ height: '100%', width: '100%' }} />
                            </Box>
                        </SectionCard>

                        <SectionCard title="Site Status">
                            <Stack gap={0}>
                                {[
                                    { label: 'Backend Status', value: site.is_online ? 'Online' : 'Offline', color: site.is_online ? '#22c55e' : '#ef4444' },
                                    { label: 'SSL', value: site.ssl_enabled ? 'Enabled' : 'Disabled', color: site.ssl_enabled ? '#22c55e' : '#71717a' },
                                    { label: 'WAF', value: site.waf_enabled ? 'Active' : 'Inactive', color: site.waf_enabled ? ACCENT : '#71717a' },
                                    { label: 'Cache', value: site.cache_enabled ? `TTL ${site.cache_ttl}s` : 'Disabled', color: site.cache_enabled ? '#a855f7' : '#71717a' },
                                    { label: 'Backend Type', value: site.backend_type === 'php_fpm' ? 'PHP-FPM' : 'HTTP Proxy', color: '#71717a' },
                                    { label: 'Performance', value: site.performance_level || 'balanced', color: '#71717a' },
                                    { label: 'Circuit Breaker', value: site.circuit_breaker_enabled ? 'Enabled' : 'Disabled', color: site.circuit_breaker_enabled ? '#22c55e' : '#71717a' },
                                    { label: 'Last Health Check', value: site.last_check_at ? new Date(site.last_check_at).toLocaleString() : 'Never', color: '#71717a' },
                                ].map(row => (
                                    <Flex
                                        key={row.label}
                                        justify="space-between"
                                        align="center"
                                        py={10}
                                        style={{ borderBottom: `1px solid ${BORDER}` }}
                                    >
                                        <Text size="sm" c="dimmed">{row.label}</Text>
                                        <Text size="sm" fw={500} style={{ color: row.color }}>{row.value}</Text>
                                    </Flex>
                                ))}
                                {site.last_error && (
                                    <Box mt={12} p={10} style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <Text size="xs" c="red">{site.last_error}</Text>
                                    </Box>
                                )}
                            </Stack>
                        </SectionCard>
                    </SimpleGrid>

                    <SectionCard title="SSL Certificates" description="Certificates managed by Caddy">
                        {sslCertificates && sslCertificates.length > 0 ? (
                            <Table style={{ color: '#e4e4e7' }}>
                                <Table.Thead>
                                    <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                        {['Domain', 'Issuer', 'Expires', 'Status'].map(h => (
                                            <Table.Th key={h} style={{ fontSize: 10, color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', padding: '10px 12px', backgroundColor: CARD_BG }}>
                                                {h}
                                            </Table.Th>
                                        ))}
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {sslCertificates.map((cert, i) => (
                                        <Table.Tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                                            <Table.Td style={{ padding: '10px 12px' }}><Text size="sm" c="white">{cert.domain || cert.subject}</Text></Table.Td>
                                            <Table.Td style={{ padding: '10px 12px' }}><Text size="xs" c="dimmed">{cert.issuer || 'Let\'s Encrypt'}</Text></Table.Td>
                                            <Table.Td style={{ padding: '10px 12px' }}><Text size="xs" c="dimmed">{cert.expires || '—'}</Text></Table.Td>
                                            <Table.Td style={{ padding: '10px 12px' }}><Badge size="xs" color="green">Active</Badge></Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Text size="sm" c="dimmed" ta="center" py={24}>No SSL certificates found for this domain.</Text>
                        )}
                    </SectionCard>
                </Tabs.Panel>

                {/* ── CONFIGURATION TAB ── */}
                <Tabs.Panel value="configuration">
                    <SectionCard
                        title="General Settings"
                        description="Core proxy configuration"
                        action={
                            <Button size="xs" style={{ backgroundColor: ACCENT }} leftSection={<IconCheck size={13} />} onClick={save} loading={processing}>
                                Save
                            </Button>
                        }
                    >
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16}>
                            <TextInput
                                label="Site Name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                styles={INPUT_STYLES}
                                leftSection={<IconTag size={14} color="#52525b" />}
                            />
                            <TextInput
                                label="Domain"
                                value={data.domain}
                                onChange={e => setData('domain', e.target.value)}
                                styles={INPUT_STYLES}
                                leftSection={<IconGlobe size={14} color="#52525b" />}
                            />
                            <TextInput
                                label="Backend URL"
                                value={data.backend_url}
                                onChange={e => setData('backend_url', e.target.value)}
                                styles={INPUT_STYLES}
                                leftSection={<IconServer size={14} color="#52525b" />}
                                placeholder="http://localhost:8080"
                            />
                            <TextInput
                                label="Backup Backend URL"
                                value={data.backup_backend_url}
                                onChange={e => setData('backup_backend_url', e.target.value)}
                                styles={INPUT_STYLES}
                                leftSection={<IconNetwork size={14} color="#52525b" />}
                                placeholder="http://localhost:8081 (failover)"
                                description="Used when primary backend is unreachable"
                            />
                            <Select
                                label="Backend Type"
                                value={data.backend_type}
                                onChange={v => setData('backend_type', v)}
                                data={[
                                    { value: 'proxy', label: 'HTTP Reverse Proxy' },
                                    { value: 'php_fpm', label: 'PHP-FPM (FastCGI)' },
                                ]}
                                styles={INPUT_STYLES}
                                leftSection={<IconCpu size={14} color="#52525b" />}
                            />
                            {data.backend_type === 'php_fpm' && (
                                <TextInput
                                    label="Root Path"
                                    value={data.root_path}
                                    onChange={e => setData('root_path', e.target.value)}
                                    styles={INPUT_STYLES}
                                    leftSection={<IconDatabase size={14} color="#52525b" />}
                                    placeholder="/var/www/html"
                                    description="Document root for PHP-FPM"
                                />
                            )}
                            <Select
                                label="Performance Level"
                                value={data.performance_level}
                                onChange={v => setData('performance_level', v)}
                                data={[
                                    { value: 'off', label: 'Off — No optimization' },
                                    { value: 'balanced', label: 'Balanced — Recommended' },
                                    { value: 'aggressive', label: 'Aggressive — Maximum speed' },
                                ]}
                                styles={INPUT_STYLES}
                                leftSection={<IconRocket size={14} color="#52525b" />}
                            />
                            <NumberInput
                                label="Rate Limit (req/s)"
                                value={data.rate_limit_rps}
                                onChange={v => setData('rate_limit_rps', v)}
                                min={1}
                                max={10000}
                                styles={INPUT_STYLES}
                                leftSection={<IconBolt size={14} color="#52525b" />}
                                description="Maximum requests per second per IP"
                            />
                        </SimpleGrid>

                        <Divider my={20} color={BORDER} />
                        <Text style={SECTION_LABEL}>Feature Toggles</Text>
                        <Stack gap={0}>
                            <ToggleRow label="SSL / HTTPS" description="Automatic Let's Encrypt certificate" checked={data.ssl_enabled} onChange={v => setData('ssl_enabled', v)} />
                            <ToggleRow label="Brotli Compression" description="Compress responses with Brotli for faster delivery" checked={data.brotli_enabled} onChange={v => setData('brotli_enabled', v)} />
                            <ToggleRow label="HSTS" description="Strict-Transport-Security header enforcement" checked={data.hsts_enabled} onChange={v => setData('hsts_enabled', v)} />
                            <ToggleRow label="Response Cache" description="Cache backend responses at the proxy layer" checked={data.cache_enabled} onChange={v => setData('cache_enabled', v)} />
                            {data.cache_enabled && (
                                <Box py={12} pl={16}>
                                    <NumberInput
                                        label="Cache TTL (seconds)"
                                        value={data.cache_ttl}
                                        onChange={v => setData('cache_ttl', v)}
                                        min={0}
                                        styles={INPUT_STYLES}
                                        w={200}
                                    />
                                </Box>
                            )}
                            <ToggleRow label="Maintenance Mode" description="Show maintenance page to all visitors" checked={data.is_maintenance} onChange={v => setData('is_maintenance', v)} />
                            {data.is_maintenance && (
                                <Box py={12} pl={16}>
                                    <Textarea
                                        label="Maintenance Message"
                                        value={data.maintenance_message}
                                        onChange={e => setData('maintenance_message', e.target.value)}
                                        styles={INPUT_STYLES}
                                        minRows={2}
                                        placeholder="We'll be back shortly..."
                                    />
                                </Box>
                            )}
                            <ToggleRow label="Protect Sensitive Files" description="Block access to .env, .git, composer files" checked={data.protect_sensitive_files} onChange={v => setData('protect_sensitive_files', v)} />
                        </Stack>
                    </SectionCard>

                    <SectionCard title="Basic Authentication" description="HTTP Basic Auth for the entire site">
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16}>
                            <TextInput
                                label="Username"
                                value={data.auth_user}
                                onChange={e => setData('auth_user', e.target.value)}
                                styles={INPUT_STYLES}
                                leftSection={<IconUser size={14} color="#52525b" />}
                                placeholder="Leave empty to disable"
                            />
                            <TextInput
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.auth_password}
                                onChange={e => setData('auth_password', e.target.value)}
                                styles={INPUT_STYLES}
                                leftSection={<IconKey size={14} color="#52525b" />}
                                rightSection={
                                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setShowPassword(v => !v)}>
                                        {showPassword ? <IconEyeOff size={13} /> : <IconEye size={13} />}
                                    </ActionIcon>
                                }
                            />
                        </SimpleGrid>
                    </SectionCard>

                    <SectionCard title="Circuit Breaker" description="Automatically open circuit when backend fails repeatedly">
                        <ToggleRow label="Enable Circuit Breaker" description="Stops forwarding requests when backend is unhealthy" checked={data.circuit_breaker_enabled} onChange={v => setData('circuit_breaker_enabled', v)} />
                        {data.circuit_breaker_enabled && (
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16} mt={16}>
                                <NumberInput
                                    label="Failure Threshold"
                                    description="Number of consecutive failures before opening circuit"
                                    value={data.circuit_breaker_threshold}
                                    onChange={v => setData('circuit_breaker_threshold', v)}
                                    min={1}
                                    max={20}
                                    styles={INPUT_STYLES}
                                />
                                <NumberInput
                                    label="Retry After (seconds)"
                                    description="Time before attempting to close the circuit"
                                    value={data.circuit_breaker_retry_seconds}
                                    onChange={v => setData('circuit_breaker_retry_seconds', v)}
                                    min={5}
                                    max={600}
                                    styles={INPUT_STYLES}
                                />
                            </SimpleGrid>
                        )}
                    </SectionCard>

                    <SectionCard title="Notification Webhook" description="POST alerts to an external URL on security events">
                        <TextInput
                            label="Webhook URL"
                            value={data.notification_webhook_url}
                            onChange={e => setData('notification_webhook_url', e.target.value)}
                            styles={INPUT_STYLES}
                            leftSection={<IconCloudUpload size={14} color="#52525b" />}
                            placeholder="https://hooks.slack.com/..."
                        />
                    </SectionCard>

                    <SectionCard title="Environment Variables" description="Injected into PHP-FPM FastCGI environment">
                        <KeyValueEditor
                            label="Variables"
                            value={data.env_vars}
                            onChange={v => setData('env_vars', v)}
                            keyPlaceholder="APP_ENV"
                            valuePlaceholder="production"
                        />
                    </SectionCard>

                    <SectionCard title="Header Rules" description="Inject or remove HTTP response headers">
                        <KeyValueEditor
                            label="Headers"
                            value={data.header_rules}
                            onChange={v => setData('header_rules', v)}
                            keyPlaceholder="X-Frame-Options"
                            valuePlaceholder="DENY"
                        />
                    </SectionCard>

                    <SectionCard title="Redirect Rules" description="Path-based redirects handled at the proxy layer">
                        <KeyValueEditor
                            label="Redirects"
                            value={data.redirect_rules}
                            onChange={v => setData('redirect_rules', v)}
                            keyPlaceholder="/old-path"
                            valuePlaceholder="/new-path"
                        />
                    </SectionCard>

                    <Flex justify="flex-end">
                        <Button size="sm" style={{ backgroundColor: ACCENT }} leftSection={<IconCheck size={14} />} onClick={save} loading={processing}>
                            Save All Changes
                        </Button>
                    </Flex>
                </Tabs.Panel>

                {/* ── SECURITY SHIELD TAB ── */}
                <Tabs.Panel value="security">
                    <SectionCard
                        title="Threat Protection"
                        description="WAF, bot management, and attack mode settings"
                        action={
                            <Button size="xs" style={{ backgroundColor: ACCENT }} leftSection={<IconCheck size={13} />} onClick={save} loading={processing}>
                                Save
                            </Button>
                        }
                    >
                        <Stack gap={0}>
                            <ToggleRow
                                label="Web Application Firewall (WAF)"
                                description="Inspect and filter malicious HTTP traffic"
                                checked={data.waf_enabled}
                                onChange={v => setData('waf_enabled', v)}
                            />
                            <ToggleRow
                                label="Block Common Bad Bots"
                                description="Automatically block known malicious user agents (sqlmap, nikto, etc.)"
                                checked={data.block_common_bad_bots}
                                onChange={v => setData('block_common_bad_bots', v)}
                            />
                            <ToggleRow
                                label="Bot Challenge Mode"
                                description="Challenge suspicious bots with a JavaScript proof-of-work"
                                checked={data.bot_challenge_mode}
                                onChange={v => setData('bot_challenge_mode', v)}
                            />
                            <ToggleRow
                                label="Bot Fight Mode"
                                description="Actively waste bot resources with honeypot responses"
                                checked={data.bot_fight_mode}
                                onChange={v => setData('bot_fight_mode', v)}
                            />
                            <ToggleRow
                                label="Under Attack Mode"
                                description="Maximum protection — challenge every visitor. Use during active DDoS attacks."
                                checked={data.under_attack_mode}
                                onChange={v => setData('under_attack_mode', v)}
                            />
                        </Stack>
                    </SectionCard>

                    <SectionCard title="IP Access Control" description="Allowlist and denylist by IP address or CIDR range">
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16}>
                            <IpListEditor
                                label="IP Allowlist"
                                description="Only these IPs can access the site (leave empty to allow all)"
                                value={data.ip_allowlist}
                                onChange={v => setData('ip_allowlist', v)}
                            />
                            <IpListEditor
                                label="IP Denylist"
                                description="These IPs are always blocked"
                                value={data.ip_denylist}
                                onChange={v => setData('ip_denylist', v)}
                            />
                        </SimpleGrid>
                    </SectionCard>

                    <SectionCard title="GeoIP Filtering" description="Restrict access by country code (ISO 3166-1 alpha-2)">
                        <ToggleRow
                            label="Enable GeoIP Filtering"
                            description="Requires MaxMind GeoLite2 database"
                            checked={data.geoip_enabled}
                            onChange={v => setData('geoip_enabled', v)}
                        />
                        {data.geoip_enabled && (
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16} mt={16}>
                                <IpListEditor
                                    label="Country Allowlist"
                                    description="Only allow traffic from these countries (e.g. US, TR, DE)"
                                    value={data.geoip_allowlist}
                                    onChange={v => setData('geoip_allowlist', v)}
                                />
                                <IpListEditor
                                    label="Country Denylist"
                                    description="Block traffic from these countries"
                                    value={data.geoip_denylist}
                                    onChange={v => setData('geoip_denylist', v)}
                                />
                            </SimpleGrid>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Custom WAF Rules"
                        description="Pattern-based request filtering rules"
                        action={
                            <Group gap={8}>
                                <Button
                                    size="xs"
                                    variant="outline"
                                    color="orange"
                                    leftSection={<IconShieldCheck size={13} />}
                                    onClick={openWafModal}
                                >
                                    Add Rule
                                </Button>
                            </Group>
                        }
                    >
                        <Text style={SECTION_LABEL}>WAF Presets</Text>
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={12} mb={20}>
                            {Object.entries(wafPresets || {}).map(([key, preset]) => (
                                <Paper
                                    key={key}
                                    p="md"
                                    style={{ backgroundColor: '#0a0a0b', border: `1px solid ${BORDER}`, cursor: 'pointer' }}
                                >
                                    <Flex justify="space-between" align="flex-start" mb={8}>
                                        <Text size="sm" fw={600} c="white">{preset.name}</Text>
                                        <Badge size="xs" variant="outline" color="orange">{preset.rules?.length} rules</Badge>
                                    </Flex>
                                    <Text size="xs" c="dimmed" mb={12}>{preset.description}</Text>
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        color="orange"
                                        leftSection={<IconUpload size={12} />}
                                        onClick={() => applyPreset(key)}
                                    >
                                        Apply Preset
                                    </Button>
                                </Paper>
                            ))}
                        </SimpleGrid>

                        <Text style={SECTION_LABEL}>Active Rules ({(data.custom_waf_rules || []).length})</Text>
                        {(data.custom_waf_rules || []).length > 0 ? (
                            <Table style={{ color: '#e4e4e7' }}>
                                <Table.Thead>
                                    <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                        {['Type', 'Pattern', 'Header', 'Action', ''].map(h => (
                                            <Table.Th key={h} style={{ fontSize: 10, color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', padding: '10px 12px', backgroundColor: CARD_BG }}>
                                                {h}
                                            </Table.Th>
                                        ))}
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {(data.custom_waf_rules || []).map((rule, i) => (
                                        <WafRuleRow key={i} rule={rule} onRemove={() => removeWafRule(i)} />
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Text size="sm" c="dimmed" ta="center" py={24}>No custom WAF rules configured.</Text>
                        )}
                    </SectionCard>

                    <Flex justify="flex-end">
                        <Button size="sm" style={{ backgroundColor: ACCENT }} leftSection={<IconCheck size={14} />} onClick={save} loading={processing}>
                            Save Security Settings
                        </Button>
                    </Flex>
                </Tabs.Panel>

                {/* ── PAGE RULES TAB ── */}
                <Tabs.Panel value="pagerules">
                    <SectionCard
                        title="Page Rules"
                        description="Path-based redirects, rewrites, and header injections"
                        action={
                            <Button size="xs" style={{ backgroundColor: ACCENT }} leftSection={<IconPlus size={13} />} onClick={openPageRuleModal}>
                                Add Rule
                            </Button>
                        }
                    >
                        {(site.pageRules || []).length > 0 ? (
                            <Table style={{ color: '#e4e4e7' }}>
                                <Table.Thead>
                                    <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                        {['Path', 'Type', 'Value', 'Status', ''].map(h => (
                                            <Table.Th key={h} style={{ fontSize: 10, color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', padding: '10px 12px', backgroundColor: CARD_BG }}>
                                                {h}
                                            </Table.Th>
                                        ))}
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {(site.pageRules || []).map(rule => (
                                        <PageRuleRow key={rule.id} rule={rule} siteId={site.id} />
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Flex direction="column" align="center" py={48} gap={12}>
                                <ThemeIcon size={48} variant="light" color="orange" radius="xl">
                                    <IconFilter size={24} />
                                </ThemeIcon>
                                <Text c="dimmed" size="sm">No page rules configured yet.</Text>
                                <Button size="xs" variant="outline" color="orange" leftSection={<IconPlus size={12} />} onClick={openPageRuleModal}>
                                    Create First Rule
                                </Button>
                            </Flex>
                        )}
                    </SectionCard>

                    <SectionCard title="How Page Rules Work" description="Reference guide for rule types">
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={12}>
                            {[
                                { type: 'redirect', color: 'blue', desc: 'Permanently (301) or temporarily (302) redirect a path to another URL.' },
                                { type: 'rewrite', color: 'violet', desc: 'Internally rewrite the request path without changing the browser URL.' },
                                { type: 'header', color: 'teal', desc: 'Inject a custom response header for requests matching the path.' },
                            ].map(item => (
                                <Box key={item.type} p={14} style={{ backgroundColor: '#0a0a0b', borderRadius: 8, border: `1px solid ${BORDER}` }}>
                                    <Badge size="sm" color={item.color} mb={8}>{item.type}</Badge>
                                    <Text size="xs" c="dimmed">{item.desc}</Text>
                                </Box>
                            ))}
                        </SimpleGrid>
                    </SectionCard>
                </Tabs.Panel>

                {/* ── TRAFFIC INSIGHTS TAB ── */}
                <Tabs.Panel value="traffic">
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb={16}>
                        {[
                            { label: '2xx Responses', value: (site.hits_2xx || 0).toLocaleString(), color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                            { label: '4xx Client Errors', value: (site.hits_4xx || 0).toLocaleString(), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                            { label: '5xx Server Errors', value: (site.hits_5xx || 0).toLocaleString(), color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                            { label: 'Avg Latency', value: site.avg_latency_ms ? `${site.avg_latency_ms}ms` : '—', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
                        ].map(stat => (
                            <Paper key={stat.label} p="lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                                <Text size="xl" fw={700} style={{ color: stat.color }} lh={1}>{stat.value}</Text>
                                <Text size="xs" c="dimmed" mt={6}>{stat.label}</Text>
                            </Paper>
                        ))}
                    </SimpleGrid>

                    <SectionCard title="Request Trend (30 Days)" description="Total vs blocked requests over time">
                        <Box h={280}>
                            <ReactECharts echarts={echarts} option={analyticsOptions} style={{ height: '100%', width: '100%' }} />
                        </Box>
                    </SectionCard>

                    <SectionCard title="Health Check History" description="Backend response time over last 48 checks">
                        <Box h={220} mb={16}>
                            <ReactECharts echarts={echarts} option={healthStatusOptions} style={{ height: '100%', width: '100%' }} />
                        </Box>
                        <Table style={{ color: '#e4e4e7' }}>
                            <Table.Thead>
                                <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                    {['Time', 'Status', 'Response Time', 'HTTP Code'].map(h => (
                                        <Table.Th key={h} style={{ fontSize: 10, color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', padding: '10px 12px', backgroundColor: CARD_BG }}>
                                            {h}
                                        </Table.Th>
                                    ))}
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {(healthLogs || []).slice(0, 10).map((log, i) => (
                                    <Table.Tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                                        <Table.Td style={{ padding: '10px 12px' }}>
                                            <Text size="xs" c="dimmed">{new Date(log.created_at).toLocaleString()}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '10px 12px' }}>
                                            <Group gap={6}>
                                                <StatusDot online={log.is_up} />
                                                <Text size="xs" c={log.is_up ? 'green' : 'red'}>{log.is_up ? 'UP' : 'DOWN'}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '10px 12px' }}>
                                            <Text size="xs" c="white">{log.response_time_ms ? `${log.response_time_ms}ms` : '—'}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '10px 12px' }}>
                                            <Badge
                                                size="xs"
                                                color={log.status_code >= 500 ? 'red' : log.status_code >= 400 ? 'yellow' : 'green'}
                                            >
                                                {log.status_code || '—'}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                                {(!healthLogs || healthLogs.length === 0) && (
                                    <Table.Tr>
                                        <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '32px 16px', color: '#52525b' }}>
                                            No health check data available.
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </SectionCard>

                    <SectionCard title="Recent Security Events" description="Last 50 blocked or flagged requests">
                        <Table style={{ color: '#e4e4e7' }}>
                            <Table.Thead>
                                <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                    {['Time', 'IP', 'Country', 'Type', 'Path'].map(h => (
                                        <Table.Th key={h} style={{ fontSize: 10, color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', padding: '10px 12px', backgroundColor: CARD_BG }}>
                                            {h}
                                        </Table.Th>
                                    ))}
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {(site.securityEvents || []).map((ev, i) => (
                                    <Table.Tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                                        <Table.Td style={{ padding: '10px 12px' }}>
                                            <Text size="xs" c="dimmed">{new Date(ev.created_at).toLocaleString()}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '10px 12px' }}>
                                            <Text size="xs" c="white" style={{ fontFamily: 'monospace' }}>{ev.ip_address}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '10px 12px' }}>
                                            <Text size="xs" c="dimmed">{ev.country_code || '—'}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '10px 12px' }}>
                                            <Badge size="xs" color="red">{ev.event_type || 'blocked'}</Badge>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '10px 12px' }}>
                                            <Text size="xs" c="dimmed" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {ev.request_path || '—'}
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                                {(!site.securityEvents || site.securityEvents.length === 0) && (
                                    <Table.Tr>
                                        <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: '#52525b' }}>
                                            No security events recorded.
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </SectionCard>
                </Tabs.Panel>

                {/* ── BRANDING & ERRORS TAB ── */}
                <Tabs.Panel value="branding">
                    <SectionCard
                        title="Custom Error Pages"
                        description="Override default 403 and 503 error pages with branded HTML"
                        action={
                            <Button size="xs" style={{ backgroundColor: ACCENT }} leftSection={<IconCheck size={13} />} onClick={save} loading={processing}>
                                Save
                            </Button>
                        }
                    >
                        <Text style={SECTION_LABEL}>Error Page Templates</Text>
                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={12} mb={24}>
                            {Object.entries(errorTemplates || {}).map(([key, tpl]) => (
                                <Paper key={key} p="md" style={{ backgroundColor: '#0a0a0b', border: `1px solid ${BORDER}` }}>
                                    <Text size="sm" fw={600} c="white" mb={4}>{tpl.name}</Text>
                                    <Text size="xs" c="dimmed" mb={12}>{tpl.description || 'Custom error template'}</Text>
                                    <Group gap={6}>
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            color="orange"
                                            leftSection={<IconUpload size={12} />}
                                            onClick={() => applyErrorTemplate(key, '403')}
                                        >
                                            Apply to 403
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            color="gray"
                                            leftSection={<IconUpload size={12} />}
                                            onClick={() => applyErrorTemplate(key, '503')}
                                        >
                                            Apply to 503
                                        </Button>
                                    </Group>
                                </Paper>
                            ))}
                        </SimpleGrid>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16}>
                            <Box>
                                <Flex justify="space-between" align="center" mb={8}>
                                    <Text style={SECTION_LABEL} mb={0}>403 Forbidden Page</Text>
                                    <Badge size="xs" color="red">403</Badge>
                                </Flex>
                                <Textarea
                                    value={data.custom_error_403}
                                    onChange={e => setData('custom_error_403', e.target.value)}
                                    placeholder="<!DOCTYPE html>&#10;<html>&#10;  <body>Access Denied</body>&#10;</html>"
                                    minRows={12}
                                    styles={{
                                        ...INPUT_STYLES,
                                        input: { ...INPUT_STYLES.input, fontFamily: 'monospace', fontSize: 12 },
                                    }}
                                    autosize
                                />
                            </Box>
                            <Box>
                                <Flex justify="space-between" align="center" mb={8}>
                                    <Text style={SECTION_LABEL} mb={0}>503 Service Unavailable Page</Text>
                                    <Badge size="xs" color="yellow">503</Badge>
                                </Flex>
                                <Textarea
                                    value={data.custom_error_503}
                                    onChange={e => setData('custom_error_503', e.target.value)}
                                    placeholder="<!DOCTYPE html>&#10;<html>&#10;  <body>Service Unavailable</body>&#10;</html>"
                                    minRows={12}
                                    styles={{
                                        ...INPUT_STYLES,
                                        input: { ...INPUT_STYLES.input, fontFamily: 'monospace', fontSize: 12 },
                                    }}
                                    autosize
                                />
                            </Box>
                        </SimpleGrid>
                    </SectionCard>

                    <Flex justify="flex-end">
                        <Button size="sm" style={{ backgroundColor: ACCENT }} leftSection={<IconCheck size={14} />} onClick={save} loading={processing}>
                            Save Error Pages
                        </Button>
                    </Flex>
                </Tabs.Panel>

                {/* ── AUDIT LOGS TAB ── */}
                <Tabs.Panel value="audit">
                    <SectionCard title="Configuration Audit Log" description="Full history of configuration changes with rollback support">
                        <Table style={{ color: '#e4e4e7' }}>
                            <Table.Thead>
                                <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                    {['Action', 'User', 'Timestamp', ''].map(h => (
                                        <Table.Th key={h} style={{ fontSize: 10, color: '#52525b', fontWeight: 600, letterSpacing: '0.08em', padding: '10px 12px', backgroundColor: CARD_BG }}>
                                            {h}
                                        </Table.Th>
                                    ))}
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {(site.configAudits || []).map(audit => (
                                    <AuditRow key={audit.id} audit={audit} siteId={site.id} />
                                ))}
                                {(!site.configAudits || site.configAudits.length === 0) && (
                                    <Table.Tr>
                                        <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '48px 16px', color: '#52525b' }}>
                                            No audit records found.
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </SectionCard>
                </Tabs.Panel>
            </Tabs>

            {/* ── WAF RULE MODAL ── */}
            <Modal
                opened={wafModalOpen}
                onClose={closeWafModal}
                title={<Text fw={600} c="white">Add WAF Rule</Text>}
                size="md"
                styles={{
                    content: { backgroundColor: '#111113', border: `1px solid ${BORDER}` },
                    header: { backgroundColor: '#111113', borderBottom: `1px solid ${BORDER}` },
                }}
            >
                <Stack gap={14} pt={8}>
                    <Select
                        label="Rule Type"
                        value={newWafRule.type}
                        onChange={v => setNewWafRule(r => ({ ...r, type: v }))}
                        data={[
                            { value: 'path', label: 'Path' },
                            { value: 'query', label: 'Query String' },
                            { value: 'header', label: 'Header' },
                            { value: 'body', label: 'Request Body' },
                        ]}
                        styles={INPUT_STYLES}
                    />
                    {newWafRule.type === 'header' && (
                        <TextInput
                            label="Header Name"
                            placeholder="User-Agent"
                            value={newWafRule.header_name}
                            onChange={e => setNewWafRule(r => ({ ...r, header_name: e.target.value }))}
                            styles={INPUT_STYLES}
                        />
                    )}
                    <TextInput
                        label="Pattern (Regex)"
                        placeholder="(?i)(sqlmap|nikto)"
                        value={newWafRule.pattern}
                        onChange={e => setNewWafRule(r => ({ ...r, pattern: e.target.value }))}
                        styles={INPUT_STYLES}
                        description="Case-insensitive regex pattern to match against the request"
                    />
                    <Select
                        label="Action"
                        value={newWafRule.action}
                        onChange={v => setNewWafRule(r => ({ ...r, action: v }))}
                        data={[
                            { value: 'block', label: 'Block (403)' },
                            { value: 'log', label: 'Log Only' },
                        ]}
                        styles={INPUT_STYLES}
                    />
                    <Group justify="flex-end" mt={8}>
                        <Button size="sm" variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={closeWafModal}>
                            Cancel
                        </Button>
                        <Button size="sm" style={{ backgroundColor: ACCENT }} leftSection={<IconPlus size={14} />} onClick={addWafRule}>
                            Add Rule
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* ── PAGE RULE MODAL ── */}
            <Modal
                opened={pageRuleModalOpen}
                onClose={closePageRuleModal}
                title={<Text fw={600} c="white">Add Page Rule</Text>}
                size="md"
                styles={{
                    content: { backgroundColor: '#111113', border: `1px solid ${BORDER}` },
                    header: { backgroundColor: '#111113', borderBottom: `1px solid ${BORDER}` },
                }}
            >
                <form onSubmit={submitPageRule}>
                    <Stack gap={14} pt={8}>
                        <TextInput
                            label="Path Pattern"
                            placeholder="/old-path/*"
                            required
                            value={pageRuleForm.data.path}
                            onChange={e => pageRuleForm.setData('path', e.target.value)}
                            styles={INPUT_STYLES}
                            description="Supports wildcards: /blog/* matches all blog paths"
                        />
                        <Select
                            label="Rule Type"
                            value={pageRuleForm.data.type}
                            onChange={v => pageRuleForm.setData('type', v)}
                            data={[
                                { value: 'redirect', label: 'Redirect' },
                                { value: 'rewrite', label: 'Rewrite' },
                                { value: 'header', label: 'Header Injection' },
                            ]}
                            styles={INPUT_STYLES}
                        />
                        <TextInput
                            label="Value"
                            placeholder={pageRuleForm.data.type === 'header' ? 'X-Custom-Header: value' : '/new-path'}
                            required
                            value={pageRuleForm.data.value}
                            onChange={e => pageRuleForm.setData('value', e.target.value)}
                            styles={INPUT_STYLES}
                        />
                        <Group justify="flex-end" mt={8}>
                            <Button size="sm" variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={closePageRuleModal}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                style={{ backgroundColor: ACCENT }}
                                leftSection={<IconPlus size={14} />}
                                loading={pageRuleForm.processing}
                            >
                                Create Rule
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </EnterpriseLayout>
    );
}
