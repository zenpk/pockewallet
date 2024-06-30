import { HamburgerIcon } from "@chakra-ui/icons";
import {
  Badge,
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
import { Categories } from "../db/categories";
import { openDb } from "../db/shared";
import { genRandomColor, getUuid } from "../utils/utils";

export function CategoriesView() {
  const [db, setDb] = useContext(dbContext)!;
  const [categories, setCategories] = useState<Categories.Category[]>([]);
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
      Categories.readAll(db, setCategories);
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
          Categories
        </Heading>
        <div></div>
      </div>
      <Divider />
      <DataTable categories={categories} db={db} setRefresh={setRefresh} />
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
  const [color, setColor] = useState<string>("");
  const [deletable, setDeletable] = useState<boolean>(true);

  useEffect(() => {
    if (db && idValue) {
      Categories.readById(db, idValue).then((result) => {
        setColor(result.color);
        setName(result.name);
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
        Categories.write(db, {
          id: idValue || getUuid(),
          name: name,
          color: color || genRandomColor(),
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
            setName(event.target.value);
          }}
        />
        {nameError && (
          <FormErrorMessage>Category name mustn't be empty</FormErrorMessage>
        )}
      </FormControl>
      <FormControl>
        <FormLabel mt={2}>Color (Leave empty for random)</FormLabel>
        <Input
          type="text"
          value={color}
          onChange={(event) => {
            setColor(event.target.value);
          }}
        />
      </FormControl>
    </Dialog>
  );
}

function DataTable({
  categories,
  db,
  setRefresh,
}: {
  categories: Categories.Category[];
  db: IDBDatabase | null;
  setRefresh: Dispatch<SetStateAction<number>>;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentCategoryId, setCurrentCategoryId] = useState<string>(
    categories[0]?.id ?? ""
  );

  return (
    <>
      <AddRecordForm
        db={db}
        setRefresh={setRefresh}
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        idValue={currentCategoryId}
      />
      <TableContainer padding={0} height={"100%"}>
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Color</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {categories.map((c) => {
              return (
                <Tr key={c.id}>
                  <Td>
                    <Badge bgColor={c.color}>{c.name}</Badge>
                  </Td>
                  <Td>{c.color}</Td>
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
                            setCurrentCategoryId(c.id);
                            onOpen();
                          }}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          color={"#ee0000"}
                          onClick={() => {
                            if (db) {
                              Categories.remove(db, c.id).then(() => {
                                setRefresh((prev) => prev + 1);
                              });
                            }
                          }}
                          isDisabled={!c.deletable}
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
