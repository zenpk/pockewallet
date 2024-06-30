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
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { BiPlus } from "react-icons/bi";
import { Dialog } from "../components/Dialog";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { dbContext } from "../contexts/Db";
import { openDb } from "../db/shared";
import { Wallets } from "../db/wallets";
import { getUuid } from "../utils/utils";

export function WalletsView() {
  const [db, setDb] = useContext(dbContext)!;
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [refresh, setRefresh] = useState<number>(0);

  const { isOpen, onOpen, onClose } = useDisclosure(); // for dialog

  useEffect(() => {
    if (!db) {
      openDb()
        .then((db) => {
          setDb(db);
        })
        .catch((e) => console.error(e));
    } else {
      Wallets.readAll(db, setWallets);
    }
  }, [db, refresh]);

  return (
    <PageLayout>
      <div id="first-lane" className="flex-row-space no-space mb-sm">
        <div className={"flex-row-space gap-sm no-space"}>
          <LeftDrawer />
          <Button leftIcon={<BiPlus />} bgColor={"green.100"} onClick={onOpen}>
            Add
          </Button>
          <AddRecordForm
            db={db}
            setRefresh={setRefresh}
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
          />
        </div>
        <Heading padding={0} margin={0} fontSize={24}>
          Wallets
        </Heading>
        <div></div>
      </div>
      <Divider />
      <DataTable wallets={wallets} db={db} setRefresh={setRefresh} />
    </PageLayout>
  );
}

function AddRecordForm({
  db,
  setRefresh,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  db: IDBDatabase | null;
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
    if (db && idValue) {
      Wallets.readById(db, idValue).then((result) => {
        setName(result.name);
        setCurrency(result.currency || "");
        setDeletable(result.deletable);
      });
    }
  }, [idValue]);

  return (
    <Dialog
      submit={() => {
        if (!name) {
          setNameError(true);
          return false;
        }
        if (!db) {
          return false;
        }
        Wallets.write(db, {
          id: idValue || getUuid(),
          name: name,
          currency: currency,
          deletable: deletable,
        })
          .then(() => setRefresh((prev) => prev + 1))
          .catch((e) => {
            console.error(e);
          });
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
            if (event?.target?.value) {
              setName(event.target.value);
            }
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
            if (event?.target?.value) {
              setCurrency(event.target.value);
            }
          }}
        />
      </FormControl>
    </Dialog>
  );
}

function DataTable({
  wallets,
  db,
  setRefresh,
}: {
  wallets: Wallets.Wallet[];
  db: IDBDatabase | null;
  setRefresh: Dispatch<SetStateAction<number>>;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentWalletId, setCurrentWalletId] = useState<string>(
    wallets[0]?.id ?? ""
  );

  return (
    <>
      <AddRecordForm
        db={db}
        setRefresh={setRefresh}
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        idValue={currentWalletId}
      />
      <TableContainer padding={0} height={"100%"}>
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Currency</Th>
              <Th>Action</Th>
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
                            if (db) {
                              Wallets.remove(db, w.id).then(() => {
                                setRefresh((prev) => prev + 1);
                              });
                            }
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
