import React from 'react';
import {
    Box,
    Flex,
    Text,
    IconButton,
    VStack,
    HStack,
    Icon,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    Badge,
    Tooltip,
    Drawer,
    DrawerContent,
    DrawerOverlay,
    useDisclosure,
    Container,
} from '@chakra-ui/react';
import {
    LayoutDashboard,
    Shield,
    LogOut,
    Users,
    Lock,
    TrendingUp,
    Menu as MenuIcon,
    X,
    Settings,
    Bell,
    Search,
    ChevronDown,
    Globe,
    BarChart3,
    FileText,
    Zap,
} from 'lucide-react';
import { Link as InertiaLink, router } from '@inertiajs/react';

const NAV_ITEMS = [
    { name: 'Dashboard', icon: LayoutDashboard, route: 'dashboard' },
    { name: 'Proxy Sites', icon: Globe, route: 'dashboard', params: { view: 'sites' } },
    { name: 'Security Logs', icon: FileText, route: 'logs.index' },
    { name: 'IP Blacklist', icon: Shield, route: 'banned-ips.index' },
    { name: 'SSL Certificates', icon: Lock, route: 'ssl.index' },
    { name: 'Uptime & SLA', icon: TrendingUp, route: 'uptime.index' },
    { name: 'Analytics', icon: BarChart3, route: 'logs.index' },
    { name: 'Teams', icon: Users, route: 'teams.index' },
];

const SIDEBAR_BG = '#111111';
const SIDEBAR_BORDER = '#1f1f1f';
const TOPBAR_BG = '#0a0a0a';
const CONTENT_BG = '#0d0d0d';
const ACTIVE_BG = '#F68220';
const HOVER_BG = '#1a1a1a';
const ACCENT = '#F68220';

function SidebarContent({ onClose }) {
    return (
        <Box
            bg={SIDEBAR_BG}
            borderRight="1px solid"
            borderRightColor={SIDEBAR_BORDER}
            w={{ base: 'full', md: '240px' }}
            pos="fixed"
            h="full"
            zIndex={10}
        >
            {/* Logo */}
            <Flex h="16" alignItems="center" mx={5} justifyContent="space-between">
                <HStack spacing={3}>
                    <Box
                        w={8} h={8}
                        bg={ACCENT}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Icon as={Zap} w={5} h={5} color="white" />
                    </Box>
                    <VStack align="start" spacing={0}>
                        <Text fontSize="md" fontWeight="bold" color="white" letterSpacing="tight">
                            ProxyPanther
                        </Text>
                        <Text fontSize="10px" color="gray.500" letterSpacing="widest" textTransform="uppercase">
                            Enterprise
                        </Text>
                    </VStack>
                </HStack>
                <IconButton
                    display={{ base: 'flex', md: 'none' }}
                    onClick={onClose}
                    variant="ghost"
                    color="gray.400"
                    icon={<X size={18} />}
                    aria-label="close"
                    size="sm"
                />
            </Flex>

            {/* Nav label */}
            <Text fontSize="10px" color="gray.600" fontWeight="semibold" letterSpacing="widest"
                textTransform="uppercase" px={5} mt={6} mb={2}>
                Navigation
            </Text>

            {/* Navigation */}
            <VStack spacing={0.5} align="stretch" px={3}>
                {NAV_ITEMS.map((item) => {
                    const currentView = new URLSearchParams(window.location.search).get('view');
                    const itemView = item.params?.view;
                    const isActive = route().current(item.route) && (itemView === currentView || (!itemView && !currentView));
                    return (
                        <Tooltip key={item.name} label={item.name} placement="right" hasArrow>
                            <Box
                                as={InertiaLink}
                                href={route(item.route, item.params || {})}
                                display="flex"
                                alignItems="center"
                                px={3}
                                py={2.5}
                                borderRadius="md"
                                cursor="pointer"
                                bg={isActive ? ACTIVE_BG : 'transparent'}
                                color={isActive ? 'white' : 'gray.500'}
                                _hover={{ bg: isActive ? ACTIVE_BG : HOVER_BG, color: 'white' }}
                                transition="all 0.15s"
                                position="relative"
                            >
                                {isActive && (
                                    <Box
                                        position="absolute"
                                        left={0}
                                        top="20%"
                                        bottom="20%"
                                        w="3px"
                                        bg="white"
                                        borderRadius="full"
                                        opacity={0.6}
                                    />
                                )}
                                <Icon as={item.icon} boxSize={4} />
                                <Text ml={3} fontSize="sm" fontWeight={isActive ? 'semibold' : 'normal'}>
                                    {item.name}
                                </Text>
                            </Box>
                        </Tooltip>
                    );
                })}
            </VStack>

            {/* System status */}
            <Box position="absolute" bottom={4} left={0} right={0} px={3}>
                <Box px={3} py={3} borderRadius="md" bg="#1a1a1a" border="1px solid" borderColor="#2a2a2a">
                    <HStack spacing={2}>
                        <Box w={2} h={2} borderRadius="full" bg="green.400"
                            boxShadow="0 0 6px rgba(72,187,120,0.8)" />
                        <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                                System Status
                            </Text>
                            <Text fontSize="xs" color="white" fontWeight="medium">
                                All Systems Operational
                            </Text>
                        </VStack>
                    </HStack>
                </Box>
            </Box>
        </Box>
    );
}

