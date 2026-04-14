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
  StatHelpText,
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
import { Shield, Globe, Activity, ChevronRight, AlertTriangle, Clock, Trash2, Power, Lock, Settings, TrendingUp, Plus, X, Map, ArrowRightLeft, BarChart2 } from 'lucide-react';
import { Head, Link, useForm } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';

export default function Show({ auth, site, analytics, bandwidth }) {
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
    bot_challenge_mode: !!site.bot_challenge_mode,
    bot_challenge_force: !!site.bot_challenge_force,
    route_policies: Array.isArray(site.route_policies) ? site.route_policies : [],
    circuit_breaker_enabled: !!site.circuit_breaker_enabled,
    circuit_breaker_threshold: site.circuit_breaker_threshold || 5,
    circuit_breaker_retry_seconds: site.circuit_breaker_retry_seconds || 30,
    // GeoIP
    geoip_enabled: !!site.geoip_enabled,
    geoip_allowlist: Array.isArray(site.geoip_allowlist) ? site.geoip_allowlist.join(', ') : '',
    geoip_denylist: Array.isArray(site.geoip_denylist) ? site.geoip_denylist.join(', ') : '',
    // Header rules
    header_rules: Array.isArray(site.header_rules) ? site.header_rules : [],
    // Redirect/Rewrite rules
    redirect_rules: Array.isArray(site.redirect_rules) ? site.redirect_rules : [],
  });

  const addHeaderRule = () => setData('header_rules', [...data.header_rules, { action: 'set', direction: 'response', name: '', value: '' }]);
  const removeHeaderRule = (i) => { const r = [...data.header_rules]; r.splice(i, 1); setData('header_rules', r); };
  const updateHeaderRule = (i, f, v) => { const r = [...data.header_rules]; r[i][f] = v; setData('header_rules', r); };

  const addRedirectRule = () => setData('redirect_rules', [...data.redirect_rules, { from: '', to: '', type: 'permanent' }]);
  const removeRedirectRule = (i) => { const r = [...data.redirect_rules]; r.splice(i, 1); setData('redirect_rules', r); };
  const updateRedirectRule = (i, f, v) => { const r = [...data.redirect_rules]; r[i][f] = v; setData('redirect_rules', r); };

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

  const addRoutePolicy = () => {
    setData('route_policies', [
      ...data.route_policies,
      { path: '/api/*', bot_challenge_mode: false, rate_limit_rps: 10, waf_enabled: true }
    ]);
  };

  const removeRoutePolicy = (index) => {
    const policies = [...data.route_policies];
    policies.splice(index, 1);
    setData('route_policies', policies);
  };

  const updateRoutePolicy = (index, field, value) => {
    const policies = [...data.route_policies];
    policies[index][field] = value;
    setData('route_policies', policies);
  };

  const rollbackAudit = (auditId) => {
    post(route('sites.audits.rollback', [site.id, auditId]), {
      onSuccess: () => {
        toast({ title: 'Rollback completed', status: 'success' });
      },
    });
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
          <Tab><Icon as={Clock} size={14} mr={2} /> Audit & Rollback</Tab>
          <Tab><Icon as={BarChart2} size={14} mr={2} /> Bandwidth</Tab>
          <Tab><Icon as={ArrowRightLeft} size={14} mr={2} /> Headers & Redirects</Tab>
          <Tab><Icon as={Map} size={14} mr={2} /> GeoIP</Tab>
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
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Bot Challenge Mode</FormLabel>
                      <Switch isChecked={data.bot_challenge_mode} onChange={e => setData('bot_challenge_mode', e.target.checked)} />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Force Challenge (All Requests)</FormLabel>
                      <Switch isChecked={data.bot_challenge_force} onChange={e => setData('bot_challenge_force', e.target.checked)} />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Circuit Breaker</FormLabel>
                      <Switch isChecked={data.circuit_breaker_enabled} onChange={e => setData('circuit_breaker_enabled', e.target.checked)} />
                    </FormControl>
                    {data.circuit_breaker_enabled && (
                      <FormControl>
                        <FormLabel>Breaker Threshold (fails)</FormLabel>
                        <Input type="number" min={1} max={20} value={data.circuit_breaker_threshold} onChange={e => setData('circuit_breaker_threshold', Number(e.target.value))} />
                      </FormControl>
                    )}
                    {data.circuit_breaker_enabled && (
                      <FormControl>
                        <FormLabel>Breaker Retry (seconds)</FormLabel>
                        <Input type="number" min={5} max={600} value={data.circuit_breaker_retry_seconds} onChange={e => setData('circuit_breaker_retry_seconds', Number(e.target.value))} />
                      </FormControl>
                    )}
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

                  <Heading size="md"><Icon as={Settings} size={18} mr={2} /> Per-Route Policy</Heading>
                  <VStack align="stretch" spacing={4}>
                    {data.route_policies.map((policy, index) => (
                      <Box key={index} p={4} border="1px" borderColor="gray.200" rounded="md" position="relative">
                        <Button size="xs" colorScheme="red" variant="ghost" position="absolute" top={2} right={2} onClick={() => removeRoutePolicy(index)}>
                          <X size={14} />
                        </Button>
                        <SimpleGrid columns={4} spacing={4}>
                          <FormControl>
                            <FormLabel fontSize="xs">Path</FormLabel>
                            <Input size="sm" value={policy.path || ''} onChange={e => updateRoutePolicy(index, 'path', e.target.value)} placeholder="/admin/*" />
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="xs">Rate Limit RPS</FormLabel>
                            <Input size="sm" type="number" min={0} value={policy.rate_limit_rps || 0} onChange={e => updateRoutePolicy(index, 'rate_limit_rps', Number(e.target.value))} />
                          </FormControl>
                          <FormControl display="flex" alignItems="center" pt={6}>
                            <FormLabel fontSize="xs" mb="0">Bot Challenge</FormLabel>
                            <Switch isChecked={!!policy.bot_challenge_mode} onChange={e => updateRoutePolicy(index, 'bot_challenge_mode', e.target.checked)} />
                          </FormControl>
                          <FormControl display="flex" alignItems="center" pt={6}>
                            <FormLabel fontSize="xs" mb="0">WAF</FormLabel>
                            <Switch isChecked={policy.waf_enabled !== false} onChange={e => updateRoutePolicy(index, 'waf_enabled', e.target.checked)} />
                          </FormControl>
                        </SimpleGrid>
                      </Box>
                    ))}
                    <Button leftIcon={<Plus size={14} />} size="sm" variant="outline" onClick={addRoutePolicy}>Add Route Policy</Button>
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

          <TabPanel px={0} py={6}>
            <Box bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg" overflow="hidden">
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Tr>
                    <Th>Time</Th>
                    <Th>User</Th>
                    <Th>Action</Th>
                    <Th textAlign="right">Rollback</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(site.config_audits || []).map((audit) => (
                    <Tr key={audit.id}>
                      <Td fontSize="xs">{new Date(audit.created_at).toLocaleString()}</Td>
                      <Td fontSize="sm">{audit.user?.name || 'System'}</Td>
                      <Td><Badge colorScheme="blue">{audit.action}</Badge></Td>
                      <Td textAlign="right">
                        <Button size="xs" colorScheme="orange" variant="outline" onClick={() => rollbackAudit(audit.id)}>
                          Rollback
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                  {(site.config_audits || []).length === 0 && (
                    <Tr>
                      <Td colSpan={4} textAlign="center" py={10}>No audit records yet.</Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
          {/* ── Bandwidth Tab ── */}
          <TabPanel px={0} py={6}>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
              {[
                { label: 'Total Requests', value: site.total_requests?.toLocaleString() ?? 0 },
                { label: 'Bandwidth In', value: formatBytes(site.bytes_in) },
                { label: 'Bandwidth Out', value: formatBytes(site.bytes_out) },
                { label: 'Avg Latency', value: site.avg_latency_ms ? `${Math.round(site.avg_latency_ms)} ms` : '—' },
              ].map(s => (
                <Stat key={s.label} px={4} py={5} bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg">
                  <StatLabel>{s.label}</StatLabel>
                  <StatNumber fontSize="xl">{s.value}</StatNumber>
                </Stat>
              ))}
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
              <Box bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg" p={5}>
                <Heading size="sm" mb={4}>Status Code Distribution</Heading>
                <ReactECharts style={{ height: '200px' }} option={{
                  backgroundColor: 'transparent',
                  tooltip: { trigger: 'item' },
                  series: [{
                    type: 'pie', radius: ['40%', '70%'],
                    data: [
                      { value: site.hits_2xx || 0, name: '2xx Success', itemStyle: { color: '#48bb78' } },
                      { value: site.hits_4xx || 0, name: '4xx Client Error', itemStyle: { color: '#ed8936' } },
                      { value: site.hits_5xx || 0, name: '5xx Server Error', itemStyle: { color: '#f56565' } },
                    ],
                    label: { color: '#718096' },
                  }],
                }} />
              </Box>

              <Box bg={useColorModeValue('white', 'gray.800')} shadow="base" rounded="lg" p={5}>
                <Heading size="sm" mb={4}>Request Trend (Last 30 Days)</Heading>
                <ReactECharts style={{ height: '200px' }} option={{
                  backgroundColor: 'transparent',
                  tooltip: { trigger: 'axis' },
                  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                  xAxis: { type: 'category', data: (bandwidth || []).map(b => b.date), axisLine: { lineStyle: { color: '#718096' } } },
                  yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(113,128,150,0.2)' } } },
                  series: [{ name: 'Requests', type: 'bar', data: (bandwidth || []).map(b => b.requests), itemStyle: { color: '#4299e1' } }],
                }} />
              </Box>
            </SimpleGrid>
          </TabPanel>

          {/* ── Headers & Redirects Tab ── */}
          <TabPanel px={0} py={6}>
            <Box bg={useColorModeValue('white', 'gray.800')} p={6} rounded="lg" shadow="base" mb={6}>
              <Heading size="md" mb={1}>Header Manipulation</Heading>
              <Text fontSize="sm" color="gray.500" mb={4}>Add, set, or remove HTTP headers on requests or responses.</Text>
              <VStack align="stretch" spacing={3}>
                {data.header_rules.map((rule, i) => (
                  <Box key={i} p={4} border="1px" borderColor="gray.200" rounded="md" position="relative">
                    <Button size="xs" colorScheme="red" variant="ghost" position="absolute" top={2} right={2} onClick={() => removeHeaderRule(i)}><X size={13} /></Button>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="xs">Direction</FormLabel>
                        <Select size="sm" value={rule.direction} onChange={e => updateHeaderRule(i, 'direction', e.target.value)}>
                          <option value="response">Response</option>
                          <option value="request">Request (upstream)</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs">Action</FormLabel>
                        <Select size="sm" value={rule.action} onChange={e => updateHeaderRule(i, 'action', e.target.value)}>
                          <option value="set">Set</option>
                          <option value="add">Add</option>
                          <option value="remove">Remove</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs">Header Name</FormLabel>
                        <Input size="sm" value={rule.name} onChange={e => updateHeaderRule(i, 'name', e.target.value)} placeholder="X-Custom-Header" />
                      </FormControl>
                      {rule.action !== 'remove' && (
                        <FormControl>
                          <FormLabel fontSize="xs">Value</FormLabel>
                          <Input size="sm" value={rule.value} onChange={e => updateHeaderRule(i, 'value', e.target.value)} placeholder="header-value" />
                        </FormControl>
                      )}
                    </SimpleGrid>
                  </Box>
                ))}
                <Button leftIcon={<Plus size={14} />} size="sm" variant="outline" onClick={addHeaderRule}>Add Header Rule</Button>
              </VStack>
            </Box>

            <Box bg={useColorModeValue('white', 'gray.800')} p={6} rounded="lg" shadow="base">
              <Heading size="md" mb={1}>Redirect & Rewrite Rules</Heading>
              <Text fontSize="sm" color="gray.500" mb={4}>301/302 redirects, path rewrites, and prefix stripping.</Text>
              <VStack align="stretch" spacing={3}>
                {data.redirect_rules.map((rule, i) => (
                  <Box key={i} p={4} border="1px" borderColor="gray.200" rounded="md" position="relative">
                    <Button size="xs" colorScheme="red" variant="ghost" position="absolute" top={2} right={2} onClick={() => removeRedirectRule(i)}><X size={13} /></Button>
                    <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="xs">Type</FormLabel>
                        <Select size="sm" value={rule.type} onChange={e => updateRedirectRule(i, 'type', e.target.value)}>
                          <option value="permanent">301 Permanent</option>
                          <option value="temporary">302 Temporary</option>
                          <option value="rewrite">Rewrite (internal)</option>
                          <option value="strip_prefix">Strip Prefix</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs">From (path)</FormLabel>
                        <Input size="sm" value={rule.from} onChange={e => updateRedirectRule(i, 'from', e.target.value)} placeholder="/old-path" />
                      </FormControl>
                      <FormControl gridColumn="span 2">
                        <FormLabel fontSize="xs">To (destination)</FormLabel>
                        <Input size="sm" value={rule.to} onChange={e => updateRedirectRule(i, 'to', e.target.value)} placeholder="/new-path or https://..." />
                      </FormControl>
                    </SimpleGrid>
                  </Box>
                ))}
                <Button leftIcon={<Plus size={14} />} size="sm" variant="outline" onClick={addRedirectRule}>Add Redirect Rule</Button>
              </VStack>

              <Box pt={6}>
                <Button colorScheme="blue" isLoading={updateProcessing} onClick={submitUpdate}>Save Headers & Redirects</Button>
              </Box>
            </Box>
          </TabPanel>

          {/* ── GeoIP Tab ── */}
          <TabPanel px={0} py={6}>
            <Box bg={useColorModeValue('white', 'gray.800')} p={6} rounded="lg" shadow="base">
              <Heading size="md" mb={1}>GeoIP Filtering</Heading>
              <Text fontSize="sm" color="gray.500" mb={6}>
                Block or allow traffic by country. Requires the <Code fontSize="xs">caddy-maxmind-geolocation</Code> module and a MaxMind GeoLite2 database at <Code fontSize="xs">/etc/caddy/GeoLite2-Country.mmdb</Code>.
              </Text>
              <Stack spacing={5}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Enable GeoIP Filtering</FormLabel>
                  <Switch isChecked={data.geoip_enabled} onChange={e => setData('geoip_enabled', e.target.checked)} />
                </FormControl>

                {data.geoip_enabled && (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel>Allowlist Countries (ISO codes)</FormLabel>
                      <Textarea
                        size="sm"
                        value={data.geoip_allowlist}
                        onChange={e => setData('geoip_allowlist', e.target.value)}
                        placeholder="TR, US, DE&#10;(comma or space separated)"
                        rows={4}
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>Only these countries can access the site. Leave empty to allow all.</Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Denylist Countries (ISO codes)</FormLabel>
                      <Textarea
                        size="sm"
                        value={data.geoip_denylist}
                        onChange={e => setData('geoip_denylist', e.target.value)}
                        placeholder="CN, RU, KP&#10;(comma or space separated)"
                        rows={4}
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>Block traffic from these countries.</Text>
                    </FormControl>
                  </SimpleGrid>
                )}

                <Box>
                  <Button colorScheme="blue" isLoading={updateProcessing} onClick={submitUpdate}>Save GeoIP Settings</Button>
                </Box>
              </Stack>
            </Box>
          </TabPanel>

        </TabPanels>
      </Tabs>
    </AppLayout>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
