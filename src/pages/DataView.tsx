import { ChevronDownIcon, HamburgerIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  IconButton,
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
  useDisclosure,
} from "@chakra-ui/react";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { BiCalendar, BiPlus, BiWallet } from "react-icons/bi";
import { Dialog } from "../components/Dialog";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { dbContext } from "../contexts/Db";
import { Categories } from "../db/categories";
import { Expenses } from "../db/expenses";
import { Settings } from "../db/settings";
import { openDb } from "../db/shared";
import { Wallets } from "../db/wallets";
import { ViewMode } from "../utils/consts";
import {
  LocalTime,
  genLocalTime,
  getDate,
  getMaxDate,
  getMonth,
  getYear,
  localTimeToInputString,
  localTimeToString,
  localTimeToUnix,
  unixToLocalTime,
} from "../utils/time";
import { getUuid } from "../utils/utils";

export function DataView() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Monthly);
  const [title, setTitle] = useState<string>(`${getYear()}-${getMonth()}`);
  const [year, setYear] = useState<number>(getYear());
  const [month, setMonth] = useState<number>(getMonth());
  const [day, setDay] = useState<number>(getDate());
  const [db, setDb] = useContext(dbContext)!;
  const [wallet, setWallet] = useState<Wallets.Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [categories, setCategories] = useState<Categories.Category[]>([]);
  const [expenses, setExpenses] = useState<Expenses.Expense[]>([]);
  const [refresh, setRefresh] = useState<number>(0);
  const [settings] = useState<Settings.Settings>(Settings.read());

  const { isOpen, onOpen, onClose } = useDisclosure(); // for dialog

  useEffect(() => {
    if (!db) {
      openDb()
        .then((db) => {
          setDb(db);
        })
        .catch((e) => console.error(e));
    } else {
      Wallets.readAll(db, setWallets);
      Categories.readAll(db, setCategories);
    }
  }, [db]);

  useEffect(() => {
    if (wallets.length) {
      setWallet(wallets[0]);
    }
  }, [wallets]);

  useEffect(() => {
    if (settings.defaultViewMode) setViewMode(settings.defaultViewMode);
    if (settings.defaultWallet && db) {
      Wallets.readById(db, settings.defaultWallet)
        .then((result) => {
          setWallet(result);
        })
        .catch((e) => console.error(e));
    }
  }, [db, settings]);

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
        setTitle(`${year}-${month}-${day}`);
        startTime = {
          year: year,
          month: month,
          day: day,
          hour: 0,
          minute: 0,
          second: 0,
        };
        endTime = {
          year: day + 1 > maxDate && month + 1 > 12 ? year + 1 : year,
          month: day + 1 > maxDate ? (month + 1 > 12 ? 1 : month + 1) : month,
          day: day + 1 > maxDate ? 1 : day + 1,
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
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
        };
        // the start of the next month
        endTime = {
          year: month + 1 > 12 ? year + 1 : year,
          month: month + 1 > 12 ? 1 : month + 1,
          day: 1,
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
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
        };
        endTime = {
          year: year + 1,
          month: 1,
          day: 1,
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
          day: 0,
          hour: 0,
          minute: 0,
          second: 0,
        };
        endTime = {
          year: 9999,
          month: 0,
          day: 0,
          hour: 0,
          minute: 0,
          second: 0,
        };
        break;
    }
    Expenses.readAll(
      db,
      localTimeToUnix(startTime),
      localTimeToUnix(endTime),
      wallet.id,
      setExpenses
    );
  }, [refresh, viewMode, wallet, year, month, day]);

  return (
    <PageLayout>
      <div
        id="first-lane"
        className="flex-row-space no-space mb-sm flex-wrap flex-wrap-third"
      >
        <div className={"flex-row-space gap-sm no-space"}>
          <LeftDrawer />
          <Button leftIcon={<BiPlus />} bgColor={"green.100"} onClick={onOpen}>
            Add
          </Button>
          <AddRecordForm
            db={db}
            categories={categories}
            wallet={wallet}
            setRefresh={setRefresh}
            year={year}
            month={month}
            day={day}
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
          />
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
              {wallet?.name ?? ""}
            </MenuButton>
            <MenuList>
              {wallets.map((wallet) => {
                return (
                  <MenuItem
                    key={wallet.id}
                    onClick={() => {
                      if (db) {
                        Wallets.readById(db, wallet.id)
                          .then((result) => {
                            setWallet(result);
                          })
                          .catch((e) => console.error(e));
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
              setDay(parseInt(event.target.value));
            }}
            value={day}
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
          {"Total: "}
          {wallet?.currency && `${wallet.currency} `}
          {expenses?.reduce((acc, cur) => acc + cur.amount, 0)}
        </Text>
      </Box>
      <Divider />
      {(viewMode === ViewMode.Monthly || viewMode === ViewMode.Daily) && (
        <DataTable
          expenses={expenses}
          categories={categories}
          wallet={wallet}
          db={db}
          setRefresh={setRefresh}
        />
      )}
      {(viewMode === ViewMode.Yearly || viewMode === ViewMode.AllTime) && (
        <MonthlyYearlyTable
          isMonthly={viewMode === ViewMode.Yearly}
          expenses={expenses}
          wallet={wallet}
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
  year,
  month,
  day,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  db: IDBDatabase | null;
  categories: Categories.Category[];
  wallet: Wallets.Wallet | null;
  setRefresh: Dispatch<SetStateAction<number>>;
  year: number;
  month: number;
  day: number;
  isOpen: boolean; // for refreshing the component
  onOpen: () => void;
  onClose: () => void;
  idValue?: string;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [amountError, setAmountError] = useState<boolean>(false);
  const [date, setDate] = useState<number>(
    localTimeToUnix(genLocalTime(year, month, day))
  );
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    if (db && idValue) {
      Expenses.readById(db, idValue).then((result) => {
        setCategoryId(result.categoryId);
        setAmount(result.amount);
        setDate(result.timestamp);
        setDescription(result.description ?? "");
      });
    }
  }, [idValue]);

  useEffect(() => {
    if (categories.length) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  return (
    <Dialog
      submit={() => {
        if (!amount || isNaN(amount)) {
          setAmountError(true);
          return false;
        }
        if (!db || !wallet || !date) {
          return false;
        }
        Expenses.write(db, {
          id: idValue || getUuid(),
          amount: amount || 0,
          categoryId: categoryId,
          walletId: wallet.id,
          timestamp: date,
          description: description || "",
        })
          .then(() => setRefresh((prev) => prev + 1))
          .catch((e) => {
            console.error(e);
          });
        return true;
      }}
      title={"Add Record"}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    >
      <FormControl>
        <FormLabel>Date</FormLabel>
        <Input
          type="datetime-local"
          value={localTimeToInputString(unixToLocalTime(date))}
          onChange={(event) => {
            setDate(new Date(event.target.value).getTime());
          }}
        />
      </FormControl>
      <FormControl>
        <FormLabel mt={2}>Category</FormLabel>
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
      </FormControl>
      <FormControl isInvalid={amountError}>
        <FormLabel mt={2}>Amount</FormLabel>
        <Input
          type="number"
          value={amount || ""}
          onChange={(event) => {
            setAmount(parseFloat(event?.target?.value));
          }}
        />
        {amountError && <FormErrorMessage>Invalid amount</FormErrorMessage>}
      </FormControl>
      <FormControl>
        <FormLabel mt={2}>Description (Optional)</FormLabel>
        <Input
          type="text"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
          }}
        />
      </FormControl>
    </Dialog>
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
  expenses,
  categories,
  wallet,
  db,
  setRefresh,
}: {
  expenses: Expenses.Expense[];
  categories: Categories.Category[];
  wallet: Wallets.Wallet | null;
  db: IDBDatabase | null;
  setRefresh: Dispatch<SetStateAction<number>>;
}) {
  const data = transformData(expenses);
  const [settings] = useState<Settings.Settings>(Settings.read());
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentExpenseId, setCurrentExpenseId] = useState<string>(
    expenses[0]?.id ?? ""
  );

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

  return (
    <>
      <AddRecordForm
        db={db}
        categories={categories}
        wallet={wallet}
        setRefresh={setRefresh}
        year={0}
        month={0}
        day={0}
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        idValue={currentExpenseId}
      />
      <TableContainer padding={0} height={"100%"}>
        <Table>
          <Thead>
            <Tr>
              {settings.displayDate && <Th>Date</Th>}
              <Th>Amount</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((d) => {
              return (
                <Tr key={d.id}>
                  {settings.displayDate && <Td>{d.date}</Td>}
                  <Td>
                    {settings.displayCurrency &&
                      wallet?.currency &&
                      `${wallet.currency} `}
                    {d.amount}
                  </Td>
                  <Td>{d.description}</Td>
                  <Td>
                    <Badge bgColor={d.category?.color}>
                      {d.category?.name}
                    </Badge>
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<HamburgerIcon />}
                        aria-label="Options"
                      />
                      <MenuList>
                        <MenuItem
                          onClick={() => {
                            setCurrentExpenseId(d.id);
                            onOpen();
                          }}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          color={"#ee0000"}
                          onClick={() => {
                            if (db) {
                              Expenses.remove(db, d.id).then(() => {
                                setRefresh((prev) => prev + 1);
                              });
                            }
                          }}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}

type MonthlyYearlyData = {
  date: string;
  amount: number;
};

function MonthlyYearlyTable({
  isMonthly,
  expenses,
  wallet,
}: {
  isMonthly?: boolean;
  expenses: Expenses.Expense[];
  wallet: Wallets.Wallet | null;
}) {
  const data = transformData(expenses);
  const [settings] = useState<Settings.Settings>(Settings.read());

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
                <Td>
                  {settings.displayCurrency &&
                    wallet?.currency &&
                    `${wallet.currency} `}
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
