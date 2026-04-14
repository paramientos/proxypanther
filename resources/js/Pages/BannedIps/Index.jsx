import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
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
  FormControl,
  FormLabel,
  Input,
  useToast,
  Icon,
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
        <Heading size="lg">Global IP Blacklist</Heading>
        <Text color="gray.500">Prevent malicious actors from accessing any of your sites.</Text>
      </Box>

      <Box bg={useColorModeValue('white', 'gray.800')} p={6} rounded="lg" shadow="base" mb={8}>
        <form onSubmit={submit}>
          <HStack align="flex-end" spacing={4}>
            <FormControl isRequired isInvalid={errors.ip_address}>
              <FormLabel>IP Address</FormLabel>
              <Input
                placeholder="e.g. 1.2.3.4"
                value={data.ip_address}
                onChange={e => setData('ip_address', e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Reason</FormLabel>
              <Input
                placeholder="Optional reason"
                value={data.reason}
                onChange={e => setData('reason', e.target.value)}
              />
            </FormControl>
            <Button
              leftIcon={<Ban size={18} />}
              colorScheme="red"
              type="submit"
              isLoading={processing}
              px={8}
            >
              Ban IP
            </Button>
          </HStack>
          {errors.ip_address && <Text color="red.500" fontSize="xs" mt={1}>{errors.ip_address}</Text>}
        </form>
      </Box>

      <Box bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg" overflow="hidden">
        <Table variant="simple">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
              <Th>IP Address</Th>
              <Th>Reason</Th>
              <Th>Date Added</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {bannedIps.map((ip) => (
              <Tr key={ip.id}>
                <Td fontWeight="bold">{ip.ip_address}</Td>
                <Td color="gray.500">{ip.reason || 'No reason provided'}</Td>
                <Td fontSize="sm">{new Date(ip.created_at).toLocaleString()}</Td>
                <Td textAlign="right">
                  <Button
                    as={Link}
                    href={route('banned-ips.destroy', ip.id)}
                    method="delete"
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    leftIcon={<Trash2 size={14} />}
                  >
                    Unban
                  </Button>
                </Td>
              </Tr>
            ))}
            {bannedIps.length === 0 && (
              <Tr>
                <Td colSpan={4} textAlign="center" py={10} color="gray.500">
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
