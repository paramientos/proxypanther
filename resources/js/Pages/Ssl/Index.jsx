import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Heading, Text, SimpleGrid, Badge, HStack, Button,
    Table, Thead, Tbody, Tr, Th, Td, Icon,
} from '@chakra-ui/react';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';

export default function Index({ auth, sites, certs }) {
    const sslSites = sites.filter(s => s.ssl_enabled !== false);
    const onlineSites = sslSites.filter(s => s.is_online);

    const kpis = [
        { label: 'SSL-Enabled Sites', value: sslSites.length, sub: 'Auto-managed by Caddy', color: '#F68220' },
        { label: 'Online & Healthy', value: onlineSites.length, sub: 'Responding to health checks', color: '#22c55e' },
        { label: 'HTTP-Only Sites', value: sites.filter(s => !s.ssl_enabled).length, sub: 'No SSL configured', color: '#f59e0b' },
    ];

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title="SSL Certificates" />

            <Box mb={6}>
                <Heading size="lg" color="white">SSL Certificate Panel</Heading>
                <Text color="gray.500" fontSize="sm">Caddy manages all certificates automatically via Let's Encrypt.</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                {kpis.map(k => (
                    <Box key={k.label} bg="#161616" p={5} rounded="lg" border="1px solid" borderColor="#242424">
                        <Text fontSize="2xl" fontWeight="bold" color={k.color}>{k.value}</Text>
                        <Text fontSize="sm" color="white" fontWeight="medium" mt={1}>{k.label}</Text>
                        <Text fontSize="xs" color="gray.600" mt={0.5}>{k.sub}</Text>
                    </Box>
                ))}
            </SimpleGrid>

            <Box bg="#161616" rounded="lg" border="1px solid" borderColor="#242424" p={4} mb={6}>
                <HStack spacing={2}>
                    <Icon as={Lock} color="#F68220" boxSize={4} />
                    <Text fontSize="sm" color="gray.400">
                        Caddy automatically renews certificates 30 days before expiry. Certificate data is served from the Caddy Admin API at{' '}
                        <Box as="code" bg="#2a2a2a" px={1} borderRadius="sm" fontSize="xs" color="#F68220">localhost:2019</Box>.
                    </Text>
                </HStack>
            </Box>

            <Box bg="#161616" rounded="lg" border="1px solid" borderColor="#242424" overflow="hidden">
                <Box px={5} py={4} borderBottom="1px solid" borderColor="#242424">
                    <HStack>
                        <Icon as={Lock} color="#F68220" boxSize={4} />
                        <Text fontWeight="semibold" color="white" fontSize="sm">Site SSL Status</Text>
                    </HStack>
                </Box>
                <Table variant="unstyled" size="sm">
                    <Thead>
                        <Tr borderBottom="1px solid" borderColor="#242424">
                            {['Domain', 'SSL', 'Backend Status', 'Last Check', ''].map(h => (
                                <Th key={h} py={3} px={4} fontSize="10px" color="gray.600" fontWeight="semibold" letterSpacing="wider">{h}</Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {sites.map(site => (
                            <Tr key={site.id} borderBottom="1px solid" borderColor="#1a1a1a" _hover={{ bg: '#1c1c1c' }}>
                                <Td px={4} py={3} fontWeight="medium" color="white" fontSize="sm">{site.domain}</Td>
                                <Td px={4} py={3}>
                                    {site.ssl_enabled ? (
                                        <HStack spacing={1}>
                                            <Icon as={CheckCircle} color="#22c55e" boxSize={3.5} />
                                            <Badge colorScheme="green" fontSize="10px">HTTPS / Auto</Badge>
                                        </HStack>
                                    ) : (
                                        <HStack spacing={1}>
                                            <Icon as={AlertTriangle} color="#f59e0b" boxSize={3.5} />
                                            <Badge colorScheme="yellow" fontSize="10px">HTTP Only</Badge>
                                        </HStack>
                                    )}
                                </Td>
                                <Td px={4} py={3}>
                                    <HStack spacing={1.5}>
                                        <Box w={1.5} h={1.5} borderRadius="full"
                                            bg={site.is_online ? '#22c55e' : '#ef4444'}
                                            boxShadow={site.is_online ? '0 0 5px rgba(34,197,94,0.7)' : '0 0 5px rgba(239,68,68,0.7)'} />
                                        <Text fontSize="xs" color={site.is_online ? '#22c55e' : '#ef4444'}>
                                            {site.is_online ? 'Online' : 'Offline'}
                                        </Text>
                                    </HStack>
                                </Td>
                                <Td px={4} py={3} fontSize="xs" color="gray.600">
                                    {site.last_check_at ? new Date(site.last_check_at).toLocaleString() : '—'}
                                </Td>
                                <Td px={4} py={3}>
                                    <Button as={Link} href={route('sites.show', site.id)}
                                        size="xs" variant="ghost" color="#F68220" _hover={{ bg: 'rgba(246,130,32,0.1)' }}>
                                        Configure →
                                    </Button>
                                </Td>
                            </Tr>
                        ))}
                        {sites.length === 0 && (
                            <Tr><Td colSpan={5} textAlign="center" py={12} color="gray.600">No proxy sites configured yet.</Td></Tr>
                        )}
                    </Tbody>
                </Table>
            </Box>

            {certs && Object.keys(certs).length > 0 && (
                <Box bg="#161616" rounded="lg" border="1px solid" borderColor="#242424" p={6} mt={4}>
                    <Text fontWeight="semibold" color="white" fontSize="sm" mb={3}>Caddy Admin API Response</Text>
                    <Box as="pre" fontSize="xs" bg="#0d0d0d" p={4} rounded="md" overflow="auto" maxH="300px" color="gray.400">
                        {JSON.stringify(certs, null, 2)}
                    </Box>
                </Box>
            )}
        </EnterpriseLayout>
    );
}
