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
  submit: () => boolean;
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
              onClick={() => {
                if (props.submit()) {
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
