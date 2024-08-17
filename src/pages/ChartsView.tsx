import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Divider,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { ResponsivePie } from "@nivo/pie";
import { useEffect, useState } from "react";
import { BiDoughnutChart, BiWallet } from "react-icons/bi";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { Settings } from "../db/settings";
import { Categories } from "../localStorage/categories";
import { Expenses } from "../localStorage/expenses";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { ChartType } from "../utils/consts";
import {
  LocalTime,
  getMaxDate,
  localDateToUtcDate,
  localTimeToLocalDate,
  localTimeToUnix,
  newLocalDate,
} from "../utils/time";

type PieData = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export function ChartsView() {
  const [chartType, setChartType] = useState<ChartType>(ChartType.Pie);
  const [wallet, setWallet] = useState<Wallets.Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [categories, setCategories] = useState<Categories.Category[]>([]);
  const [expenses, setExpenses] = useState<Expenses.Expense[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [settings] = useState<Settings.Settings>(Settings.read());
  const [customStartTime, setCustomStartTime] = useState<Date>(
    localTimeToLocalDate({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      milli: 0,
    })
  );
  const [customEndTime, setCustomEndTime] = useState<Date>(new Date());

  useEffect(() => {
    openDb();
    setWallets(Wallets.readAll());
    setCategories(Categories.readAll());
  }, []);

  useEffect(() => {
    if (wallets.length) {
      setWallet(wallets[0]);
    }
  }, [wallets]);

  useEffect(() => {
    if (settings.defaultWallet) {
      const result = Wallets.readById(settings.defaultWallet);
      if (result) {
        setWallet(result);
      }
    }
  }, [settings]);

  // get data
  useEffect(() => {
    if (!wallet || !customStartTime || !customEndTime) {
      return;
    }
    const maxDate = getMaxDate(
      customStartTime.getFullYear(),
      customStartTime.getMonth() + 1
    );
    const startTime: LocalTime = {
      year: customStartTime.getFullYear(),
      month: customStartTime.getMonth() + 1,
      day: customStartTime.getDate(),
      hour: 0,
      minute: 0,
      second: 0,
      milli: 0,
    };
    const endTime: LocalTime = {
      year:
        customEndTime.getDate() + 1 > maxDate &&
        customEndTime.getMonth() + 1 + 1 > 12
          ? customEndTime.getFullYear() + 1
          : customEndTime.getFullYear(),
      month:
        customEndTime.getDate() + 1 > maxDate
          ? customEndTime.getMonth() + 1 + 1 > 12
            ? 1
            : customEndTime.getMonth() + 1 + 1
          : customEndTime.getMonth() + 1,
      day:
        customEndTime.getDate() + 1 > maxDate ? 1 : customEndTime.getDate() + 1,
      hour: 0,
      minute: 0,
      second: 0,
      milli: 0,
    };
    setExpenses(
      Expenses.readRange(
        localTimeToUnix(startTime),
        localTimeToUnix(endTime),
        wallet.id
      )
    );
  }, [chartType, wallet, customStartTime, customEndTime]);

  // chart data
  useEffect(() => {
    if (!expenses.length || !categories.length) {
      return;
    }
    switch (chartType) {
      case ChartType.Pie:
        const dataMap = new Map<string, PieData>();
        const data: PieData[] = [];
        for (const exp of expenses) {
          const cat =
            categories.find((category) => category.id === exp.categoryId) ??
            Categories.defaultCategory;
          let value = dataMap.get(cat.name);
          if (!value) {
            value = {
              id: cat.name,
              label: cat.name,
              value: exp.amount,
              color: cat.color,
            };
          } else {
            value.value += exp.amount;
          }
          dataMap.set(cat.name, value);
        }
        for (const value of dataMap.values()) {
          value.value = Math.round(value.value * 100) / 100;
          data.push(value);
        }
        setPieData(data);
        break;
      default:
        break;
    }
  }, [expenses, categories]);

  return (
    <PageLayout>
      <div
        id="first-lane"
        className="flex-row-space no-space mb-sm flex-wrap flex-wrap-third"
      >
        <LeftDrawer />
        <Heading padding={0} margin={0} fontSize={24}>
          Charts
        </Heading>
        <div className="flex-row-space gap-sm no-space">
          <Menu>
            <MenuButton
              as={Button}
              leftIcon={<BiDoughnutChart />}
              rightIcon={<ChevronDownIcon />}
            >
              {chartType}
            </MenuButton>
            <MenuList>
              <MenuItem
                onClick={() => {
                  setChartType(ChartType.Pie);
                }}
              >
                {ChartType.Pie}
              </MenuItem>
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton
              as={Button}
              leftIcon={<BiWallet />}
              rightIcon={<ChevronDownIcon />}
            >
              {wallet?.name ?? ""}
            </MenuButton>
            <MenuList>
              {wallets.map((wallet) => {
                return (
                  <MenuItem
                    key={wallet.id}
                    onClick={() => {
                      const result = Wallets.readById(wallet.id);
                      if (result) {
                        setWallet(result);
                      }
                    }}
                  >
                    {wallet.name}
                  </MenuItem>
                );
              })}
            </MenuList>
          </Menu>
        </div>
      </div>
      <div id="second-lane" className="flex-row-space no-space gap-sm">
        <input
          id="startDate"
          type="date"
          className="input"
          value={localDateToUtcDate(customStartTime).toISOString().slice(0, 10)}
          onChange={(event) => {
            setCustomStartTime(newLocalDate(event.target.value));
          }}
        ></input>
        <input
          id="endDate"
          type="date"
          className="input"
          value={localDateToUtcDate(customEndTime).toISOString().slice(0, 10)}
          onChange={(event) => {
            setCustomEndTime(newLocalDate(event.target.value));
          }}
        ></input>
      </div>
      <Box margin={"0.5rem"} height={"fit-content"}>
        <Text margin={0}>
          {"Total: "}
          {wallet?.currency && `${wallet.currency} `}
          {Math.round(
            expenses?.reduce((acc, cur) => acc + cur.amount, 0) * 100
          ) / 100}
        </Text>
      </Box>
      <Divider />
      <Box
        width={"100%"}
        height={"100%"}
        display={"flex"}
        justifyContent={"center"}
        overflow={"auto"}
      >
        {chartType === ChartType.Pie && (
          <Box minWidth={720} width={"100%"} height={"80vh"}>
            <ResponsivePie
              data={pieData}
              colors={pieData.map((data) => data.color)}
              margin={{ top: 80, right: 200, bottom: 40, left: 200 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{
                from: "color",
                modifiers: [["darker", 0.2]],
              }}
              arcLabelsSkipAngle={30}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: "color" }}
            />
          </Box>
        )}
      </Box>
    </PageLayout>
  );
}
