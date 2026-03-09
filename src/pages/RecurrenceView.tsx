import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { BiMenu, BiPlus } from "react-icons/bi";
import { Dialog } from "../components/Dialog";
import { Dropdown, DropdownItem } from "../components/Dropdown";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { useDisclosure } from "../hooks/useDisclosure";
import { Categories } from "../localStorage/categories";
import { Recurrences } from "../localStorage/recurrences";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { RecurrenceFrequency } from "../utils/consts";
import {
  genLocalTime,
  localTimeToInputString,
  localTimeToUnix,
  unixToLocalTime,
} from "../utils/time";
import { getUuid } from "../utils/utils";

export function RecurrenceView() {
  const [recurrences, setRecurrences] = useState<Recurrences.Recurrence[]>([]);
  const [categories, setCategories] = useState<Categories.Category[]>([]);
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    openDb();
    setRecurrences(Recurrences.readAll());
    setCategories(Categories.readAll());
    setWallets(Wallets.readAll());
  }, []);

  return (
    <PageLayout>
      <div id="first-lane" className="flex-row-space no-space mb-sm">
        <div className="flex-row-space gap-sm no-space">
          <LeftDrawer />
          <button type="button" className="btn btn-green" onClick={onOpen}>
            <BiPlus />
            Add
          </button>
          {isOpen && (
            <AddRecurrenceForm
              categories={categories}
              wallets={wallets}
              setRecurrences={setRecurrences}
              isOpen={isOpen}
              onOpen={onOpen}
              onClose={onClose}
            />
          )}
        </div>
        <h2 className="page-title">Recurrence</h2>
        <div />
      </div>
      <hr />
      <RecurrenceTable
        recurrences={recurrences}
        setRecurrences={setRecurrences}
        categories={categories}
        wallets={wallets}
      />
    </PageLayout>
  );
}

function AddRecurrenceForm({
  categories,
  wallets,
  setRecurrences,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  categories: Categories.Category[];
  wallets: Wallets.Wallet[];
  setRecurrences: Dispatch<SetStateAction<Recurrences.Recurrence[]>>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  idValue?: string;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [amountError, setAmountError] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    RecurrenceFrequency.Monthly,
  );
  const [startDate, setStartDate] = useState<number>(
    localTimeToUnix(genLocalTime()),
  );
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (idValue) {
      const rec = Recurrences.readById(idValue);
      if (rec) {
        setDescription(rec.description);
        setAmount(rec.amount);
        setCategoryId(rec.categoryId);
        setWalletId(rec.walletId);
        setFrequency(rec.frequency);
        setStartDate(rec.startDate);
        setEnabled(rec.enabled);
      }
    }
  }, [idValue]);

  useEffect(() => {
    if (!idValue && categories.length) setCategoryId(categories[0].id);
  }, [categories, idValue]);

  useEffect(() => {
    if (!idValue && wallets.length) setWalletId(wallets[0].id);
  }, [wallets, idValue]);

  return (
    <Dialog
      submit={() => {
        if (!amount || Number.isNaN(Number(amount))) {
          setAmountError(true);
          return false;
        }
        const existing = idValue ? Recurrences.readById(idValue) : undefined;
        Recurrences.write({
          id: idValue || getUuid(),
          description,
          amount,
          categoryId,
          walletId,
          frequency,
          startDate,
          lastGeneratedDate: existing?.lastGeneratedDate ?? 0,
          enabled,
        });
        setRecurrences(Recurrences.readAll());
        return true;
      }}
      title={idValue ? "Edit Recurrence" : "Add Recurrence"}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    >
      <div className="form-group">
        <label>Description</label>
        <input
          className="input"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Amount</label>
        <input
          className="input"
          type="number"
          value={amount || ""}
          onChange={(e) => setAmount(Number.parseFloat(e.target.value))}
        />
        {amountError && <span className="form-error">Invalid amount</span>}
      </div>
      <div className="form-group">
        <label>Category</label>
        <select
          className="input"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Wallet</label>
        <select
          className="input"
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
        >
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Frequency</label>
        <select
          className="input"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
        >
          {Object.values(RecurrenceFrequency).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Start Date</label>
        <input
          className="input"
          type="datetime-local"
          value={localTimeToInputString(unixToLocalTime(startDate))}
          onChange={(e) => setStartDate(new Date(e.target.value).getTime())}
        />
      </div>
      <div
        className="form-group"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <label style={{ marginBottom: 0 }}>Enabled</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="switch-slider" />
        </label>
      </div>
    </Dialog>
  );
}

function RecurrenceTable({
  recurrences,
  setRecurrences,
  categories,
  wallets,
}: {
  recurrences: Recurrences.Recurrence[];
  setRecurrences: Dispatch<SetStateAction<Recurrences.Recurrence[]>>;
  categories: Categories.Category[];
  wallets: Wallets.Wallet[];
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentId, setCurrentId] = useState(recurrences[0]?.id ?? "");

  return (
    <>
      {isOpen && (
        <AddRecurrenceForm
          categories={categories}
          wallets={wallets}
          setRecurrences={setRecurrences}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          idValue={currentId}
        />
      )}
      <div className="scroll-area">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Wallet</th>
              <th>Frequency</th>
              <th>Enabled</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {recurrences.map((r) => {
              const cat =
                categories.find((c) => c.id === r.categoryId) ??
                Categories.defaultCategory;
              const wal = wallets.find((w) => w.id === r.walletId);
              return (
                <tr key={r.id}>
                  <td>{r.description}</td>
                  <td>{Math.round(r.amount * 100) / 100}</td>
                  <td>
                    <span
                      className="badge"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name}
                    </span>
                  </td>
                  <td>{wal?.name ?? "-"}</td>
                  <td>{r.frequency}</td>
                  <td>{r.enabled ? "Yes" : "No"}</td>
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
                          setCurrentId(r.id);
                          onOpen();
                        }}
                      >
                        Edit
                      </DropdownItem>
                      <DropdownItem
                        style={{ color: "#ee0000" }}
                        onClick={() => {
                          Recurrences.remove(r.id);
                          setRecurrences(Recurrences.readAll());
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
