import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
  Box, Title, Text, Button, Group, Table,
  TextInput, Paper, Stack, Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconShield, IconTrash, IconBan } from '@tabler/icons-react';
import { Head, useForm, Link } from '@inertiajs/react';

const CARD_BG = '#111113';
const BORDER = 'rgba(255,255,255,0.07)';

export default function Index({ auth, bannedIps }) {
  const { data, setData, post, processing, reset, errors } = useForm({
    ip_address: '',
    reason: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('banned-ips.store'), {
      onSuccess: () => {
        reset();
        notifications.show({ title: 'IP Banned', color: 'red' });
      },
    });
  };

  return (
    <EnterpriseLayout user={auth.user}>
      <Head title="IP Blacklist" />

      <Box mb={32}>
        <Title order={2} c="white" fw={600}>Global IP Blacklist</Title>
        <Text c="dimmed" size="sm" mt={4}>Prevent malicious actors from accessing any of your sites.</Text>
      </Box>

      <Paper
        p="xl"
        mb={24}
        style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <form onSubmit={submit}>
          <Group align="flex-end" gap={16}>
            <TextInput
              label="IP Address"
              placeholder="e.g. 1.2.3.4"
              required
              value={data.ip_address}
              onChange={e => setData('ip_address', e.target.value)}
              error={errors.ip_address}
              style={{ flex: 1 }}
              styles={{
                label: { color: '#71717a', fontSize: 12 },
                input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
              }}
            />
            <TextInput
              label="Reason"
              placeholder="Optional reason"
              value={data.reason}
              onChange={e => setData('reason', e.target.value)}
              style={{ flex: 1 }}
              styles={{
                label: { color: '#71717a', fontSize: 12 },
                input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
              }}
            />
            <Button
              leftSection={<IconBan size={15} />}
              type="submit"
              loading={processing}
              color="red"
              style={{ flexShrink: 0 }}
            >
              Ban IP
            </Button>
          </Group>
        </form>
      </Paper>

      <Paper style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <Table highlightOnHover highlightOnHoverColor="#18181b">
          <Table.Thead>
            <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['IP Address', 'Reason', 'Date Added', ''].map(h => (
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
            {bannedIps.map(ip => (
              <Table.Tr key={ip.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <Table.Td style={{ padding: '12px 16px' }}>
                  <Text fw={700} c="white" ff="monospace" size="sm">{ip.ip_address}</Text>
                </Table.Td>
                <Table.Td style={{ padding: '12px 16px' }}>
                  <Text c="dimmed" size="sm">{ip.reason || 'No reason provided'}</Text>
                </Table.Td>
                <Table.Td style={{ padding: '12px 16px' }}>
                  <Text size="xs" c="dimmed">{new Date(ip.created_at).toLocaleString()}</Text>
                </Table.Td>
                <Table.Td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <Button
                    component={Link}
                    href={route('banned-ips.destroy', ip.id)}
                    method="delete"
                    size="xs"
                    variant="subtle"
                    color="red"
                    leftSection={<IconTrash size={12} />}
                  >
                    Unban
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {bannedIps.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '48px 16px', color: '#52525b' }}>
                  No IP addresses are currently banned.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </EnterpriseLayout>
  );
}
