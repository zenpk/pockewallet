import { useCallback, useEffect, useMemo, useState } from "react";
import { BiCalendar, BiChevronDown, BiPlus, BiWallet } from "react-icons/bi";
import { AddRecordForm } from "../components/AddRecordForm";
import { DataTable } from "../components/DataTable";
import { DateRangeControls } from "../components/DateRangeControls";
import { Dropdown, DropdownItem } from "../components/Dropdown";
import { LeftDrawer } from "../components/LeftDrawer";
import { MonthlyYearlyTable } from "../components/MonthlyYearlyTable";
import { PageLayout } from "../components/PageLayout";
import { PendingRecurrences } from "../components/PendingRecurrences";
import { useDisclosure } from "../hooks/useDisclosure";
import { useViewMode } from "../hooks/useViewMode";
import { Categories } from "../localStorage/categories";
import { Expenses } from "../localStorage/expenses";
import { Settings } from "../localStorage/settings";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { ViewMode } from "../utils/consts";
import { genLocalTime, getDate, unixToLocalTime } from "../utils/time";

export function ExpensesView() {
  const vm = useViewMode();
  const [wallet, setWallet] = useState<Wallets.Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [categories, setCategories] = useState<Categories.Category[]>([]);
  const [expenses, setExpenses] = useState<Expenses.Expense[]>(
    Expenses.readAll(),
  );
  const [settings] = useState<Settings.Settings>(Settings.read());
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
    if (settings.defaultViewMode) vm.setViewMode(settings.defaultViewMode);
    if (settings.defaultWallet) {
      const result = Wallets.readById(settings.defaultWallet);
      if (result) {
        setWallet(result);
        return;
      }
    }
    setWallet(wallets[0]);
  }, [wallets, settings, vm.setViewMode]);

  const walletId = wallet?.id;

  const displayData = useMemo(() => {
    if (!expenses || !categories) {
      return;
    }
    if (vm.viewMode === ViewMode.Search) {
      if (!searchString && !categoryId) {
        return;
      }
      return Expenses.search(expenses, walletId, categoryId, searchString);
    }
    if (!vm.timeRange) return;
    const results = Expenses.readRange(
      expenses,
      vm.timeRange.startTime,
      vm.timeRange.endTime,
      walletId,
    );
    if (
      vm.viewMode === ViewMode.Custom &&
      maxAmount !== null &&
      maxAmount > 0
    ) {
      return results.filter((e) => e.amount <= maxAmount);
    }
    return results;
  }, [
    vm.viewMode,
    vm.timeRange,
    walletId,
    expenses,
    categories,
    categoryId,
    maxAmount,
    searchString,
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
    switch (vm.viewMode) {
      case ViewMode.Today: {
        return null;
      }
      case ViewMode.Daily: {
        name = "day";
        if (currentDate.year === vm.year && currentDate.month === vm.month) {
          divide = currentDate.day;
        } else {
          divide = maxDay - minDay + 1;
        }
        break;
      }
      case ViewMode.Monthly: {
        name = "month";
        if (currentDate.year === vm.year) {
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
            (vm.customEndTime.getTime() - vm.customStartTime.getTime()) /
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
  }, [
    displayData,
    vm.viewMode,
    vm.month,
    vm.year,
    vm.customStartTime,
    vm.customEndTime,
  ]);

  return (
    <PageLayout>
      {!recurrenceChecked && <PendingRecurrences onDone={onRecurrenceDone} />}
      {isOpen && wallet && (
        <AddRecordForm
          categories={categories}
          wallet={wallet}
          setExpenses={setExpenses}
          year={vm.year}
          month={vm.month}
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
                {vm.viewMode}
                <BiChevronDown />
              </button>
            }
          >
            <DropdownItem onClick={() => vm.setViewMode(ViewMode.Today)}>
              {ViewMode.Today}
            </DropdownItem>
            <DropdownItem onClick={() => vm.setViewMode(ViewMode.Daily)}>
              {ViewMode.Daily}
            </DropdownItem>
            <DropdownItem onClick={() => vm.setViewMode(ViewMode.Monthly)}>
              {ViewMode.Monthly}
            </DropdownItem>
            <DropdownItem onClick={() => vm.setViewMode(ViewMode.Yearly)}>
              {ViewMode.Yearly}
            </DropdownItem>
            <DropdownItem onClick={() => vm.setViewMode(ViewMode.Custom)}>
              {ViewMode.Custom}
            </DropdownItem>
            <DropdownItem onClick={() => vm.setViewMode(ViewMode.Search)}>
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
      <DateRangeControls {...vm}>
        {vm.viewMode === ViewMode.Custom && (
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
        )}
        {vm.viewMode === ViewMode.Search && (
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
      </DateRangeControls>
      {wallet && (
        <>
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
          <hr />
        </>
      )}
      {(vm.viewMode === ViewMode.Today ||
        vm.viewMode === ViewMode.Daily ||
        vm.viewMode === ViewMode.Custom ||
        vm.viewMode === ViewMode.Search) &&
        displayData && (
          <DataTable
            displayData={displayData}
            categories={categories}
            wallet={wallet}
            wallets={wallets}
            setExpenses={setExpenses}
            viewMode={vm.viewMode}
          />
        )}
      {(vm.viewMode === ViewMode.Monthly || vm.viewMode === ViewMode.Yearly) &&
        displayData && (
          <MonthlyYearlyTable
            isMonthly={vm.viewMode === ViewMode.Monthly}
            displayData={displayData}
            wallet={wallet}
          />
        )}
    </PageLayout>
  );
}
