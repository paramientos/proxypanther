import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Title, Text, Button, Badge, Group, Stack,
    Table, Paper, Modal, TextInput, Select, Flex,
    ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconUsers, IconPlus, IconUserMinus, IconLogin, IconTrash,
} from '@tabler/icons-react';
import { Head, useForm, router } from '@inertiajs/react';

const CARD_BG = '#111113';
const BORDER = 'rgba(255,255,255,0.07)';
const ACCENT = '#f38020';

export default function Index({ auth, teams, ownedTeams }) {
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [inviteOpened, { open: openInvite, close: closeInvite }] = useDisclosure(false);
    const [selectedTeam, setSelectedTeam] = React.useState(null);

    const createForm = useForm({ name: '' });
    const inviteForm = useForm({ email: '', role: 'member' });

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route('teams.store'), {
            onSuccess: () => {
                closeCreate();
                createForm.reset();
                notifications.show({ title: 'Team created', color: 'orange' });
            },
        });
    };

    const handleInvite = (e) => {
        e.preventDefault();
        inviteForm.post(route('teams.invite', selectedTeam.id), {
            onSuccess: () => {
                closeInvite();
                inviteForm.reset();
                notifications.show({ title: 'User invited', color: 'orange' });
            },
        });
    };

    const switchTeam = (teamId) => {
        router.post(route('teams.switch'), { team_id: teamId }, {
            onSuccess: () => notifications.show({ title: 'Team switched', color: 'orange' }),
        });
    };

    const removeMember = (team, userId) => {
        if (!confirm('Remove this member?')) return;
        router.delete(route('teams.members.remove', [team.id, userId]));
    };

    const deleteTeam = (teamId) => {
        if (!confirm('Delete this team? This cannot be undone.')) return;
        router.delete(route('teams.destroy', teamId));
    };

    const allTeams = [...ownedTeams, ...teams.filter(t => !ownedTeams.find(o => o.id === t.id))];

    const modalStyles = {
        content: { backgroundColor: '#111113', border: `1px solid ${BORDER}` },
        header: { backgroundColor: '#111113', borderBottom: `1px solid ${BORDER}` },
    };

    const inputStyles = {
        label: { color: '#71717a', fontSize: 12 },
        input: { backgroundColor: '#0a0a0b', borderColor: BORDER, color: '#e4e4e7' },
    };

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title="Teams" />

            <Flex justify="space-between" align="center" mb={32}>
                <Box>
                    <Title order={2} c="white" fw={600}>Teams</Title>
                    <Text c="dimmed" size="sm" mt={4}>Collaborate with your team on proxy site management.</Text>
                </Box>
                <Button
                    leftSection={<IconPlus size={15} />}
                    style={{ backgroundColor: ACCENT }}
                    onClick={openCreate}
                >
                    New Team
                </Button>
            </Flex>

            {allTeams.length === 0 ? (
                <Paper
                    p={48}
                    style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, textAlign: 'center' }}
                >
                    <IconUsers size={40} color="#3f3f46" style={{ marginBottom: 16 }} />
                    <Text size="md" c="dimmed" fw={500} mb={8}>No teams yet</Text>
                    <Text c="dimmed" size="sm" mb={16}>Create a team to collaborate with others.</Text>
                    <Button style={{ backgroundColor: ACCENT }} onClick={openCreate}>
                        Create your first team
                    </Button>
                </Paper>
            ) : (
                <Stack gap={16}>
                    {allTeams.map(team => {
                        const isOwner = team.owner_id === auth.user.id;
                        return (
                            <Paper
                                key={team.id}
                                style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, overflow: 'hidden' }}
                            >
                                <Flex
                                    px={20} py={16}
                                    justify="space-between"
                                    align="center"
                                    style={{ borderBottom: `1px solid ${BORDER}` }}
                                >
                                    <Group gap={12}>
                                        <Box
                                            style={{
                                                padding: 8,
                                                backgroundColor: 'rgba(243,128,32,0.1)',
                                                borderRadius: 8,
                                            }}
                                        >
                                            <IconUsers size={16} color={ACCENT} />
                                        </Box>
                                        <Box>
                                            <Group gap={8}>
                                                <Text fw={600} c="white" size="sm">{team.name}</Text>
                                                {isOwner && (
                                                    <Badge size="xs" style={{ backgroundColor: 'rgba(243,128,32,0.1)', color: ACCENT }}>
                                                        Owner
                                                    </Badge>
                                                )}
                                                {auth.user.current_team_id === team.id && (
                                                    <Badge color="green" size="xs">Active</Badge>
                                                )}
                                            </Group>
                                            <Text size="xs" c="dimmed">
                                                {team.proxy_sites_count ?? 0} sites · {team.users?.length ?? 0} members
                                            </Text>
                                        </Box>
                                    </Group>
                                    <Group gap={8}>
                                        {auth.user.current_team_id !== team.id && (
                                            <Button
                                                size="xs"
                                                variant="outline"
                                                color="gray"
                                                leftSection={<IconLogin size={13} />}
                                                onClick={() => switchTeam(team.id)}
                                            >
                                                Switch
                                            </Button>
                                        )}
                                        {isOwner && (
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                color="orange"
                                                leftSection={<IconPlus size={13} />}
                                                onClick={() => { setSelectedTeam(team); openInvite(); }}
                                            >
                                                Invite
                                            </Button>
                                        )}
                                        {isOwner && (
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                color="red"
                                                leftSection={<IconTrash size={13} />}
                                                onClick={() => deleteTeam(team.id)}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </Group>
                                </Flex>

                                <Table highlightOnHover highlightOnHoverColor="#18181b">
                                    <Table.Thead>
                                        <Table.Tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                                            {['Member', 'Email', 'Role', isOwner ? '' : null].filter(Boolean).map(h => (
                                                <Table.Th
                                                    key={h}
                                                    style={{
                                                        fontSize: 10,
                                                        color: '#52525b',
                                                        fontWeight: 600,
                                                        letterSpacing: '0.08em',
                                                        padding: '10px 16px',
                                                        backgroundColor: CARD_BG,
                                                    }}
                                                >
                                                    {h}
                                                </Table.Th>
                                            ))}
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {(team.users || []).map(member => (
                                            <Table.Tr key={member.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                                                <Table.Td style={{ padding: '10px 16px' }}>
                                                    <Text size="sm" fw={500} c="white">{member.name}</Text>
                                                </Table.Td>
                                                <Table.Td style={{ padding: '10px 16px' }}>
                                                    <Text size="sm" c="dimmed">{member.email}</Text>
                                                </Table.Td>
                                                <Table.Td style={{ padding: '10px 16px' }}>
                                                    <Badge
                                                        size="xs"
                                                        color={member.pivot?.role === 'admin' ? 'violet' : member.pivot?.role === 'viewer' ? 'gray' : 'blue'}
                                                    >
                                                        {member.pivot?.role || 'member'}
                                                    </Badge>
                                                </Table.Td>
                                                {isOwner && (
                                                    <Table.Td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                                        {member.id !== auth.user.id && (
                                                            <Button
                                                                size="xs"
                                                                variant="subtle"
                                                                color="red"
                                                                leftSection={<IconUserMinus size={11} />}
                                                                onClick={() => removeMember(team, member.id)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        )}
                                                    </Table.Td>
                                                )}
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Paper>
                        );
                    })}
                </Stack>
            )}

            <Modal
                opened={createOpened}
                onClose={closeCreate}
                title={<Text fw={600} c="white">Create New Team</Text>}
                styles={modalStyles}
            >
                <form onSubmit={handleCreate}>
                    <Stack gap={16} pt={8}>
                        <TextInput
                            label="Team Name"
                            placeholder="e.g. DevOps Team"
                            required
                            value={createForm.data.name}
                            onChange={e => createForm.setData('name', e.target.value)}
                            styles={inputStyles}
                        />
                        <Group justify="flex-end" pt={8} style={{ borderTop: `1px solid ${BORDER}` }}>
                            <Button variant="subtle" color="gray" onClick={closeCreate}>Cancel</Button>
                            <Button
                                type="submit"
                                loading={createForm.processing}
                                style={{ backgroundColor: ACCENT }}
                            >
                                Create
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal
                opened={inviteOpened}
                onClose={closeInvite}
                title={<Text fw={600} c="white">Invite to {selectedTeam?.name}</Text>}
                styles={modalStyles}
            >
                <form onSubmit={handleInvite}>
                    <Stack gap={16} pt={8}>
                        <TextInput
                            label="Email Address"
                            type="email"
                            placeholder="user@example.com"
                            required
                            value={inviteForm.data.email}
                            onChange={e => inviteForm.setData('email', e.target.value)}
                            styles={inputStyles}
                        />
                        <Select
                            label="Role"
                            required
                            value={inviteForm.data.role}
                            onChange={v => inviteForm.setData('role', v)}
                            data={[
                                { value: 'admin', label: 'Admin' },
                                { value: 'member', label: 'Member' },
                                { value: 'viewer', label: 'Viewer' },
                            ]}
                            styles={inputStyles}
                        />
                        <Group justify="flex-end" pt={8} style={{ borderTop: `1px solid ${BORDER}` }}>
                            <Button variant="subtle" color="gray" onClick={closeInvite}>Cancel</Button>
                            <Button
                                type="submit"
                                loading={inviteForm.processing}
                                style={{ backgroundColor: ACCENT }}
                            >
                                Invite
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </EnterpriseLayout>
    );
}
