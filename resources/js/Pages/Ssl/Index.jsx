import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Box, Heading, Text, SimpleGrid, Badge, HStack, VStack,
    Stat, StatLabel, StatNumber, StatHelpText,
    Table, Thead, Tbody, Tr, Th, Td,
    useColorModeValue, Icon, Alert, AlertIcon,
} from '@chakra-ui/react';
import { Lock, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';

export default function Index({ auth, sites, certs }) {
    const bg = useColorModeValue('white', 'gray.800');
    const headBg = useColorModeValue('gray.50', 'gray.700');

    const sslSites = sites.filter(s => s.ssl_enabled !== false);
    const onlineSites = sslSites.filter(s => s.is_online);

    return (
        <AppLayout user={auth.user}>
            <Head title="SSL Certificates" />

            <Box mb={6}>
                <Heading size="lg">SSL Certificate Panel</Heading>
                <Text color="gray.500">Caddy manages all certificates automatically via Let's Encrypt.</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                <Stat px={5} py={4} bg={bg} shadow="base" rounded="lg">
                    <StatLabel>SSL-Enabled Sites</StatLabel>
                    <StatNumber>{sslSites.length}</StatNumber>
                    <StatHelpText>Auto-managed by Caddy</StatHelpText>
                </Stat>
                <Stat px={5} py={4} bg={bg} shadow="base" rounded="lg">
                    <StatLabel>Online & Healthy</StatLabel>
                    <StatNumber color="green.400">{onlineSites.length}</StatNumber>
                    <StatHelpText>Responding to health checks</StatHelpText>
                </Stat>
                <Stat px={5} py={4} bg={bg} shadow="base" rounded="lg">
                    <StatLabel>HTTP-Only Sites</StatLabel>
                    <StatNumber color="orange.400">{sites.filter(s => !s.ssl_enabled).length}</StatNumber>
                    <StatHelpText>No SSL configured</StatHelpText>
                </Stat>
            </SimpleGrid>

            <Alert status="info" rounded="lg" mb={6}>
                <AlertIcon />
                Caddy automatically renews certificates 30 days before expiry. No manual action needed.
                Certificate data is served from the Caddy Admin API at <Text as="span" fontFamily="mono" fontSize="sm">localhost:2019</Text>.
            </Alert>

            <Box bg={bg} shadow="base" rounded="lg" overflow="hidden">
                <Box px={6} py={4} borderBottom="1px" borderColor={useColorModeValue('gray.100', 'gray.700')}>
                    <HStack>
                        <Icon as={Lock} color="green.400" />
                        <Heading size="sm">Site SSL Status</Heading>
                    </HStack>
                </Box>
                <Table variant="simple" size="sm">
                    <Thead bg={headBg}>
                        <Tr>
                            <Th>Domain</Th>
                            <Th>SSL</Th>
                            <Th>Backend Status</Th>
                            <Th>Last Check</Th>
                            <Th></Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {sites.map(site => (
                            <Tr key={site.id}>
                                <Td fontWeight="medium">{site.domain}</Td>
                                <Td>
                                    {site.ssl_enabled ? (
                                        <HStack spacing={1}>
                                            <Icon as={CheckCircle} color="green.400" boxSize={4} />
                                            <Badge colorScheme="green">HTTPS / Auto</Badge>
                                        </HStack>
                                    ) : (
                                        <HStack spacing={1}>
                                            <Icon as={AlertTriangle} color="orange.400" boxSize={4} />
                                            <Badge colorScheme="orange">HTTP Only</Badge>
                                        </HStack>
                                    )}
                                </Td>
                                <Td>
                                    <Badge colorScheme={site.is_online ? 'green' : 'red'}>
                                        {site.is_online ? 'Online' : 'Offline'}
                                    </Badge>
                                </Td>
                                <Td fontSize="xs" color="gray.500">
                                    {site.last_check_at ? new Date(site.last_check_at).toLocaleString() : '—'}
                                </Td>
                                <Td>
                                    <Text as={Link} href={route('sites.show', site.id)} fontSize="xs" color="blue.400">
                                        Configure →
                                    </Text>
                                </Td>
                            </Tr>
                        ))}
                        {sites.length === 0 && (
                            <Tr>
                                <Td colSpan={5} textAlign="center" py={10} color="gray.500">
                                    No proxy sites configured yet.
                                </Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </Box>

            {certs && Object.keys(certs).length > 0 && (
                <Box bg={bg} shadow="base" rounded="lg" p={6} mt={6}>
                    <Heading size="sm" mb={4}>Caddy Admin API Response</Heading>
                    <Box
                        as="pre"
                        fontSize="xs"
                        bg={useColorModeValue('gray.50', 'gray.900')}
                        p={4}
                        rounded="md"
                        overflow="auto"
                        maxH="300px"
                    >
                        {JSON.stringify(certs, null, 2)}
                    </Box>
                </Box>
            )}
        </AppLayout>
    );
}
