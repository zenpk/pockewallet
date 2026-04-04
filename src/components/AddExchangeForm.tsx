import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useId,
  useState,
} from "react";
import { Exchanges } from "../localStorage/exchanges";
import type { Wallets } from "../localStorage/wallets";
import {
  genLocalTime,
  localTimeToInputString,
  localTimeToUnix,
  unixToLocalTime,
} from "../utils/time";
import { getUuid } from "../utils/utils";
import { Dialog } from "./Dialog";

export function AddExchangeForm({
  wallets,
  setExchanges,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  wallets: Wallets.Wallet[];
  setExchanges: Dispatch<SetStateAction<Exchanges.Exchange[]>>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  idValue?: string;
}) {
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id ?? "");
  const [toWalletId, setToWalletId] = useState(
    wallets[1]?.id ?? wallets[0]?.id ?? "",
  );
  const [fromAmount, setFromAmount] = useState<number>(0);
  const [toAmount, setToAmount] = useState<number>(0);
  const [amountError, setAmountError] = useState(false);
  const [sameWalletError, setSameWalletError] = useState(false);
  const [date, setDate] = useState<number>(localTimeToUnix(genLocalTime()));
  const [description, setDescription] = useState("");
  const idPrefix = useId();
  const dateInputId = `${idPrefix}-date`;
  const fromWalletInputId = `${idPrefix}-from-wallet`;
  const fromAmountInputId = `${idPrefix}-from-amount`;
  const toWalletInputId = `${idPrefix}-to-wallet`;
  const toAmountInputId = `${idPrefix}-to-amount`;
  const descriptionInputId = `${idPrefix}-description`;

  useEffect(() => {
    if (idValue) {
      const existing = Exchanges.readById(idValue);
      if (existing) {
        setFromWalletId(existing.fromWalletId);
        setToWalletId(existing.toWalletId);
        setFromAmount(existing.fromAmount);
        setToAmount(existing.toAmount);
        setDate(existing.timestamp);
        setDescription(existing.description ?? "");
      }
    }
  }, [idValue]);

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);

  return (
    <Dialog
      submit={() => {
        setSameWalletError(false);
        setAmountError(false);

        if (fromWalletId === toWalletId) {
          setSameWalletError(true);
          return false;
        }
        if (
          !fromAmount ||
          !toAmount ||
          Number.isNaN(fromAmount) ||
          Number.isNaN(toAmount)
        ) {
          setAmountError(true);
          return false;
        }

        Exchanges.write({
          id: idValue || getUuid(),
          fromWalletId,
          toWalletId,
          fromAmount,
          toAmount,
          timestamp: date,
          description: description || "",
        });
        setExchanges(Exchanges.readAll());
        return true;
      }}
      title={idValue ? "Edit Exchange" : "Add Exchange"}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    >
      <div className="form-group">
        <label htmlFor={dateInputId}>Date</label>
        <input
          id={dateInputId}
          className="input"
          type="datetime-local"
          value={localTimeToInputString(unixToLocalTime(date))}
          onChange={(e) => setDate(new Date(e.target.value).getTime())}
        />
      </div>
      <div className="form-group">
        <label htmlFor={fromWalletInputId}>From Wallet</label>
        <select
          id={fromWalletInputId}
          className="input"
          value={fromWalletId}
          onChange={(e) => setFromWalletId(e.target.value)}
        >
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} {w.currency ? `(${w.currency})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor={fromAmountInputId}>
          Amount Sent {fromWallet?.currency ? `(${fromWallet.currency})` : ""}
        </label>
        <input
          id={fromAmountInputId}
          className="input"
          type="number"
          value={fromAmount || ""}
          onChange={(e) => setFromAmount(Number.parseFloat(e.target.value))}
        />
      </div>
      <div className="form-group">
        <label htmlFor={toWalletInputId}>To Wallet</label>
        <select
          id={toWalletInputId}
          className="input"
          value={toWalletId}
          onChange={(e) => setToWalletId(e.target.value)}
        >
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} {w.currency ? `(${w.currency})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor={toAmountInputId}>
          Amount Received {toWallet?.currency ? `(${toWallet.currency})` : ""}
        </label>
        <input
          id={toAmountInputId}
          className="input"
          type="number"
          value={toAmount || ""}
          onChange={(e) => setToAmount(Number.parseFloat(e.target.value))}
        />
      </div>
      {fromAmount > 0 && toAmount > 0 && (
        <div className="form-group">
          <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>
            Rate: 1 {fromWallet?.currency ?? "unit"} ={" "}
            {Math.round((toAmount / fromAmount) * 10000) / 10000}{" "}
            {toWallet?.currency ?? "unit"}
          </span>
        </div>
      )}
      <div className="form-group">
        <label htmlFor={descriptionInputId}>Description (Optional)</label>
        <input
          id={descriptionInputId}
          className="input"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {amountError && (
        <span className="form-error">Both amounts are required</span>
      )}
      {sameWalletError && (
        <span className="form-error">
          From and To wallets must be different
        </span>
      )}
    </Dialog>
  );
}
