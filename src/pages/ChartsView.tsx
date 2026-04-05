import type { BarDatum } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { useEffect, useMemo, useState } from "react";
import {
  BiCalendar,
  BiChevronDown,
  BiDoughnutChart,
  BiWallet,
} from "react-icons/bi";
import { DateRangeControls } from "../components/DateRangeControls";
import { Dropdown, DropdownItem } from "../components/Dropdown";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { useViewMode } from "../hooks/useViewMode";
import { Categories } from "../localStorage/categories";
import { Expenses } from "../localStorage/expenses";
import { Settings } from "../localStorage/settings";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { ChartType, ViewMode } from "../utils/consts";
import { unixToLocalTime } from "../utils/time";

type PieData = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type BarData = BarDatum & {
  date: string;
  amount: number;
};

export function ChartsView() {
  const [chartType, setChartType] = useState<ChartType>(ChartType.Pie);
  const [wallet, setWallet] = useState<Wallets.Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [categories, setCategories] = useState<Categories.Category[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [barData, setBarData] = useState<BarData[]>([]);
  const [settings] = useState<Settings.Settings>(Settings.read());
  const vm = useViewMode(ViewMode.Custom);
  const [expenses] = useState(() => Expenses.readAll());

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync view mode with chart type
  useEffect(() => {
    if (chartType === ChartType.Bar) {
      vm.setViewMode(ViewMode.Daily);
    } else {
      vm.setViewMode(ViewMode.Custom);
    }
  }, [chartType]);

  useEffect(() => {
    openDb();
    setWallets(Wallets.readAll());
    setCategories(Categories.readAll());
  }, []);

  useEffect(() => {
    if (!wallets.length) return;
    if (settings.defaultWallet) {
      const result = Wallets.readById(settings.defaultWallet);
      if (result) {
        setWallet(result);
        return;
      }
    }
    setWallet(wallets[0]);
  }, [wallets, settings]);

  const displayData = useMemo(() => {
    if (!wallet || !categories || !expenses || !vm.timeRange) return;
    return Expenses.readRange(
      expenses,
      vm.timeRange.startTime,
      vm.timeRange.endTime,
      wallet.id,
    );
  }, [wallet, categories, expenses, vm.timeRange]);

  // chart data
  useEffect(() => {
    if (!displayData?.length || !categories.length) {
      return;
    }
    switch (chartType) {
      case ChartType.Pie: {
        const dataMap = new Map<string, PieData>();
        const data: PieData[] = [];
        for (const exp of displayData) {
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
      }
      case ChartType.Bar: {
        const dataMap = new Map<string, { label: string; amount: number }>();
        for (const exp of displayData) {
          const lt = unixToLocalTime(exp.timestamp);
          let key: string;
          let label: string;
          switch (vm.viewMode) {
            case ViewMode.Monthly:
              key = String(lt.month).padStart(2, "0");
              label = String(lt.month);
              break;
            case ViewMode.Yearly:
              key = String(lt.year);
              label = String(lt.year);
              break;
            default:
              key = String(lt.day).padStart(2, "0");
              label = String(lt.day);
              break;
          }
          const existing = dataMap.get(key);
          if (existing) {
            existing.amount += exp.amount;
          } else {
            dataMap.set(key, { label, amount: exp.amount });
          }
        }
        const sortedKeys = [...dataMap.keys()].sort();
        const data: BarData[] = sortedKeys
          .map((key) => {
            const entry = dataMap.get(key);
            if (!entry) return null;
            return {
              date: entry.label,
              amount: Math.round(entry.amount * 100) / 100,
            };
          })
          .filter((res) => !!res);
        setBarData(data);
        break;
      }
      default:
        break;
    }
  }, [chartType, displayData, categories, vm.viewMode]);

  return (
    <PageLayout>
      <div
        id="first-lane"
        className="flex-row-space no-space mb-sm flex-wrap flex-wrap-third"
      >
        <LeftDrawer />
        <h2 className="page-title">Charts</h2>
        <div className="flex-row-space gap-sm no-space">
          <Dropdown
            trigger={
              <button type="button" className="btn">
                <BiDoughnutChart />
                {chartType}
                <BiChevronDown />
              </button>
            }
          >
            <DropdownItem onClick={() => setChartType(ChartType.Pie)}>
              {ChartType.Pie}
            </DropdownItem>
            <DropdownItem onClick={() => setChartType(ChartType.Bar)}>
              {ChartType.Bar}
            </DropdownItem>
          </Dropdown>
          {chartType === ChartType.Bar && (
            <Dropdown
              trigger={
                <button type="button" className="btn">
                  <BiCalendar />
                  {vm.viewMode}
                  <BiChevronDown />
                </button>
              }
            >
              <DropdownItem onClick={() => vm.setViewMode(ViewMode.Daily)}>
                {ViewMode.Daily}
              </DropdownItem>
              <DropdownItem onClick={() => vm.setViewMode(ViewMode.Monthly)}>
                {ViewMode.Monthly}
              </DropdownItem>
              <DropdownItem onClick={() => vm.setViewMode(ViewMode.Yearly)}>
                {ViewMode.Yearly}
              </DropdownItem>
            </Dropdown>
          )}
          <Dropdown
            align="right"
            trigger={
              <button type="button" className="btn">
                <BiWallet />
                {wallet?.name ?? ""}
                <BiChevronDown />
              </button>
            }
          >
            {wallets.map((wallet) => (
              <DropdownItem
                key={wallet.id}
                onClick={() => {
                  const result = Wallets.readById(wallet.id);
                  if (result) {
                    setWallet(result);
                  }
                }}
              >
                {wallet.name}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>
      <DateRangeControls {...vm} />
      <div style={{ margin: "0.5rem", height: "fit-content" }}>
        <span style={{ margin: 0 }}>
          {"Total: "}
          {wallet?.currency && `${wallet.currency} `}
          {displayData
            ? Math.round(
                displayData?.reduce((acc, cur) => acc + cur.amount, 0) * 100,
              ) / 100
            : 0}
        </span>
      </div>
      <hr />
      <div
        className="scroll-area"
        style={{ display: "flex", justifyContent: "center" }}
      >
        {chartType === ChartType.Pie && (
          <div
            style={{
              minWidth: 720,
              width: "100%",
              height: "80vh",
              flexShrink: 0,
            }}
          >
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
          </div>
        )}
        {chartType === ChartType.Bar && (
          <div
            style={{
              minWidth: Math.max(720, barData.length * 30 + 120),
              width: "100%",
              height: "80vh",
              flexShrink: 0,
            }}
          >
            <ResponsiveBar
              data={barData}
              keys={["amount"]}
              indexBy="date"
              colors={() => "#3182ce"}
              margin={{ top: 40, right: 40, bottom: 80, left: 80 }}
              padding={0.3}
              borderWidth={1}
              borderColor={{
                from: "color",
                modifiers: [["darker", 0.2]],
              }}
              axisBottom={{
                tickRotation: 35,
              }}
              labelSkipWidth={20}
              labelSkipHeight={20}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
