import React, { useState, useCallback } from 'react';
import {
    Modal, Stack, Text, Box, Group, Button, Badge,
    Checkbox, Divider, ScrollArea, Alert, Loader, Center,
    ThemeIcon, Progress,
} from '@mantine/core';
import {
    IconShield, IconBan, IconGlobe, IconBolt,
    IconAlertTriangle, IconCheck, IconRefresh,
    IconRobot, IconChevronRight, IconInfoCircle,
} from '@tabler/icons-react';
import axios from 'axios';

const CARD_BG = '#0d0d0f';
const BORDER = 'rgba(255,255,255,0.07)';
const ACCENT = '#f38020';

const SEVERITY_CONFIG = {
    critical: { color: '#f03e3e', label: 'Critical', order: 0 },
    high: { color: '#f38020', label: 'High', order: 1 },
    medium: { color: '#f59f00', label: 'Medium', order: 2 },
    low: { color: '#2f9e44', label: 'Low', order: 3 },
};

const TYPE_ICON = {
    ban_ip: IconBan,
    block_country: IconGlobe,
    enable_waf: IconShield,
    increase_rate_limit: IconBolt,
    enable_bot_fight: IconRobot,
    enable_under_attack: IconAlertTriangle,
    add_waf_rule: IconShield,
};

