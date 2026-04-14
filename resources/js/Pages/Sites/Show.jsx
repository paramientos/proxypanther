import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
  Box, Heading, Text, Button, VStack, HStack, Badge,
  Table, Thead, Tbody, Tr, Th, Td, Icon, Breadcrumb,
  BreadcrumbItem, BreadcrumbLink, Code, Divider,
  SimpleGrid, Stat, StatLabel, StatNumber, Switch,
  useToast, Tabs, TabList, TabPanels, Tab, TabPanel,
  FormControl, FormLabel, Input, Stack, Select, Textarea,
  Flex, IconButton
} from '@chakra-ui/react';
import {
  Shield, Globe, Activity, ChevronRight, AlertTriangle,
  Clock, Trash2, Power, Lock, Settings, TrendingUp,
  Plus, X, Map, ArrowRightLeft, BarChart2, Zap, Save, Palette,
  Server, Cpu, Database, Bell, ArrowUp, ArrowDown, RefreshCcw,
  ShieldCheck, ShieldAlert, Terminal
} from 'lucide-react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';

const CARD_BG = '#0c0d12';
const BORDER = 'rgba(255,255,255,0.08)';
const ACCENT = '#f38020';
const ACCENT_DIM = 'rgba(243,128,32,0.12)';

export default function Show({ auth, site, analytics, bandwidth, wafPresets, errorTemplates }) {
  const toast = useToast();
  const { post, delete: destroy, processing } = useForm();

  const chartOptions = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1a1a',
      borderColor: ACCENT,
      textStyle: { color: '#e5e5e5', fontSize: 12 },
    },
    grid: { left: '2%', right: '2%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: analytics.map(a => a.date),
      axisLine: { lineStyle: { color: '#333' } },
      axisLabel: { color: '#666', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1f1f1f' } },
      axisLabel: { color: '#666', fontSize: 11 },
    },
    series: [
      {
        name: 'Total Requests',
        type: 'line',
        smooth: true,
        data: (analytics || []).map(a => a.total_requests),
        itemStyle: { color: 'rgba(255,255,255,0.2)' },
        lineStyle: { width: 1, color: 'rgba(255,255,255,0.2)', type: 'dashed' },
        symbol: 'none',
      },
      {
        name: 'Blocked Threats',
        type: 'line',
        smooth: true,
        data: (analytics || []).map(a => a.blocked_requests),
        itemStyle: { color: ACCENT },
        lineStyle: { width: 2, color: ACCENT },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(243,128,32,0.2)' },
              { offset: 1, color: 'rgba(243,128,32,0)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 4,
      }
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
    under_attack_mode: !!site.under_attack_mode,
    route_policies: Array.isArray(site.route_policies) ? site.route_policies : [],
    circuit_breaker_enabled: !!site.circuit_breaker_enabled,
    circuit_breaker_threshold: site.circuit_breaker_threshold || 5,
    circuit_breaker_retry_seconds: site.circuit_breaker_retry_seconds || 30,
    geoip_enabled: !!site.geoip_enabled,
    geoip_allowlist: Array.isArray(site.geoip_allowlist) ? site.geoip_allowlist.join(', ') : '',
    geoip_denylist: Array.isArray(site.geoip_denylist) ? site.geoip_denylist.join(', ') : '',
    header_rules: Array.isArray(site.header_rules) ? site.header_rules : [],
    redirect_rules: Array.isArray(site.redirect_rules) ? site.redirect_rules : [],
  });

  const { data: newRule, setData: setNewRule, post: saveRule, reset: resetRule } = useForm({
    path: '',
    type: 'redirect',
    value: '',
  });

  const submitUpdate = (e) => {
    e?.preventDefault();
    update(route('sites.update', site.id), {
      onSuccess: () => toast({ title: 'Infrastructure configuration updated', status: 'success' }),
    });
  };

  const addWafRule = () => {
    setData('custom_waf_rules', [...data.custom_waf_rules, { type: 'path', pattern: '', action: 'block', header_name: '' }]);
  };

  const removeWafRule = (index) => {
    const rules = data.custom_waf_rules.filter((_, i) => i !== index);
    setData('custom_waf_rules', rules);
  };

  const updateWafRule = (index, field, value) => {
    const rules = [...data.custom_waf_rules];
    rules[index][field] = value;
    setData('custom_waf_rules', rules);
  };

  const toggleStatus = () => {
    post(route('sites.toggle', site.id), {
      onSuccess: () => toast({ title: `Site ${site.is_active ? 'deactivated' : 'activated'}`, status: 'success' }),
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const ConfigSection = ({ title, icon, children, description }) => (
    <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER} mb={6}>
      <HStack mb={6} spacing={4}>
        <Box p={2.5} bg={ACCENT_DIM} borderRadius="lg">
          <Icon as={icon} boxSize={5} color={ACCENT} />
        </Box>
        <VStack align="start" spacing={0}>
          <Heading size="sm" color="white">{title}</Heading>
          <Text fontSize="xs" color="gray.500">{description}</Text>
        </VStack>
      </HStack>
      {children}
    </Box>
  );

  return (
    <EnterpriseLayout user={auth.user}>
      <Head title={`${site.name} Control Panel`} />

      <Breadcrumb spacing="8px" separator={<ChevronRight size={14} color="#444" />} mb={6} color="gray.500" fontSize="xs">
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href={route('dashboard')}>Infrastructure</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink color="white">{site.name}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex mb={10} justify="space-between" align="start">
        <VStack align="start" spacing={1}>
          <HStack spacing={3}>
            <Heading size="xl" color="white" fontWeight="900" letterSpacing="tight">{site.name}</Heading>
            <Badge
              variant="solid"
              px={3}
              borderRadius="full"
              fontSize="10px"
              bg={site.is_active ? 'green.500' : 'red.500'}
            >
              {site.is_active ? 'LIVE' : 'INACTIVE'}
            </Badge>
          </HStack>
          <HStack color="gray.500" fontSize="sm">
            <Globe size={14} />
            <Text fontWeight="medium" color="gray.400">{site.domain}</Text>
            <ArrowRightLeft size={14} />
            <Text>{site.backend_url}</Text>
          </HStack>
        </VStack>
        <HStack spacing={3}>
          <Button
            leftIcon={<AlertTriangle size={18} />}
            variant={data.under_attack_mode ? 'solid' : 'outline'}
            borderColor={ACCENT}
            color={data.under_attack_mode ? 'white' : ACCENT}
            bg={data.under_attack_mode ? '#ea580c' : 'transparent'}
            _hover={{ bg: data.under_attack_mode ? '#c2410c' : 'rgba(243,128,32,0.1)' }}
            boxShadow={data.under_attack_mode ? `0 0 20px ${ACCENT}` : 'none'}
            animation={data.under_attack_mode ? 'pulse 2s infinite' : 'none'}
            onClick={() => {
                const val = !data.under_attack_mode;
                setData('under_attack_mode', val);
                router.post(route('sites.update', site.id), {
                    ...data,
                    under_attack_mode: val
                }, { preserveScroll: true });
            }}
          >
            {data.under_attack_mode ? 'UNDER ATTACK' : 'PANIC BUTTON'}
          </Button>
          <Button
            leftIcon={<Power size={18} />}
            variant="outline"
            borderColor={site.is_active ? 'orange.800' : 'green.800'}
            color={site.is_active ? 'orange.400' : 'green.400'}
            _hover={{ bg: site.is_active ? 'rgba(251,146,60,0.1)' : 'rgba(34,197,94,0.1)' }}
            onClick={toggleStatus}
            isLoading={processing}
          >
            {site.is_active ? 'Decommission' : 'Deploy'}
          </Button>
          <Button
            leftIcon={<Trash2 size={18} />}
            colorScheme="red"
            variant="ghost"
            _hover={{ bg: 'rgba(239,68,68,0.1)' }}
            onClick={() => confirm('Purge this proxy site?') && destroy(route('sites.destroy', site.id))}
          >
            Purge Site
          </Button>
        </HStack>
      </Flex>

      <Tabs variant="unstyled">
        <TabList bg={CARD_BG} p={1} borderRadius="xl" border="1px solid" borderColor={BORDER} mb={8} display="inline-flex">
          {[
            { n: 'Overview', i: Activity },
            { n: 'Configuration', i: Settings },
            { n: 'Security Shield', i: Shield },
            { n: 'Page Rules', i: ArrowRightLeft },
            { n: 'Traffic Insights', i: BarChart2 },
            { n: 'Branding & Errors', i: Palette },
            { n: 'Audit Logs', i: Clock },
          ].map(t => (
            <Tab key={t.n} py={2.5} px={5} borderRadius="lg" fontSize="sm" fontWeight="medium" color="gray.500"
              _selected={{ bg: ACCENT, color: 'white' }} _hover={{ color: 'white' }}>
              <Icon as={t.i} size={14} mr={2} /> {t.n}
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          <TabPanel p={0}>
            {/* Overview Stats */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
              {[
                { l: 'TOTAL REQUESTS', v: site.total_requests?.toLocaleString(), i: Zap },
                { l: 'SECURITY BLOCKS', v: site.blocked_requests?.toLocaleString(), i: Shield, c: 'red.400' },
                { l: 'UPTIME SCORE', v: '99.98%', i: Activity, c: 'green.400' },
              ].map(s => (
                <Box key={s.l} bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="10px" fontWeight="bold" color="gray.500" letterSpacing="widest">{s.l}</Text>
                      <Text fontSize="3xl" fontWeight="900" color={s.c || 'white'}>{s.v}</Text>
                    </VStack>
                    <Icon as={s.i} boxSize={6} color="gray.700" />
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>

            <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
              <HStack mb={6}>
                <Icon as={TrendingUp} color={ACCENT} />
                <Heading size="xs" color="white" textTransform="uppercase" letterSpacing="widest">Attack Pattern Analysis</Heading>
              </HStack>
              <Box height="300px">
                <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} />
              </Box>
            </Box>
          </TabPanel>

          <TabPanel p={0}>
            <form onSubmit={submitUpdate}>
              <Stack spacing={0}>
                <ConfigSection title="Identity & Placement" icon={Database} description="Global identification and domain mapping">
                  <SimpleGrid columns={2} spacing={6}>
                    <FormControl isRequired isInvalid={errors.name}>
                      <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">INSTANCE NAME</FormLabel>
                      <Input bg="#050508" borderColor={BORDER} value={data.name} onChange={e => setData('name', e.target.value)} />
                    </FormControl>
                    <FormControl isRequired isInvalid={errors.domain}>
                      <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">PUBLIC DOMAIN</FormLabel>
                      <Input bg="#050508" borderColor={BORDER} value={data.domain} onChange={e => setData('domain', e.target.value)} />
                    </FormControl>
                  </SimpleGrid>
                </ConfigSection>

                <ConfigSection title="Upstream Infrastructure" icon={Server} description="Target server and protocol configuration">
                  <Stack spacing={6}>
                    <SimpleGrid columns={2} spacing={6}>
                      <FormControl isRequired>
                        <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">PROXIED ENGINE</FormLabel>
                        <Select bg="#050508" borderColor={BORDER} value={data.backend_type} onChange={e => setData('backend_type', e.target.value)}>
                          <option value="proxy">Reverse Proxy (HTTP/gRPC)</option>
                          <option value="php_fpm">PHP-FPM (FastCGI)</option>
                        </Select>
                      </FormControl>
                      <FormControl isRequired isInvalid={errors.backend_url}>
                        <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">DESTINATION URL / SOCKET</FormLabel>
                        <Input bg="#050508" borderColor={BORDER} value={data.backend_url} onChange={e => setData('backend_url', e.target.value)} />
                      </FormControl>
                    </SimpleGrid>
                    {data.backend_type === 'php_fpm' && (
                      <FormControl isRequired isInvalid={errors.root_path}>
                        <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">SYSTEM ROOT PATH</FormLabel>
                        <Input bg="#050508" borderColor={BORDER} value={data.root_path} onChange={e => setData('root_path', e.target.value)} />
                      </FormControl>
                    )}
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">FAILOVER ENDPOINT (BACKUP)</FormLabel>
                      <Input bg="#050508" borderColor={BORDER} value={data.backup_backend_url} onChange={e => setData('backup_backend_url', e.target.value)} placeholder="e.g. http://backup-cluster:8001" />
                    </FormControl>
                  </Stack>
                </ConfigSection>

                <ConfigSection title="Reliability & Performance" icon={Zap} description="High-availability and speed optimizations">
                  <SimpleGrid columns={2} spacing={8}>
                    <FormControl display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <FormLabel mb="0" fontSize="sm" color="white">Circuit Breaker</FormLabel>
                        <Text fontSize="xs" color="gray.500">Auto-isolate unhealthy upstreams</Text>
                      </Box>
                      <Switch colorScheme="brand" isChecked={data.circuit_breaker_enabled} onChange={e => setData('circuit_breaker_enabled', e.target.checked)} />
                    </FormControl>
                    <FormControl display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <FormLabel mb="0" fontSize="sm" color="white">Global Caching</FormLabel>
                        <Text fontSize="xs" color="gray.500">Static asset orchestration</Text>
                      </Box>
                      <Switch colorScheme="brand" isChecked={data.cache_enabled} onChange={e => setData('cache_enabled', e.target.checked)} />
                    </FormControl>
                    <FormControl display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <FormLabel mb="0" fontSize="sm" color="white">Auto-SSL Delivery</FormLabel>
                        <Text fontSize="xs" color="gray.500">Managed certificates via Let's Encrypt</Text>
                      </Box>
                      <Switch colorScheme="brand" isChecked={data.ssl_enabled} onChange={e => setData('ssl_enabled', e.target.checked)} />
                    </FormControl>
                    </FormControl>
                  </SimpleGrid>

                  <Box borderTop="1px solid" borderColor={BORDER} pt={6} mt={6}>
                    <HStack justify="space-between" mb={4}>
                      <VStack align="start" spacing={0}>
                        <FormLabel mb="0" fontSize="sm" color="white">Advanced Rate Limiting (Leaky Bucket)</FormLabel>
                        <Text fontSize="xs" color="gray.500">Intelligent traffic shaping and abuse mitigation</Text>
                      </VStack>
                    </HStack>
                    
                    <SimpleGrid columns={3} spacing={6}>
                      <FormControl>
                        <FormLabel fontSize="10px" color="gray.500">REQUESTS / SEC (RPS)</FormLabel>
                        <Input size="sm" bg="#050508" borderColor={BORDER} type="number" value={data.rate_limit_rps} onChange={e => setData('rate_limit_rps', e.target.value)} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="10px" color="gray.500">BURST CAPACITY</FormLabel>
                        <Input size="sm" bg="#050508" borderColor={BORDER} type="number" value={data.rate_limit_burst} onChange={e => setData('rate_limit_burst', e.target.value)} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="10px" color="gray.500">ENFORCEMENT ACTION</FormLabel>
                        <Select size="sm" bg="#050508" borderColor={BORDER} value={data.rate_limit_action} onChange={e => setData('rate_limit_action', e.target.value)}>
                          <option value="block">Hard Block (429)</option>
                          <option value="delay">Smooth Delay (Queue)</option>
                        </Select>
                      </FormControl>
                    </SimpleGrid>
                  </Box>
                </ConfigSection>

                <ConfigSection title="Operation Center" icon={Bell} description="Maintenance and notifications">
                  <Stack spacing={6}>
                    <FormControl display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <FormLabel mb="0" fontSize="sm" color="white">Maintenance Mode</FormLabel>
                        <Text fontSize="xs" color="gray.500">Serve local outage landing page</Text>
                      </Box>
                      <Switch colorScheme="brand" isChecked={data.is_maintenance} onChange={e => setData('is_maintenance', e.target.checked)} />
                    </FormControl>
                    {data.is_maintenance && (
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">OFFLINE PAYLOAD MSG</FormLabel>
                        <Input bg="#050508" borderColor={BORDER} value={data.maintenance_message} onChange={e => setData('maintenance_message', e.target.value)} />
                      </FormControl>
                    )}
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">TELEMETRY WEBHOOK (Slack/Discord)</FormLabel>
                      <Input bg="#050508" borderColor={BORDER} value={data.notification_webhook_url} onChange={e => setData('notification_webhook_url', e.target.value)} />
                    </FormControl>
                  </Stack>
                </ConfigSection>

                <Box pt={4} display="flex" justifyContent="flex-end">
                  <Button bg={ACCENT} color="white" _hover={{ bg: '#4f46e5' }} size="lg" type="submit" isLoading={updateProcessing} leftIcon={<Save size={18} />}>
                    Deploy Changes
                  </Button>
                </Box>
              </Stack>
            </form>
          </TabPanel>

          <TabPanel p={0}>
              <Stack spacing={6}>
                <ConfigSection title="WAF Strategy" icon={Shield} description="Intelligent firewall policies">
                <SimpleGrid columns={2} spacing={8}>
                  <FormControl display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <FormLabel mb="0" fontSize="sm" color="white">Active Protection</FormLabel>
                      <Text fontSize="xs" color="gray.500">Enable real-time rule engine</Text>
                    </Box>
                    <Switch colorScheme="brand" isChecked={data.waf_enabled} onChange={e => setData('waf_enabled', e.target.checked)} />
                  </FormControl>
                  <FormControl display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <FormLabel mb="0" fontSize="sm" color="white">Bot Defense</FormLabel>
                      <Text fontSize="xs" color="gray.500">Block known malicious crawlers</Text>
                    </Box>
                    <Switch colorScheme="brand" isChecked={data.block_common_bad_bots} onChange={e => setData('block_common_bad_bots', e.target.checked)} />
                  </FormControl>
                  <FormControl display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <FormLabel mb="0" fontSize="sm" color="white">Bot Challenge Mode</FormLabel>
                      <Text fontSize="xs" color="gray.500">Force JS-challenge for suspected bots</Text>
                    </Box>
                    <Switch colorScheme="brand" isChecked={data.bot_challenge_mode} onChange={e => setData('bot_challenge_mode', e.target.checked)} />
                  </FormControl>
                  <FormControl display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <FormLabel mb="0" fontSize="sm" color="white">File Shield</FormLabel>
                      <Text fontSize="xs" color="gray.500">Protect .env and sensitive data</Text>
                    </Box>
                    <Switch colorScheme="brand" isChecked={data.protect_sensitive_files} onChange={e => setData('protect_sensitive_files', e.target.checked)} />
                  </FormControl>
                </SimpleGrid>
              </ConfigSection>

              <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                <HStack justify="space-between" mb={6}>
                  <HStack spacing={4}>
                    <Box p={2.5} bg={ACCENT_DIM} borderRadius="lg">
                      <Icon as={Lock} boxSize={5} color={ACCENT} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Heading size="sm" color="white">Identity Vault</Heading>
                      <Text fontSize="xs" color="gray.500">Enforce Basic Authentication for all requests</Text>
                    </VStack>
                  </HStack>
                </HStack>
                <SimpleGrid columns={2} spacing={6}>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">VAULT USERNAME</FormLabel>
                    <Input bg="#050508" borderColor={BORDER} value={data.auth_user} onChange={e => setData('auth_user', e.target.value)} placeholder="e.g. admin" />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">VAULT PASSWORD</FormLabel>
                    <Input type="password" bg="#050508" borderColor={BORDER} value={data.auth_password} onChange={e => setData('auth_password', e.target.value)} placeholder="••••••••" />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                <HStack justify="space-between" mb={6}>
                  <HStack spacing={4}>
                    <Box p={2.5} bg={ACCENT_DIM} borderRadius="lg">
                      <Icon as={Map} boxSize={5} color={ACCENT} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Heading size="sm" color="white">Regional Defense (GeoIP)</Heading>
                      <Text fontSize="xs" color="gray.500">Restrict access by geographic location (ISO Codes)</Text>
                    </VStack>
                  </HStack>
                  <Switch colorScheme="brand" isChecked={data.geoip_enabled} onChange={e => setData('geoip_enabled', e.target.checked)} />
                </HStack>
                {data.geoip_enabled && (
                  <SimpleGrid columns={2} spacing={6}>
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">ALLOWED COUNTRIES (ISO)</FormLabel>
                      <Input bg="#050508" borderColor={BORDER} value={data.geoip_allowlist} onChange={e => setData('geoip_allowlist', e.target.value)} placeholder="e.g. TR, US, GB" />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">BLOCKED COUNTRIES (ISO)</FormLabel>
                      <Input bg="#050508" borderColor={BORDER} value={data.geoip_denylist} onChange={e => setData('geoip_denylist', e.target.value)} placeholder="e.g. RU, CN, KP" />
                    </FormControl>
                  </SimpleGrid>
                )}
              </Box>

              <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                <HStack spacing={4} mb={6}>
                  <Box p={2.5} bg={ACCENT_DIM} borderRadius="lg">
                    <Icon as={ShieldCheck} boxSize={5} color={ACCENT} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="sm" color="white">WAF Security Presets</Heading>
                    <Text fontSize="xs" color="gray.500">One-click zırhlama (hardening) for common stacks</Text>
                  </VStack>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  {Object.entries(wafPresets || {}).map(([key, preset]) => {
                    const IconComp = { ShieldCheck, ShieldAlert, Terminal }[preset.icon] || ShieldCheck;
                    return (
                      <Box key={key} p={4} borderRadius="lg" border="1px solid" borderColor={BORDER} transition="all 0.2s" _hover={{ borderColor: ACCENT, bg: 'rgba(255,255,255,0.02)' }}>
                        <VStack align="start" spacing={3}>
                          <HStack justify="space-between" w="100%">
                            <Icon as={IconComp} color={ACCENT} boxSize={5} />
                            <Button size="xs" colorScheme="brand" variant="ghost" onClick={() => router.post(route('sites.apply-preset', [site.id, key]))}>
                              Apply
                            </Button>
                          </HStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="bold" color="white">{preset.name}</Text>
                            <Text fontSize="11px" color="gray.500">{preset.description}</Text>
                          </VStack>
                        </VStack>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </Box>

              <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                <HStack justify="space-between" mb={6}>
                  <HStack spacing={4}>
                    <Box p={2.5} bg={ACCENT_DIM} borderRadius="lg">
                      <Icon as={Shield} boxSize={5} color={ACCENT} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Heading size="sm" color="white">WAF Custom Rules Matrix</Heading>
                      <Text fontSize="xs" color="gray.500">Define high-precision regular expression filters</Text>
                    </VStack>
                  </HStack>
                  <Button size="sm" leftIcon={<Plus size={14} />} onClick={addWafRule} colorScheme="brand" variant="ghost">Add Rule</Button>
                </HStack>

                <Stack spacing={4}>
                  {data.custom_waf_rules.map((rule, idx) => (
                    <Box key={idx} p={4} bg="#050508" borderRadius="lg" border="1px solid" borderColor={BORDER}>
                      <HStack spacing={4}>
                        <Select size="sm" w="150px" value={rule.type} onChange={e => updateWafRule(idx, 'type', e.target.value)}>
                          <option value="path">Path Pattern</option>
                          <option value="query">Query Parameter</option>
                          <option value="header">Request Header</option>
                        </Select>

                        {rule.type === 'header' && (
                          <Input size="sm" w="180px" placeholder="Header Name" value={rule.header_name || ''} onChange={e => updateWafRule(idx, 'header_name', e.target.value)} />
                        )}

                        <Input size="sm" flex={1} placeholder="Regex Pattern (e.g. ^/admin/.*)" value={rule.pattern} onChange={e => updateWafRule(idx, 'pattern', e.target.value)} />

                        <Badge colorScheme="red" variant="subtle" px={3} py={1} borderRadius="md" fontSize="10px">BLOCK</Badge>

                        <IconButton size="sm" icon={<Trash2 size={14} />} colorScheme="red" variant="ghost" onClick={() => removeWafRule(idx)} />
                      </HStack>
                    </Box>
                  ))}
                  {data.custom_waf_rules.length === 0 && (
                    <Text fontSize="xs" color="gray.600" textAlign="center" py={4}>No custom rules defined yet.</Text>
                  )}
                </Stack>
              </Box>

              <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                <HStack justify="space-between" mb={6}>
                  <HStack spacing={4}>
                    <Box p={2.5} bg={ACCENT_DIM} borderRadius="lg">
                      <Icon as={Lock} boxSize={5} color={ACCENT} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Heading size="sm" color="white">Network Access Control</Heading>
                      <Text fontSize="xs" color="gray.500">IP-level address filtering rules</Text>
                    </VStack>
                  </HStack>
                </HStack>
                <SimpleGrid columns={2} spacing={6}>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">IP ALLOWLIST (Whitelist)</FormLabel>
                    <Textarea bg="#050508" borderColor={BORDER} value={data.ip_allowlist} onChange={e => setData('ip_allowlist', e.target.value)} placeholder="One IP/CIDR per line" size="sm" />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">IP DENYLIST (Blacklist)</FormLabel>
                    <Textarea bg="#050508" borderColor={BORDER} value={data.ip_denylist} onChange={e => setData('ip_denylist', e.target.value)} placeholder="One IP/CIDR per line" size="sm" />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Box display="flex" justifyContent="flex-end">
                <Button bg={ACCENT} color="white" _hover={{ bg: '#4f46e5' }} onClick={submitUpdate} isLoading={updateProcessing} leftIcon={<Shield size={18} />}>
                  Save Security Policy
                </Button>
              </Box>
            </Stack>
          </TabPanel>

          {/* Page Rules TabPanel (Index 3) */}
          <TabPanel p={0}>
            <Stack spacing={6}>
              <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                <HStack justify="space-between" mb={6}>
                  <HStack spacing={4}>
                    <Box p={2.5} bg={ACCENT_DIM} borderRadius="lg">
                      <Icon as={ArrowRightLeft} boxSize={5} color={ACCENT} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Heading size="sm" color="white">Create Page Rule</Heading>
                      <Text fontSize="xs" color="gray.500">Define a new routing or transformation policy</Text>
                    </VStack>
                  </HStack>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">MATCHING PATH</FormLabel>
                    <Input size="sm" bg="#050508" borderColor={BORDER} placeholder="/old-path/*" value={newRule.path} onChange={e => setNewRule('path', e.target.value)} />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">RULE TYPE</FormLabel>
                    <Select size="sm" bg="#050508" borderColor={BORDER} value={newRule.type} onChange={e => setNewRule('type', e.target.value)}>
                      <option value="redirect">Permanent Redirect (301)</option>
                      <option value="rewrite">Internal Rewrite</option>
                      <option value="header">Inject Custom Header</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">{newRule.type === 'header' ? 'HEADER: VALUE' : 'TARGET DESTINATION'}</FormLabel>
                    <Input size="sm" bg="#050508" borderColor={BORDER} placeholder={newRule.type === 'header' ? 'X-Panther: Power' : 'https://backup.site.com'} value={newRule.value} onChange={e => setNewRule('value', e.target.value)} />
                  </FormControl>
                </SimpleGrid>
                <Box mt={6} display="flex" justifyContent="flex-end">
                  <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: '#4f46e5' }} leftIcon={<Plus size={14} />} onClick={() => saveRule(route('sites.page-rules.store', site.id), { onSuccess: () => resetRule() })}>
                    Add Page Rule
                  </Button>
                </Box>
              </Box>

              <Box bg={CARD_BG} p={0} borderRadius="xl" border="1px solid" borderColor={BORDER} overflow="hidden">
                <Table variant="unstyled" size="sm">
                  <Thead bg="rgba(255,255,255,0.02)">
                    <Tr>
                      <Th color="gray.500" py={3}>PATH PATTERN</Th>
                      <Th color="gray.500" py={3}>ACTION</Th>
                      <Th color="gray.500" py={3}>VALUE</Th>
                      <Th color="gray.500" py={3}></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(site.page_rules || []).map(rule => (
                      <Tr key={rule.id} borderTop="1px solid" borderColor={BORDER} _hover={{ bg: 'rgba(255,255,255,0.01)' }}>
                        <Td py={4}><Code bg="transparent" color={ACCENT}>{rule.path}</Code></Td>
                        <Td py={4}>
                          <Badge variant="subtle" colorScheme={rule.type === 'redirect' ? 'orange' : rule.type === 'rewrite' ? 'purple' : 'green'} fontSize="10px">
                            {rule.type.toUpperCase()}
                          </Badge>
                        </Td>
                        <Td py={4} fontSize="xs" color="gray.400">{rule.value}</Td>
                        <Td py={4} textAlign="right">
                          <IconButton size="xs" variant="ghost" colorScheme="red" icon={<Trash2 size={14} />} onClick={() => destroy(route('sites.page-rules.destroy', [site.id, rule.id]), { preserveScroll: true })} />
                        </Td>
                      </Tr>
                    ))}
                    {(site.page_rules || []).length === 0 && (
                      <Tr><Td colSpan={4} py={8} textAlign="center" color="gray.600" fontSize="sm">No custom rules defined for this site.</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
            </Stack>
          </TabPanel>

          {/* Traffic Insights */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
              {[
                { l: 'TOTAL DATA IN', v: formatBytes(site.bytes_in), i: ArrowUp },
                { l: 'TOTAL DATA OUT', v: formatBytes(site.bytes_out), i: ArrowDown },
                { l: 'AVG LATENCY', v: `${Math.round(site.avg_latency_ms || 0)}ms`, i: Clock },
                { l: 'PEAK RPS', v: '24', i: Zap },
              ].map(s => (
                <Box key={s.l} bg={CARD_BG} p={5} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                  <Text fontSize="10px" fontWeight="bold" color="gray.500" letterSpacing="widest" mb={2}>{s.l}</Text>
                  <Text fontSize="xl" fontWeight="900" color="white">{s.v}</Text>
                </Box>
              ))}
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                <Heading size="xs" color="white" mb={6} textTransform="uppercase" letterSpacing="widest">HTTP Distribution</Heading>
                <ReactECharts style={{ height: '250px' }} option={{
                  backgroundColor: 'transparent',
                  tooltip: { trigger: 'item' },
                  series: [{
                    type: 'pie', radius: ['40%', '70%'],
                    data: [
                      { value: site.hits_2xx || 1, name: '2xx Success', itemStyle: { color: '#22c55e' } },
                      { value: site.hits_4xx || 0, name: '4xx Error', itemStyle: { color: '#f59e0b' } },
                      { value: site.hits_5xx || 0, name: '5xx Error', itemStyle: { color: '#ef4444' } },
                    ],
                    label: { show: false },
                  }],
                }} />
              </Box>
              <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                <Heading size="xs" color="white" mb={6} textTransform="uppercase" letterSpacing="widest">30-Day Volume</Heading>
                <ReactECharts style={{ height: '250px' }} option={{
                  backgroundColor: 'transparent',
                  grid: { left: '3%', right: '3%', bottom: '3%', top: '3%', containLabel: true },
                  xAxis: { type: 'category', data: (bandwidth || []).map(b => b.date), axisLine: { lineStyle: { color: '#333' } } },
                  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#1f1f1f' } } },
                  series: [{ type: 'bar', data: (bandwidth || []).map(b => b.requests), itemStyle: { color: ACCENT } }],
                }} />
              </Box>
            </SimpleGrid>
          </TabPanel>

          {/* Other Tabs Simplified for brevity, following the same pattern */}
          <TabPanel p={0}>
              <Stack spacing={6}>
                  <ConfigSection title="Visual Identity" icon={Palette} description="Branded experience for visitors">
                      <SimpleGrid columns={2} spacing={8}>
                          <FormControl>
                              <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">CUSTOM 403 (FORBIDDEN) PAGE HTML</FormLabel>
                              <Textarea bg="#050508" borderColor={BORDER} rows={10} value={data.custom_error_403} onChange={e => setData('custom_error_403', e.target.value)} fontFamily="monospace" fontSize="xs" />
                          </FormControl>
                          <FormControl>
                              <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">CUSTOM 503 (MAINTENANCE) PAGE HTML</FormLabel>
                              <Textarea bg="#050508" borderColor={BORDER} rows={10} value={data.custom_error_503} onChange={e => setData('custom_error_503', e.target.value)} fontFamily="monospace" fontSize="xs" />
                          </FormControl>
                      </SimpleGrid>
                  </ConfigSection>

                  <Box bg={CARD_BG} p={6} borderRadius="xl" border="1px solid" borderColor={BORDER}>
                      <HStack spacing={4} mb={6}>
                          <Box p={2.5} bg={ACCENT_DIM} borderRadius="lg">
                              <Icon as={Palette} boxSize={5} color={ACCENT} />
                          </Box>
                          <VStack align="start" spacing={0}>
                              <Heading size="sm" color="white">Stunning Error Templates</Heading>
                              <Text fontSize="xs" color="gray.500">Pick a professional design to WOW your blocked visitors</Text>
                          </VStack>
                      </HStack>
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          {Object.entries(errorTemplates || {}).map(([key, tpl]) => (
                              <Box key={key} p={4} borderRadius="lg" border="1px solid" borderColor={BORDER} transition="all 0.2s" _hover={{ borderColor: ACCENT, bg: 'rgba(255,255,255,0.02)' }}>
                                  <VStack align="start" spacing={3}>
                                      <Text fontSize="sm" fontWeight="bold" color="white">{tpl.name}</Text>
                                      <HStack spacing={2} w="100%">
                                          <Button size="xs" colorScheme="orange" variant="outline" flex={1} onClick={() => router.post(route('sites.apply-error-template', site.id), { template: key, code: '403' })}>
                                              Apply to 403
                                          </Button>
                                          <Button size="xs" colorScheme="orange" variant="outline" flex={1} onClick={() => router.post(route('sites.apply-error-template', site.id), { template: key, code: '503' })}>
                                              Apply to 503
                                          </Button>
                                      </HStack>
                                  </VStack>
                              </Box>
                          ))}
                      </SimpleGrid>
                  </Box>
              </Stack>
          </TabPanel>
          <TabPanel p={0}>
            <Box bg={CARD_BG} p={0} borderRadius="xl" border="1px solid" borderColor={BORDER} overflow="hidden">
              <Table variant="unstyled" size="sm">
                <Thead bg="rgba(255,255,255,0.02)">
                  <Tr>
                    <Th color="gray.500" py={3}>TIME & EVENT</Th>
                    <Th color="gray.500" py={3}>AUTHENTICATED USER</Th>
                    <Th color="gray.500" py={3}>ACTION TYPE</Th>
                    <Th color="gray.500" py={3}></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(site.config_audits || []).sort((a, b) => b.id - a.id).map(audit => (
                    <Tr key={audit.id} borderTop="1px solid" borderColor={BORDER} _hover={{ bg: 'rgba(255,255,255,0.01)' }}>
                      <Td py={4}>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" fontWeight="bold" color="white">
                            {new Date(audit.created_at).toLocaleString()}
                          </Text>
                          <Text fontSize="10px" color="gray.500">SYSTEM SNAPSHOT #{audit.id}</Text>
                        </VStack>
                      </Td>
                      <Td py={4}>
                        <HStack spacing={2}>
                          <Box boxSize={6} bg={ACCENT_DIM} borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                            <Text fontSize="10px" fontWeight="bold" color={ACCENT}>{audit.user?.name?.charAt(0) || 'S'}</Text>
                          </Box>
                          <Text fontSize="xs" color="gray.300">{audit.user?.name || 'System Auto'}</Text>
                        </HStack>
                      </Td>
                      <Td py={4}>
                        <Badge variant="outline" colorScheme={audit.action === 'rollback' ? 'orange' : 'blue'} fontSize="10px">
                          {audit.action.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td py={4} textAlign="right">
                        {audit.action !== 'rollback' && (
                          <Button size="xs" variant="ghost" color={ACCENT} _hover={{ bg: ACCENT_DIM }} leftIcon={<RefreshCcw size={12} />} onClick={() => router.post(route('sites.audits.rollback', [site.id, audit.id]))}>
                            Restore State
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                  {(site.config_audits || []).length === 0 && (
                    <Tr><Td colSpan={4} py={12} textAlign="center" color="gray.600" fontSize="sm">No deployment history found.</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </EnterpriseLayout>
  );
}
