import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BiChevronDown, BiChevronUp, BiMenu } from "react-icons/bi";
import { useDisclosure } from "../hooks/useDisclosure";
import { Categories } from "../localStorage/categories";
import { Expenses } from "../localStorage/expenses";
import { Settings } from "../localStorage/settings";
import type { Wallets } from "../localStorage/wallets";
import { SortMode, ViewMode } from "../utils/consts";
import { localTimeToString, unixToLocalTime } from "../utils/time";
import { AddRecordForm } from "./AddRecordForm";
import { Dropdown, DropdownItem } from "./Dropdown";

type DisplayData = {
  id: string;
  date: string;
  category: Categories.Category;
  description: string;
  amount: number;
  currency: string;
};

export function DataTable({
  displayData: expenses,
  categories,
  wallet,
  wallets,
  setExpenses,
  viewMode,
}: {
  displayData: Expenses.Expense[];
  categories: Categories.Category[];
  wallet: Wallets.Wallet | null;
  wallets: Wallets.Wallet[];
  setExpenses: Dispatch<SetStateAction<Expenses.Expense[]>>;
  viewMode: ViewMode;
}) {
  const [data, setData] = useState<DisplayData[]>([]);
  const [settings] = useState<Settings.Settings>(Settings.read());
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentExpenseId, setCurrentExpenseId] = useState<string>(
    expenses[0]?.id ?? "",
  );
  const [sortMode, setSortMode] = useState<SortMode>(SortMode.DateDesc);
  const dateSet = new Set();

  const transformed = useMemo(() => {
    function transformData(expenses: Expenses.Expense[]): DisplayData[] {
      return expenses.map((expense, i) => {
        return {
          id: expense.id ?? i.toString(),
          date: localTimeToString(
            unixToLocalTime(expense.timestamp),
            viewMode,
            settings.displayFullDate,
          ),
          category:
            categories.find((category) => category.id === expense.categoryId) ??
            Categories.defaultCategory,
          description: expense.description ?? "",
          amount: expense.amount,
          currency:
            wallets.find((w) => w.id === expense.walletId)?.currency ?? "",
        };
      });
    }

    expenses.sort((a, b) =>
      Number(a.timestamp) > Number(b.timestamp) ? -1 : 1,
    );
    const dateDesc = transformData(expenses);
    expenses.sort((a, b) =>
      Number(a.timestamp) < Number(b.timestamp) ? -1 : 1,
    );
    const dateAsc = transformData(expenses);
    expenses.sort((a, b) => (Number(a.amount) > Number(b.amount) ? -1 : 1));
    const amountDesc = transformData(expenses);
    expenses.sort((a, b) => (Number(a.amount) < Number(b.amount) ? -1 : 1));
    const amountAsc = transformData(expenses);
    return {
      dateDesc,
      dateAsc,
      amountDesc,
      amountAsc,
    };
  }, [expenses, viewMode, categories, settings, wallets]);

  useEffect(() => {
    dateSet.clear();
    switch (sortMode) {
      case SortMode.DateDesc:
        setData(transformed.dateDesc);
        break;
      case SortMode.DateAsc:
        setData(transformed.dateAsc);
        break;
      case SortMode.AmountDesc:
        setData(transformed.amountDesc);
        break;
      case SortMode.AmountAsc:
        setData(transformed.amountAsc);
        break;
      default:
        break;
    }
  }, [dateSet, sortMode, transformed]);

  return (
    <>
      {isOpen && (
        <AddRecordForm
          categories={categories}
          wallet={wallet}
          setExpenses={setExpenses}
          year={0}
          month={0}
          day={0}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          idValue={currentExpenseId}
        />
      )}
      <div className="scroll-area">
        <table>
          <thead>
            <tr>
              {settings.displayDate && (
                <th
                  onClick={() => {
                    setSortMode(
                      sortMode === SortMode.DateDesc
                        ? SortMode.DateAsc
                        : SortMode.DateDesc,
                    );
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <span
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
                    {viewMode === ViewMode.Monthly ? "Month" : "Date"}
                    {sortMode === SortMode.DateDesc && <BiChevronDown />}
                    {sortMode === SortMode.DateAsc && <BiChevronUp />}
                  </span>
                </th>
              )}
              <th>Description</th>
              <th
                onClick={() => {
                  setSortMode(
                    sortMode === SortMode.AmountDesc
                      ? SortMode.AmountAsc
                      : SortMode.AmountDesc,
                  );
                }}
                style={{ cursor: "pointer" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  Amount
                  {sortMode === SortMode.AmountDesc && <BiChevronDown />}
                  {sortMode === SortMode.AmountAsc && <BiChevronUp />}
                </span>
              </th>
              <th>Category</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const hasTheDate = dateSet.has(d.date);
              if (
                settings.combineDate &&
                (sortMode === SortMode.DateAsc ||
                  sortMode === SortMode.DateDesc)
              ) {
                dateSet.add(d.date);
              }
              return (
                <tr key={d.id}>
                  {settings.displayDate && <td>{!hasTheDate ? d.date : ""}</td>}
                  <td style={{ whiteSpace: "normal" }}>{d.description}</td>
                  <td>
                    {(wallet
                      ? settings.displayCurrency && `${wallet.currency} `
                      : `${d.currency} `) || ""}
                    {Math.round(d.amount * 100) / 100}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{ backgroundColor: d.category.color }}
                    >
                      {d.category.name}
                    </span>
                  </td>
                  <td>
                    <Dropdown
                      align="right"
                      trigger={
                        <button
                          type="button"
                          className="btn-icon"
                          aria-label="Options"
                        >
                          <BiMenu />
                        </button>
                      }
                    >
                      <DropdownItem
                        onClick={() => {
                          setCurrentExpenseId(d.id);
                          onOpen();
                        }}
                      >
                        Edit
                      </DropdownItem>
                      <DropdownItem
                        style={{ color: "#ee0000" }}
                        onClick={() => {
                          Expenses.remove(d.id);
                          setExpenses(Expenses.readAll());
                        }}
                      >
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
