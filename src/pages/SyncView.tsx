import { useEffect, useState } from "react";
import { Dialog } from "../components/Dialog";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { oAuthSdk } from "../endpoints/oauth";
import { useDisclosure } from "../hooks/useDisclosure";
import { Categories } from "../localStorage/categories";
import { Exchanges } from "../localStorage/exchanges";
import { Expenses } from "../localStorage/expenses";
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
} from "../utils/consts";
import { getUnix, localTimeToString, unixToLocalTime } from "../utils/time";
import { getIdFromCookie } from "../utils/utils";

export function SyncView() {
  const [loginChecked, setLoginChecked] = useState(false);
  const [login, setLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    openDb();
  }, []);

  useEffect(() => {
    fetchJson("/api/check")
      .then(() => {
        setLogin(true);
        setLoginChecked(true);
      })
      .catch(() =>
        postJson("/api/refresh", {})
          .then(() => {
            setLogin(true);
            setLoginChecked(true);
          })
          .catch(() => {
            setLogin(false);
            setLoginChecked(true);
          }),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!login) return;
    const id = getIdFromCookie();
    if (!id) return;
    fetchJson<SyncData>(`/api/wallet/settings?userId=${id.uuid}`)
      .then((data) => {
        if (data?.timestamp) setLastSyncTime(data.timestamp);
      })
      .catch(() => {});
  }, [login]);

  async function goToLogin() {
    const cv = await oAuthSdk.genChallengeVerifier(128);
    localStorage.setItem(STORE_VERIFIER, cv.codeVerifier);
    oAuthSdk.redirectLogin({
      clientId: import.meta.env.VITE_CLIENT_ID as string,
      redirect: window.location.origin,
      codeChallenge: cv.codeChallenge,
    });
  }

  async function pushData(isBackup = false): Promise<boolean> {
    const id = getIdFromCookie();
    if (!id || !login) return false;
    setSyncing(true);
    setMessage(null);
    const data: SyncData = {
      expenses: Expenses.readAll(),
      categories: Categories.readAll(),
      wallets: Wallets.readAll(),
      recurrences: Recurrences.readAll(),
      synonyms: Synonyms.readAll(),
      exchanges: Exchanges.readAll(),
      recentDescriptions: JSON.parse(
        localStorage.getItem(STORE_DESCRIPTIONS) ?? "{}",
      ),
      settings: JSON.stringify(Settings.read()),
      timestamp: getUnix(),
      userId: id.uuid,
    };
    try {
      await postJson(
        isBackup ? "/api/wallet/backup" : "/api/wallet/push",
        data,
      );
      setLastSyncTime(data.timestamp);
      if (!isBackup) setMessage({ text: "Pushed successfully", ok: true });
      return true;
    } catch {
      setMessage({ text: "Push failed", ok: false });
      return false;
    } finally {
      setSyncing(false);
    }
  }

  async function pullData(): Promise<boolean> {
    if (!(await pushData(true))) return false;
    const id = getIdFromCookie();
    if (!id) return false;
    setSyncing(true);
    setMessage(null);
    try {
      const data = await fetchJson<SyncData>(
        `/api/wallet/pull?userId=${id.uuid}`,
      );
      if (!data) return false;
      Expenses.writeAll(data.expenses ?? []);
      Categories.writeAll(data.categories ?? []);
      Wallets.writeAll(data.wallets ?? []);
      Recurrences.writeAll(data.recurrences ?? []);
      Synonyms.writeAll(data.synonyms ?? []);
      Exchanges.writeAll(data.exchanges ?? []);
      localStorage.setItem(
        STORE_DESCRIPTIONS,
        JSON.stringify(data.recentDescriptions ?? {}),
      );
      if (data.settings) {
        const parsed = JSON.parse(data.settings) as Settings.Settings;
        Settings.write(parsed);
      }
      setLastSyncTime(data.timestamp);
      setMessage({ text: "Pulled successfully", ok: true });
      return true;
    } catch {
      setMessage({ text: "Pull failed", ok: false });
      return false;
    } finally {
      setSyncing(false);
    }
  }

  function logout() {
    fetchJson("/api/logout")
      .then(() => {
        setLogin(false);
        setLastSyncTime(null);
        setMessage(null);
      })
      .catch(() => {});
  }

  const username = getIdFromCookie()?.username;

  return (
    <PageLayout>
      {isOpen && (
        <Dialog
          title="Are you sure?"
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          submit={pullData}
        >
          This will overwrite your local data.
        </Dialog>
      )}
      <div id="first-lane" className="flex-row-space no-space mb-sm">
        <LeftDrawer />
        <h2 className="page-title">Sync</h2>
        <div />
      </div>
      <hr />
      <div className="scroll-area" style={{ padding: "1rem 0.5rem" }}>
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <span className="spinner" />
          </div>
        )}

        {loginChecked && !login && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              padding: "2rem",
            }}
          >
            <span style={{ color: "#718096" }}>
              Sign in to sync your data across devices.
            </span>
            <button type="button" className="btn btn-blue" onClick={goToLogin}>
              Login
            </button>
          </div>
        )}

        {loginChecked && login && !loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600 }}>{username ?? "Logged in"}</span>
              <button type="button" className="btn" onClick={logout}>
                Logout
              </button>
            </div>

            <div
              style={{
                padding: "0.75rem 1rem",
                background: "#f7fafc",
                borderRadius: "0.375rem",
                border: "1px solid #e2e8f0",
              }}
            >
              <span style={{ fontSize: "0.875rem", color: "#718096" }}>
                Last sync
              </span>
              <div style={{ fontWeight: 600, marginTop: "0.25rem" }}>
                {lastSyncTime
                  ? localTimeToString(
                      unixToLocalTime(lastSyncTime),
                      undefined,
                      false,
                    )
                  : "Never"}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-blue"
                style={{ flex: 1 }}
                disabled={syncing}
                onClick={() => pushData(false)}
              >
                Push
              </button>
              <button
                type="button"
                className="btn btn-red"
                style={{ flex: 1 }}
                disabled={syncing}
                onClick={onOpen}
              >
                Pull
              </button>
            </div>

            {syncing && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "0.5rem",
                }}
              >
                <span className="spinner" />
              </div>
            )}

            {message && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.375rem",
                  background: message.ok ? "#c6f6d5" : "#fed7d7",
                  color: message.ok ? "#22543d" : "#822727",
                  fontWeight: 500,
                }}
              >
                {message.text}
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