function RecommendationCard({ rec, selected, onToggle }) {
    const sev = SEVERITY_CONFIG[rec.severity] || SEVERITY_CONFIG.medium;
    const Icon = TYPE_ICON[rec.type] || IconShield;

    return (
        <Box
            p={14}
            style={{
                backgroundColor: selected ? 'rgba(243,128,32,0.06)' : '#111113',
                border: `1px solid ${selected ? 'rgba(243,128,32,0.3)' : BORDER}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s',
            }}
            onClick={() => onToggle(rec.id)}
        >
            <Group gap={12} wrap="nowrap" align="flex-start">
                <Checkbox
                    checked={selected}
                    onChange={() => onToggle(rec.id)}
                    color="orange"
                    size="sm"
                    mt={2}
                    onClick={e => e.stopPropagation()}
                />
                <ThemeIcon
                    size={32}
                    radius={8}
                    style={{ backgroundColor: sev.color + '22', flexShrink: 0 }}
                >
                    <Icon size={16} color={sev.color} />
                </ThemeIcon>
                <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={8} mb={4} wrap="nowrap">
                        <Text size="sm" fw={600} c="white" style={{ flex: 1 }} lineClamp={1}>
                            {rec.title}
                        </Text>
                        <Badge
                            size="xs"
                            variant="light"
                            style={{ backgroundColor: sev.color + '22', color: sev.color, flexShrink: 0 }}
                        >
                            {sev.label}
                        </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mb={6} lineClamp={2}>{rec.description}</Text>
                    <Group gap={4}>
                        <IconInfoCircle size={11} color="#52525b" />
                        <Text size="10px" c="#52525b">{rec.impact}</Text>
                    </Group>
                </Box>
            </Group>
            <Box mt={10} ml={44 + 12}>
                <Progress
                    value={rec.severity_score}
                    size={3}
                    color={sev.color}
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                />
            </Box>
        </Box>
    );
}

export default function PolicyOptimizerModal({ opened, onClose }) {
    const [phase, setPhase] = useState('idle');
    const [data, setData] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const runAnalysis = useCallback(async () => {
        setPhase('analyzing');
        setError(null);
        setResult(null);
        setSelected(new Set());
        try {
            const { data: res } = await axios.get(route('policy-optimizer.analyze'));
            setData(res);
            const allIds = new Set(res.recommendations.map(r => r.id));
            setSelected(allIds);
            setPhase('results');
        } catch (e) {
            setError('Analysis failed. Please try again.');
            setPhase('idle');
        }
    }, []);

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === data?.recommendations?.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(data.recommendations.map(r => r.id)));
        }
    };

    const applySelected = async () => {
        const actions = data.recommendations
            .filter(r => selected.has(r.id))
            .map(r => ({ type: r.type, payload: r.payload }));

        if (actions.length === 0) return;

        setPhase('applying');
        try {
            const { data: res } = await axios.post(route('policy-optimizer.apply'), { actions });
            setResult(res);
            setPhase('done');
        } catch (e) {
            setError('Failed to apply policies. Please try again.');
            setPhase('results');
        }
    };

    const handleOpen = () => {
        if (phase === 'idle') runAnalysis();
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setPhase('idle');
            setData(null);
            setSelected(new Set());
            setResult(null);
            setError(null);
        }, 300);
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            onOpen={handleOpen}
            title={
                <Group gap={10}>
                    <ThemeIcon size={28} radius={8} style={{ backgroundColor: ACCENT + '22' }}>
                        <IconShield size={15} color={ACCENT} />
                    </ThemeIcon>
                    <Box>
                        <Text fw={700} size="sm" c="white">Policy Optimizer</Text>
                        <Text size="10px" c="dimmed">AI-driven security recommendations</Text>
                    </Box>
                </Group>
            }
            size="lg"
            styles={{
                content: { backgroundColor: '#0a0a0b', border: `1px solid ${BORDER}` },
                header: { backgroundColor: '#0a0a0b', borderBottom: `1px solid ${BORDER}` },
                title: { width: '100%' },
            }}
        >
            {phase === 'analyzing' && (
                <Center py={60}>
                    <Stack align="center" gap={16}>
                        <Loader color="orange" size="md" />
                        <Text c="dimmed" size="sm">Analyzing security events from the last 7 days...</Text>
                    </Stack>
                </Center>
            )}

            {phase === 'applying' && (
                <Center py={60}>
                    <Stack align="center" gap={16}>
                        <Loader color="orange" size="md" />
                        <Text c="dimmed" size="sm">Applying {selected.size} policies...</Text>
                    </Stack>
                </Center>
            )}

            {error && (
                <Alert icon={<IconAlertTriangle size={15} />} color="red" variant="light" mb={16}>
                    {error}
                </Alert>
            )}

            {phase === 'done' && result && (
                <Stack gap={16}>
                    <Alert icon={<IconCheck size={15} />} color="green" variant="light">
                        Successfully applied {result.count} policies.
                    </Alert>
                    <ScrollArea h={300} scrollbarSize={4}>
                        <Stack gap={8}>
                            {result.applied.map((a, i) => (
                                <Box
                                    key={i}
                                    p={12}
                                    style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 8 }}
                                >
                                    <Group gap={8}>
                                        <IconCheck size={13} color="#2f9e44" />
                                        <Text size="xs" c="gray.3">
                                            {a.type === 'ban_ip' && `Banned IP: ${a.ip}`}
                                            {a.type === 'block_country' && `Blocked ${a.country} on ${a.site}`}
                                            {a.type === 'enable_waf' && `WAF enabled on ${a.site}`}
                                            {a.type === 'rate_limit' && `Rate limit set to ${a.rps} req/s on ${a.site}`}
                                            {a.type === 'bot_fight' && `Bot Fight Mode enabled on ${a.site}`}
                                            {a.type === 'under_attack' && `Under Attack Mode enabled on ${a.site}`}
                                            {a.type === 'waf_rule' && `WAF rule added to: ${a.sites?.join(', ')}`}
                                        </Text>
                                    </Group>
                                </Box>
                            ))}
                        </Stack>
                    </ScrollArea>
                    <Button
                        leftSection={<IconRefresh size={14} />}
                        variant="outline"
                        color="orange"
                        onClick={runAnalysis}
                    >
                        Re-analyze
                    </Button>
                </Stack>
            )}

            {phase === 'results' && data && (
                <Stack gap={0}>
                    <Box
                        p={12}
                        mb={16}
                        style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 8 }}
                    >
                        <Group gap={24} wrap="wrap">
                            <Box>
                                <Text size="18px" fw={700} c="white">{data.stats.total_events}</Text>
                                <Text size="10px" c="dimmed">Events analyzed</Text>
                            </Box>
                            <Box>
                                <Text size="18px" fw={700} c="white">{data.stats.unique_ips}</Text>
                                <Text size="10px" c="dimmed">Unique IPs</Text>
                            </Box>
                            <Box>
                                <Text size="18px" fw={700} c="white">{data.stats.unique_countries}</Text>
                                <Text size="10px" c="dimmed">Countries</Text>
                            </Box>
                            <Box>
                                <Text size="18px" fw={700} style={{ color: ACCENT }}>{data.recommendations.length}</Text>
                                <Text size="10px" c="dimmed">Recommendations</Text>
                            </Box>
                        </Group>
                    </Box>

                    {data.recommendations.length === 0 ? (
                        <Alert icon={<IconCheck size={15} />} color="green" variant="light">
                            No issues detected. Your security policies look good.
                        </Alert>
                    ) : (
                        <>
                            <Group justify="space-between" mb={12}>
                                <Text size="xs" c="dimmed">
                                    {selected.size} of {data.recommendations.length} selected
                                </Text>
                                <Button size="xs" variant="subtle" color="gray" onClick={toggleAll}>
                                    {selected.size === data.recommendations.length ? 'Deselect all' : 'Select all'}
                                </Button>
                            </Group>

                            <ScrollArea h={340} scrollbarSize={4}>
                                <Stack gap={8}>
                                    {data.recommendations.map(rec => (
                                        <RecommendationCard
                                            key={rec.id}
                                            rec={rec}
                                            selected={selected.has(rec.id)}
                                            onToggle={toggleSelect}
                                        />
                                    ))}
                                </Stack>
                            </ScrollArea>

                            <Divider color={BORDER} my={16} />

                            <Group justify="space-between">
                                <Button
                                    size="sm"
                                    variant="subtle"
                                    color="gray"
                                    leftSection={<IconRefresh size={14} />}
                                    onClick={runAnalysis}
                                >
                                    Re-analyze
                                </Button>
                                <Button
                                    size="sm"
                                    style={{ backgroundColor: ACCENT }}
                                    leftSection={<IconChevronRight size={14} />}
                                    disabled={selected.size === 0}
                                    onClick={applySelected}
                                >
                                    Apply {selected.size} {selected.size === 1 ? 'policy' : 'policies'}
                                </Button>
                            </Group>
                        </>
                    )}
                </Stack>
            )}
        </Modal>
    );
}
