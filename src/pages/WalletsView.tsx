import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { BiMenu, BiPlus } from "react-icons/bi";
import { Dialog } from "../components/Dialog";
import { Dropdown, DropdownItem } from "../components/Dropdown";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { useDisclosure } from "../hooks/useDisclosure";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { getUuid } from "../utils/utils";

export function WalletsView() {
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    openDb();
    setWallets(Wallets.readAll());
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
              setWallets={setWallets}
              isOpen={isOpen}
              onOpen={onOpen}
              onClose={onClose}
            />
          )}
        </div>
        <h2 className="page-title">Wallets</h2>
        <div />
      </div>
      <hr />
      <DataTable wallets={wallets} setWallets={setWallets} />
    </PageLayout>
  );
}

function AddRecordForm({
  setWallets,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  setWallets: Dispatch<SetStateAction<Wallets.Wallet[]>>;
  isOpen: boolean;
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
        setWallets(Wallets.readAll());
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
          <span className="form-error">Wallet name mustn't be empty</span>
        )}
      </div>
      <div className="form-group">
        <label>Currency ($ € £ ￥) (Optional)</label>
        <input
          className="input"
          type="text"
          value={currency}
          onChange={(event) => {
            setCurrency(event.target.value);
          }}
        />
      </div>
    </Dialog>
  );
}

function DataTable({
  wallets,
  setWallets,
}: {
  wallets: Wallets.Wallet[];
  setWallets: Dispatch<SetStateAction<Wallets.Wallet[]>>;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentWalletId, setCurrentWalletId] = useState<string>(
    wallets[0]?.id ?? "",
  );

  return (
    <>
      {isOpen && (
        <AddRecordForm
          setWallets={setWallets}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          idValue={currentWalletId}
        />
      )}
      <div className="scroll-area">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Currency</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => {
              return (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.currency}</td>
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
                          setCurrentWalletId(w.id);
                          onOpen();
                        }}
                      >
                        Edit
                      </DropdownItem>
                      <DropdownItem
                        style={{ color: "#ee0000" }}
                        onClick={() => {
                          if (!w.deletable) return;
                          Wallets.remove(w.id);
                          setWallets(Wallets.readAll());
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
