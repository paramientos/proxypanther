import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
  Box, Title, Text, Button, Group, Table,
  TextInput, Select, Paper, Badge, Code, Flex,
  SimpleGrid,
} from '@mantine/core';
import { IconSearch, IconDownload, IconBan } from '@tabler/icons-react';
import { Head, Link, router } from '@inertiajs/react';

const CARD_BG = '#111113';
const BORDER = 'rgba(255,255,255,0.07)';

const TYPE_COLORS = {
  SQLi: 'red', XSS: 'orange', LFI: 'yellow',
  Bot: 'violet', SensitivePath: 'pink', WAF_Block: 'gray',
};

export default function Index({ auth, events, filters, sites, types }) {
  const [form, setForm] = React.useState({
    search: filters.search || '',
    site_id: filters.site_id || '',
    type: filters.type || '',
    from: filters.from || '',
    to: filters.to || '',
  });

  const apply = (overrides = {}) => {
    const params = { ...form, ...overrides };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    router.get(route('logs.index'), params, { preserveState: true });
  };

  const exportUrl = () => {
    const params = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => { if (v) params.set(k, v); });
    return route('logs.export') + (params.toString() ? '?' + params.toString() : '');
  };

  return (
    <EnterpriseLayout user={auth.user}>
      <Head title="Security Logs" />

      <Flex justify="space-between" align="center" mb={32}>
        <Box>
          <Title order={2} c="white" fw={600}>Log Explorer</Title>
          <Text c="dimmed" size="sm" mt={4}>Analyze and export security events across all proxy sites.</Text>
        </Box>
        <Button
          component="a"
          href={exportUrl()}
          leftSection={<IconDownload size={15} />}
          color="green"
        >
          Export CSV
        </Button>
      </Flex>

      <Paper p="lg" mb={24} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md">
          <TextInput
            label="Search"
            placeholder="IP, path, user-agent..."
            leftSection={<IconSearch size={14} />}
            value={form.search}
            onChange={e => setForm(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && apply()}
            styles={{
              label: { color: '#71717a', fontSize: 11 },
              input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
            }}
          />
          <Select
            label="Site"
            value={form.site_id || null}
            onChange={v => { setForm(f => ({ ...f, site_id: v || '' })); apply({ site_id: v || '' }); }}
            data={[{ value: '', label: 'All Sites' }, ...sites.map(s => ({ value: String(s.id), label: s.name }))]}
            styles={{
              label: { color: '#71717a', fontSize: 11 },
              input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
            }}
          />
          <Select
            label="Type"
            value={form.type || null}
            onChange={v => { setForm(f => ({ ...f, type: v || '' })); apply({ type: v || '' }); }}
            data={[{ value: '', label: 'All Types' }, ...types.map(t => ({ value: t, label: t }))]}
            styles={{
              label: { color: '#71717a', fontSize: 11 },
              input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
            }}
          />
          <TextInput
            label="From"
            type="date"
            value={form.from}
            onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
            styles={{
              label: { color: '#71717a', fontSize: 11 },
              input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
            }}
          />
          <TextInput
            label="To"
            type="date"
            value={form.to}
            onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
            styles={{
              label: { color: '#71717a', fontSize: 11 },
              input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
            }}
          />
        </SimpleGrid>
        <Group mt={16} gap={8}>
          <Button
            size="sm"
            style={{ backgroundColor: '#f38020' }}
            onClick={() => apply()}
          >
            Apply Filters
          </Button>
          <Button
            size="sm"
            variant="subtle"
            color="gray"
            onClick={() => {
              setForm({ search: '', site_id: '', type: '', from: '', to: '' });
              router.get(route('logs.index'));
            }}
          >
            Clear
          </Button>
        </Group>
      </Paper>

      <Paper style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <Table highlightOnHover highlightOnHoverColor="#18181b" style={{ fontSize: 13 }}>
          <Table.Thead>
            <Table.Tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Time', 'Site', 'IP Address', 'Type', 'Method / Path', 'User Agent', ''].map(h => (
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
            {events.data.map(event => (
              <Table.Tr key={event.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <Table.Td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                  <Text size="xs" c="dimmed">{new Date(event.created_at).toLocaleString()}</Text>
                </Table.Td>
                <Table.Td style={{ padding: '10px 16px' }}>
                  <Text size="xs" fw={700} c="white">{event.proxy_site?.name ?? '—'}</Text>
                </Table.Td>
                <Table.Td style={{ padding: '10px 16px' }}>
                  <Group gap={4}>
                    <Text size="xs" c="gray.3">{event.ip_address}</Text>
                    <Button
                      component={Link}
                      href={route('banned-ips.store')}
                      method="post"
                      data={{ ip_address: event.ip_address, reason: `Manual ban from Log Explorer for ${event.type}` }}
                      size="xs"
                      variant="subtle"
                      color="red"
                      px={4}
                    >
                      <IconBan size={11} />
                    </Button>
                  </Group>
                </Table.Td>
                <Table.Td style={{ padding: '10px 16px' }}>
                  <Badge
                    color={TYPE_COLORS[event.type] || 'gray'}
                    size="xs"
                  >
                    {event.type}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ padding: '10px 16px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Code
                    style={{ backgroundColor: '#27272a', color: '#f38020', fontSize: 10, marginRight: 6 }}
                  >
                    {event.request_method}
                  </Code>
                  <Text as="span" size="xs" c="dimmed">{event.request_path}</Text>
                </Table.Td>
                <Table.Td style={{ padding: '10px 16px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Text size="xs" c="dimmed">{event.user_agent || '—'}</Text>
                </Table.Td>
                <Table.Td style={{ padding: '10px 16px' }}>
                  {event.proxy_site_id && (
                    <Button
                      component={Link}
                      href={route('sites.show', event.proxy_site_id)}
                      size="xs"
                      variant="subtle"
                      color="orange"
                    >
                      Site →
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
            {events.data.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: '#52525b' }}>
                  No security events found.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <Flex
          p={16}
          justify="space-between"
          align="center"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <Text size="xs" c="dimmed">
            {events.from}–{events.to} of {events.total} events
          </Text>
          <Group gap={4}>
            {events.links.map((link, i) => (
              link.url ? (
                <Button
                  key={i}
                  component={Link}
                  href={link.url}
                  size="xs"
                  variant={link.active ? 'filled' : 'subtle'}
                  color={link.active ? 'orange' : 'gray'}
                >
                  {link.label.replace(/<[^>]*>/g, '')}
                </Button>
              ) : (
                <Button key={i} size="xs" variant="subtle" color="gray" disabled>
                  {link.label.replace(/<[^>]*>/g, '')}
                </Button>
              )
            ))}
          </Group>
        </Flex>
      </Paper>
    </EnterpriseLayout>
  );
}
