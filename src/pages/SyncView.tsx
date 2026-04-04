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
} from "../utils/consts";
import { getUnix, localTimeToString, unixToLocalTime } from "../utils/time";
import { getIdFromCookie } from "../utils/utils";

export function SyncView() {
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [settings, setSettings] = useState<Settings.Settings>(Settings.read());
  const [loginChecked, setLoginChecked] = useState<boolean>(false);
  const [login, setLogin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [pulledData, setPulledData] = useState<SyncData | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    openDb();
    setWallets(Wallets.readAll());
    setSettings(Settings.read());
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
      })
      .finally(() => {
        setLoading(false);
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

  async function pushData(isBackup = false): Promise<boolean> {
    const id = getIdFromCookie();
    if (!id || !login) return false;
    setLoading(true);
    const data: SyncData = {
      expenses: Expenses.readAll(),
      categories: Categories.readAll(),
      wallets,
      recurrences: Recurrences.readAll(),
      synonyms: Synonyms.readAll(),
      exchanges: Exchanges.readAll(),
      recentDescriptions: RecentDescriptions.read(),
      settings: JSON.stringify(Settings.read()),
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
      const data = await fetchJson<SyncData>(`/api/wallet/pull?userId=${id.uuid}`);
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

  const displayLogin = loginChecked && !login;
  const displaySpinner = loading;
  const displayPushPull = loginChecked && login && !loading;

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
        <h2 className="page-title">Sync</h2>
        <div />
      </div>
      <hr />
      <div className="scroll-area">
        <div
          style={{
            marginBlock: "1rem",
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
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
