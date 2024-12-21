import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Spinner,
  Switch,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { Dialog } from "../components/Dialog";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { oAuthSdk } from "../endpoints/oauth";
import { Categories } from "../localStorage/categories";
import { Expenses } from "../localStorage/expenses";
import { Settings } from "../localStorage/settings";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { STORE_VERIFIER, type SyncData, ViewMode } from "../utils/consts";
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

  // check login
  useEffect(() => {
    axios
      .get("/api/check", {
        withCredentials: true,
      })
      .then((res) => {
        console.log(res);
        setLogin(true);
        setLoginChecked(true);
      })
      .catch((err) => {
        console.log(err);
        axios
          .post("/api/refresh", {}, { withCredentials: true })
          .then((res) => {
            console.log(res);
            setLogin(true);
            setLoginChecked(true);
          })
          .catch((err) => {
            console.log(err);
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
    if (!id) {
      return false;
    }
    setLoading(true);
    let data: SyncData;
    try {
      const res = await axios.get(`/api/wallet/settings?userId=${id.uuid}`);
      data = res.data as SyncData;
      setPulledData(data);
    } catch (err) {
      console.log(err);
      return false;
    }
    if (data?.settings) {
      Settings.write(JSON.parse(data.settings) as Settings.Settings);
    }
    setSettings(Settings.read());
    return true;
  }

  async function pushData(isBackup = false): Promise<boolean> {
    const id = getIdFromCookie();
    if (!id || !login) {
      return false;
    }
    setLoading(true);
    const data: SyncData = {
      expenses: Expenses.readAll(),
      categories: Categories.readAll(),
      wallets: wallets,
      settings: JSON.stringify(settings),
      timestamp: getUnix(),
      userId: id.uuid,
    };
    try {
      const res = await axios.post(
        isBackup ? "/api/wallet/backup" : "/api/wallet/push",
        data,
      );
      console.log(res);
      setPulledData(data);
    } catch (err) {
      console.log(err);
      return false;
    } finally {
      setLoading(false);
    }
    return true;
  }

  async function pullData(): Promise<boolean> {
    const pushOk = await pushData(true);
    if (!pushOk) {
      return false;
    }
    const id = getIdFromCookie();
    if (!id) {
      return false;
    }
    setLoading(true);
    let data: SyncData;
    try {
      const res = await axios.get(`/api/wallet/pull?userId=${id.uuid}`);
      data = res.data as SyncData;
      setPulledData(data);
    } catch (err) {
      console.log(err);
      return false;
    } finally {
      setLoading(false);
    }
    if (!data) {
      return false;
    }
    if (data?.expenses) {
      Expenses.writeAll(data.expenses);
    }
    if (data?.categories) {
      Categories.writeAll(data.categories);
    }
    if (data?.wallets) {
      Wallets.writeAll(data.wallets);
    }
    if (data?.settings) {
      Settings.write(JSON.parse(data.settings) as Settings.Settings);
    }
    setWallets(Wallets.readAll());
    setSettings(Settings.read());
    return true;
  }

  function logout() {
    axios
      .get("/api/logout", { withCredentials: true })
      .then((res) => {
        console.log(res);
        setLogin(false);
      })
      .catch((err) => {
        console.log(err);
      });
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
        <Heading padding={0} margin={0} fontSize={24}>
          Settings
        </Heading>
        <div />
      </div>
      {saved && (
        <Alert status="success" marginBlock={4}>
          <AlertIcon />
          Saved!
        </Alert>
      )}
      <Divider />
      <FormControl>
        <FormLabel marginBlock={2}>Default Wallet</FormLabel>
        <Select
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
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel marginBlock={2}>Default View Mode</FormLabel>
        <Select
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
        </Select>
      </FormControl>
      <FormControl
        display="flex"
        alignItems="center"
        justifyContent={"space-between"}
        marginBlock={2}
      >
        <FormLabel>Display Date</FormLabel>
        <Switch
          isChecked={settings.displayDate}
          onChange={(event) => {
            setSettings((prev) => ({
              ...prev,
              displayDate: event.target.checked,
            }));
          }}
        />
      </FormControl>
      <FormControl
        display="flex"
        alignItems="center"
        justifyContent={"space-between"}
        marginBlock={2}
      >
        <FormLabel>Display Full Date</FormLabel>
        <Switch
          isChecked={settings.displayFullDate}
          onChange={(event) => {
            setSettings((prev) => ({
              ...prev,
              displayFullDate: event.target.checked,
            }));
          }}
        />
      </FormControl>
      <FormControl
        display="flex"
        alignItems="center"
        justifyContent={"space-between"}
        marginBlock={2}
      >
        <FormLabel>Combine Same Dates</FormLabel>
        <Switch
          isChecked={settings.combineDate}
          onChange={(event) => {
            setSettings((prev) => ({
              ...prev,
              combineDate: event.target.checked,
            }));
          }}
        />
      </FormControl>
      <FormControl
        display="flex"
        alignItems="center"
        justifyContent={"space-between"}
        marginBlock={2}
      >
        <FormLabel>Display Currency</FormLabel>
        <Switch
          isChecked={settings.displayCurrency}
          onChange={(event) => {
            setSettings((prev) => ({
              ...prev,
              displayCurrency: event.target.checked,
            }));
          }}
        />
      </FormControl>
      <Box
        marginBlock={2}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"flex-end"}
      >
        <Button
          colorScheme="blue"
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
        </Button>
      </Box>
      <br />
      <Box
        marginBlock={2}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"flex-end"}
      >
        {displayLogin && (
          <Button colorScheme="blue" onClick={goToLogin}>
            Login
          </Button>
        )}
        {displaySpinner && <Spinner />}
        {displayPushPull && (
          <Box display={"flex"} gap={2} alignItems={"center"}>
            <Text>
              Last Sync:{" "}
              {pulledData?.timestamp
                ? localTimeToString(
                    unixToLocalTime(pulledData.timestamp),
                    undefined,
                    settings.displayFullDate,
                  )
                : "None"}
            </Text>
            <Button colorScheme="red" onClick={onOpen}>
              Pull
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                pushData(false);
              }}
            >
              Push
            </Button>
            <Button colorScheme="blue" onClick={logout}>
              Logout
            </Button>
          </Box>
        )}
      </Box>
    </PageLayout>
  );
}
