import { useEffect, useRef, useState } from "react";
import { Categories } from "../localStorage/categories";
import { Recurrences } from "../localStorage/recurrences";
import { Wallets } from "../localStorage/wallets";
import { unixToLocalTime } from "../utils/time";

type Props = {
  onDone: () => void;
};

export function PendingRecurrences({ onDone }: Props) {
  const [pending, setPending] = useState<Recurrences.PendingExpense[]>([]);
  const [categories] = useState(Categories.readAll());
  const [wallets] = useState(Wallets.readAll());
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const items = Recurrences.getPendingExpenses();
    if (items.length === 0) {
      onDone();
      return;
    }
    setPending(items);
    ref.current?.showModal();
  }, [onDone]);

  if (pending.length === 0) return null;

  function handleAdd() {
    Recurrences.commitPendingExpenses(pending);
    ref.current?.close();
    onDone();
  }

  function handleSkip() {
    Recurrences.skipPendingExpenses();
    ref.current?.close();
    onDone();
  }

  return (
    <dialog
      ref={ref}
      onClose={handleSkip}
      onClick={(e) => {
        if (e.target === ref.current) handleSkip();
      }}
      style={{ maxWidth: "36rem" }}
    >
      <div className="dialog-header">
        <span>Pending Recurring Expenses</span>
        <button
          type="button"
          className="dialog-close-btn"
          onClick={handleSkip}
          aria-label="Close"
        >
          &#x2715;
        </button>
      </div>
      <div className="dialog-body">
        <p style={{ margin: "0 0 0.75rem", color: "#4a5568" }}>
          {pending.length} recurring expense{pending.length > 1 ? "s" : ""} need
          to be added. Would you like to add them?
        </p>
        <div
          style={{
            maxHeight: "40vh",
            overflowY: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: "0.375rem",
          }}
        >
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Wallet</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p, i) => {
                const t = unixToLocalTime(p.timestamp);
                const cat =
                  categories.find((c) => c.id === p.categoryId) ??
                  Categories.defaultCategory;
                const wal = wallets.find((w) => w.id === p.walletId);
                return (
                  <tr key={`${p.recurrenceId}-${i}`}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {`${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`}
                    </td>
                    <td>{p.description}</td>
                    <td>{Math.round(p.amount * 100) / 100}</td>
                    <td>
                      <span
                        className="badge"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.name}
                      </span>
                    </td>
                    <td>{wal?.name ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="dialog-footer">
        <button type="button" className="btn btn-gray" onClick={handleSkip}>
          Skip
        </button>
        <button type="button" className="btn btn-blue" onClick={handleAdd}>
          Add All
        </button>
      </div>
    </dialog>
  );
}
