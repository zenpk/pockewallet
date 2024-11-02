import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import type { ReactNode } from "react";

export type DialogProps = {
  title: string;
  submit: () => Promise<boolean> | boolean;
  children: ReactNode;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function Dialog(props: DialogProps) {
  return (
    <>
      <Modal isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{props.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{props.children}</ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={props.onClose}>
              Close
            </Button>
            <Button
              colorScheme="blue"
              onClick={async () => {
                const result = await props.submit();
                if (result) {
                  props.onClose();
                }
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
