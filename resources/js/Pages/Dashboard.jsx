import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Badge,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Flex,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  VStack,
  Select,
  Textarea,
  Code,
} from '@chakra-ui/react';
import { Plus, Shield, Globe, Activity, ExternalLink, AlertTriangle, TrendingUp, RefreshCcw } from 'lucide-react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';

export default function Dashboard({ auth, sites: initialSites, bannedIps, analytics, recentEvents }) {
  const [sites, setSites] = React.useState(initialSites);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  React.useEffect(() => {
    if (!window.Echo) {
      console.warn('Echo is not initialized. Real-time updates will not work.');
      return;
    }
    
    const channel = window.Echo.channel('health-checks');
    
    channel.listen('BackendHealthUpdated', (e) => {
      setSites(currentSites => currentSites.map(site => 
        site.id === e.id ? { ...site, is_online: e.is_online, last_check_at: e.last_check_at, last_error: e.last_error } : site
      ));
    });

    return () => {
      if (window.Echo) {
        window.Echo.leaveChannel('health-checks');
      }
    };
  }, []);

  const handleManualCheck = (siteId) => {
    router.post(route('sites.check-health', siteId), {}, { preserveScroll: true });
  };
  
  const chartOptions = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#3182ce',
      textStyle: { color: '#fff' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: analytics.map(a => a.date),
      axisLine: { lineStyle: { color: '#718096' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#718096' } },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
    series: [
      {
        name: 'Attacks Blocked',
        type: 'line',
        smooth: true,
        data: analytics.map(a => a.count),
        itemStyle: { color: '#f56565' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 101, 101, 0.5)' },
              { offset: 1, color: 'rgba(245, 101, 101, 0)' }
            ]
          }
        },
      },
    ],
  };

  const { data, setData, post, processing, reset, errors } = useForm({
    name: '',
    domain: '',
    backend_url: '',
    backend_type: 'proxy',
    root_path: '',
    ssl_enabled: true,
    waf_enabled: true,
    rate_limit_rps: 5,
    cache_enabled: false,
    cache_ttl: 3600,
    is_maintenance: false,
    maintenance_message: '',
    backup_backend_url: '',
    custom_waf_rules: [],
    env_vars: {},
    custom_error_403: '',
    custom_error_503: '',
    ip_allowlist: '',
    ip_denylist: '',
    block_common_bad_bots: true,
    bot_challenge_mode: false,
    bot_challenge_force: false,
    route_policies: [],
    circuit_breaker_enabled: false,
    circuit_breaker_threshold: 5,
    circuit_breaker_retry_seconds: 30,
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('sites.store'), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const totalBlocked = sites.reduce((acc, s) => acc + s.blocked_requests, 0);

  return (
    <AppLayout user={auth.user}>
      <Head title="Dashboard" />

      <Box mb={8} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Heading size="lg">Proxy Sites</Heading>
          <Text color="gray.500">Manage your reverse proxy and WAF settings</Text>
        </Box>
        <HStack spacing={4}>
          <Button as={Link} href={route('banned-ips.index')} leftIcon={<Shield size={18} />} colorScheme="red" variant="outline">
            IP Blacklist
          </Button>
          <Button leftIcon={<Plus size={18} />} colorScheme="blue" onClick={onOpen}>
            Add Site
          </Button>
        </HStack>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Stat px={4} py={5} bg={useColorModeValue('white', 'gray.800')} shadow={'base'} rounded={'lg'}>
          <StatLabel fontWeight={'medium'}>Active Sites</StatLabel>
          <StatNumber fontSize={'2xl'} fontWeight={'medium'}>
            {sites.filter(s => s.is_active).length} / {sites.length}
          </StatNumber>
        </Stat>
        <Stat px={4} py={5} bg={useColorModeValue('white', 'gray.800')} shadow={'base'} rounded={'lg'}>
          <StatLabel fontWeight={'medium'}>Total Attacks Blocked</StatLabel>
          <StatNumber fontSize={'2xl'} fontWeight={'medium'} color="red.500">
            {totalBlocked}
          </StatNumber>
        </Stat>
        <Stat px={4} py={5} bg={useColorModeValue('white', 'gray.800')} shadow={'base'} rounded={'lg'}>
          <StatLabel fontWeight={'medium'}>System Health</StatLabel>
          <StatNumber fontSize={'2xl'} fontWeight={'medium'} color={sites.every(s => s.is_online) ? "green.500" : "red.500"}>
            {sites.filter(s => s.is_online).length} / {sites.length} Online
          </StatNumber>
        </Stat>
      </SimpleGrid>

      <Box bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg" p={6} mb={8}>
        <HStack mb={4}>
          <Icon as={TrendingUp} color="blue.500" />
          <Heading size="md">Security Events Trend (Last 7 Days)</Heading>
        </HStack>
        <Box height="300px">
          <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} />
        </Box>
      </Box>

      <Box bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg" overflow="hidden" mb={8}>
        <Box p={4} borderBottomWidth="1px" display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md"><Icon as={AlertTriangle} color="red.500" mr={2} /> Recent Security Events</Heading>
          <Button as={Link} href={route('banned-ips.index')} size="sm" variant="ghost">View Blacklist</Button>
        </Box>
        <Table variant="simple" size="sm">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
              <Th>Time</Th>
              <Th>Site</Th>
              <Th>IP Address</Th>
              <Th>Type</Th>
              <Th>Method / Path</Th>
            </Tr>
          </Thead>
          <Tbody>
            {recentEvents.map((event) => (
              <Tr key={event.id}>
                <Td fontSize="xs">{new Date(event.created_at).toLocaleTimeString()}</Td>
                <Td fontSize="xs" fontWeight="bold">{event.proxy_site?.name}</Td>
                <Td fontSize="xs">{event.ip_address}</Td>
                <Td>
                  <Badge size="sm" colorScheme="red" fontSize="10px">{event.type}</Badge>
                </Td>
                <Td fontSize="xs" isTruncated maxW="200px">
                  <Code fontSize="10px">{event.request_method}</Code> {event.request_path}
                </Td>
              </Tr>
            ))}
            {recentEvents.length === 0 && (
              <Tr>
                <Td colSpan={5} textAlign="center" py={4} color="gray.500">No recent security events.</Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      <Box bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg" overflow="hidden">
        <Table variant="simple">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
              <Th>Status</Th>
              <Th>Site</Th>
              <Th>Backend</Th>
              <Th>Protection</Th>
              <Th>Requests</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {sites.map((site) => (
              <Tr key={site.id}>
                <Td>
                  <HStack spacing={2}>
                    <Badge
                      colorScheme={site.is_online ? 'green' : 'red'}
                      variant="solid"
                      rounded="full"
                      px={2}
                      title={site.is_online ? 'Online' : `Offline: ${site.last_error}`}
                    >
                      {site.is_online ? 'ONLINE' : 'OFFLINE'}
                    </Badge>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleManualCheck(site.id)}
                      title="Re-check health"
                    >
                      <RefreshCcw size={12} />
                    </Button>
                  </HStack>
                </Td>
                <Td>
                  <Stack spacing={0}>
                    <Text fontWeight="bold">{site.name}</Text>
                    <Text fontSize="xs" color="gray.500">{site.domain}</Text>
                  </Stack>
                </Td>
                <Td fontSize="sm">
                  <Badge variant="outline" colorScheme="gray">{site.backend_url}</Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    {site.ssl_enabled && <Badge colorScheme="green">SSL</Badge>}
                    {site.waf_enabled && <Badge colorScheme="purple">WAF</Badge>}
                    {site.auth_user && <Badge colorScheme="blue">AUTH</Badge>}
                  </HStack>
                </Td>
                <Td fontSize="sm">
                   <Text>{site.total_requests} total</Text>
                   <Text color="red.500" fontSize="xs">{site.blocked_requests} blocked</Text>
                </Td>
                <Td textAlign="right">
                   <Button
                     as={Link}
                     href={route('sites.show', site.id)}
                     size="sm"
                     rightIcon={<ExternalLink size={14} />}
                     variant="ghost"
                   >
                     Manage
                   </Button>
                </Td>
              </Tr>
            ))}
            {sites.length === 0 && (
              <Tr>
                <Td colSpan={5} textAlign="center" py={10}>
                  No proxy sites configured.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Add Site Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={useColorModeValue('white', 'gray.800')}>
          <form onSubmit={submit}>
            <ModalHeader>Add New Proxy Site</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                <FormControl isRequired isInvalid={errors.name}>
                  <FormLabel>Site Name</FormLabel>
                  <Input
                    placeholder="e.g. My Blog"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                  />
                  {errors.name && <Text color="red.500" fontSize="xs">{errors.name}</Text>}
                </FormControl>

                <FormControl>
                  <FormLabel>Per-Route Policy (JSON)</FormLabel>
                  <Textarea
                    placeholder='[{"path":"/admin/*","rate_limit_rps":5,"bot_challenge_mode":true,"waf_enabled":true}]'
                    size="sm"
                    value={JSON.stringify(data.route_policies, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value || '[]');
                        setData('route_policies', Array.isArray(parsed) ? parsed : []);
                      } catch {
                      }
                    }}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Define path-based rules for bot challenge and rate policies.
                  </Text>
                </FormControl>
                <FormControl isRequired isInvalid={errors.domain}>
                  <FormLabel>Domain</FormLabel>
                  <Input
                    placeholder="blog.com"
                    value={data.domain}
                    onChange={(e) => setData('domain', e.target.value)}
                  />
                  {errors.domain && <Text color="red.500" fontSize="xs">{errors.domain}</Text>}
                </FormControl>
                <FormControl isRequired isInvalid={errors.backend_url}>
                  <FormLabel>Backend URL / FastCGI Socket</FormLabel>
                  <Input
                    placeholder={data.backend_type === 'proxy' ? 'http://localhost:8001' : '/var/run/php/php-fpm.sock'}
                    value={data.backend_url}
                    onChange={(e) => setData('backend_url', e.target.value)}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {data.backend_type === 'proxy' 
                      ? 'Multiple URLs supported for Load Balancing (separate with comma or space).' 
                      : 'Enter path to PHP-FPM socket or TCP address.'}
                  </Text>
                  {errors.backend_url && <Text color="red.500" fontSize="xs">{errors.backend_url}</Text>}
                </FormControl>
                
                <FormControl isInvalid={errors.backup_backend_url}>
                  <FormLabel>Backup Backend URL (Failover)</FormLabel>
                  <Input
                    placeholder="e.g. http://backup-server:8001"
                    value={data.backup_backend_url}
                    onChange={(e) => setData('backup_backend_url', e.target.value)}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    If the primary backend fails, traffic will automatically switch to this server.
                  </Text>
                  {errors.backup_backend_url && <Text color="red.500" fontSize="xs">{errors.backup_backend_url}</Text>}
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Backend Type</FormLabel>
                  <Select value={data.backend_type} onChange={(e) => setData('backend_type', e.target.value)}>
                    <option value="proxy">Reverse Proxy (HTTP)</option>
                    <option value="php_fpm">PHP-FPM (FastCGI)</option>
                  </Select>
                </FormControl>

                {data.backend_type === 'php_fpm' && (
                  <FormControl isRequired isInvalid={errors.root_path}>
                    <FormLabel>Root Path (on server)</FormLabel>
                    <Input
                      placeholder="/var/www/my-app/public"
                      value={data.root_path}
                      onChange={(e) => setData('root_path', e.target.value)}
                    />
                    {errors.root_path && <Text color="red.500" fontSize="xs">{errors.root_path}</Text>}
                  </FormControl>
                )}
                <SimpleGrid columns={2} spacing={4}>
                   <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Enable SSL</FormLabel>
                      <Switch isChecked={data.ssl_enabled} onChange={(e) => setData('ssl_enabled', e.target.checked)} />
                   </FormControl>
                   <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Enable WAF</FormLabel>
                      <Switch isChecked={data.waf_enabled} onChange={(e) => setData('waf_enabled', e.target.checked)} />
                   </FormControl>
                   <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Enable Cache</FormLabel>
                      <Switch isChecked={data.cache_enabled} onChange={(e) => setData('cache_enabled', e.target.checked)} />
                   </FormControl>
                   <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Maintenance Mode</FormLabel>
                      <Switch isChecked={data.is_maintenance} onChange={(e) => setData('is_maintenance', e.target.checked)} />
                   </FormControl>
                   <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Block Bad Bots</FormLabel>
                      <Switch isChecked={data.block_common_bad_bots} onChange={(e) => setData('block_common_bad_bots', e.target.checked)} />
                   </FormControl>
                   <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Bot Challenge Mode</FormLabel>
                      <Switch isChecked={data.bot_challenge_mode} onChange={(e) => setData('bot_challenge_mode', e.target.checked)} />
                   </FormControl>
                   <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Force Challenge</FormLabel>
                      <Switch isChecked={data.bot_challenge_force} onChange={(e) => setData('bot_challenge_force', e.target.checked)} />
                   </FormControl>
                   <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Circuit Breaker</FormLabel>
                      <Switch isChecked={data.circuit_breaker_enabled} onChange={(e) => setData('circuit_breaker_enabled', e.target.checked)} />
                   </FormControl>
                </SimpleGrid>

                {data.circuit_breaker_enabled && (
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl>
                      <FormLabel>Circuit Breaker Threshold</FormLabel>
                      <NumberInput min={1} max={20} value={data.circuit_breaker_threshold} onChange={(v) => setData('circuit_breaker_threshold', parseInt(v || '1', 10))}>
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Circuit Breaker Retry (Sec)</FormLabel>
                      <NumberInput min={5} max={600} value={data.circuit_breaker_retry_seconds} onChange={(v) => setData('circuit_breaker_retry_seconds', parseInt(v || '5', 10))}>
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                )}

                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel>IP Allowlist</FormLabel>
                    <Textarea 
                      placeholder="Allow specific IPs only (comma or newline)" 
                      size="sm"
                      value={data.ip_allowlist}
                      onChange={(e) => setData('ip_allowlist', e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>IP Denylist</FormLabel>
                    <Textarea 
                      placeholder="Block specific IPs (comma or newline)" 
                      size="sm"
                      value={data.ip_denylist}
                      onChange={(e) => setData('ip_denylist', e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Custom 403 (WAF Blocked) HTML</FormLabel>
                  <Textarea 
                    placeholder="Custom HTML for WAF blocks" 
                    size="sm"
                    value={data.custom_error_403}
                    onChange={(e) => setData('custom_error_403', e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Custom 503 (Maintenance) HTML</FormLabel>
                  <Textarea 
                    placeholder="Custom HTML for maintenance mode" 
                    size="sm"
                    value={data.custom_error_503}
                    onChange={(e) => setData('custom_error_503', e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Environment Variables (Key:Value)</FormLabel>
                  <Textarea 
                    placeholder="KEY1=VALUE1&#10;KEY2=VALUE2" 
                    size="sm"
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      const vars = {};
                      lines.forEach(line => {
                        const [key, ...value] = line.split('=');
                        if (key && value.length > 0) {
                          vars[key.trim()] = value.join('=').trim();
                        }
                      });
                      setData('env_vars', vars);
                    }}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    These variables will be injected directly into the application environment.
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Rate Limit (Req/Sec)</FormLabel>
                  <NumberInput min={1} max={1000} value={data.rate_limit_rps} onChange={(v) => setData('rate_limit_rps', parseInt(v))}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                {data.cache_enabled && (
                  <FormControl>
                    <FormLabel>Cache TTL (Seconds)</FormLabel>
                    <NumberInput min={0} value={data.cache_ttl} onChange={(v) => setData('cache_ttl', parseInt(v))}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                )}

                {data.is_maintenance && (
                  <FormControl>
                    <FormLabel>Maintenance Message</FormLabel>
                    <Textarea
                      placeholder="We'll be back soon!"
                      value={data.maintenance_message}
                      onChange={(e) => setData('maintenance_message', e.target.value)}
                    />
                  </FormControl>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" type="submit" isLoading={processing}>
                Save Site
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </AppLayout>
  );
}