export default function EnterpriseLayout({ children, user }) {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Box minH="100vh" bg={CONTENT_BG}>
            {/* Desktop sidebar */}
            <Box display={{ base: 'none', md: 'block' }}>
                <SidebarContent onClose={onClose} />
            </Box>

            {/* Mobile drawer */}
            <Drawer autoFocus={false} isOpen={isOpen} placement="left"
                onClose={onClose} returnFocusOnClose={false} onOverlayClick={onClose} size="full">
                <DrawerOverlay />
                <DrawerContent>
                    <SidebarContent onClose={onClose} />
                </DrawerContent>
            </Drawer>

            {/* Main area */}
            <Box ml={{ base: 0, md: '240px' }}>
                {/* Topbar */}
                <Flex
                    px={6}
                    height="16"
                    alignItems="center"
                    bg={TOPBAR_BG}
                    borderBottom="1px solid"
                    borderBottomColor={SIDEBAR_BORDER}
                    justifyContent="space-between"
                    position="sticky"
                    top={0}
                    zIndex={9}
                >
                    <HStack spacing={4} flex={1}>
                        <IconButton
                            display={{ base: 'flex', md: 'none' }}
                            onClick={onOpen}
                            variant="ghost"
                            color="gray.400"
                            icon={<MenuIcon size={20} />}
                            aria-label="open menu"
                        />
                        <Box
                            display={{ base: 'none', md: 'flex' }}
                            alignItems="center"
                            bg="#1a1a1a"
                            border="1px solid"
                            borderColor="#2a2a2a"
                            px={4}
                            py={2}
                            borderRadius="md"
                            maxW="360px"
                            flex={1}
                            cursor="text"
                        >
                            <Icon as={Search} color="gray.600" boxSize={4} mr={2} />
                            <Text fontSize="sm" color="gray.600">
                                Search sites, logs, IPs...
                            </Text>
                            <Box ml="auto" px={1.5} py={0.5} bg="#2a2a2a" borderRadius="sm">
                                <Text fontSize="10px" color="gray.500">⌘K</Text>
                            </Box>
                        </Box>
                    </HStack>

                    <HStack spacing={2}>
                        <Tooltip label="Notifications" hasArrow>
                            <Box position="relative">
                                <IconButton
                                    variant="ghost"
                                    color="gray.400"
                                    _hover={{ bg: HOVER_BG, color: 'white' }}
                                    icon={<Bell size={18} />}
                                    aria-label="notifications"
                                    size="sm"
                                />
                                <Box
                                    position="absolute"
                                    top={1}
                                    right={1}
                                    w={2}
                                    h={2}
                                    bg={ACCENT}
                                    borderRadius="full"
                                    border="2px solid"
                                    borderColor={TOPBAR_BG}
                                />
                            </Box>
                        </Tooltip>

                        <Box w="1px" h={6} bg="#2a2a2a" mx={1} />

                        <Menu>
                            <MenuButton>
                                <HStack spacing={2} cursor="pointer" px={2} py={1}
                                    borderRadius="md" _hover={{ bg: HOVER_BG }}>
                                    <Avatar size="xs" name={user?.name} bg={ACCENT} color="white" />
                                    <VStack display={{ base: 'none', md: 'flex' }} alignItems="flex-start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="medium" color="white">
                                            {user?.name}
                                        </Text>
                                        <Text fontSize="10px" color="gray.500">
                                            Administrator
                                        </Text>
                                    </VStack>
                                    <Icon as={ChevronDown} boxSize={3} color="gray.500" />
                                </HStack>
                            </MenuButton>
                            <MenuList bg="#1a1a1a" borderColor="#2a2a2a">
                                <MenuItem bg="transparent" _hover={{ bg: HOVER_BG }}
                                    icon={<Settings size={14} />} color="gray.300">
                                    Settings
                                </MenuItem>
                                <MenuItem bg="transparent" _hover={{ bg: HOVER_BG }}
                                    icon={<Users size={14} />} color="gray.300"
                                    as={InertiaLink} href={route('teams.index')}>
                                    Teams
                                </MenuItem>
                                <MenuDivider borderColor="#2a2a2a" />
                                <MenuItem bg="transparent" _hover={{ bg: '#2a1010' }}
                                    icon={<LogOut size={14} />} color="red.400"
                                    onClick={() => router.post(route('logout'))}>
                                    Logout
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </HStack>
                </Flex>

                {/* Content */}
                <Box p={8}>
                    <Container maxW="container.2xl">{children}</Container>
                </Box>
            </Box>
        </Box>
    );
}
