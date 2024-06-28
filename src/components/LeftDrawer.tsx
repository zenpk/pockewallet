import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { BiMenu } from "react-icons/bi";

export function LeftDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button bg="blue.100" onClick={onOpen} leftIcon={<BiMenu />}>
        Menu
      </Button>
      <Drawer placement={"left"} onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
