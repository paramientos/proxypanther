import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Heading, Text, Button, SimpleGrid, Badge, HStack, VStack,
    Table, Thead, Tbody, Tr, Th, Td,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
    FormControl, FormLabel, Input, Select,
    useColorModeValue, useDisclosure, useToast, Icon, Divider,
} from '@chakra-ui/react';
import { Users, Plus, UserMinus, LogIn, Trash2 } from 'lucide-react';
import { Head, useForm, router } from '@inertiajs/react';

export default function Index({ auth, teams, ownedTeams }) {
    const toast = useToast();
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const { isOpen: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();
    const [selectedTeam, setSelectedTeam] = React.useState(null);

    const createForm = useForm({ name: '' });
    const inviteForm = useForm({ email: '', role: 'member' });

    const bg = useColorModeValue('white', 'gray.800');
    const headBg = useColorModeValue('gray.50', 'gray.700');

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route('teams.store'), {
            onSuccess: () => { onCreateClose(); createForm.reset(); toast({ title: 'Team created', status: 'success' }); },
        });
    };

    const handleInvite = (e) => {
        e.preventDefault();
        inviteForm.post(route('teams.invite', selectedTeam.id), {
            onSuccess: () => { onInviteClose(); inviteForm.reset(); toast({ title: 'User invited', status: 'success' }); },
        });
    };

    const switchTeam = (teamId) => {
        router.post(route('teams.switch'), { team_id: teamId }, {
            onSuccess: () => toast({ title: 'Team switched', status: 'success' }),
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

    return (
        <EnterpriseLayout user={auth.user}>
            <Head title="Teams" />

            <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Heading size="lg">Teams</Heading>
                    <Text color="gray.500">Collaborate with your team on proxy site management.</Text>
                </Box>
                <Button leftIcon={<Plus size={16} />} colorScheme="blue" onClick={onCreateOpen}>
                    New Team
                </Button>
            </Box>

            {allTeams.length === 0 ? (
                <Box bg={bg} p={12} rounded="lg" shadow="base" textAlign="center">
                    <Icon as={Users} boxSize={12} color="gray.300" mb={4} />
                    <Heading size="md" color="gray.500" mb={2}>No teams yet</Heading>
                    <Text color="gray.400" mb={4}>Create a team to collaborate with others.</Text>
                    <Button colorScheme="blue" onClick={onCreateOpen}>Create your first team</Button>
                </Box>
            ) : (
                <VStack spacing={6} align="stretch">
                    {allTeams.map(team => {
                        const isOwner = team.owner_id === auth.user.id;
                        return (
                            <Box key={team.id} bg={bg} shadow="base" rounded="lg" overflow="hidden">
                                <Box px={6} py={4} borderBottom="1px" borderColor={useColorModeValue('gray.100', 'gray.700')}>
                                    <HStack justify="space-between">
                                        <HStack spacing={3}>
                                            <Icon as={Users} color="blue.400" />
                                            <VStack align="start" spacing={0}>
                                                <HStack>
                                                    <Heading size="sm">{team.name}</Heading>
                                                    {isOwner && <Badge colorScheme="blue">Owner</Badge>}
                                                    {auth.user.current_team_id === team.id && <Badge colorScheme="green">Active</Badge>}
                                                </HStack>
                                                <Text fontSize="xs" color="gray.500">
                                                    {team.proxy_sites_count ?? 0} sites · {team.users?.length ?? 0} members
                                                </Text>
                                            </VStack>
                                        </HStack>
                                        <HStack>
                                            {auth.user.current_team_id !== team.id && (
                                                <Button size="sm" leftIcon={<LogIn size={14} />} variant="outline" onClick={() => switchTeam(team.id)}>
                                                    Switch
                                                </Button>
                                            )}
                                            {isOwner && (
                                                <Button size="sm" leftIcon={<Plus size={14} />} colorScheme="blue" variant="ghost"
                                                    onClick={() => { setSelectedTeam(team); onInviteOpen(); }}>
                                                    Invite
                                                </Button>
                                            )}
                                            {isOwner && (
                                                <Button size="sm" leftIcon={<Trash2 size={14} />} colorScheme="red" variant="ghost"
                                                    onClick={() => deleteTeam(team.id)}>
                                                    Delete
                                                </Button>
                                            )}
                                        </HStack>
                                    </HStack>
                                </Box>

                                <Table variant="simple" size="sm">
                                    <Thead bg={headBg}>
                                        <Tr>
                                            <Th>Member</Th>
                                            <Th>Email</Th>
                                            <Th>Role</Th>
                                            {isOwner && <Th></Th>}
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {(team.users || []).map(member => (
                                            <Tr key={member.id}>
                                                <Td fontSize="sm" fontWeight="medium">{member.name}</Td>
                                                <Td fontSize="sm" color="gray.500">{member.email}</Td>
                                                <Td>
                                                    <Badge colorScheme={
                                                        member.pivot?.role === 'admin' ? 'purple' :
                                                            member.pivot?.role === 'viewer' ? 'gray' : 'blue'
                                                    }>
                                                        {member.pivot?.role || 'member'}
                                                    </Badge>
                                                </Td>
                                                {isOwner && (
                                                    <Td textAlign="right">
                                                        {member.id !== auth.user.id && (
                                                            <Button size="xs" colorScheme="red" variant="ghost"
                                                                leftIcon={<UserMinus size={12} />}
                                                                onClick={() => removeMember(team, member.id)}>
                                                                Remove
                                                            </Button>
                                                        )}
                                                    </Td>
                                                )}
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                        );
                    })}
                </VStack>
            )}

            {/* Create Team Modal */}
            <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create New Team</ModalHeader>
                    <ModalCloseButton />
                    <form onSubmit={handleCreate}>
                        <ModalBody>
                            <FormControl isRequired>
                                <FormLabel>Team Name</FormLabel>
                                <Input
                                    placeholder="e.g. DevOps Team"
                                    value={createForm.data.name}
                                    onChange={e => createForm.setData('name', e.target.value)}
                                />
                            </FormControl>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onCreateClose}>Cancel</Button>
                            <Button colorScheme="blue" type="submit" isLoading={createForm.processing}>Create</Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Invite Modal */}
            <Modal isOpen={isInviteOpen} onClose={onInviteClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Invite to {selectedTeam?.name}</ModalHeader>
                    <ModalCloseButton />
                    <form onSubmit={handleInvite}>
                        <ModalBody>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Email Address</FormLabel>
                                    <Input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={inviteForm.data.email}
                                        onChange={e => inviteForm.setData('email', e.target.value)}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Role</FormLabel>
                                    <Select value={inviteForm.data.role} onChange={e => inviteForm.setData('role', e.target.value)}>
                                        <option value="admin">Admin</option>
                                        <option value="member">Member</option>
                                        <option value="viewer">Viewer</option>
                                    </Select>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onInviteClose}>Cancel</Button>
                            <Button colorScheme="blue" type="submit" isLoading={inviteForm.processing}>Invite</Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </EnterpriseLayout>
    );
}
