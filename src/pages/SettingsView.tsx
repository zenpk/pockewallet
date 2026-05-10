import { useEffect, useId, useRef, useState } from "react";
import { BiEdit, BiTrash } from "react-icons/bi";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { Categories } from "../localStorage/categories";
import { RecentDescriptions } from "../localStorage/recentDescriptions";
import { Settings } from "../localStorage/settings";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { ViewMode } from "../utils/consts";

export function SettingsView() {
  const [settings, setSettings] = useState<Settings.Settings>(Settings.read());
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [categories, setCategories] = useState<Categories.Category[]>([]);
  const [saved, setSaved] = useState<boolean>(false);
  const [cleared, setCleared] = useState<boolean>(false);
  const [descDialogOpen, setDescDialogOpen] = useState(false);
  const idPrefix = useId();
  const defaultWalletInputId = `${idPrefix}-default-wallet`;
  const defaultViewModeInputId = `${idPrefix}-default-view-mode`;
  const displayDateInputId = `${idPrefix}-display-date`;
  const displayConciseDateInputId = `${idPrefix}-display-concise-date`;
  const combineDateInputId = `${idPrefix}-combine-date`;
  const displayCurrencyInputId = `${idPrefix}-display-currency`;

  useEffect(() => {
    openDb();
    setWallets(Wallets.readAll());
    setCategories(Categories.readAll());
  }, []);

  return (
    <PageLayout>
      {descDialogOpen && (
        <RecentDescriptionsDialog
          wallets={wallets}
          categories={categories}
          onClose={() => setDescDialogOpen(false)}
          onClear={() => {
            setCleared(true);
            setTimeout(() => setCleared(false), 2000);
          }}
        />
      )}
      <div id="first-lane" className="flex-row-space no-space mb-sm">
        <div className={"flex-row-space gap-sm no-space"}>
          <LeftDrawer />
        </div>
        <h2 className="page-title">Settings</h2>
        <div />
      </div>
      {saved && (
        <div className="alert-success" style={{ marginBlock: "1rem" }}>
          Saved!
        </div>
      )}
      <hr />
      <div className="scroll-area">
        <div>
          <label
            htmlFor={defaultWalletInputId}
            style={{ display: "block", marginBlock: "0.5rem" }}
          >
            Default Wallet
          </label>
          <select
            id={defaultWalletInputId}
            className="input"
            value={settings.defaultWallet || wallets[0]?.id}
            onChange={(event) => {
              setSettings((prev) => ({
                ...prev,
                defaultWallet: event.target.value,
              }));
            }}
          >
            {wallets.map((w) => {
              return (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label
            htmlFor={defaultViewModeInputId}
            style={{ display: "block", marginBlock: "0.5rem" }}
          >
            Default View Mode
          </label>
          <select
            id={defaultViewModeInputId}
            className="input"
            value={settings.defaultViewMode || ViewMode.Monthly}
            onChange={(event) => {
              setSettings((prev) => ({
                ...prev,
                defaultViewMode: event.target.value as ViewMode,
              }));
            }}
          >
            {Object.values(ViewMode).map((v) => {
              return (
                <option key={v} value={v}>
                  {v}
                </option>
              );
            })}
          </select>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBlock: "0.5rem",
          }}
        >
          <label htmlFor={displayDateInputId}>Display Date</label>
          <label className="switch">
            <input
              id={displayDateInputId}
              type="checkbox"
              checked={settings.displayDate}
              onChange={(event) => {
                setSettings((prev) => ({
                  ...prev,
                  displayDate: event.target.checked,
                }));
              }}
            />
            <span className="switch-slider" />
          </label>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBlock: "0.5rem",
          }}
        >
          <label htmlFor={displayConciseDateInputId}>
            Display Concise Date
          </label>
          <label className="switch">
            <input
              id={displayConciseDateInputId}
              type="checkbox"
              checked={settings.displayConciseDate}
              onChange={(event) => {
                setSettings((prev) => ({
                  ...prev,
                  displayConciseDate: event.target.checked,
                }));
              }}
            />
            <span className="switch-slider" />
          </label>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBlock: "0.5rem",
          }}
        >
          <label htmlFor={combineDateInputId}>Combine Same Dates</label>
          <label className="switch">
            <input
              id={combineDateInputId}
              type="checkbox"
              checked={settings.combineDate}
              onChange={(event) => {
                setSettings((prev) => ({
                  ...prev,
                  combineDate: event.target.checked,
                }));
              }}
            />
            <span className="switch-slider" />
          </label>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBlock: "0.5rem",
          }}
        >
          <label htmlFor={displayCurrencyInputId}>Display Currency</label>
          <label className="switch">
            <input
              id={displayCurrencyInputId}
              type="checkbox"
              checked={settings.displayCurrency}
              onChange={(event) => {
                setSettings((prev) => ({
                  ...prev,
                  displayCurrency: event.target.checked,
                }));
              }}
            />
            <span className="switch-slider" />
          </label>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBlock: "0.5rem",
          }}
        >
          <span>Recent Descriptions</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-fixed"
              onClick={() => setDescDialogOpen(true)}
            >
              Open
            </button>
          </div>
        </div>
        {cleared && (
          <div className="alert-success" style={{ marginBlock: "0.5rem" }}>
            Recent descriptions cleared!
          </div>
        )}
        <div
          style={{
            marginBlock: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          <button
            type="button"
            className="btn btn-blue btn-fixed"
            onClick={() => {
              Settings.write(settings);
              setSettings(Settings.read());
              setSaved(true);
              setTimeout(() => {
                setSaved(false);
              }, 2000);
            }}
          >
            Save
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

function RecentDescriptionsDialog({
  wallets,
  categories,
  onClose,
  onClear,
}: {
  wallets: Wallets.Wallet[];
  categories: Categories.Category[];
  onClose: () => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const store = RecentDescriptions.readAll();
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));

  type FlatEntry = {
    walletId: string;
    description: string;
    categoryId: string;
  };
  const initialEntries: FlatEntry[] = [];
  for (const [walletId, entries] of Object.entries(store)) {
    for (const e of entries) {
      initialEntries.push({ walletId, ...e });
    }
  }

  const [entries, setEntries] = useState(initialEntries);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  function handleDelete(idx: number) {
    const entry = entries[idx];
    RecentDescriptions.removeEntry(entry.walletId, entry.description);
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleStartEdit(idx: number) {
    setEditingIdx(idx);
    setEditValue(entries[idx].description);
    setEditCategoryId(entries[idx].categoryId);
  }

  function handleSaveEdit(idx: number) {
    const entry = entries[idx];
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditingIdx(null);
      return;
    }
    const descChanged = trimmed !== entry.description;
    const catChanged = editCategoryId !== entry.categoryId;
    if (descChanged || catChanged) {
      RecentDescriptions.updateEntry(
        entry.walletId,
        entry.description,
        trimmed,
        catChanged ? editCategoryId : undefined,
      );
      setEntries((prev) =>
        prev.map((e, i) =>
          i === idx
            ? { ...e, description: trimmed, categoryId: editCategoryId }
            : e,
        ),
      );
    }
    setEditingIdx(null);
  }

  function handleClearAll() {
    RecentDescriptions.clear();
    setEntries([]);
    onClear();
  }

  function handleClose() {
    ref.current?.close();
    onClose();
  }

  function getCategoryName(categoryId: string) {
    return (
      categories.find((c) => c.id === categoryId)?.name ?? (categoryId || "-")
    );
  }

  return (
    <dialog
      ref={ref}
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === ref.current) handleClose();
      }}
      style={{ maxWidth: "44rem", width: "90vw" }}
    >
      <div className="dialog-header">
        <span>Recent Descriptions</span>
        <button
          type="button"
          className="dialog-close-btn"
          onClick={handleClose}
          aria-label="Close"
        >
          &#x2715;
        </button>
      </div>
      <div className="dialog-body">
        {entries.length === 0 && (
          <p style={{ color: "#718096" }}>No recent descriptions.</p>
        )}
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            border: entries.length > 0 ? "1px solid #e2e8f0" : undefined,
            borderRadius: "0.375rem",
          }}
        >
          {entries.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={`${entry.walletId}-${entry.description}`}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {walletMap.get(entry.walletId) ?? entry.walletId}
                    </td>
                    <td>
                      {editingIdx === i ? (
                        <input
                          className="input"
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(i);
                            if (e.key === "Escape") setEditingIdx(null);
                          }}
                          ref={(el) => el?.focus()}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        entry.description
                      )}
                    </td>
                    <td>
                      {editingIdx === i ? (
                        <select
                          className="input"
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          style={{ minWidth: "6rem" }}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        getCategoryName(entry.categoryId)
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        {editingIdx === i ? (
                          <button
                            type="button"
                            className="btn btn-blue"
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.85rem",
                            }}
                            onClick={() => handleSaveEdit(i)}
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-icon"
                            aria-label="Edit"
                            onClick={() => handleStartEdit(i)}
                          >
                            <BiEdit />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-icon"
                          aria-label="Delete"
                          style={{ color: "#ee0000" }}
                          onClick={() => handleDelete(i)}
                        >
                          <BiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="dialog-footer">
        <button
          type="button"
          className="btn btn-red"
          onClick={handleClearAll}
          disabled={entries.length === 0}
        >
          Clear All
        </button>
        <button type="button" className="btn" onClick={handleClose}>
          Close
        </button>
      </div>
    </dialog>
  );
}
