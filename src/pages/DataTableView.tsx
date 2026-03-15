import { useCallback, useEffect, useMemo, useState } from "react";
import { BiCalendar, BiChevronDown, BiPlus, BiWallet } from "react-icons/bi";
import { AddRecordForm } from "../components/AddRecordForm";
import { DataTable } from "../components/DataTable";
import { Dropdown, DropdownItem } from "../components/Dropdown";
import { LeftDrawer } from "../components/LeftDrawer";
import { MonthlyYearlyTable } from "../components/MonthlyYearlyTable";
import { PageLayout } from "../components/PageLayout";
import { PendingRecurrences } from "../components/PendingRecurrences";
import { useDisclosure } from "../hooks/useDisclosure";
import { Categories } from "../localStorage/categories";
import { Expenses } from "../localStorage/expenses";
import { Settings } from "../localStorage/settings";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { ViewMode } from "../utils/consts";
import {
  type LocalTime,
  genLocalTime,
  getDate,
  getMaxDate,
  getMonth,
  getYear,
  localDateToUtcDate,
  localTimeToLocalDate,
  localTimeToUnix,
  newLocalDate,
  unixToLocalTime,
} from "../utils/time";

export function DataTableView() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Monthly);
  const [year, setYear] = useState<number>(getYear());
  const [month, setMonth] = useState<number>(getMonth());
  const [wallet, setWallet] = useState<Wallets.Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [categories, setCategories] = useState<Categories.Category[]>([]);
  const [expenses, setExpenses] = useState<Expenses.Expense[]>(
    Expenses.readAll(),
  );
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
    }),
  );
  const [customEndTime, setCustomEndTime] = useState<Date>(new Date());
  const [searchString, setSearchString] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [recurrenceChecked, setRecurrenceChecked] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const onRecurrenceDone = useCallback(() => {
    setRecurrenceChecked(true);
    setExpenses(Expenses.readAll());
  }, []);

  useEffect(() => {
    openDb();
    setWallets(Wallets.readAll());
    setCategories(Categories.readAll());
  }, []);

  useEffect(() => {
    if (!wallets.length) return;
    if (settings.defaultViewMode) setViewMode(settings.defaultViewMode);
    if (settings.defaultWallet) {
      const result = Wallets.readById(settings.defaultWallet);
      if (result) {
        setWallet(result);
        return;
      }
    }
    setWallet(wallets[0]);
  }, [wallets, settings]);

  const walletId = wallet?.id;

  const displayData = useMemo(() => {
    if (!expenses || !categories) {
      return;
    }
    if (viewMode === ViewMode.Search) {
      if (!searchString && !categoryId) {
        return;
      }
      return Expenses.search(expenses, walletId, categoryId, searchString);
    }
    let startTime: LocalTime;
    let endTime: LocalTime;
    let maxDate: number;
    const today = genLocalTime();
    switch (viewMode) {
      case ViewMode.Today:
        startTime = {
          year: today.year,
          month: today.month,
          day: today.day,
          hour: 0,
          minute: 0,
          second: 0,
          milli: 0,
        };
        endTime = {
          year: today.year,
          month: today.month,
          day: today.day,
          hour: 23,
          minute: 59,
          second: 59,
          milli: 999,
        };
        break;
      case ViewMode.Daily:
        startTime = {
          year: year,
          month: month,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          milli: 0,
        };
        endTime = {
          year: month + 1 > 12 ? year + 1 : year,
          month: month + 1 > 12 ? 1 : month + 1,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          milli: 0,
        };
        break;
      case ViewMode.Monthly:
        startTime = {
          year: year,
          month: 1,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          milli: 0,
        };
        endTime = {
          year: year + 1,
          month: 1,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          milli: 0,
        };
        break;
      case ViewMode.Custom:
        maxDate = getMaxDate(
          customStartTime.getFullYear(),
          customStartTime.getMonth() + 1,
        );
        startTime = {
          year: customStartTime.getFullYear(),
          month: customStartTime.getMonth() + 1,
          day: customStartTime.getDate(),
          hour: 0,
          minute: 0,
          second: 0,
          milli: 0,
        };
        endTime = {
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
            customEndTime.getDate() + 1 > maxDate
              ? 1
              : customEndTime.getDate() + 1,
          hour: 0,
          minute: 0,
          second: 0,
          milli: 0,
        };
        break;
      default:
        startTime = {
          year: 0,
          month: 0,
          day: 0,
          hour: 0,
          minute: 0,
          second: 0,
          milli: 0,
        };
        endTime = {
          year: 9999,
          month: 0,
          day: 0,
          hour: 0,
          minute: 0,
          second: 0,
          milli: 0,
        };
        break;
    }
    const results = Expenses.readRange(
      expenses,
      localTimeToUnix(startTime),
      localTimeToUnix(endTime),
      walletId,
    );
    if (viewMode === ViewMode.Custom && maxAmount !== null && maxAmount > 0) {
      return results.filter((e) => e.amount <= maxAmount);
    }
    return results;
  }, [
    viewMode,
    walletId,
    expenses,
    categories,
    categoryId,
    maxAmount,
    searchString,
    year,
    month,
    customStartTime,
    customEndTime,
  ]);

  const amountPerX = useMemo<{ name: string; amount: number } | null>(() => {
    if (!displayData || displayData.length === 0) {
      return null;
    }
    let total = 0;
    let minDay = 31;
    let maxDay = 1;
    let minMonth = 12;
    let maxMonth = 1;
    let minYear = 9999;
    for (const data of displayData) {
      total += data.amount;
      const localTime = unixToLocalTime(data.timestamp);
      minDay = Math.min(minDay, localTime.day);
      maxDay = Math.max(maxDay, localTime.day);
      minMonth = Math.min(minMonth, localTime.month);
      maxMonth = Math.max(maxMonth, localTime.month);
      minYear = Math.min(minYear, localTime.year);
    }
    let divide = 0;
    let name = "";
    const currentDate = genLocalTime();
    switch (viewMode) {
      case ViewMode.Today: {
        return null;
      }
      case ViewMode.Daily: {
        name = "day";
        if (currentDate.year === year && currentDate.month === month) {
          divide = currentDate.day;
        } else {
          divide = maxDay - minDay + 1;
        }
        break;
      }
      case ViewMode.Monthly: {
        name = "month";
        if (currentDate.year === year) {
          divide = currentDate.month - minMonth + 1;
        } else {
          divide = maxMonth - minMonth + 1;
        }
        break;
      }
      case ViewMode.Yearly: {
        name = "year";
        divide = currentDate.year - minYear + 1;
        break;
      }
      case ViewMode.Custom: {
        name = "day";
        divide =
          Math.round(
            (customEndTime.getTime() - customStartTime.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1;
        break;
      }
      case ViewMode.Search: {
        return null;
      }
      default: {
        return null;
      }
    }
    if (divide <= 0) {
      return null;
    }
    return { name: name, amount: Math.round((total / divide) * 100) / 100 };
  }, [displayData, viewMode, month, year, customStartTime, customEndTime]);

  return (
    <PageLayout>
      {!recurrenceChecked && <PendingRecurrences onDone={onRecurrenceDone} />}
      {isOpen && wallet && (
        <AddRecordForm
          categories={categories}
          wallet={wallet}
          setExpenses={setExpenses}
          year={year}
          month={month}
          day={getDate()}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
        />
      )}
      <div
        id="first-lane"
        className="flex-row-space no-space mb-sm flex-wrap flex-wrap-third"
      >
        <div className="flex-row-space gap-sm no-space">
          <LeftDrawer />
          {wallet && (
            <button type="button" className="btn btn-green" onClick={onOpen}>
              <BiPlus />
              Add
            </button>
          )}
        </div>
        <h2 className="page-title">Expenses</h2>
        <div className="flex-row-space gap-sm no-space">
          <Dropdown
            trigger={
              <button type="button" className="btn">
                <BiCalendar />
                {viewMode}
                <BiChevronDown />
              </button>
            }
          >
            <DropdownItem onClick={() => setViewMode(ViewMode.Today)}>
              {ViewMode.Today}
            </DropdownItem>
            <DropdownItem onClick={() => setViewMode(ViewMode.Daily)}>
              {ViewMode.Daily}
            </DropdownItem>
            <DropdownItem onClick={() => setViewMode(ViewMode.Monthly)}>
              {ViewMode.Monthly}
            </DropdownItem>
            <DropdownItem onClick={() => setViewMode(ViewMode.Yearly)}>
              {ViewMode.Yearly}
            </DropdownItem>
            <DropdownItem onClick={() => setViewMode(ViewMode.Custom)}>
              {ViewMode.Custom}
            </DropdownItem>
            <DropdownItem onClick={() => setViewMode(ViewMode.Search)}>
              {ViewMode.Search}
            </DropdownItem>
          </Dropdown>

          <Dropdown
            align="right"
            trigger={
              <button type="button" className="btn">
                <BiWallet />
                {wallet ? wallet.name : "All"}
                <BiChevronDown />
              </button>
            }
          >
            <DropdownItem onClick={() => setWallet(null)}>All</DropdownItem>
            {wallets.map((w) => (
              <DropdownItem
                key={w.id}
                onClick={() => {
                  const result = Wallets.readById(w.id);
                  if (result) setWallet(result);
                }}
              >
                {w.name}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>
      <div
        id="second-lane"
        className="flex-row-space no-space gap-sm flex-wrap"
      >
        {(viewMode === ViewMode.Monthly || viewMode === ViewMode.Daily) && (
          <select
            className="input"
            onChange={(event) => {
              setYear(Number.parseInt(event.target.value));
            }}
            value={year}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i.toString()} value={getYear() - i}>
                {getYear() - i}
              </option>
            ))}
          </select>
        )}
        {viewMode === ViewMode.Daily && (
          <select
            className="input"
            onChange={(event) => {
              setMonth(Number.parseInt(event.target.value));
            }}
            value={month}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i.toString()} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        )}
        {viewMode === ViewMode.Custom && (
          <>
            <input
              id="startDate"
              type="date"
              className="input"
              value={localDateToUtcDate(customStartTime)
                .toISOString()
                .slice(0, 10)}
              onChange={(event) => {
                setCustomStartTime(newLocalDate(event.target.value));
              }}
            />
            <input
              id="endDate"
              type="date"
              className="input"
              value={localDateToUtcDate(customEndTime)
                .toISOString()
                .slice(0, 10)}
              onChange={(event) => {
                setCustomEndTime(newLocalDate(event.target.value));
              }}
            />
            <input
              type="number"
              className="input"
              placeholder="Max amount"
              value={maxAmount ?? ""}
              onChange={(event) => {
                const val = event.target.value;
                setMaxAmount(val === "" ? null : Number.parseFloat(val));
              }}
            />
          </>
        )}
        {viewMode === ViewMode.Search && (
          <>
            <input
              id="searchString"
              type="text"
              className="input"
              value={searchString}
              onChange={(event) => {
                setSearchString(event.target.value);
              }}
            />
            <select
              className="input"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
              }}
            >
              <option value="">-</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      {wallet && (
        <div
          style={{
            margin: "0.5rem",
            height: "fit-content",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ margin: 0 }}>
            {"Total: "}
            {wallet.currency && `${wallet.currency} `}
            {displayData
              ? Math.round(
                  displayData.reduce((acc, cur) => acc + cur.amount, 0) * 100,
                ) / 100
              : 0}
          </span>
          {amountPerX && (
            <span style={{ margin: 0 }}>
              {`Per ${amountPerX.name}: `}
              {wallet.currency && `${wallet.currency} `}
              {amountPerX.amount}
            </span>
          )}
        </div>
      )}
      <hr />
      {(viewMode === ViewMode.Today ||
        viewMode === ViewMode.Daily ||
        viewMode === ViewMode.Custom ||
        viewMode === ViewMode.Search) &&
        displayData && (
          <DataTable
            displayData={displayData}
            categories={categories}
            wallet={wallet}
            wallets={wallets}
            setExpenses={setExpenses}
            viewMode={viewMode}
          />
        )}
      {(viewMode === ViewMode.Monthly || viewMode === ViewMode.Yearly) &&
        displayData && (
          <MonthlyYearlyTable
            isMonthly={viewMode === ViewMode.Monthly}
            displayData={displayData}
            wallet={wallet}
          />
        )}
    </PageLayout>
  );
}
