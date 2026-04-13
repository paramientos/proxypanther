import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Input,
  Badge,
  Code,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import { Search, Shield, Filter, ExternalLink, Ban } from 'lucide-react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ auth, events, filters }) {
  const [search, setSearch] = React.useState(filters.search || '');

  const handleSearch = (e) => {
    e.preventDefault();
    router.get(route('logs.index'), { search, site_id: filters.site_id }, { preserveState: true });
  };

  return (
    <AppLayout user={auth.user}>
      <Head title="Security Logs" />

      <Box mb={8} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Heading size="lg">Log Explorer</Heading>
          <Text color="gray.500">Analyze security events across all your proxy sites.</Text>
        </Box>
      </Box>

      <Box bg={useColorModeValue('white', 'gray.800')} p={4} rounded="lg" shadow="base" mb={8}>
        <form onSubmit={handleSearch}>
          <HStack spacing={4}>
            <InputGroup maxW="md">
              <InputLeftElement pointerEvents="none">
                <Search size={18} color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search by IP, type or path..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </InputGroup>
            <Button type="submit" colorScheme="blue">Search</Button>
            {search && (
              <Button variant="ghost" onClick={() => { setSearch(''); router.get(route('logs.index')); }}>Clear</Button>
            )}
          </HStack>
        </form>
      </Box>

      <Box bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg" overflow="hidden">
        <Table variant="simple">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
              <Th>Time</Th>
              <Th>Site</Th>
              <Th>IP Address</Th>
              <Th>Type</Th>
              <Th>Method / Path</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {events.data.map((event) => (
              <Tr key={event.id}>
                <Td fontSize="sm">{new Date(event.created_at).toLocaleString()}</Td>
                <Td fontSize="sm" fontWeight="bold">{event.proxy_site?.name}</Td>
                <Td fontSize="sm">
                  <HStack>
                    <Text>{event.ip_address}</Text>
                    <Button
                      as={Link}
                      href={route('banned-ips.store')}
                      method="post"
                      data={{ ip_address: event.ip_address, reason: `Manual ban from Log Explorer for ${event.type}` }}
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      title="Ban IP"
                    >
                      <Ban size={12} />
                    </Button>
                  </HStack>
                </Td>
                <Td>
                  <Badge colorScheme="red">{event.type}</Badge>
                </Td>
                <Td fontSize="sm">
                  <Code fontSize="xs">{event.request_method}</Code> {event.request_path}
                </Td>
                <Td textAlign="right">
                   {event.proxy_site_id ? (
                     <Button as={Link} href={route('sites.show', event.proxy_site_id)} size="xs" variant="ghost">
                       View Site
                     </Button>
                   ) : (
                     <Text fontSize="xs" color="gray.500">—</Text>
                   )}
                </Td>
              </Tr>
            ))}
            {events.data.length === 0 && (
              <Tr>
                <Td colSpan={6} textAlign="center" py={10} color="gray.500">
                  No security events found matching your criteria.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>

        {/* Basic Pagination */}
        <Box p={4} display="flex" justifyContent="center">
          <HStack>
            {events.links.map((link, i) => (
              link.url ? (
                <Button
                  key={i}
                  as={Link}
                  href={link.url}
                  size="sm"
                  variant={link.active ? 'solid' : 'ghost'}
                  colorScheme={link.active ? 'blue' : 'gray'}
                >
                  {link.label.replace(/<[^>]*>/g, '')}
                </Button>
              ) : (
                <Button
                  key={i}
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  isDisabled
                >
                  {link.label.replace(/<[^>]*>/g, '')}
                </Button>
              )
            ))}
          </HStack>
        </Box>
      </Box>
    </AppLayout>
  );
}
