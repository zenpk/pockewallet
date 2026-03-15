import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import type { Categories } from "../localStorage/categories";
import { Expenses } from "../localStorage/expenses";
import { RecentDescriptions } from "../localStorage/recentDescriptions";
import type { Wallets } from "../localStorage/wallets";
import {
  genLocalTime,
  localTimeToInputString,
  localTimeToUnix,
  unixToLocalTime,
} from "../utils/time";
import { getUuid } from "../utils/utils";
import { Autocomplete } from "./Autocomplete";
import { Dialog } from "./Dialog";

export function AddRecordForm({
  categories,
  wallet,
  setExpenses,
  year,
  month,
  day,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  categories: Categories.Category[];
  wallet: Wallets.Wallet | null;
  setExpenses: Dispatch<SetStateAction<Expenses.Expense[]>>;
  year: number;
  month: number;
  day: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  idValue?: string;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [amountError, setAmountError] = useState<boolean>(false);
  const [date, setDate] = useState<number>(
    localTimeToUnix(genLocalTime(year, month, day)),
  );
  const [description, setDescription] = useState<string>("");
  const [recentDescriptions] = useState(() => RecentDescriptions.read());

  useEffect(() => {
    setDate(localTimeToUnix(genLocalTime(year, month, day)));
  }, [year, month, day]);

  useEffect(() => {
    if (idValue) {
      const result = Expenses.readById(idValue);
      if (result) {
        setCategoryId(result.categoryId);
        setAmount(result.amount);
        setDate(result.timestamp);
        setDescription(result.description ?? "");
      } else {
        console.warn("No expense found with id: ", idValue);
      }
    }
  }, [idValue]);

  useEffect(() => {
    if (categories.length && !idValue) {
      setCategoryId(categories[0].id);
    }
  }, [categories, idValue]);

  return (
    <Dialog
      submit={() => {
        if (!amount || Number.isNaN(Number(amount))) {
          setAmountError(true);
          return false;
        }
        if (!wallet || !date) {
          return false;
        }
        Expenses.write({
          id: idValue || getUuid(),
          amount: amount || 0,
          categoryId: categoryId,
          walletId: wallet.id,
          timestamp: date,
          description: description || "",
        });
        RecentDescriptions.add(description);
        setExpenses(Expenses.readAll());
        return true;
      }}
      title={"Add Record"}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    >
      <div className="form-group">
        <label>Date</label>
        <input
          className="input"
          type="datetime-local"
          value={localTimeToInputString(unixToLocalTime(date))}
          onChange={(event) => {
            setDate(new Date(event.target.value).getTime());
          }}
        />
      </div>
      <div className="form-group">
        <label>Category</label>
        <select
          className="input"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
          }}
        >
          {categories.map((category) => {
            return (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            );
          })}
        </select>
      </div>
      <div className="form-group">
        <label>Description (Optional)</label>
        <Autocomplete
          className="input"
          value={description}
          onChange={setDescription}
          suggestions={recentDescriptions}
        />
      </div>
      <div className="form-group">
        <label>Amount</label>
        <input
          className="input"
          type="number"
          value={amount || ""}
          onChange={(event) => {
            setAmount(Number.parseFloat(event?.target?.value));
          }}
        />
        {amountError && <span className="form-error">Invalid amount</span>}
      </div>
    </Dialog>
  );
}
