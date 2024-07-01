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
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { BiPlus } from "react-icons/bi";
import { Dialog } from "../components/Dialog";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { Categories } from "../localStorage/categories";
import { openDb } from "../localStorage/shared";
import { genRandomColor, getUuid } from "../utils/utils";

export function CategoriesView() {
  const [categories, setCategories] = useState<Categories.Category[]>([]);
  const [refresh, setRefresh] = useState<number>(0);

  const { isOpen, onOpen, onClose } = useDisclosure(); // for dialog

  useEffect(() => {
    openDb();
    setCategories(Categories.readAll());
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
          Categories
        </Heading>
        <div></div>
      </div>
      <Divider />
      <DataTable categories={categories} setRefresh={setRefresh} />
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
  const [color, setColor] = useState<string>("");
  const [deletable, setDeletable] = useState<boolean>(true);

  useEffect(() => {
    if (idValue) {
      const result = Categories.readById(idValue);
      if (result) {
        setColor(result.color);
        setName(result.name);
        setDeletable(result.deletable);
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
        Categories.write({
          id: idValue || getUuid(),
          name: name,
          color: color || genRandomColor(),
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
  setRefresh,
}: {
  categories: Categories.Category[];
  setRefresh: Dispatch<SetStateAction<number>>;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentCategoryId, setCurrentCategoryId] = useState<string>(
    categories[0]?.id ?? ""
  );

  return (
    <>
      {isOpen && (
        <AddRecordForm
          setRefresh={setRefresh}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          idValue={currentCategoryId}
        />
      )}
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
                            Categories.remove(c.id);
                            setRefresh((prev) => prev + 1);
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
