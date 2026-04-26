import { useCallback, useEffect, useState } from "react";
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
import { STORE_DESCRIPTIONS, STORE_VERIFIER } from "../utils/consts";
import { getIdFromCookie } from "../utils/utils";

type YearInfo = {
  liveCount: number;
  backupCount: number;
  latestLive: number | null;
  latestBackup: number | null;
};
type SyncInfo = {
  expenseYears: Record<string, YearInfo>;
  hasOtherData: boolean;
  hasOtherBackup: boolean;
  otherLiveTimestamp: number | null;
  otherBackupTimestamp: number | null;
};

type Message = { text: string; ok: boolean } | null;

function fmtTs(ts: number | null | undefined): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getLocalExpensesByYear(year: number): Expenses.Expense[] {
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  return Expenses.readAll().filter(
    (e) => e.timestamp >= start && e.timestamp < end,
  );
}

function getLocalLatestTimestamp(year: number): number | null {
  const items = getLocalExpensesByYear(year);
  if (items.length === 0) return null;
  return Math.max(...items.map((e) => e.timestamp));
}

function removeLocalExpensesByYear(year: number) {
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  const all = Expenses.readAll();
  Expenses.writeAll(
    all.filter((e) => e.timestamp < start || e.timestamp >= end),
  );
}

function getLocalExpenseYears(): number[] {
  const expenses = Expenses.readAll();
  const years = new Set<number>();
  for (const e of expenses) years.add(new Date(e.timestamp).getFullYear());
  return Array.from(years).sort((a, b) => b - a);
}

function buildYearList(localYears: number[], serverYears: number[]): number[] {
  const all = new Set([...localYears, ...serverYears]);
  return Array.from(all).sort((a, b) => b - a);
}

// ── Main component ──

