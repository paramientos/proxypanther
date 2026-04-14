import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
  Box, Heading, Text, Button, HStack,
  Table, Thead, Tbody, Tr, Th, Td,
  useColorModeValue, Input, Badge, Code,
  InputGroup, InputLeftElement, Select,
  SimpleGrid, FormControl, FormLabel,
} from '@chakra-ui/react';
import { Search, Download, Ban } from 'lucide-react';
import { Head, Link, router } from '@inertiajs/react';

const TYPE_COLORS = {
  SQLi: 'red', XSS: 'orange', LFI: 'yellow',
  Bot: 'purple', SensitivePath: 'pink', WAF_Block: 'gray',
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

  const bg = useColorModeValue('white', 'gray.800');
  const headBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <EnterpriseLayout user={auth.user}>
      <Head title="Security Logs" />

      <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Heading size="lg" color="white">Log Explorer</Heading>
          <Text color="gray.500" fontSize="sm">Analyze and export security events across all proxy sites.</Text>
        </Box>
        <Button as="a" href={exportUrl()} leftIcon={<Download size={16} />}
          bg="#16a34a" color="white" _hover={{ bg: '#15803d' }} size="sm">
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Box bg="#161616" p={4} rounded="lg" border="1px solid" borderColor="#242424" mb={6}>
        <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="xs">Search</FormLabel>
            <InputGroup size="sm">
              <InputLeftElement><Search size={14} /></InputLeftElement>
              <Input
                placeholder="IP, path, user-agent..."
                value={form.search}
                onChange={e => setForm(f => ({ ...f, search: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && apply()}
              />
            </InputGroup>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs">Site</FormLabel>
            <Select size="sm" value={form.site_id} onChange={e => { setForm(f => ({ ...f, site_id: e.target.value })); apply({ site_id: e.target.value }); }}>
              <option value="">All Sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs">Type</FormLabel>
            <Select size="sm" value={form.type} onChange={e => { setForm(f => ({ ...f, type: e.target.value })); apply({ type: e.target.value }); }}>
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs">From</FormLabel>
            <Input size="sm" type="date" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs">To</FormLabel>
            <Input size="sm" type="date" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
          </FormControl>
        </SimpleGrid>

        <HStack mt={3} spacing={2}>
          <Button size="sm" bg="#6366f1" color="white" _hover={{ bg: '#4f46e5' }} onClick={() => apply()}>Apply Filters</Button>
          <Button size="sm" variant="ghost" color="gray.500" onClick={() => {
            setForm({ search: '', site_id: '', type: '', from: '', to: '' });
            router.get(route('logs.index'));
          }}>Clear</Button>
        </HStack>
      </Box>

      {/* Table */}
      <Box bg="#161616" rounded="lg" border="1px solid" borderColor="#242424" overflow="hidden">
        <Table variant="unstyled" size="sm">
          <Thead>
            <Tr borderBottom="1px solid" borderColor="#242424">
              {['Time', 'Site', 'IP Address', 'Type', 'Method / Path', 'User Agent', ''].map(h => (
                <Th key={h} py={3} px={4} fontSize="10px" color="gray.600" fontWeight="semibold" letterSpacing="wider">{h}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {events.data.map((event) => (
              <Tr key={event.id} borderBottom="1px solid" borderColor="#1a1a1a" _hover={{ bg: '#1c1c1c' }}>
                <Td px={4} py={2.5} fontSize="xs" whiteSpace="nowrap" color="gray.500">{new Date(event.created_at).toLocaleString()}</Td>
                <Td px={4} py={2.5} fontSize="xs" fontWeight="bold" color="white">{event.proxy_site?.name ?? '—'}</Td>
                <Td px={4} py={2.5} fontSize="xs">
                  <HStack spacing={1}>
                    <Text color="gray.300">{event.ip_address}</Text>
                    <Button
                      as={Link}
                      href={route('banned-ips.store')}
                      method="post"
                      data={{ ip_address: event.ip_address, reason: `Manual ban from Log Explorer for ${event.type}` }}
                      size="xs" colorScheme="red" variant="ghost" px={1}>
                      <Ban size={11} />
                    </Button>
                  </HStack>
                </Td>
                <Td px={4} py={2.5}>
                  <Badge colorScheme={TYPE_COLORS[event.type] || 'gray'} fontSize="10px">{event.type}</Badge>
                </Td>
                <Td px={4} py={2.5} fontSize="xs" maxW="260px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  <Box as="code" bg="#2a2a2a" px={1} py={0.5} borderRadius="sm" fontSize="10px" color="#6366f1" mr={1}>
                    {event.request_method}
                  </Box>
                  <Text as="span" color="gray.400">{event.request_path}</Text>
                </Td>
                <Td px={4} py={2.5} fontSize="xs" maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" color="gray.600">
                  {event.user_agent || '—'}
                </Td>
                <Td px={4} py={2.5}>
                  {event.proxy_site_id && (
                    <Button as={Link} href={route('sites.show', event.proxy_site_id)}
                      size="xs" variant="ghost" color="#6366f1" _hover={{ bg: 'rgba(99,102,241,0.1)' }}>
                      Site →
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
            {events.data.length === 0 && (
              <Tr>
                <Td colSpan={7} textAlign="center" py={12} color="gray.600">
                  No security events found.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>

        {/* Pagination */}
        <Box p={4} display="flex" justifyContent="space-between" alignItems="center"
          borderTop="1px solid" borderColor="#242424">
          <Text fontSize="xs" color="gray.600">
            {events.from}–{events.to} of {events.total} events
          </Text>
          <HStack>
            {events.links.map((link, i) => (
              link.url ? (
                <Button key={i} as={Link} href={link.url} size="xs"
                  variant={link.active ? 'solid' : 'ghost'}
                  bg={link.active ? '#6366f1' : 'transparent'}
                  color={link.active ? 'white' : 'gray.500'}
                  _hover={{ bg: link.active ? '#4f46e5' : '#1c1c1c' }}>
                  {link.label.replace(/<[^>]*>/g, '')}
                </Button>
              ) : (
                <Button key={i} size="xs" variant="ghost" isDisabled color="gray.700">
                  {link.label.replace(/<[^>]*>/g, '')}
                </Button>
              )
            ))}
          </HStack>
        </Box>
      </Box>
    </EnterpriseLayout>
  );
}
