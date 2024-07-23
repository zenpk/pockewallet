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
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { Settings } from "../db/settings";
import { oAuthSdk } from "../endpoints/oauth";
import { Categories } from "../localStorage/categories";
import { Expenses } from "../localStorage/expenses";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { SendBody, STORE_VERIFIER, SyncData, ViewMode } from "../utils/consts";
import { genLocalTime, localTimeToString } from "../utils/time";
import { getIdFromCookie } from "../utils/utils";

export function SettingsView() {
  const [settings, setSettings] = useState<Settings.Settings>(Settings.read());
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [saved, setSaved] = useState<boolean>(false);
  const [login, setLogin] = useState<boolean | null>(null);
  const [pulledData, setPulledData] = useState<SyncData | null>(null);

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
      })
      .catch((err) => {
        console.log(err);
        axios
          .post("/api/refresh", {}, { withCredentials: true })
          .then((res) => {
            console.log(res);
            setLogin(true);
          })
          .catch((err) => {
            console.log(err);
            setLogin(false);
          });
      });
  }, []);

  function getData() {
    const id = getIdFromCookie();
    if (!id || !login) {
      return;
    }
    axios
      .get(
        `/api/mongo/read?collection=${
          import.meta.env.VITE_DB_COLLECTION
        }&key=userId&value=${id.uuid}`
      )
      .then((res) => {
        const data = res.data as SyncData[];
        if (data && data.length > 0) {
          setPulledData(data[0]);
        }
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  useEffect(getData, [login]);

  async function goToLogin() {
    const cv = await oAuthSdk.genChallengeVerifier(128);
    localStorage.setItem(STORE_VERIFIER, cv.codeVerifier);
    oAuthSdk.redirectLogin({
      clientId: import.meta.env.VITE_CLIENT_ID as string,
      redirect: window.location.origin,
      codeChallenge: cv.codeChallenge,
    });
  }

  function pushData() {
    const id = getIdFromCookie();
    if (!id || !login) {
      return;
    }
    setLogin(null);
    const expenses = Expenses.readAll();
    const categories = Categories.readAll();
    const data: SyncData = {
      expenses,
      categories,
      wallets,
      settings,
      lastSync: localTimeToString(genLocalTime()),
      userId: getIdFromCookie()?.uuid ?? "",
    };
    const sendBody: SendBody = {
      collection: import.meta.env.VITE_DB_COLLECTION as string,
      data,
    };
    axios
      .post(`/api/mongo/update?key=userId&value=${id.uuid}`, sendBody)
      .then((res) => {
        console.log(res);
        getData();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLogin(true);
      });
  }

  function pullData() {
    console.log(pulledData);
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

  return (
    <PageLayout>
      <div id="first-lane" className="flex-row-space no-space mb-sm">
        <div className={"flex-row-space gap-sm no-space"}>
          <LeftDrawer />
        </div>
        <Heading padding={0} margin={0} fontSize={24}>
          Settings
        </Heading>
        <div></div>
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
            setSaved(true);
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
        {login === null && <Spinner />}
        {login === false && (
          <Button colorScheme="blue" onClick={goToLogin}>
            Login
          </Button>
        )}
        {login === true && (
          <Box display={"flex"} gap={2} alignItems={"center"}>
            <Text>Last Sync: {pulledData?.lastSync ?? "None"}</Text>
            <Button colorScheme="red" onClick={pullData}>
              Pull
            </Button>
            <Button colorScheme="blue" onClick={pushData}>
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
