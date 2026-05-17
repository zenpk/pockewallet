import { useEffect, useRef, useState } from "react";
import type { Categories } from "../localStorage/categories";
import { Recurrences } from "../localStorage/recurrences";
import type { Wallets } from "../localStorage/wallets";
import { unixToLocalTime } from "../utils/time";

type Props = {
  onDone: () => void;
  categories: Categories.Category[];
  wallets: Wallets.Wallet[];
};

export function PendingRecurrences({ onDone, categories, wallets }: Props) {
  const [pending, setPending] = useState<Recurrences.PendingExpense[]>([]);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    performance.mark("recurrence-calc-start");
    const items = Recurrences.getPendingExpenses();
    performance.mark("recurrence-calc-end");
    if (items.length === 0) {
      onDone();
      return;
    }
    setPending(items);
  }, [onDone]);

  useEffect(() => {
    if (pending.length > 0 && ref.current && !ref.current.open) {
      ref.current.showModal();
    }
  }, [pending]);

  if (pending.length === 0) return null;

  function handleSkipRow(index: number) {
    const item = pending[index];
    Recurrences.skipSinglePendingExpense(item);
    const next = pending.filter((_, i) => i !== index);
    if (next.length === 0) {
      ref.current?.close();
      onDone();
    } else {
      setPending(next);
    }
  }

  function handleAddRow(index: number) {
    Recurrences.commitPendingExpenses([pending[index]]);
    const next = pending.filter((_, i) => i !== index);
    if (next.length === 0) {
      ref.current?.close();
      onDone();
    } else {
      setPending(next);
    }
  }

  function handleAddAll() {
    Recurrences.commitPendingExpenses(pending);
    ref.current?.close();
    onDone();
  }

  function handleLater() {
    ref.current?.close();
    onDone();
  }

  return (
    <dialog
      ref={ref}
      onClose={handleLater}
      onClick={(e) => {
        if (e.target === ref.current) handleLater();
      }}
      style={{ maxWidth: "36rem" }}
    >
      <div className="dialog-header">
        <span>Pending Recurring Expenses</span>
        <button
          type="button"
          className="dialog-close-btn"
          onClick={handleLater}
          aria-label="Close"
        >
          &#x2715;
        </button>
      </div>
      <div className="dialog-body">
        <p style={{ margin: "0 0 0.75rem", color: "#4a5568" }}>
          {pending.length} recurring expense{pending.length > 1 ? "s" : ""} need
          to be added.
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
                <th />
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
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        <button
                          type="button"
                          className="btn btn-gray"
                          style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.85rem",
                          }}
                          onClick={() => handleSkipRow(i)}
                        >
                          Skip
                        </button>
                        <button
                          type="button"
                          className="btn btn-blue"
                          style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.85rem",
                          }}
                          onClick={() => handleAddRow(i)}
                        >
                          Add
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="dialog-footer">
        <button type="button" className="btn btn-gray" onClick={handleLater}>
          Later
        </button>
        <button type="button" className="btn btn-blue" onClick={handleAddAll}>
          Add All
        </button>
      </div>
    </dialog>
  );
}
