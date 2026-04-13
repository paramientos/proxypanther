import React from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Stack,
  Collapse,
  Icon,
  Link,
  useColorModeValue,
  useDisclosure,
  Container,
} from '@chakra-ui/react';
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Shield,
  Activity,
  LogOut,
} from 'lucide-react';
import { Link as InertiaLink } from '@inertiajs/react';

export default function AppLayout({ children, user }) {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        align={'center'}
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
        >
          <IconButton
            onClick={onToggle}
            icon={isOpen ? <X size={20} /> : <Menu size={20} />}
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }} align="center">
          <Icon as={Shield} w={6} h={6} color="blue.400" mr={2} />
          <Text
            textAlign={{ base: 'center', md: 'left' }}
            fontFamily={'heading'}
            fontWeight="bold"
            fontSize="xl"
            color={useColorModeValue('gray.800', 'white')}
          >
            ProxyPanther
          </Text>

          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
             <Stack direction={'row'} spacing={4}>
                <NavItem href={route('dashboard')}>Dashboard</NavItem>
                <NavItem href={route('banned-ips.index')}>IP Blacklist</NavItem>
                <NavItem href={route('logs.index')}>Security Logs</NavItem>
             </Stack>
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          spacing={6}
        >
            <Text fontSize="sm" fontWeight={500}>{user?.name}</Text>
            <InertiaLink href={route('logout')} method="post" as="button">
                <Icon as={LogOut} size={18} />
            </InertiaLink>
        </Stack>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
         <Stack bg={useColorModeValue('white', 'gray.800')} p={4} display={{ md: 'none' }}>
            <NavItem href={route('dashboard')}>Dashboard</NavItem>
            <NavItem href={route('banned-ips.index')}>IP Blacklist</NavItem>
            <NavItem href={route('logs.index')}>Security Logs</NavItem>
         </Stack>
      </Collapse>

      <Container maxW="container.xl" py={8}>
        {children}
      </Container>
    </Box>
  );
}

const NavItem = ({ children, href }) => {
  return (
    <Box
      as={InertiaLink}
      href={href}
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
      fontWeight={route().current(href) ? 'bold' : 'normal'}
    >
      {children}
    </Box>
  );
};
