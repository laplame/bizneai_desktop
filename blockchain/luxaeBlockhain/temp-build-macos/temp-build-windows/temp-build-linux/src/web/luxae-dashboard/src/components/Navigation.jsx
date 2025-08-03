import React from 'react';
import {
    Box,
    Flex,
    HStack,
    IconButton,
    useDisclosure,
    useColorModeValue,
    Stack,
    Button,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { ServerStatus } from './ServerStatus';

const Links = [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Validadores', to: '/validators' },
    { name: 'Transacciones', to: '/transactions' },
    { name: 'Contratos', to: '/contracts' },
    { name: 'Documentación', to: '/docs' }
];

export function Navigation() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    const NavLink = ({ to, children }) => (
        <Button
            as={RouterLink}
            to={to}
            px={4}
            py={2}
            rounded={'md'}
            _hover={{
                textDecoration: 'none',
                bg: useColorModeValue('gray.200', 'gray.700'),
            }}
            variant="ghost"
        >
            {children}
        </Button>
    );

    return (
        <Box 
            bg={bgColor} 
            px={4} 
            position="sticky" 
            top={0} 
            zIndex="sticky"
            borderBottom="1px"
            borderColor={borderColor}
        >
            <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
                <IconButton
                    size={'md'}
                    icon={<HamburgerIcon />}
                    aria-label={'Open Menu'}
                    display={{ md: 'none' }}
                    onClick={onOpen}
                />

                <HStack spacing={8} alignItems={'center'}>
                    <Box 
                        as={RouterLink} 
                        to="/" 
                        fontWeight="bold" 
                        fontSize="lg"
                        _hover={{ textDecoration: 'none' }}
                    >
                        Luxae
                    </Box>
                    <HStack
                        as={'nav'}
                        spacing={4}
                        display={{ base: 'none', md: 'flex' }}>
                        {Links.map((link) => (
                            <NavLink key={link.name} to={link.to}>
                                {link.name}
                            </NavLink>
                        ))}
                    </HStack>
                </HStack>

                <HStack spacing={4}>
                    <ServerStatus />
                </HStack>
            </Flex>

            <Drawer
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
            >
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth="1px">
                        Menú
                    </DrawerHeader>

                    <DrawerBody>
                        <Stack spacing={4}>
                            {Links.map((link) => (
                                <Button
                                    key={link.name}
                                    as={RouterLink}
                                    to={link.to}
                                    variant="ghost"
                                    w="full"
                                    onClick={onClose}
                                >
                                    {link.name}
                                </Button>
                            ))}
                        </Stack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Box>
    );
} 