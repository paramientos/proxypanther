import React from 'react';
import EnterpriseLayout from '@/Layouts/EnterpriseLayout';
import {
    Box, Heading, Text, Button, Badge, HStack, VStack,
    Table, Thead, Tbody, Tr, Th, Td,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
    FormControl, FormLabel, Input, Select,
    useDisclosure, useToast, Icon,
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

    const bg = '#161616';
    const headBg = '#1a1a1a';

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
                    <Heading size="lg" color="white">Teams</Heading>
                    <Text color="gray.500" fontSize="sm">Collaborate with your team on proxy site management.</Text>
                </Box>
                <Button leftIcon={<Plus size={16} />} bg="#F68220" color="white" _hover={{ bg: '#e56b10' }} onClick={onCreateOpen}>
                    New Team
                </Button>
            </Box>

            {allTeams.length === 0 ? (
                <Box bg={bg} p={12} rounded="lg" border="1px solid" borderColor="#242424" textAlign="center">
                    <Icon as={Users} boxSize={10} color="gray.700" mb={4} />
                    <Text fontSize="md" color="gray.500" fontWeight="medium" mb={2}>No teams yet</Text>
                    <Text color="gray.600" fontSize="sm" mb={4}>Create a team to collaborate with others.</Text>
                    <Button bg="#F68220" color="white" _hover={{ bg: '#e56b10' }} onClick={onCreateOpen}>Create your first team</Button>
                </Box>
            ) : (
                <VStack spacing={4} align="stretch">
                    {allTeams.map(team => {
                        const isOwner = team.owner_id === auth.user.id;
                        return (
                            <Box key={team.id} bg={bg} rounded="lg" border="1px solid" borderColor="#242424" overflow="hidden">
                                <Box px={5} py={4} borderBottom="1px solid" borderColor="#242424">
                                    <HStack justify="space-between">
                                        <HStack spacing={3}>
                                            <Box p={2} bg="rgba(246,130,32,0.12)" borderRadius="md">
                                                <Icon as={Users} color="#F68220" boxSize={4} />
                                            </Box>
                                            <VStack align="start" spacing={0}>
                                                <HStack>
                                                    <Text fontWeight="semibold" color="white" fontSize="sm">{team.name}</Text>
                                                    {isOwner && <Badge fontSize="10px" bg="rgba(246,130,32,0.15)" color="#F68220">Owner</Badge>}
                                                    {auth.user.current_team_id === team.id && <Badge colorScheme="green" fontSize="10px">Active</Badge>}
                                                </HStack>
                                                <Text fontSize="xs" color="gray.600">
                                                    {team.proxy_sites_count ?? 0} sites · {team.users?.length ?? 0} members
                                                </Text>
                                            </VStack>
                                        </HStack>
                                        <HStack spacing={2}>
                                            {auth.user.current_team_id !== team.id && (
                                                <Button size="sm" leftIcon={<LogIn size={13} />} variant="outline"
                                                    borderColor="#333" color="gray.400" _hover={{ borderColor: '#F68220', color: '#F68220' }}
                                                    onClick={() => switchTeam(team.id)}>
                                                    Switch
                                                </Button>
                                            )}
                                            {isOwner && (
                                                <Button size="sm" leftIcon={<Plus size={13} />} variant="ghost"
                                                    color="#F68220" _hover={{ bg: 'rgba(246,130,32,0.1)' }}
                                                    onClick={() => { setSelectedTeam(team); onInviteOpen(); }}>
                                                    Invite
                                                </Button>
                                            )}
                                            {isOwner && (
                                                <Button size="sm" leftIcon={<Trash2 size={13} />} variant="ghost"
                                                    color="gray.600" _hover={{ color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }}
                                                    onClick={() => deleteTeam(team.id)}>
                                                    Delete
                                                </Button>
                                            )}
                                        </HStack>
                                    </HStack>
                                </Box>

                                <Table variant="unstyled" size="sm">
                                    <Thead>
                                        <Tr borderBottom="1px solid" borderColor="#1f1f1f">
                                            {['Member', 'Email', 'Role', isOwner ? '' : null].filter(Boolean).map(h => (
                                                <Th key={h} py={2.5} px={4} fontSize="10px" color="gray.600" fontWeight="semibold" letterSpacing="wider">{h}</Th>
                                            ))}
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {(team.users || []).map(member => (
                                            <Tr key={member.id} borderBottom="1px solid" borderColor="#1a1a1a" _hover={{ bg: '#1c1c1c' }}>
                                                <Td px={4} py={2.5} fontSize="sm" fontWeight="medium" color="white">{member.name}</Td>
                                                <Td px={4} py={2.5} fontSize="sm" color="gray.500">{member.email}</Td>
                                                <Td px={4} py={2.5}>
                                                    <Badge fontSize="10px"
                                                        colorScheme={member.pivot?.role === 'admin' ? 'purple' : member.pivot?.role === 'viewer' ? 'gray' : 'blue'}>
                                                        {member.pivot?.role || 'member'}
                                                    </Badge>
                                                </Td>
                                                {isOwner && (
                                                    <Td px={4} py={2.5} textAlign="right">
                                                        {member.id !== auth.user.id && (
                                                            <Button size="xs" variant="ghost" color="gray.600"
                                                                _hover={{ color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }}
                                                                leftIcon={<UserMinus size={11} />}
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
                <ModalOverlay backdropFilter="blur(4px)" bg="rgba(0,0,0,0.7)" />
                <ModalContent bg="#161616" border="1px solid" borderColor="#242424">
                    <ModalHeader color="white" borderBottom="1px solid" borderColor="#242424" pb={4}>Create New Team</ModalHeader>
                    <ModalCloseButton color="gray.500" />
                    <form onSubmit={handleCreate}>
                        <ModalBody py={5}>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color="gray.400">Team Name</FormLabel>
                                <Input placeholder="e.g. DevOps Team"
                                    value={createForm.data.name}
                                    onChange={e => createForm.setData('name', e.target.value)}
                                    bg="#0d0d0d" borderColor="#242424" color="white"
                                    _focus={{ borderColor: '#F68220', boxShadow: '0 0 0 1px #F68220' }} />
                            </FormControl>
                        </ModalBody>
                        <ModalFooter borderTop="1px solid" borderColor="#242424">
                            <Button variant="ghost" color="gray.500" mr={3} onClick={onCreateClose}>Cancel</Button>
                            <Button bg="#F68220" color="white" _hover={{ bg: '#e56b10' }}
                                type="submit" isLoading={createForm.processing}>Create</Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Invite Modal */}
            <Modal isOpen={isInviteOpen} onClose={onInviteClose}>
                <ModalOverlay backdropFilter="blur(4px)" bg="rgba(0,0,0,0.7)" />
                <ModalContent bg="#161616" border="1px solid" borderColor="#242424">
                    <ModalHeader color="white" borderBottom="1px solid" borderColor="#242424" pb={4}>
                        Invite to {selectedTeam?.name}
                    </ModalHeader>
                    <ModalCloseButton color="gray.500" />
                    <form onSubmit={handleInvite}>
                        <ModalBody py={5}>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" color="gray.400">Email Address</FormLabel>
                                    <Input type="email" placeholder="user@example.com"
                                        value={inviteForm.data.email}
                                        onChange={e => inviteForm.setData('email', e.target.value)}
                                        bg="#0d0d0d" borderColor="#242424" color="white"
                                        _focus={{ borderColor: '#F68220', boxShadow: '0 0 0 1px #F68220' }} />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" color="gray.400">Role</FormLabel>
                                    <Select value={inviteForm.data.role}
                                        onChange={e => inviteForm.setData('role', e.target.value)}
                                        bg="#0d0d0d" borderColor="#242424" color="white"
                                        _focus={{ borderColor: '#F68220' }}>
                                        <option value="admin">Admin</option>
                                        <option value="member">Member</option>
                                        <option value="viewer">Viewer</option>
                                    </Select>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter borderTop="1px solid" borderColor="#242424">
                            <Button variant="ghost" color="gray.500" mr={3} onClick={onInviteClose}>Cancel</Button>
                            <Button bg="#F68220" color="white" _hover={{ bg: '#e56b10' }}
                                type="submit" isLoading={inviteForm.processing}>Invite</Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </EnterpriseLayout>
    );
}
