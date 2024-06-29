import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BiCalendar, BiWallet } from "react-icons/bi";
import { AddRecord } from "../components/AddRecord";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { dbContext } from "../contexts/Db";
import { Categories } from "../db/categories";
import { Expenses } from "../db/expenses";
import { openDb } from "../db/shared";
import { Wallets } from "../db/wallets";
import { ViewMode, iconMap } from "../utils/consts";
import {
  LocalTime,
  getDate,
  getMaxDate,
  getMonth,
  getUnix,
  getYear,
  localTimeToString,
  localTimeToUnix,
  unixToLocalTime,
} from "../utils/time";

type MonthlyExpense = {
  month: number;
  amount: number;
};

type YearlyExpense = {
  year: number;
  amount: number;
};

export function DataView() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Monthly);
  const [title, setTitle] = useState<string>(`${getYear()}-${getMonth()}`);
  const [year, setYear] = useState<number>(getYear());
  const [month, setMonth] = useState<number>(getMonth());
  const [date, setDate] = useState<number>(getDate);
  const [db, setDb] = useContext(dbContext)!;
  const [wallet, setWallet] = useState<Wallets.Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [categories, setCategories] = useState<Categories.Category[]>([]);
  const [expenses, setExpenses] = useState<Expenses.Expense[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [yearlyExpense, setYearlyExpenses] = useState<MonthlyExpense[]>([]);
  const [refresh, setRefresh] = useState<number>(0);

  useEffect(() => {
    if (!db) {
      openDb()
        .then((db) => {
          setDb(db);
        })
        .catch((e) => console.log(e));
    } else {
      Wallets.read(db, setWallets);
      Categories.read(db, setCategories);
    }
  }, [db]);

  useEffect(() => {
    if (wallets.length) {
      setWallet(wallets[0]);
    }
  }, [wallets]);

  useEffect(() => {
    switch (viewMode) {
      case ViewMode.Daily:
        setTitle(`${year}-${month}-${date}`);
        break;
      case ViewMode.Monthly:
        setTitle(`${year}-${month}`);
        break;
      case ViewMode.Yearly:
        setTitle(`${year}`);
        break;
      case ViewMode.AllTime:
        setTitle("All Time");
        break;
    }
  }, [viewMode, year, month, date]);

  // get data
  useEffect(() => {
    if (!db) {
      return;
    }
    if (!wallet) {
      return;
    }
    const timeNow = getUnix();
    switch (viewMode) {
      case ViewMode.Daily:
        break;
      case ViewMode.Monthly:
        // the start of this month
        const startTime: LocalTime = {
          year: year,
          month: month,
          date: 1,
          hour: 0,
          minute: 0,
          second: 0,
        };
        // the start of the next month
        const endTime: LocalTime = {
          year: month + 1 > 12 ? year + 1 : year,
          month: month + 1 > 12 ? 1 : month + 1,
          date: 1,
          hour: 0,
          minute: 0,
          second: 0,
        };
        Expenses.read(
          db,
          localTimeToUnix(startTime),
          localTimeToUnix(endTime),
          wallet.id,
          setExpenses
        );
        break;
      case ViewMode.Yearly:
        break;
      case ViewMode.AllTime:
        Expenses.read(db, 0, timeNow, wallet.id, setExpenses);
        break;
      default:
        break;
    }
  }, [refresh, viewMode, wallet, year, month, date]);

  return (
    <PageLayout>
      <div
        id="first-lane"
        className="flex-row-space no-space mb-sm flex-wrap flex-wrap-third"
      >
        <div className={"flex-row-space gap-sm no-space"}>
          <LeftDrawer />
          {(viewMode === ViewMode.Daily || viewMode === ViewMode.Monthly) && (
            <AddRecordForm
              db={db}
              categories={categories}
              wallet={wallet}
              setRefresh={setRefresh}
            />
          )}
        </div>
        <Heading padding={0} margin={0} fontSize={24}>
          {title}
        </Heading>
        <div className="flex-row-space gap-sm no-space">
          <Menu>
            <MenuButton
              as={Button}
              leftIcon={<BiCalendar />}
              rightIcon={<ChevronDownIcon />}
            >
              {viewMode}
            </MenuButton>
            <MenuList>
              <MenuItem
                onClick={() => {
                  setViewMode(ViewMode.Daily);
                }}
              >
                {ViewMode.Daily}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setViewMode(ViewMode.Monthly);
                }}
              >
                {ViewMode.Monthly}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setViewMode(ViewMode.Yearly);
                }}
              >
                {ViewMode.Yearly}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setViewMode(ViewMode.AllTime);
                }}
              >
                {ViewMode.AllTime}
              </MenuItem>
            </MenuList>
          </Menu>

          <Menu>
            <MenuButton
              as={Button}
              leftIcon={<BiWallet />}
              rightIcon={<ChevronDownIcon />}
            >
              {wallets.length
                ? wallets.find((w) => {
                    w.id === wallet?.id;
                  })?.name ?? wallets[0].name
                : ""}
            </MenuButton>
            <MenuList>
              {wallets.map((wallet) => {
                return (
                  <MenuItem
                    key={wallet.id}
                    onClick={() => {
                      if (db) {
                        Wallets.readById(db, wallet.id, setWallet);
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
        {viewMode !== ViewMode.AllTime && (
          <Select
            onChange={(event) => {
              setYear(parseInt(event.target.value));
            }}
            value={year}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={getYear() - i}>
                {getYear() - i}
              </option>
            ))}
          </Select>
        )}
        {(viewMode === ViewMode.Monthly || viewMode === ViewMode.Daily) && (
          <Select
            onChange={(event) => {
              setMonth(parseInt(event.target.value));
            }}
            value={month}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Select>
        )}

        {viewMode === ViewMode.Daily && (
          <Select
            onChange={(event) => {
              setDate(parseInt(event.target.value));
            }}
            value={date}
          >
            {Array.from({ length: getMaxDate(year, month) }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Select>
        )}
      </div>
      <Box margin={"0.5rem"} height={"fit-content"}>
        <Text margin={0}>
          {`Total: ${expenses?.reduce((acc, cur) => acc + cur.amount, 0)}`}
        </Text>
      </Box>
      <Divider />
      <DataTable
        displayDate={viewMode === ViewMode.Daily}
        expenses={expenses}
        categories={categories}
        wallet={wallet}
      />
    </PageLayout>
  );
}

function AddRecordForm({
  db,
  categories,
  wallet,
  setRefresh,
}: {
  db: IDBDatabase | null;
  categories: Categories.Category[];
  wallet: Wallets.Wallet | null;
  setRefresh: Dispatch<SetStateAction<number>>;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const amountRef = useRef<HTMLInputElement>(null);
  const [amountError, setAmountError] = useState<boolean>(false);
  const descriptionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categories.length) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  return (
    <AddRecord
      submit={() => {
        if (!amountRef.current || !amountRef.current.value) {
          setAmountError(true);
          return false;
        }
        if (isNaN(parseFloat(amountRef.current.value))) {
          setAmountError(true);
          return false;
        }
        if (!db || !wallet) {
          return false;
        }
        Expenses.write(db, {
          amount: parseFloat(amountRef.current.value),
          categoryId: categoryId,
          walletId: wallet.id,
          timestamp: Date.now(),
          description: descriptionRef.current?.value ?? "",
        })
          .then(() => setRefresh((prev) => prev + 1))
          .catch((e) => {
            console.log(e);
          });
        return true;
      }}
      title={"Add Record"}
    >
      <FormControl>
        <FormLabel>Category</FormLabel>
        <Select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
          }}
        >
          {categories.map((category) => {
            return (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            );
          })}
        </Select>
        <FormLabel>Amount</FormLabel>
        <Input type="number" ref={amountRef} />
        {amountError && <FormErrorMessage>Invalid amount</FormErrorMessage>}
        <FormLabel>Description (Optional)</FormLabel>
        <Input type="text" ref={descriptionRef} />
      </FormControl>
    </AddRecord>
  );
}

type DisplayData = {
  id: string;
  date: string;
  category: Categories.Category | null;
  description: string;
  amount: number;
};

function DataTable({
  displayDate,
  displayCurrency,
  expenses,
  categories,
  wallet,
}: {
  displayDate?: boolean;
  displayCurrency?: boolean;
  expenses: Expenses.Expense[];
  categories: Categories.Category[];
  wallet: Wallets.Wallet | null;
}) {
  const data = transformData(expenses);

  function transformData(expenses: Expenses.Expense[]): DisplayData[] {
    return expenses.map((expense, i) => {
      return {
        id: expense.id ?? i.toString(),
        date: localTimeToString(unixToLocalTime(expense.timestamp)),
        category:
          categories.find((category) => category.id === expense.categoryId) ??
          null,
        description: expense.description ?? "",
        amount: expense.amount,
      };
    });
  }
  displayDate = true;

  return (
    <TableContainer paddingTop={"0.5rem"}>
      <Table>
        <Thead>
          <Tr>
            {displayDate && <Th>Date</Th>}
            <Th>Category</Th>
            <Th>Description</Th>
            <Th>Amount</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((d) => {
            return (
              <Tr key={d.id}>
                {displayDate && <Td>{d.date}</Td>}
                <Td className="flex align-center gap-sm">
                  {d.category && iconMap[d.category.icon]}
                  {d.category?.name}
                </Td>
                <Td>{d.description}</Td>
                <Td>
                  {displayCurrency && wallet?.currency}
                  {d.amount}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
