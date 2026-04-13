import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Code,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Switch,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Select,
  Textarea,
} from '@chakra-ui/react';
import { Shield, Globe, Activity, ChevronRight, AlertTriangle, Clock, Trash2, Power, Lock, Settings, TrendingUp, Plus, X } from 'lucide-react';
import { Head, Link, useForm } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';

export default function Show({ auth, site, analytics }) {
  const toast = useToast();
  const { post, delete: destroy, processing } = useForm();
  
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

  const { data, setData, post: update, processing: updateProcessing, errors } = useForm({
    name: site.name,
    domain: site.domain,
    backend_url: site.backend_url,
    ssl_enabled: !!site.ssl_enabled,
    waf_enabled: !!site.waf_enabled,
    rate_limit_rps: site.rate_limit_rps,
    backend_type: site.backend_type || 'proxy',
    root_path: site.root_path || '',
    auth_user: site.auth_user || '',
    auth_password: '',
    protect_sensitive_files: !!site.protect_sensitive_files,
    notification_webhook_url: site.notification_webhook_url || '',
    cache_enabled: !!site.cache_enabled,
    cache_ttl: site.cache_ttl || 3600,
    is_maintenance: !!site.is_maintenance,
    maintenance_message: site.maintenance_message || '',
    backup_backend_url: site.backup_backend_url || '',
    custom_waf_rules: site.custom_waf_rules || [],
    env_vars: site.env_vars || {},
    custom_error_403: site.custom_error_403 || '',
    custom_error_503: site.custom_error_503 || '',
    ip_allowlist: Array.isArray(site.ip_allowlist) ? site.ip_allowlist.join(', ') : '',
    ip_denylist: Array.isArray(site.ip_denylist) ? site.ip_denylist.join(', ') : '',
    block_common_bad_bots: !!site.block_common_bad_bots,
  });

  const toggleStatus = () => {
    post(route('sites.toggle', site.id), {
      onSuccess: () => {
        toast({
          title: `Site ${site.is_active ? 'deactivated' : 'activated'}`,
          status: 'success',
          duration: 3000,
        });
      },
    });
  };

  const addWafRule = () => {
    setData('custom_waf_rules', [
      ...data.custom_waf_rules,
      { type: 'path', pattern: '', header_name: '' }
    ]);
  };

  const removeWafRule = (index) => {
    const rules = [...data.custom_waf_rules];
    rules.splice(index, 1);
    setData('custom_waf_rules', rules);
  };

  const updateWafRule = (index, field, value) => {
    const rules = [...data.custom_waf_rules];
    rules[index][field] = value;
    setData('custom_waf_rules', rules);
  };

  const submitUpdate = (e) => {
    e.preventDefault();
    update(route('sites.update', site.id), {
      onSuccess: () => {
        toast({ title: 'Settings updated', status: 'success' });
      },
    });
  };

  const deleteSite = () => {
    if (confirm('Are you sure you want to delete this proxy site?')) {
      destroy(route('sites.destroy', site.id));
    }
  };

  return (
    <AppLayout user={auth.user}>
      <Head title={site.name} />

      <Breadcrumb spacing="8px" separator={<ChevronRight size={14} />} mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href={route('dashboard')}>Proxy Sites</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{site.name}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Box mb={8} display="flex" justifyContent="space-between" alignItems="flex-start">
        <VStack align="start" spacing={1}>
          <HStack>
            <Heading size="lg">{site.name}</Heading>
            <Badge colorScheme={site.is_active ? 'green' : 'red'}>
              {site.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </HStack>
          <Text color="gray.500">{site.domain} → {site.backend_url}</Text>
        </VStack>
        <HStack spacing={4}>
          <Button
            leftIcon={<Power size={18} />}
            colorScheme={site.is_active ? 'orange' : 'green'}
            onClick={toggleStatus}
            isLoading={processing}
          >
            {site.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            leftIcon={<Trash2 size={18} />}
            colorScheme="red"
            variant="ghost"
            onClick={deleteSite}
          >
            Delete
          </Button>
        </HStack>
      </Box>

      <Tabs variant="enclosed">
        <TabList>
          <Tab><Icon as={Activity} size={14} mr={2} /> Overview</Tab>
          <Tab><Icon as={Settings} size={14} mr={2} /> Settings</Tab>
          <Tab><Icon as={Shield} size={14} mr={2} /> Security Logs</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0} py={6}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
              <Stat px={4} py={5} bg={useColorModeValue('white', 'gray.800')} shadow={'base'} rounded={'lg'}>
                <StatLabel fontWeight={'medium'}>Total Requests</StatLabel>
                <StatNumber fontSize={'2xl'}>{site.total_requests}</StatNumber>
              </Stat>
              <Stat px={4} py={5} bg={useColorModeValue('white', 'gray.800')} shadow={'base'} rounded={'lg'}>
                <StatLabel fontWeight={'medium'}>Blocked (WAF/Rate Limit)</StatLabel>
                <StatNumber fontSize={'2xl'} color="red.500">{site.blocked_requests}</StatNumber>
              </Stat>
              <Stat px={4} py={5} bg={useColorModeValue('white', 'gray.800')} shadow={'base'} rounded={'lg'}>
                <StatLabel fontWeight={'medium'}>Protection Status</StatLabel>
                <HStack mt={1}>
                   <Badge colorScheme={site.waf_enabled ? 'purple' : 'gray'}>WAF: {site.waf_enabled ? 'ON' : 'OFF'}</Badge>
                   <Badge colorScheme={site.ssl_enabled ? 'green' : 'gray'}>SSL: {site.ssl_enabled ? 'ON' : 'OFF'}</Badge>
                   {site.auth_user && <Badge colorScheme="blue">AUTH: ON</Badge>}
                </HStack>
              </Stat>
            </SimpleGrid>

            <Box bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg" p={6}>
              <HStack mb={4}>
                <Icon as={TrendingUp} color="blue.500" />
                <Heading size="md">Security Events Trend (Last 7 Days)</Heading>
              </HStack>
              <Box height="250px">
                <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} />
              </Box>
            </Box>
          </TabPanel>

          <TabPanel px={0} py={6}>
            <Box bg={useColorModeValue('white', 'gray.800')} p={6} rounded="lg" shadow="base">
              <form onSubmit={submitUpdate}>
                <Stack spacing={6}>
                  <Heading size="md">Site Configuration</Heading>
                  <SimpleGrid columns={2} spacing={6}>
                    <FormControl isRequired isInvalid={errors.name}>
                      <FormLabel>Site Name</FormLabel>
                      <Input value={data.name} onChange={e => setData('name', e.target.value)} />
                    </FormControl>
                    <FormControl isRequired isInvalid={errors.domain}>
                      <FormLabel>Domain</FormLabel>
                      <Input value={data.domain} onChange={e => setData('domain', e.target.value)} />
                    </FormControl>
                    <FormControl isRequired isInvalid={errors.backend_url}>
                      <FormLabel>Backend URL / FastCGI Socket</FormLabel>
                      <Input value={data.backend_url} onChange={e => setData('backend_url', e.target.value)} placeholder={data.backend_type === 'proxy' ? 'http://localhost:8001' : '/var/run/php/php-fpm.sock'} />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {data.backend_type === 'proxy' 
                          ? 'Multiple URLs supported for Load Balancing (separate with comma or space).' 
                          : 'Enter path to PHP-FPM socket or TCP address.'}
                      </Text>
                    </FormControl>
                    <FormControl isInvalid={errors.backup_backend_url}>
                      <FormLabel>Backup Backend (Failover)</FormLabel>
                      <Input value={data.backup_backend_url} onChange={e => setData('backup_backend_url', e.target.value)} placeholder="e.g. http://backup:8001" />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Backend Type</FormLabel>
                      <Select value={data.backend_type} onChange={e => setData('backend_type', e.target.value)}>
                        <option value="proxy">Reverse Proxy (HTTP)</option>
                        <option value="php_fpm">PHP-FPM (FastCGI)</option>
                      </Select>
                    </FormControl>
                    {data.backend_type === 'php_fpm' && (
                      <FormControl isRequired isInvalid={errors.root_path}>
                        <FormLabel>Root Path (on server)</FormLabel>
                        <Input value={data.root_path} onChange={e => setData('root_path', e.target.value)} placeholder="/var/www/my-app/public" />
                      </FormControl>
                    )}
                    <FormControl>
                      <FormLabel>Rate Limit (Req/Sec)</FormLabel>
                      <Input type="number" value={data.rate_limit_rps} onChange={e => setData('rate_limit_rps', e.target.value)} />
                    </FormControl>
                  </SimpleGrid>

                  <Divider />
                  
                  <Heading size="md"><Icon as={Shield} size={18} mr={2} /> Security Settings</Heading>
                  <SimpleGrid columns={2} spacing={6}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Enable WAF Protection</FormLabel>
                      <Switch isChecked={data.waf_enabled} onChange={e => setData('waf_enabled', e.target.checked)} />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Protect Sensitive Files (.env, .git)</FormLabel>
                      <Switch isChecked={data.protect_sensitive_files} onChange={e => setData('protect_sensitive_files', e.target.checked)} />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Enable Automatic SSL</FormLabel>
                      <Switch isChecked={data.ssl_enabled} onChange={e => setData('ssl_enabled', e.target.checked)} />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Enable Caching</FormLabel>
                      <Switch isChecked={data.cache_enabled} onChange={e => setData('cache_enabled', e.target.checked)} />
                    </FormControl>
                    {data.cache_enabled && (
                      <FormControl>
                        <FormLabel>Cache TTL (Seconds)</FormLabel>
                        <Input type="number" value={data.cache_ttl} onChange={e => setData('cache_ttl', e.target.value)} />
                      </FormControl>
                    )}
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Maintenance Mode</FormLabel>
                      <Switch isChecked={data.is_maintenance} onChange={e => setData('is_maintenance', e.target.checked)} />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Block Common Bad Bots</FormLabel>
                      <Switch isChecked={data.block_common_bad_bots} onChange={e => setData('block_common_bad_bots', e.target.checked)} />
                    </FormControl>
                    {data.is_maintenance && (
                      <FormControl colSpan={2}>
                        <FormLabel>Maintenance Message (Simple Text)</FormLabel>
                        <Input value={data.maintenance_message} onChange={e => setData('maintenance_message', e.target.value)} placeholder="We'll be back soon!" />
                      </FormControl>
                    )}
                  </SimpleGrid>

                  <Divider />

                  <Heading size="md"><Icon as={Shield} size={18} mr={2} /> Custom WAF Rules</Heading>
                  <Text fontSize="sm" color="gray.500">Add custom regex patterns to block specific paths, queries, or headers.</Text>
                  <VStack align="stretch" spacing={4}>
                    {data.custom_waf_rules.map((rule, index) => (
                      <Box key={index} p={4} border="1px" borderColor="gray.200" rounded="md" position="relative">
                        <Button 
                          size="xs" 
                          colorScheme="red" 
                          variant="ghost" 
                          position="absolute" 
                          top={2} 
                          right={2} 
                          onClick={() => removeWafRule(index)}
                        >
                          <X size={14} />
                        </Button>
                        <SimpleGrid columns={3} spacing={4}>
                          <FormControl>
                            <FormLabel fontSize="xs">Type</FormLabel>
                            <Select size="sm" value={rule.type} onChange={e => updateWafRule(index, 'type', e.target.value)}>
                              <option value="path">Path Match</option>
                              <option value="query">Query Match</option>
                              <option value="header">Header Regex</option>
                            </Select>
                          </FormControl>
                          {rule.type === 'header' && (
                            <FormControl>
                              <FormLabel fontSize="xs">Header Name</FormLabel>
                              <Input size="sm" value={rule.header_name} onChange={e => updateWafRule(index, 'header_name', e.target.value)} placeholder="User-Agent" />
                            </FormControl>
                          )}
                          <FormControl gridColumn={rule.type !== 'header' ? "span 2" : "auto"}>
                            <FormLabel fontSize="xs">Pattern / Regex</FormLabel>
                            <Input size="sm" value={rule.pattern} onChange={e => updateWafRule(index, 'pattern', e.target.value)} placeholder="/admin/sensitive" />
                          </FormControl>
                        </SimpleGrid>
                      </Box>
                    ))}
                    <Button leftIcon={<Plus size={14} />} size="sm" variant="outline" onClick={addWafRule}>Add Rule</Button>
                  </VStack>

                  <Divider />

                  <Heading size="md"><Icon as={Settings} size={18} mr={2} /> Environment Variables (.env Injector)</Heading>
                  <Text fontSize="sm" color="gray.500">Variables will be injected directly into the application runtime (PHP-FPM or via HTTP Headers for Proxy).</Text>
                  <FormControl>
                    <Textarea 
                      rows={6}
                      placeholder="KEY1=VALUE1&#10;KEY2=VALUE2" 
                      value={Object.entries(data.env_vars).map(([k, v]) => `${k}=${v}`).join('\n')}
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
                  </FormControl>

                  <Divider />

                  <Heading size="md"><Icon as={Lock} size={18} mr={2} /> Access Control & Custom Errors</Heading>
                  <SimpleGrid columns={2} spacing={6}>
                    <FormControl>
                      <FormLabel>IP Allowlist (Comma or Newline separated)</FormLabel>
                      <Textarea value={data.ip_allowlist} onChange={e => setData('ip_allowlist', e.target.value)} placeholder="Allow only these IPs..." size="sm" />
                    </FormControl>
                    <FormControl>
                      <FormLabel>IP Denylist (Comma or Newline separated)</FormLabel>
                      <Textarea value={data.ip_denylist} onChange={e => setData('ip_denylist', e.target.value)} placeholder="Block these specific IPs..." size="sm" />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Custom 403 (WAF Blocked) HTML</FormLabel>
                      <Textarea value={data.custom_error_403} onChange={e => setData('custom_error_403', e.target.value)} placeholder="Custom HTML for WAF blocks" size="sm" />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Custom 503 (Maintenance) HTML</FormLabel>
                      <Textarea value={data.custom_error_503} onChange={e => setData('custom_error_503', e.target.value)} placeholder="Custom HTML for maintenance mode" size="sm" />
                    </FormControl>
                  </SimpleGrid>

                  <Divider />

                  <Heading size="md"><Icon as={Lock} size={18} mr={2} /> Auth Proxy (Basic Auth)</Heading>
                  <Text fontSize="sm" color="gray.500">Add an extra layer of password protection before reaching your backend.</Text>
                  <SimpleGrid columns={2} spacing={6}>
                    <FormControl>
                      <FormLabel>Username</FormLabel>
                      <Input placeholder="Leave empty to disable" value={data.auth_user} onChange={e => setData('auth_user', e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Password</FormLabel>
                      <Input type="password" placeholder="New password" value={data.auth_password} onChange={e => setData('auth_password', e.target.value)} />
                    </FormControl>
                  </SimpleGrid>

                  <Divider />

                  <Heading size="md"><Icon as={Activity} size={18} mr={2} /> Alerting (Slack/Discord Webhook)</Heading>
                  <Text fontSize="sm" color="gray.500">Receive real-time notifications when a security event is blocked.</Text>
                  <FormControl>
                    <FormLabel>Webhook URL</FormLabel>
                    <Input placeholder="https://hooks.slack.com/services/..." value={data.notification_webhook_url} onChange={e => setData('notification_webhook_url', e.target.value)} />
                  </FormControl>

                  <Box pt={4}>
                    <Button colorScheme="blue" type="submit" isLoading={updateProcessing}>Save All Changes</Button>
                  </Box>
                </Stack>
              </form>
            </Box>
          </TabPanel>

          <TabPanel px={0} py={6}>
            <Box bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg" overflow="hidden">
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Tr>
                    <Th>Time</Th>
                    <Th>Type</Th>
                    <Th>IP Address</Th>
                    <Th>Method / Path</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {site.security_events.map((event) => (
                    <Tr key={event.id}>
                      <Td fontSize="xs">{new Date(event.created_at).toLocaleString()}</Td>
                      <Td>
                        <Badge colorScheme="red">{event.type}</Badge>
                      </Td>
                      <Td fontSize="sm">{event.ip_address}</Td>
                      <Td fontSize="sm">
                        <Code colorScheme="gray">{event.request_method}</Code> {event.request_path}
                      </Td>
                      <Td textAlign="right">
                        <Button size="xs" variant="ghost">Details</Button>
                      </Td>
                    </Tr>
                  ))}
                  {site.security_events.length === 0 && (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={10}>
                        No security events recorded. Site is clean!
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </AppLayout>
  );
}