export function SyncView() {
  const [loginChecked, setLoginChecked] = useState(false);
  const [login, setLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const [serverInfo, setServerInfo] = useState<SyncInfo | null>(null);
  const [localYears, setLocalYears] = useState<number[]>([]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingPull, setPendingPull] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const refreshLocalYears = useCallback(() => {
    setLocalYears(getLocalExpenseYears());
  }, []);

  useEffect(() => {
    openDb();
    refreshLocalYears();
  }, [refreshLocalYears]);

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

  const tz = new Date().getTimezoneOffset();

  const fetchServerInfo = useCallback(() => {
    const id = getIdFromCookie();
    if (!id) return;
    fetchJson<SyncInfo>(`/api/wallet/info?userId=${id.uuid}&tz=${tz}`)
      .then(setServerInfo)
      .catch(() => {});
  }, [tz]);

  useEffect(() => {
    if (login) fetchServerInfo();
  }, [login, fetchServerInfo]);

  const allYears = buildYearList(
    localYears,
    Object.keys(serverInfo?.expenseYears ?? {}).map(Number),
  );

  // ── Expense actions ──

  async function pushExpenses(year: number) {
    const id = getIdFromCookie();
    if (!id) return;
    setSyncing(true);
    setMessage(null);
    try {
      const expenses = getLocalExpensesByYear(year);
      await postJson("/api/wallet/expenses/push", {
        userId: id.uuid,
        year,
        tz,
        expenses,
      });
      setMessage({
        text: `Pushed ${year} expenses (${expenses.length})`,
        ok: true,
      });
      fetchServerInfo();
    } catch {
      setMessage({ text: `Push ${year} failed`, ok: false });
    } finally {
      setSyncing(false);
    }
  }

  async function pullExpenses(year: number) {
    const id = getIdFromCookie();
    if (!id) return;
    setSyncing(true);
    setMessage(null);
    try {
      const data = await fetchJson<{ expenses: Expenses.Expense[] }>(
        `/api/wallet/expenses/pull?userId=${id.uuid}&year=${year}&tz=${tz}`,
      );
      removeLocalExpensesByYear(year);
      const all = Expenses.readAll();
      all.push(...(data.expenses ?? []));
      Expenses.writeAll(all);
      refreshLocalYears();
      setMessage({
        text: `Pulled ${year} expenses (${data.expenses?.length ?? 0})`,
        ok: true,
      });
    } catch {
      setMessage({ text: `Pull ${year} failed`, ok: false });
    } finally {
      setSyncing(false);
    }
  }

  function offloadExpenses(year: number) {
    removeLocalExpensesByYear(year);
    refreshLocalYears();
    setMessage({ text: `Offloaded ${year} expenses from local`, ok: true });
  }

  async function backupExpenses(year: number) {
    const id = getIdFromCookie();
    if (!id) return;
    setSyncing(true);
    setMessage(null);
    try {
      await postJson("/api/wallet/expenses/backup", {
        userId: id.uuid,
        year,
        tz,
      });
      setMessage({ text: `Backed up ${year} expenses`, ok: true });
      fetchServerInfo();
    } catch {
      setMessage({ text: `Backup ${year} failed`, ok: false });
    } finally {
      setSyncing(false);
    }
  }

  // ── Other data actions ──

  async function pushOtherData() {
    const id = getIdFromCookie();
    if (!id) return;
    setSyncing(true);
    setMessage(null);
    try {
      await postJson("/api/wallet/other/push", {
        userId: id.uuid,
        categories: Categories.readAll(),
        wallets: Wallets.readAll(),
        recurrences: Recurrences.readAll(),
        synonyms: Synonyms.readAll(),
        exchanges: Exchanges.readAll(),
        recentDescriptions: JSON.parse(
          localStorage.getItem(STORE_DESCRIPTIONS) ?? "{}",
        ),
        settings: JSON.stringify(Settings.read()),
        timestamp: Date.now(),
      });
      setMessage({ text: "Pushed categories / wallets / others", ok: true });
      fetchServerInfo();
    } catch {
      setMessage({ text: "Push other data failed", ok: false });
    } finally {
      setSyncing(false);
    }
  }

  async function pullOtherData() {
    const id = getIdFromCookie();
    if (!id) return;
    setSyncing(true);
    setMessage(null);
    try {
      const data = await fetchJson<{
        categories: Categories.Category[];
        wallets: Wallets.Wallet[];
        recurrences: Recurrences.Recurrence[];
        synonyms: Synonyms.SynonymGroup[];
        exchanges: Exchanges.Exchange[];
        recentDescriptions: unknown;
        settings: string;
      }>(`/api/wallet/other/pull?userId=${id.uuid}`);
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
        Settings.write(JSON.parse(data.settings) as Settings.Settings);
      }
      setMessage({ text: "Pulled categories / wallets / others", ok: true });
      fetchServerInfo();
    } catch {
      setMessage({ text: "Pull other data failed", ok: false });
    } finally {
      setSyncing(false);
    }
  }

  async function backupOtherData() {
    const id = getIdFromCookie();
    if (!id) return;
    setSyncing(true);
    setMessage(null);
    try {
      await postJson("/api/wallet/other/backup", { userId: id.uuid });
      setMessage({ text: "Backed up categories / wallets / others", ok: true });
      fetchServerInfo();
    } catch {
      setMessage({ text: "Backup other data failed", ok: false });
    } finally {
      setSyncing(false);
    }
  }

  // ── Auth ──

  async function goToLogin() {
    const cv = await oAuthSdk.genChallengeVerifier(128);
    localStorage.setItem(STORE_VERIFIER, cv.codeVerifier);
    oAuthSdk.redirectLogin({
      clientId: import.meta.env.VITE_CLIENT_ID as string,
      redirect: window.location.origin,
      codeChallenge: cv.codeChallenge,
    });
  }

  function logout() {
    fetchJson("/api/logout")
      .then(() => {
        setLogin(false);
        setServerInfo(null);
        setMessage(null);
      })
      .catch(() => {});
  }

  const username = getIdFromCookie()?.username;

  // ── Styles ──

  const sectionStyle: React.CSSProperties = {
    padding: "0.75rem 1rem",
    background: "#f7fafc",
    borderRadius: "0.375rem",
    border: "1px solid #e2e8f0",
  };

  const sectionTitle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: "1.05rem",
    marginBottom: "0.75rem",
  };

  const btnSmall: React.CSSProperties = {
    padding: "0.3rem 0.6rem",
    fontSize: "0.85rem",
  };

  const tsStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    color: "#a0aec0",
    lineHeight: 1.4,
  };

  // ── Render ──

  return (
    <PageLayout>
      {isOpen && pendingPull && (
        <Dialog
          title={pendingPull.title}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          submit={async () => {
            await pendingPull.action();
            return true;
          }}
        >
          {pendingPull.message}
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
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
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

            {/* ── Expenses by year ── */}
            <div style={sectionStyle}>
              <div style={sectionTitle}>Expenses (by year)</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {allYears.map((year) => {
                  const localCount = getLocalExpensesByYear(year).length;
                  const localLatest = getLocalLatestTimestamp(year);
                  const srv = serverInfo?.expenseYears?.[year];
                  return (
                    <div
                      key={year}
                      style={{
                        padding: "0.5rem 0.75rem",
                        background: "#fff",
                        borderRadius: "0.25rem",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{year}</span>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.375rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-blue"
                            style={btnSmall}
                            disabled={syncing || localCount === 0}
                            onClick={() => pushExpenses(year)}
                          >
                            Push
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={btnSmall}
                            disabled={syncing || !srv?.liveCount}
                            onClick={() => {
                              setPendingPull({
                                title: `Pull ${year}?`,
                                message: `This will overwrite your local ${year} expenses with server data.`,
                                action: () => pullExpenses(year),
                              });
                              onOpen();
                            }}
                          >
                            Pull
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={btnSmall}
                            disabled={syncing || localCount === 0}
                            onClick={() => offloadExpenses(year)}
                          >
                            Offload
                          </button>
                          <button
                            type="button"
                            className="btn btn-green"
                            style={btnSmall}
                            disabled={syncing || !srv?.liveCount}
                            onClick={() => backupExpenses(year)}
                          >
                            Backup
                          </button>
                        </div>
                      </div>
                      <div style={tsStyle}>
                        Local: {localCount} ({fmtTs(localLatest)})
                        &nbsp;&middot;&nbsp; Server: {srv?.liveCount ?? 0} (
                        {fmtTs(srv?.latestLive)}) &nbsp;&middot;&nbsp; Backup:{" "}
                        {srv?.backupCount ?? 0} ({fmtTs(srv?.latestBackup)})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Other data ── */}
            <div style={sectionStyle}>
              <div style={sectionTitle}>
                Categories / Wallets / Recurrences / Synonyms / Settings
              </div>
              <div style={{ ...tsStyle, marginBottom: "0.5rem" }}>
                Server: {serverInfo?.hasOtherData ? "exists" : "none"} (
                {fmtTs(serverInfo?.otherLiveTimestamp)}) &nbsp;&middot;&nbsp;
                Backup: {serverInfo?.hasOtherBackup ? "exists" : "none"} (
                {fmtTs(serverInfo?.otherBackupTimestamp)})
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-blue"
                  style={btnSmall}
                  disabled={syncing}
                  onClick={pushOtherData}
                >
                  Push
                </button>
                <button
                  type="button"
                  className="btn"
                  style={btnSmall}
                  disabled={syncing || !serverInfo?.hasOtherData}
                  onClick={() => {
                    setPendingPull({
                      title: "Pull other data?",
                      message:
                        "This will overwrite your local categories, wallets, recurrences, synonyms, and settings with server data.",
                      action: pullOtherData,
                    });
                    onOpen();
                  }}
                >
                  Pull
                </button>
                <button
                  type="button"
                  className="btn btn-green"
                  style={btnSmall}
                  disabled={syncing || !serverInfo?.hasOtherData}
                  onClick={backupOtherData}
                >
                  Backup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
