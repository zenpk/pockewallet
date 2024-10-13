import { HamburgerIcon } from "@chakra-ui/icons";
import {
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { BiPlus } from "react-icons/bi";
import { Dialog } from "../components/Dialog";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { getUuid } from "../utils/utils";

export function WalletsView() {
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [refresh, setRefresh] = useState<number>(0);

  const { isOpen, onOpen, onClose } = useDisclosure(); // for dialog

  useEffect(() => {
    if (refresh < 0) return;
    openDb();
    setWallets(Wallets.readAll());
  }, [refresh]);

  return (
    <PageLayout>
      <div id="first-lane" className="flex-row-space no-space mb-sm">
        <div className={"flex-row-space gap-sm no-space"}>
          <LeftDrawer />
          <Button leftIcon={<BiPlus />} bgColor={"green.100"} onClick={onOpen}>
            Add
          </Button>
          {isOpen && (
            <AddRecordForm
              setRefresh={setRefresh}
              isOpen={isOpen}
              onOpen={onOpen}
              onClose={onClose}
            />
          )}
        </div>
        <Heading padding={0} margin={0} fontSize={24}>
          Wallets
        </Heading>
        <div />
      </div>
      <Divider />
      <DataTable wallets={wallets} setRefresh={setRefresh} />
    </PageLayout>
  );
}

function AddRecordForm({
  setRefresh,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  setRefresh: Dispatch<SetStateAction<number>>;
  isOpen: boolean; // for refreshing the component
  onOpen: () => void;
  onClose: () => void;
  idValue?: string;
}) {
  const [name, setName] = useState<string>("");
  const [nameError, setNameError] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>("");
  const [deletable, setDeletable] = useState<boolean>(true);

  useEffect(() => {
    if (idValue) {
      const result = Wallets.readById(idValue);
      if (result) {
        setName(result.name);
        setCurrency(result.currency || "");
        setDeletable(result.deletable);
      } else {
        console.warn("No wallet found with id: ", idValue);
      }
    }
  }, [idValue]);

  return (
    <Dialog
      submit={() => {
        if (!name) {
          setNameError(true);
          return false;
        }
        Wallets.write({
          id: idValue || getUuid(),
          name: name,
          currency: currency,
          deletable: deletable,
        });
        setRefresh((prev) => prev + 1);
        return true;
      }}
      title={"Add Record"}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    >
      <FormControl isInvalid={nameError}>
        <FormLabel mt={2}>Name</FormLabel>
        <Input
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        {nameError && (
          <FormErrorMessage>Wallet name mustn't be empty</FormErrorMessage>
        )}
      </FormControl>
      <FormControl>
        <FormLabel mt={2}>Currency ($ € £ ￥) (Optional)</FormLabel>
        <Input
          type="text"
          value={currency}
          onChange={(event) => {
            setCurrency(event.target.value);
          }}
        />
      </FormControl>
    </Dialog>
  );
}

function DataTable({
  wallets,
  setRefresh,
}: {
  wallets: Wallets.Wallet[];
  setRefresh: Dispatch<SetStateAction<number>>;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentWalletId, setCurrentWalletId] = useState<string>(
    wallets[0]?.id ?? "",
  );

  return (
    <>
      {isOpen && (
        <AddRecordForm
          setRefresh={setRefresh}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          idValue={currentWalletId}
        />
      )}
      <TableContainer padding={0} height={"100%"}>
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Currency</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {wallets.map((w) => {
              return (
                <Tr key={w.id}>
                  <Td>{w.name}</Td>
                  <Td>{w.currency}</Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<HamburgerIcon />}
                        aria-label="Options"
                      />
                      <MenuList>
                        <MenuItem
                          onClick={() => {
                            setCurrentWalletId(w.id);
                            onOpen();
                          }}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          color={"#ee0000"}
                          onClick={() => {
                            Wallets.remove(w.id);
                            setRefresh((prev) => prev + 1);
                          }}
                          isDisabled={!w.deletable}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}
