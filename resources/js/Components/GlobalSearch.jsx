import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, TextInput, Box, Text, Group, Stack, Kbd, Loader } from '@mantine/core';
import { IconSearch, IconGlobe, IconFileText, IconBan, IconArrowRight } from '@tabler/icons-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

const BORDER = 'rgba(255,255,255,0.07)';
const ACCENT = '#f38020';

const TYPE_META = {
    site: { icon: IconGlobe, color: '#3b82f6', label: 'Site' },
    log: { icon: IconFileText, color: '#f59e0b', label: 'Log Event' },
    ip: { icon: IconBan, color: '#ef4444', label: 'Banned IP' },
};

export default function GlobalSearch({ opened, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(0);
    const inputRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (opened) {
            setQuery('');
            setResults([]);
            setActive(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [opened]);

    const search = useCallback((q) => {
        if (q.length < 2) { setResults([]); setLoading(false); return; }
        setLoading(true);
        axios.get(route('search'), { params: { q } })
            .then(r => { setResults(r.data); setActive(0); })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => search(val), 250);
    };

    const navigate = (url) => {
        onClose();
        router.visit(url);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(a => Math.min(a + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(a => Math.max(a - 1, 0));
        } else if (e.key === 'Enter' && results[active]) {
            navigate(results[active].url);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            withCloseButton={false}
            size={560}
            padding={0}
            radius="md"
            styles={{
                content: { backgroundColor: '#111113', border: `1px solid ${BORDER}`, overflow: 'hidden' },
                overlay: { backdropFilter: 'blur(4px)' },
            }}
        >
            <Box style={{ borderBottom: `1px solid ${BORDER}` }}>
                <Group px={16} py={12} gap={10} wrap="nowrap">
                    {loading
                        ? <Loader size={16} color="orange" />
                        : <IconSearch size={16} color="#52525b" />
                    }
                    <TextInput
                        ref={inputRef}
                        value={query}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Search sites, logs, IPs..."
                        variant="unstyled"
                        style={{ flex: 1 }}
                        styles={{ input: { color: '#e4e4e7', fontSize: 15, padding: 0 } }}
                    />
                    <Kbd size="xs" style={{ backgroundColor: '#27272a', color: '#52525b', border: 'none' }}>
                        ESC
                    </Kbd>
                </Group>
            </Box>

            {results.length > 0 && (
                <Stack gap={0} p={8}>
                    {results.map((r, i) => {
                        const meta = TYPE_META[r.type] ?? TYPE_META.log;
                        const Icon = meta.icon;
                        const isActive = i === active;
                        return (
                            <Box
                                key={i}
                                onClick={() => navigate(r.url)}
                                onMouseEnter={() => setActive(i)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    backgroundColor: isActive ? 'rgba(243,128,32,0.08)' : 'transparent',
                                    transition: 'background 0.1s',
                                }}
                            >
                                <Box
                                    style={{
                                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                        backgroundColor: meta.color + '18',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <Icon size={15} color={meta.color} />
                                </Box>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Text size="sm" c="white" fw={500} truncate>{r.label}</Text>
                                    {r.sublabel && (
                                        <Text size="xs" c="dimmed" truncate>{r.sublabel}</Text>
                                    )}
                                </Box>
                                <Group gap={6} style={{ flexShrink: 0 }}>
                                    <Text size="10px" c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {meta.label}
                                    </Text>
                                    {isActive && <IconArrowRight size={13} color={ACCENT} />}
                                </Group>
                            </Box>
                        );
                    })}
                </Stack>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
                <Box p={32} style={{ textAlign: 'center' }}>
                    <Text c="dimmed" size="sm">No results for "{query}"</Text>
                </Box>
            )}

            {results.length > 0 && (
                <Box px={16} py={10} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <Group gap={16}>
                        <Group gap={4}>
                            <Kbd size="xs" style={{ backgroundColor: '#27272a', color: '#52525b', border: 'none' }}>↑</Kbd>
                            <Kbd size="xs" style={{ backgroundColor: '#27272a', color: '#52525b', border: 'none' }}>↓</Kbd>
                            <Text size="xs" c="dimmed">navigate</Text>
                        </Group>
                        <Group gap={4}>
                            <Kbd size="xs" style={{ backgroundColor: '#27272a', color: '#52525b', border: 'none' }}>↵</Kbd>
                            <Text size="xs" c="dimmed">open</Text>
                        </Group>
                    </Group>
                </Box>
            )}
        </Modal>
    );
}
