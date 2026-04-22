import React, { useState } from 'react';
import { AppShell, Box, Burger, Group, Text, NavLink, Container } from '@mantine/core';
import { IconShield, IconLogout, IconLayoutDashboard, IconBan, IconFileText, IconLock, IconActivity, IconUsers } from '@tabler/icons-react';
import { Link as InertiaLink, router } from '@inertiajs/react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: 'dashboard', icon: IconLayoutDashboard },
  { label: 'IP Blacklist', href: 'banned-ips.index', icon: IconBan },
  { label: 'Security Logs', href: 'logs.index', icon: IconFileText },
  { label: 'SSL', href: 'ssl.index', icon: IconLock },
  { label: 'Uptime', href: 'uptime.index', icon: IconActivity },
  { label: 'Teams', href: 'teams.index', icon: IconUsers },
];

export default function AppLayout({ children, user }) {
  const [opened, setOpened] = useState(false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      styles={{
        main: { backgroundColor: '#0f0f11', minHeight: '100vh' },
        header: { backgroundColor: '#18181b', borderBottom: '1px solid #27272a' },
        navbar: { backgroundColor: '#18181b', borderRight: '1px solid #27272a' },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={() => setOpened(!opened)} hiddenFrom="sm" size="sm" color="#f38020" />
            <IconShield size={22} color="#f38020" />
            <Text fw={700} size="lg" c="white">ProxyPanther</Text>
          </Group>
          <Group gap="md">
            <Text size="sm" c="dimmed">{user?.name}</Text>
            <Box
              component="button"
              onClick={() => router.post(route('logout'))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <IconLogout size={18} color="#71717a" />
            </Box>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            component={InertiaLink}
            href={route(item.href)}
            label={item.label}
            leftSection={<item.icon size={16} />}
            active={route().current(item.href)}
            styles={{
              root: { borderRadius: 6, color: '#a1a1aa' },
              label: { fontSize: 13 },
            }}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl" py="md">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
