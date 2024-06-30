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
  Switch,
} from "@chakra-ui/react";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { Settings } from "../db/settings";
import { useContext, useEffect, useState } from "react";
import { Wallets } from "../db/wallets";
import { dbContext } from "../contexts/Db";
import { openDb } from "../db/shared";
import { ViewMode } from "../utils/consts";

export function SettingsView() {
  const [settings, setSettings] = useState<Settings.Settings>(Settings.read());
  const [db, setDb] = useContext(dbContext)!;
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!db) {
      openDb()
        .then((db) => {
          setDb(db);
        })
        .catch((e) => console.error(e));
    } else {
      Wallets.readAll(db, setWallets);
    }
  }, [db]);

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
    </PageLayout>
  );
}
