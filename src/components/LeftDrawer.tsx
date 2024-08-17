import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Link,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import {
  BiCog,
  BiCustomize,
  BiDollarCircle,
  BiDoughnutChart,
  BiMenu,
  BiWallet,
} from "react-icons/bi";

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
            <Link
              href="/"
              display={"flex"}
              marginBlock={"1rem"}
              alignItems={"center"}
              gap={"1rem"}
            >
              <BiDollarCircle />
              <Text>Expenses</Text>
            </Link>
            <Link
              href="/categories"
              display={"flex"}
              marginBlock={"1rem"}
              alignItems={"center"}
              gap={"1rem"}
            >
              <BiCustomize />
              <Text>Categories</Text>
            </Link>
            <Link
              href="/wallets"
              display={"flex"}
              marginBlock={"1rem"}
              alignItems={"center"}
              gap={"1rem"}
            >
              <BiWallet />
              <Text>Wallets</Text>
            </Link>
            <Link
              href="/charts"
              display={"flex"}
              marginBlock={"1rem"}
              alignItems={"center"}
              gap={"1rem"}
            >
              <BiDoughnutChart />
              <Text>Charts</Text>
            </Link>
            <Link
              href="/settings"
              display={"flex"}
              marginBlock={"1rem"}
              alignItems={"center"}
              gap={"1rem"}
            >
              <BiCog />
              <Text>Settings</Text>
            </Link>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
