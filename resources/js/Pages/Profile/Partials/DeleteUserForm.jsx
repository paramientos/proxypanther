import React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  useColorModeValue,
  FormErrorMessage,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        onClose();
        clearErrors();
        reset();
    };

    return (
        <Box as="section" className={className}>
            <Stack spacing={1} mb={6}>
                <Heading size="md">Delete Account</Heading>
                <Text color="gray.500" fontSize="sm">
                    Once your account is deleted, all of its resources and data will be permanently deleted.
                </Text>
            </Stack>

            <Button colorScheme="red" onClick={onOpen}>
                Delete Account
            </Button>

            <Modal isOpen={isOpen} onClose={closeModal}>
                <ModalOverlay />
                <ModalContent bg={useColorModeValue('white', 'gray.800')}>
                    <form onSubmit={deleteUser}>
                        <ModalHeader>Are you sure you want to delete your account?</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Text color="gray.500" mb={4}>
                                Once your account is deleted, all of its resources and data will be permanently deleted.
                                Please enter your password to confirm you would like to permanently delete your account.
                            </Text>

                            <FormControl isRequired isInvalid={errors.password}>
                                <FormLabel htmlFor="password" srOnly>Password</FormLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Password"
                                />
                                {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
                            </FormControl>
                        </ModalBody>

                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" type="submit" isLoading={processing}>
                                Delete Account
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </Box>
    );
}
