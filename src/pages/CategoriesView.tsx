import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { BiMenu, BiPlus } from "react-icons/bi";
import { Dialog } from "../components/Dialog";
import { Dropdown, DropdownItem } from "../components/Dropdown";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { useDisclosure } from "../hooks/useDisclosure";
import { Categories } from "../localStorage/categories";
import { openDb } from "../localStorage/shared";
import { genRandomColor, getUuid } from "../utils/utils";

export function CategoriesView() {
  const [categories, setCategories] = useState<Categories.Category[]>([]);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    openDb();
    setCategories(Categories.readAll());
  }, []);

  return (
    <PageLayout>
      <div id="first-lane" className="flex-row-space no-space mb-sm">
        <div className={"flex-row-space gap-sm no-space"}>
          <LeftDrawer />
          <button type="button" className="btn btn-green" onClick={onOpen}>
            <BiPlus />
            Add
          </button>
          {isOpen && (
            <AddRecordForm
              setCategories={setCategories}
              isOpen={isOpen}
              onOpen={onOpen}
              onClose={onClose}
            />
          )}
        </div>
        <h2 className="page-title">Categories</h2>
        <div />
      </div>
      <hr />
      <DataTable categories={categories} setCategories={setCategories} />
    </PageLayout>
  );
}

function AddRecordForm({
  setCategories,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  setCategories: Dispatch<SetStateAction<Categories.Category[]>>;
  isOpen: boolean;
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
      } else {
        console.warn("No category found with id: ", idValue);
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
        setCategories(Categories.readAll());
        return true;
      }}
      title={"Add Record"}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    >
      <div className="form-group">
        <label>Name</label>
        <input
          className="input"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        {nameError && (
          <span className="form-error">Category name mustn't be empty</span>
        )}
      </div>
      <div className="form-group">
        <label>Color (Leave empty for random)</label>
        <input
          className="input"
          type="text"
          value={color}
          onChange={(event) => {
            setColor(event.target.value);
          }}
        />
      </div>
    </Dialog>
  );
}

function DataTable({
  categories,
  setCategories,
}: {
  categories: Categories.Category[];
  setCategories: Dispatch<SetStateAction<Categories.Category[]>>;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentCategoryId, setCurrentCategoryId] = useState<string>(
    categories[0]?.id ?? "",
  );

  return (
    <>
      {isOpen && (
        <AddRecordForm
          setCategories={setCategories}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          idValue={currentCategoryId}
        />
      )}
      <div className="scroll-area">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Color</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => {
              return (
                <tr key={c.id}>
                  <td>
                    <span
                      className="badge"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name}
                    </span>
                  </td>
                  <td>{c.color}</td>
                  <td>
                    <Dropdown
                      trigger={
                        <button
                          type="button"
                          className="btn-icon"
                          aria-label="Options"
                        >
                          <BiMenu />
                        </button>
                      }
                    >
                      <DropdownItem
                        onClick={() => {
                          setCurrentCategoryId(c.id);
                          onOpen();
                        }}
                      >
                        Edit
                      </DropdownItem>
                      <DropdownItem
                        style={{ color: "#ee0000" }}
                        onClick={() => {
                          if (!c.deletable) return;
                          Categories.remove(c.id);
                          setCategories(Categories.readAll());
                        }}
                      >
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
