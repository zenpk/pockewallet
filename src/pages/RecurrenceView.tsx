import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { BiChevronDown, BiMenu, BiPlus, BiWallet } from "react-icons/bi";
import { useSearchParams } from "react-router-dom";
import { Dialog } from "../components/Dialog";
import { Dropdown, DropdownItem } from "../components/Dropdown";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { useDisclosure } from "../hooks/useDisclosure";
import { Categories } from "../localStorage/categories";
import { Recurrences } from "../localStorage/recurrences";
import { Settings } from "../localStorage/settings";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("id");
  const [recurrences, setRecurrences] = useState<Recurrences.Recurrence[]>([]);
  const [categories, setCategories] = useState<Categories.Category[]>([]);
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [wallet, setWallet] = useState<Wallets.Wallet | null>(null);
  const [settings] = useState(Settings.read());
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    openDb();
    setRecurrences(Recurrences.readAll());
    setCategories(Categories.readAll());
    setWallets(Wallets.readAll());
  }, []);

  useEffect(() => {
    if (!wallets.length) return;
    if (highlightId) {
      const rec = recurrences.find((r) => r.id === highlightId);
      if (rec) {
        const w = wallets.find((w) => w.id === rec.walletId);
        if (w) {
          setWallet(w);
          return;
        }
      }
    }
    if (settings.defaultWallet) {
      const result = Wallets.readById(settings.defaultWallet);
      if (result) {
        setWallet(result);
        return;
      }
    }
    setWallet(wallets[0]);
  }, [wallets, settings, highlightId, recurrences]);

  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => {
      setSearchParams({}, { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [highlightId, setSearchParams]);

  const filtered = wallet
    ? recurrences.filter((r) => r.walletId === wallet.id)
    : recurrences;

  const sums = useMemo(() => {
    const m: Record<string, number> = {};
    for (const freq of Object.values(RecurrenceFrequency)) m[freq] = 0;
    for (const r of filtered) m[r.frequency] += r.amount;
    for (const k of Object.keys(m)) m[k] = Math.round(m[k] * 100) / 100;
    return m;
  }, [filtered]);

  return (
    <PageLayout>
      {isOpen && wallet && (
        <AddRecurrenceForm
          categories={categories}
          wallet={wallet}
          setRecurrences={setRecurrences}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
        />
      )}
      <div
        id="first-lane"
        className="flex-row-space no-space mb-sm flex-wrap flex-wrap-third"
      >
        <div className="flex-row-space gap-sm no-space">
          <LeftDrawer />
          {wallet && (
            <button type="button" className="btn btn-green" onClick={onOpen}>
              <BiPlus />
              Add
            </button>
          )}
        </div>
        <h2 className="page-title">Recurrence</h2>
        <Dropdown
          align="right"
          trigger={
            <button type="button" className="btn">
              <BiWallet />
              {wallet ? wallet.name : "All"}
              <BiChevronDown />
            </button>
          }
        >
          <DropdownItem onClick={() => setWallet(null)}>All</DropdownItem>
          {wallets.map((w) => (
            <DropdownItem
              key={w.id}
              onClick={() => {
                const result = Wallets.readById(w.id);
                if (result) setWallet(result);
              }}
            >
              {w.name}
            </DropdownItem>
          ))}
        </Dropdown>
      </div>
      <hr />
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "0.5rem 0.75rem",
          fontSize: "0.875rem",
        }}
      >
        {Object.values(RecurrenceFrequency).map((freq) => (
          <span key={freq}>
            <span style={{ color: "#718096" }}>{freq}:</span>{" "}
            <span style={{ fontWeight: 600 }}>{sums[freq]}</span>
          </span>
        ))}
      </div>
      <RecurrenceTable
        recurrences={filtered}
        setRecurrences={setRecurrences}
        categories={categories}
        wallets={wallets}
        highlightId={highlightId}
      />
    </PageLayout>
  );
}

function AddRecurrenceForm({
  categories,
  wallet,
  setRecurrences,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  categories: Categories.Category[];
  wallet: Wallets.Wallet | null;
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
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    RecurrenceFrequency.Monthly,
  );
  const [startDate, setStartDate] = useState<number>(
    localTimeToUnix(genLocalTime()),
  );
  const idPrefix = useId();
  const descriptionInputId = `${idPrefix}-description`;
  const amountInputId = `${idPrefix}-amount`;
  const categoryInputId = `${idPrefix}-category`;
  const frequencyInputId = `${idPrefix}-frequency`;
  const startDateInputId = `${idPrefix}-start-date`;
  useEffect(() => {
    if (idValue) {
      const rec = Recurrences.readById(idValue);
      if (rec) {
        setDescription(rec.description);
        setAmount(rec.amount);
        setCategoryId(rec.categoryId);
        setFrequency(rec.frequency);
        setStartDate(rec.startDate);
      }
    }
  }, [idValue]);

  useEffect(() => {
    if (!idValue && categories.length) setCategoryId(categories[0].id);
  }, [categories, idValue]);

  return (
    <Dialog
      submit={() => {
        if (!amount || Number.isNaN(Number(amount))) {
          setAmountError(true);
          return false;
        }
        if (!wallet) return false;
        const existing = idValue ? Recurrences.readById(idValue) : undefined;
        Recurrences.write({
          id: idValue || getUuid(),
          description,
          amount,
          categoryId,
          walletId: wallet.id,
          frequency,
          startDate,
          lastGeneratedDate: existing?.lastGeneratedDate ?? 0,
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
        <label htmlFor={descriptionInputId}>Description</label>
        <input
          id={descriptionInputId}
          className="input"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor={amountInputId}>Amount</label>
        <input
          id={amountInputId}
          className="input"
          type="number"
          value={amount || ""}
          onChange={(e) => setAmount(Number.parseFloat(e.target.value))}
        />
        {amountError && <span className="form-error">Invalid amount</span>}
      </div>
      <div className="form-group">
        <label htmlFor={categoryInputId}>Category</label>
        <select
          id={categoryInputId}
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
        <label htmlFor={frequencyInputId}>Frequency</label>
        <select
          id={frequencyInputId}
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
        <label htmlFor={startDateInputId}>Start Date</label>
        <input
          id={startDateInputId}
          className="input"
          type="datetime-local"
          value={localTimeToInputString(unixToLocalTime(startDate))}
          onChange={(e) => setStartDate(new Date(e.target.value).getTime())}
        />
      </div>
    </Dialog>
  );
}

function RecurrenceTable({
  recurrences,
  setRecurrences,
  categories,
  wallets,
  highlightId,
}: {
  recurrences: Recurrences.Recurrence[];
  setRecurrences: Dispatch<SetStateAction<Recurrences.Recurrence[]>>;
  categories: Categories.Category[];
  wallets: Wallets.Wallet[];
  highlightId: string | null;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentId, setCurrentId] = useState(recurrences[0]?.id ?? "");

  return (
    <>
      {isOpen && (
        <AddRecurrenceForm
          categories={categories}
          wallet={
            wallets.find(
              (w) => w.id === Recurrences.readById(currentId)?.walletId,
            ) ?? null
          }
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
              <th>Frequency</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {recurrences.map((r) => {
              const cat =
                categories.find((c) => c.id === r.categoryId) ??
                Categories.defaultCategory;
              return (
                <tr
                  key={r.id}
                  style={
                    highlightId === r.id
                      ? { backgroundColor: "#bee3f8" }
                      : undefined
                  }
                >
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
                  <td>{r.frequency}</td>
                  <td>
                    <Dropdown
                      align="right"
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
