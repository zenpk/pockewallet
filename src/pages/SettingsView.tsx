import { useEffect, useId, useState } from "react";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { RecentDescriptions } from "../localStorage/recentDescriptions";
import { Settings } from "../localStorage/settings";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { ViewMode } from "../utils/consts";

export function SettingsView() {
  const [settings, setSettings] = useState<Settings.Settings>(Settings.read());
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [saved, setSaved] = useState<boolean>(false);
  const [cleared, setCleared] = useState<boolean>(false);
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
  }, []);

  return (
    <PageLayout>
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
          <span>Clear Recent Descriptions</span>
          <button
            type="button"
            className="btn btn-red"
            onClick={() => {
              RecentDescriptions.clear();
              setCleared(true);
              setTimeout(() => {
                setCleared(false);
              }, 2000);
            }}
          >
            Clear
          </button>
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
            className="btn btn-blue"
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
