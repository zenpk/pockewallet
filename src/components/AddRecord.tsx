import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { BiPlus } from "react-icons/bi";

export type AddRecordProps = {
  title: string;
  submit: () => void;
  children: ReactNode;
};

export function AddRecord(props: AddRecordProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Button
        leftIcon={<BiPlus />}
        bgColor={"green.100"}
        onClick={() => {
          onOpen();
        }}
      >
        Add
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{props.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{props.children}</ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                props.submit();
                onClose();
              }}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
