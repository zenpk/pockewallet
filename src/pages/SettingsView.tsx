import { useEffect, useState } from "react";
import { Dialog } from "../components/Dialog";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { oAuthSdk } from "../endpoints/oauth";
import { useDisclosure } from "../hooks/useDisclosure";
import { Categories } from "../localStorage/categories";
import { Exchanges } from "../localStorage/exchanges";
import { Expenses } from "../localStorage/expenses";
import { RecentDescriptions } from "../localStorage/recentDescriptions";
import { Recurrences } from "../localStorage/recurrences";
import { Settings } from "../localStorage/settings";
import { openDb } from "../localStorage/shared";
import { Synonyms } from "../localStorage/synonyms";
import { Wallets } from "../localStorage/wallets";
import { fetchJson, postJson } from "../utils/api";
import {
  STORE_DESCRIPTIONS,
  STORE_VERIFIER,
  type SyncData,
  ViewMode,
} from "../utils/consts";
import { getUnix, localTimeToString, unixToLocalTime } from "../utils/time";
import { getIdFromCookie } from "../utils/utils";

export function SettingsView() {
  const [settings, setSettings] = useState<Settings.Settings>(Settings.read());
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [saved, setSaved] = useState<boolean>(false);
  const [loginChecked, setLoginChecked] = useState<boolean>(false);
  const [login, setLogin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [pulledData, setPulledData] = useState<SyncData | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    openDb();
    setWallets(Wallets.readAll());
  }, []);

  useEffect(() => {
    fetchJson("/api/check")
      .then(() => {
        setLogin(true);
        setLoginChecked(true);
      })
      .catch(() => {
        postJson("/api/refresh", {})
          .then(() => {
            setLogin(true);
            setLoginChecked(true);
          })
          .catch(() => {
            setLogin(false);
            setLoginChecked(true);
          });
      });
  }, []);

  async function goToLogin() {
    const cv = await oAuthSdk.genChallengeVerifier(128);
    localStorage.setItem(STORE_VERIFIER, cv.codeVerifier);
    oAuthSdk.redirectLogin({
      clientId: import.meta.env.VITE_CLIENT_ID as string,
      redirect: window.location.origin,
      codeChallenge: cv.codeChallenge,
    });
  }

  useEffect(() => {
    if (loginChecked && login) {
      getSettings();
    }
  }, [login, loginChecked]);

  async function getSettings(): Promise<boolean> {
    const id = getIdFromCookie();
    if (!id) return false;
    setLoading(true);
    try {
      const data = await fetchJson<SyncData>(
        `/api/wallet/settings?userId=${id.uuid}`,
      );
      setPulledData(data);
      if (data?.settings) {
        Settings.write(JSON.parse(data.settings) as Settings.Settings);
      }
      setSettings(Settings.read());
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function pushData(isBackup = false): Promise<boolean> {
    const id = getIdFromCookie();
    if (!id || !login) return false;
    setLoading(true);
    const data: SyncData = {
      expenses: Expenses.readAll(),
      categories: Categories.readAll(),
      wallets: wallets,
      recurrences: Recurrences.readAll(),
      synonyms: Synonyms.readAll(),
      exchanges: Exchanges.readAll(),
      recentDescriptions: RecentDescriptions.read(),
      settings: JSON.stringify(settings),
      timestamp: getUnix(),
      userId: id.uuid,
    };
    try {
      await postJson(
        isBackup ? "/api/wallet/backup" : "/api/wallet/push",
        data,
      );
      setPulledData(data);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function pullData(): Promise<boolean> {
    if (!(await pushData(true))) return false;
    const id = getIdFromCookie();
    if (!id) return false;
    setLoading(true);
    try {
      const data = await fetchJson<SyncData>(
        `/api/wallet/pull?userId=${id.uuid}`,
      );
      if (!data) return false;
      setPulledData(data);
      Expenses.writeAll(data.expenses ?? []);
      Categories.writeAll(data.categories ?? []);
      Wallets.writeAll(data.wallets ?? []);
      Recurrences.writeAll(data.recurrences ?? []);
      Synonyms.writeAll(data.synonyms ?? []);
      Exchanges.writeAll(data.exchanges ?? []);
      localStorage.setItem(
        STORE_DESCRIPTIONS,
        JSON.stringify(data.recentDescriptions ?? []),
      );
      if (data.settings) {
        Settings.write(JSON.parse(data.settings) as Settings.Settings);
      }
      setWallets(Wallets.readAll());
      setSettings(Settings.read());
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    fetchJson("/api/logout")
      .then(() => setLogin(false))
      .catch(() => {});
  }

  // loginChecked, login, loading
  const displayLogin = loginChecked && !login; // 100, 101
  const displaySpinner = !loginChecked || (login && loading); // 000, 001, 010, 011, 111
  const displayPushPull = loginChecked && login && !loading; // 110

  return (
    <PageLayout>
      {isOpen && (
        <Dialog
          title={"Are you sure?"}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          submit={pullData}
        >
          This will overwrite your local data.
        </Dialog>
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
          <label style={{ display: "block", marginBlock: "0.5rem" }}>
            Default Wallet
          </label>
          <select
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
          <label style={{ display: "block", marginBlock: "0.5rem" }}>
            Default View Mode
          </label>
          <select
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
          <label>Display Date</label>
          <label className="switch">
            <input
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
          <label>Display Concise Date</label>
          <label className="switch">
            <input
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
          <label>Combine Same Dates</label>
          <label className="switch">
            <input
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
          <label>Display Currency</label>
          <label className="switch">
            <input
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
            marginBlock: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
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
        <br />
        <div
          style={{
            marginBlock: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {displayLogin && (
            <button type="button" className="btn btn-blue" onClick={goToLogin}>
              Login
            </button>
          )}
          {displaySpinner && <span className="spinner" />}
          {displayPushPull && (
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <span>
                Last Sync:{" "}
                {pulledData?.timestamp
                  ? localTimeToString(
                      unixToLocalTime(pulledData.timestamp),
                      undefined,
                      settings.displayConciseDate,
                    )
                  : "None"}
              </span>
              <button type="button" className="btn btn-red" onClick={onOpen}>
                Pull
              </button>
              <button
                type="button"
                className="btn btn-blue"
                onClick={() => {
                  pushData(false);
                }}
              >
                Push
              </button>
              <button type="button" className="btn btn-blue" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
