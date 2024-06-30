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
import { ViewMode } from "../utils/consts";
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

  // get data
  useEffect(() => {
    if (!db) {
      return;
    }
    if (!wallet) {
      return;
    }
    let startTime: LocalTime;
    let endTime: LocalTime;
    const maxDate = getMaxDate(year, month);
    switch (viewMode) {
      case ViewMode.Daily:
        setTitle(`${year}-${month}-${date}`);
        startTime = {
          year: year,
          month: month,
          date: date,
          hour: 0,
          minute: 0,
          second: 0,
        };
        endTime = {
          year: date + 1 > maxDate && month + 1 > 12 ? year + 1 : year,
          month: date + 1 > maxDate ? (month + 1 > 12 ? 1 : month + 1) : month,
          date: date + 1 > maxDate ? 1 : date + 1,
          hour: 0,
          minute: 0,
          second: 0,
        };
        break;
      case ViewMode.Monthly:
        setTitle(`${year}-${month}`);
        // the start of this month
        startTime = {
          year: year,
          month: month,
          date: 1,
          hour: 0,
          minute: 0,
          second: 0,
        };
        // the start of the next month
        endTime = {
          year: month + 1 > 12 ? year + 1 : year,
          month: month + 1 > 12 ? 1 : month + 1,
          date: 1,
          hour: 0,
          minute: 0,
          second: 0,
        };
        break;
      case ViewMode.Yearly:
        setTitle(`${year}`);
        startTime = {
          year: year,
          month: 1,
          date: 1,
          hour: 0,
          minute: 0,
          second: 0,
        };
        endTime = {
          year: year + 1,
          month: 1,
          date: 1,
          hour: 0,
          minute: 0,
          second: 0,
        };
        break;
      default:
        setTitle("All Time");
        startTime = {
          year: 0,
          month: 0,
          date: 0,
          hour: 0,
          minute: 0,
          second: 0,
        };
        endTime = {
          year: 9999,
          month: 0,
          date: 0,
          hour: 0,
          minute: 0,
          second: 0,
        };
        break;
    }
    Expenses.read(
      db,
      localTimeToUnix(startTime),
      localTimeToUnix(endTime),
      wallet.id,
      setExpenses
    );
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
      {(viewMode === ViewMode.Monthly || viewMode === ViewMode.Daily) && (
        <DataTable
          displayDate={viewMode === ViewMode.Daily}
          expenses={expenses}
          categories={categories}
        />
      )}
      {(viewMode === ViewMode.Yearly || viewMode === ViewMode.AllTime) && (
        <MonthlyYearlyTable
          isMonthly={viewMode === ViewMode.Yearly}
          expenses={expenses}
        />
      )}
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
  expenses,
  categories,
}: {
  displayDate?: boolean;
  expenses: Expenses.Expense[];
  categories: Categories.Category[];
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
                <Td>{d.category?.name}</Td>
                <Td>{d.description}</Td>
                <Td>{d.amount}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

type MonthlyYearlyData = {
  date: string;
  amount: number;
};

function MonthlyYearlyTable({
  isMonthly,
  expenses,
}: {
  isMonthly?: boolean;
  expenses: Expenses.Expense[];
}) {
  const data = transformData(expenses);

  function transformData(expenses: Expenses.Expense[]): MonthlyYearlyData[] {
    // @ts-ignore
    const grouped = Object.groupBy(expenses, (expense) => {
      const time = unixToLocalTime(expense.timestamp);
      return isMonthly ? time.month : time.year;
    });
    return Array.from(Object.keys(grouped))
      .sort()
      .map((key: string) => {
        return {
          date: key,
          amount: grouped[key].reduce(
            (acc: number, cur: Pick<Expenses.Expense, "amount">) =>
              acc + cur.amount,
            0
          ),
        };
      });
  }

  return (
    <TableContainer paddingTop={"0.5rem"}>
      <Table>
        <Thead>
          <Tr>
            {isMonthly && <Th>Month</Th>}
            {!isMonthly && <Th>Year</Th>}
            <Th>Amount</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((d) => {
            return (
              <Tr key={d.date}>
                <Td>{d.date}</Td>
                <Td>{d.amount}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
