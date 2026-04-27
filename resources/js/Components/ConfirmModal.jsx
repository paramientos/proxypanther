import React, { useState, useEffect } from 'react';
import { Modal, Text, TextInput, Button, Group, Box, Stack } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

const BORDER = 'rgba(255,255,255,0.07)';

export default function ConfirmModal({ opened, onClose, onConfirm, title, description, confirmWord, loading = false }) {
    const [input, setInput] = useState('');

    useEffect(() => {
        if (opened) setInput('');
    }, [opened]);

    const isValid = confirmWord ? input === confirmWord : true;

    const handleConfirm = () => {
        if (!isValid) return;
        onConfirm();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            withCloseButton={false}
            size={440}
            padding={0}
            radius="md"
            styles={{
                content: { backgroundColor: '#111113', border: `1px solid rgba(239,68,68,0.3)` },
            }}
        >
            <Box p={24}>
                <Stack gap={16}>
                    <Group gap={12}>
                        <Box style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <IconAlertTriangle size={18} color="#ef4444" />
                        </Box>
                        <Box>
                            <Text fw={600} c="white" size="sm">{title}</Text>
                            <Text c="dimmed" size="xs" mt={2}>{description}</Text>
                        </Box>
                    </Group>

                    {confirmWord && (
                        <Box style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
                            <Text size="xs" c="dimmed" mb={8}>
                                Type <Text component="span" c="white" fw={600} ff="monospace">{confirmWord}</Text> to confirm
                            </Text>
                            <TextInput
                                placeholder={confirmWord}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                                autoFocus
                                styles={{
                                    input: {
                                        backgroundColor: '#0a0a0b',
                                        borderColor: input && !isValid ? '#ef4444' : BORDER,
                                        color: '#e4e4e7',
                                        fontFamily: 'monospace',
                                    },
                                }}
                            />
                        </Box>
                    )}

                    <Group justify="flex-end" gap={8} style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
                        <Button variant="subtle" color="gray" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            size="sm"
                            disabled={!isValid}
                            loading={loading}
                            onClick={handleConfirm}
                        >
                            Confirm
                        </Button>
                    </Group>
                </Stack>
            </Box>
        </Modal>
    );
}
