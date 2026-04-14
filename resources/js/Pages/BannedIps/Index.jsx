import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  FormControl,
  FormLabel,
  Input,
  useToast,
} from '@chakra-ui/react';
import { Shield, Trash2, Ban } from 'lucide-react';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Index({ auth, bannedIps }) {
  const toast = useToast();
  const { data, setData, post, processing, reset, errors } = useForm({
    ip_address: '',
    reason: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('banned-ips.store'), {
      onSuccess: () => {
        reset();
        toast({ title: 'IP Banned', status: 'success' });
      },
    });
  };

  return (
    <EnterpriseLayout user={auth.user}>
      <Head title="IP Blacklist" />

      <Box mb={8}>
        <Heading size="lg" color="white">Global IP Blacklist</Heading>
        <Text color="gray.500" fontSize="sm">Prevent malicious actors from accessing any of your sites.</Text>
      </Box>

      <Box bg="#161616" p={6} rounded="lg" border="1px solid" borderColor="#242424" mb={6}>
        <form onSubmit={submit}>
          <HStack align="flex-end" spacing={4}>
            <FormControl isRequired isInvalid={errors.ip_address}>
              <FormLabel fontSize="sm" color="gray.400">IP Address</FormLabel>
              <Input
                placeholder="e.g. 1.2.3.4"
                value={data.ip_address}
                onChange={e => setData('ip_address', e.target.value)}
                bg="#0d0d0d" borderColor="#242424" color="white"
                _focus={{ borderColor: '#6366f1', boxShadow: '0 0 0 1px #6366f1' }}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" color="gray.400">Reason</FormLabel>
              <Input
                placeholder="Optional reason"
                value={data.reason}
                onChange={e => setData('reason', e.target.value)}
                bg="#0d0d0d" borderColor="#242424" color="white"
                _focus={{ borderColor: '#6366f1', boxShadow: '0 0 0 1px #6366f1' }}
              />
            </FormControl>
            <Button
              leftIcon={<Ban size={16} />}
              bg="#ef4444" color="white" _hover={{ bg: '#dc2626' }}
              type="submit" isLoading={processing} px={8} flexShrink={0}
            >
              Ban IP
            </Button>
          </HStack>
          {errors.ip_address && <Text color="red.400" fontSize="xs" mt={1}>{errors.ip_address}</Text>}
        </form>
      </Box>

      <Box bg="#161616" rounded="lg" border="1px solid" borderColor="#242424" overflow="hidden">
        <Table variant="unstyled">
          <Thead>
            <Tr borderBottom="1px solid" borderColor="#242424">
              {['IP Address', 'Reason', 'Date Added', ''].map(h => (
                <Th key={h} py={3} px={4} fontSize="10px" color="gray.600" fontWeight="semibold" letterSpacing="wider">{h}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {bannedIps.map((ip) => (
              <Tr key={ip.id} borderBottom="1px solid" borderColor="#1a1a1a" _hover={{ bg: '#1c1c1c' }}>
                <Td px={4} py={3} fontWeight="bold" color="white" fontFamily="mono" fontSize="sm">{ip.ip_address}</Td>
                <Td px={4} py={3} color="gray.500" fontSize="sm">{ip.reason || 'No reason provided'}</Td>
                <Td px={4} py={3} fontSize="xs" color="gray.600">{new Date(ip.created_at).toLocaleString()}</Td>
                <Td px={4} py={3} textAlign="right">
                  <Button
                    as={Link}
                    href={route('banned-ips.destroy', ip.id)}
                    method="delete"
                    size="xs"
                    variant="ghost"
                    color="gray.500"
                    _hover={{ color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }}
                    leftIcon={<Trash2 size={13} />}
                  >
                    Unban
                  </Button>
                </Td>
              </Tr>
            ))}
            {bannedIps.length === 0 && (
              <Tr>
                <Td colSpan={4} textAlign="center" py={12} color="gray.600">
                  No IP addresses are currently banned.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </EnterpriseLayout>
  );
}
