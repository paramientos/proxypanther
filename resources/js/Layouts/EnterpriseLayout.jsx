import React from 'react';
import {
    Box,
    Flex,
    Text,
    IconButton,
    VStack,
    HStack,
    Icon,
    useColorModeValue,
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
} from 'lucide-react';
import { Link as InertiaLink, router } from '@inertiajs/react';

const NAV_ITEMS = [
    { name: 'Dashboard', icon: LayoutDashboard, route: 'dashboard' },
    { name: 'Proxy Sites', icon: Globe, route: 'dashboard' },
    { name: 'Security Logs', icon: FileText, route: 'logs.index' },
    { name: 'IP Blacklist', icon: Shield, route: 'banned-ips.index' },
    { name: 'SSL Certificates', icon: Lock, route: 'ssl.index' },
    { name: 'Uptime & SLA', icon: TrendingUp, route: 'uptime.index' },
    { name: 'Analytics', icon: BarChart3, route: 'dashboard' },
    { name: 'Teams', icon: Users, route: 'teams.index' },
];

export default function EnterpriseLayout({ children, user }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const sidebarBg = useColorModeValue('gray.900', 'gray.900');
    const sidebarHoverBg = useColorModeValue('gray.800', 'gray.800');
    const activeBg = useColorModeValue('blue.600', 'blue.600');
    const topbarBg = useColorModeValue('white', 'gray.800');
    const contentBg = useColorModeValue('gray.50', 'gray.900');

    const SidebarContent = ({ onClose, ...rest }) => (
        <Box
            bg={sidebarBg}
            borderRight="1px"
            borderRightColor={useColorModeValue('gray.700', 'gray.700')}
            w={{ base: 'full', md: 60 }}
            pos="fixed"
            h="full"
            {...rest}
        >
            {/* Logo */}
            <Flex h="16" alignItems="center" mx="6" justifyContent="space-between">
                <HStack spacing={3}>
                    <Icon as={Shield} w={8} h={8} color="blue.400" />
                    <VStack align="start" spacing={0}>
                        <Text fontSize="lg" fontWeight="bold" color="white">
                            ProxyPanther
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                            Enterprise Gateway
                        </Text>
                    </VStack>
                </HStack>
                <IconButton
                    display={{ base: 'flex', md: 'none' }}
                    onClick={onClose}
                    variant="ghost"
                    color="white"
                    icon={<X size={20} />}
                    aria-label="close menu"
                />
            </Flex>

            {/* Navigation */}
            <VStack spacing={1} align="stretch" mt={6} px={3}>
                {NAV_ITEMS.map((item) => {
                    const isActive = route().current(item.route);
                    return (
                        <Tooltip key={item.name} label={item.name} placement="right" hasArrow>
                            <Box
                                as={InertiaLink}
                                href={route(item.route)}
                                display="flex"
                                alignItems="center"
                                px={4}
                                py={3}
                                borderRadius="md"
                                cursor="pointer"
                                bg={isActive ? activeBg : 'transparent'}
                                color={isActive ? 'white' : 'gray.400'}
                                _hover={{
                                    bg: isActive ? activeBg : sidebarHoverBg,
                                    color: 'white',
                                }}
                                transition="all 0.2s"
                            >
                                <Icon as={item.icon} boxSize={5} />
                                <Text ml={4} fontSize="sm" fontWeight={isActive ? 'semibold' : 'medium'}>
                                    {item.name}
                                </Text>
                            </Box>
                        </Tooltip>
                    );
                })}
            </VStack>

            {/* Bottom Section */}
            <Box position="absolute" bottom={4} left={0} right={0} px={3}>
                <Box
                    px={4}
                    py={3}
                    borderRadius="md"
                    bg="gray.800"
                    border="1px"
                    borderColor="gray.700"
                >
                    <HStack spacing={3}>
                        <Box w={2} h={2} borderRadius="full" bg="green.400" />
                        <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="xs" color="gray.400">
                                System Status
                            </Text>
                            <Text fontSize="sm" color="white" fontWeight="medium">
                                All Systems Operational
                            </Text>
                        </VStack>
                    </HStack>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box minH="100vh" bg={contentBg}>
            {/* Sidebar for desktop */}
            <SidebarContent display={{ base: 'none', md: 'block' }} />

            {/* Mobile drawer */}
            <Drawer
                autoFocus={false}
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size="full"
            >
                <DrawerOverlay />
                <DrawerContent>
                    <SidebarContent onClose={onClose} />
                </DrawerContent>
            </Drawer>

            {/* Top bar */}
            <Box ml={{ base: 0, md: 60 }}>
                <Flex
                    px={8}
                    height="16"
                    alignItems="center"
                    bg={topbarBg}
                    borderBottomWidth="1px"
                    borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
                    justifyContent="space-between"
                >
                    <IconButton
                        display={{ base: 'flex', md: 'none' }}
                        onClick={onOpen}
                        variant="ghost"
                        icon={<MenuIcon size={20} />}
                        aria-label="open menu"
                    />

                    <HStack spacing={4} flex={1} ml={{ base: 0, md: 4 }}>
                        <Box
                            display={{ base: 'none', md: 'flex' }}
                            alignItems="center"
                            bg={useColorModeValue('gray.100', 'gray.700')}
                            px={4}
                            py={2}
                            borderRadius="md"
                            maxW="md"
                            flex={1}
                        >
                            <Icon as={Search} color="gray.500" mr={2} />
                            <Text fontSize="sm" color="gray.500">
                                Search sites, logs, IPs...
                            </Text>
                        </Box>
                    </HStack>

                    <HStack spacing={4}>
                        <Tooltip label="Notifications" hasArrow>
                            <Box position="relative">
                                <IconButton
                                    variant="ghost"
                                    icon={<Bell size={20} />}
                                    aria-label="notifications"
                                />
                                <Badge
                                    position="absolute"
                                    top={1}
                                    right={1}
                                    colorScheme="red"
                                    borderRadius="full"
                                    fontSize="9px"
                                    px={1.5}
                                >
                                    3
                                </Badge>
                            </Box>
                        </Tooltip>

                        <Menu>
                            <MenuButton>
                                <HStack spacing={3} cursor="pointer">
                                    <Avatar size="sm" name={user?.name} bg="blue.500" />
                                    <VStack
                                        display={{ base: 'none', md: 'flex' }}
                                        alignItems="flex-start"
                                        spacing={0}
                                    >
                                        <Text fontSize="sm" fontWeight="medium">
                                            {user?.name}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                            Administrator
                                        </Text>
                                    </VStack>
                                    <Icon as={ChevronDown} boxSize={4} color="gray.500" />
                                </HStack>
                            </MenuButton>
                            <MenuList>
                                <MenuItem icon={<Settings size={16} />}>Settings</MenuItem>
                                <MenuItem icon={<Users size={16} />} as={InertiaLink} href={route('teams.index')}>
                                    Teams
                                </MenuItem>
                                <MenuDivider />
                                <MenuItem
                                    icon={<LogOut size={16} />}
                                    onClick={() => router.post(route('logout'))}
                                    color="red.500"
                                >
                                    Logout
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </HStack>
                </Flex>

                {/* Main content */}
                <Box p={8}>
                    <Container maxW="container.2xl">{children}</Container>
                </Box>
            </Box>
        </Box>
    );
}
