import {
  ChevronDownIcon,
  ChevronUpIcon,
  HamburgerIcon,
} from "@chakra-ui/icons";
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
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BiCalendar, BiPlus, BiWallet } from "react-icons/bi";
import { Dialog } from "../components/Dialog";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { Categories } from "../localStorage/categories";
import { Expenses } from "../localStorage/expenses";
import { Settings } from "../localStorage/settings";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { SortMode, ViewMode } from "../utils/consts";
import {
  type LocalTime,
  genLocalTime,
  getDate,
  getMaxDate,
  getMonth,
  getYear,
  localDateToUtcDate,
  localTimeToInputString,
  localTimeToLocalDate,
  localTimeToString,
  localTimeToUnix,
  newLocalDate,
  unixToLocalTime,
} from "../utils/time";
import { getUuid } from "../utils/utils";

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

  const { isOpen, onOpen, onClose } = useDisclosure(); // for dialog

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
    if (settings.defaultViewMode) setViewMode(settings.defaultViewMode);
    if (settings.defaultWallet) {
      const result = Wallets.readById(settings.defaultWallet);
      if (result) {
        setWallet(result);
      }
    }
  }, [settings]);

  // get data
  const displayData = useMemo(() => {
    if (!wallet || !expenses || !categories) {
      return;
    }
    if (viewMode === ViewMode.Search) {
      if (!searchString && !categoryId) {
        return;
      }
      return Expenses.search(expenses, wallet.id, categoryId, searchString);
    }
    let startTime: LocalTime;
    let endTime: LocalTime;
    let maxDate: number;
    switch (viewMode) {
      case ViewMode.Daily:
        // the start of this month
        startTime = {
          year: year,
          month: month,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          milli: 0,
        };
        // the start of the next month
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
    return Expenses.readRange(
      expenses,
      localTimeToUnix(startTime),
      localTimeToUnix(endTime),
      wallet.id,
    );
  }, [
    viewMode,
    wallet,
    expenses,
    categories,
    categoryId,
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
      <div
        id="first-lane"
        className="flex-row-space no-space mb-sm flex-wrap flex-wrap-third"
      >
        <div className={"flex-row-space gap-sm no-space"}>
          <LeftDrawer />
          <Button leftIcon={<BiPlus />} bgColor={"green.100"} onClick={onOpen}>
            Add
          </Button>
          {isOpen && (
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
        </div>
        <Heading padding={0} margin={0} fontSize={24}>
          Expenses
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
                  setViewMode(ViewMode.Custom);
                }}
              >
                {ViewMode.Custom}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setViewMode(ViewMode.Search);
                }}
              >
                {ViewMode.Search}
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
        {(viewMode === ViewMode.Monthly || viewMode === ViewMode.Daily) && (
          <Select
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
          </Select>
        )}
        {viewMode === ViewMode.Daily && (
          <Select
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
          </Select>
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
            <Select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
              }}
            >
              {[
                <option key={""} value={""}>
                  -
                </option>,
                ...categories.map((category) => {
                  return (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  );
                }),
              ]}
            </Select>
          </>
        )}
      </div>
      <Box
        margin={"0.5rem"}
        height={"fit-content"}
        display={"flex"}
        justifyContent={"space-between"}
      >
        <Text margin={0}>
          {"Total: "}
          {wallet?.currency && `${wallet.currency} `}
          {displayData
            ? Math.round(
                displayData?.reduce((acc, cur) => acc + cur.amount, 0) * 100,
              ) / 100
            : 0}
        </Text>
        {amountPerX && (
          <Text margin={0}>
            {`Per ${amountPerX.name}: `}
            {wallet?.currency && `${wallet.currency} `}
            {amountPerX.amount}
          </Text>
        )}
      </Box>
      <Divider />
      {(viewMode === ViewMode.Daily ||
        viewMode === ViewMode.Custom ||
        viewMode === ViewMode.Search) &&
        displayData && (
          <DataTable
            displayData={displayData}
            categories={categories}
            wallet={wallet}
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

function AddRecordForm({
  categories,
  wallet,
  setExpenses,
  year,
  month,
  day,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  categories: Categories.Category[];
  wallet: Wallets.Wallet | null;
  setExpenses: Dispatch<SetStateAction<Expenses.Expense[]>>;
  year: number;
  month: number;
  day: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  idValue?: string;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [amountError, setAmountError] = useState<boolean>(false);
  const [date, setDate] = useState<number>(
    localTimeToUnix(genLocalTime(year, month, day)),
  );
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    setDate(localTimeToUnix(genLocalTime(year, month, day)));
  }, [year, month, day]);

  useEffect(() => {
    if (idValue) {
      const result = Expenses.readById(idValue);
      if (result) {
        setCategoryId(result.categoryId);
        setAmount(result.amount);
        setDate(result.timestamp);
        setDescription(result.description ?? "");
      } else {
        console.warn("No expense found with id: ", idValue);
      }
    }
  }, [idValue]);

  useEffect(() => {
    if (categories.length && !idValue) {
      setCategoryId(categories[0].id);
    }
  }, [categories, idValue]);

  return (
    <Dialog
      submit={() => {
        if (!amount || Number.isNaN(Number(amount))) {
          setAmountError(true);
          return false;
        }
        if (!wallet || !date) {
          return false;
        }
        Expenses.write({
          id: idValue || getUuid(),
          amount: amount || 0,
          categoryId: categoryId,
          walletId: wallet.id,
          timestamp: date,
          description: description || "",
        });
        setExpenses(Expenses.readAll());
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
      <FormControl isInvalid={amountError}>
        <FormLabel mt={2}>Amount</FormLabel>
        <Input
          type="number"
          value={amount || ""}
          onChange={(event) => {
            setAmount(Number.parseFloat(event?.target?.value));
          }}
        />
        {amountError && <FormErrorMessage>Invalid amount</FormErrorMessage>}
      </FormControl>
    </Dialog>
  );
}

type DisplayData = {
  id: string;
  date: string;
  category: Categories.Category;
  description: string;
  amount: number;
};

function DataTable({
  displayData: expenses,
  categories,
  wallet,
  setExpenses,
  viewMode,
}: {
  displayData: Expenses.Expense[];
  categories: Categories.Category[];
  wallet: Wallets.Wallet | null;
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
  }, [expenses, viewMode, categories, settings]);

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
      <TableContainer padding={0} height={"100%"} minHeight={"50vh"}>
        <Table>
          <Thead>
            <Tr>
              {settings.displayDate && (
                <Th
                  onClick={() => {
                    setSortMode(
                      sortMode === SortMode.DateDesc
                        ? SortMode.DateAsc
                        : SortMode.DateDesc,
                    );
                  }}
                  display={"flex"}
                  alignItems={"center"}
                >
                  <Text>
                    {viewMode === ViewMode.Monthly ? "Month" : "Date"}
                  </Text>
                  {sortMode === SortMode.DateDesc && <ChevronDownIcon />}
                  {sortMode === SortMode.DateAsc && <ChevronUpIcon />}
                </Th>
              )}
              <Th>Description</Th>
              <Th
                onClick={() => {
                  setSortMode(
                    sortMode === SortMode.AmountDesc
                      ? SortMode.AmountAsc
                      : SortMode.AmountDesc,
                  );
                }}
                display={"flex"}
                alignItems={"center"}
              >
                <Text>Amount</Text>
                {sortMode === SortMode.AmountDesc && <ChevronDownIcon />}
                {sortMode === SortMode.AmountAsc && <ChevronUpIcon />}
              </Th>
              <Th>Category</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
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
                <Tr key={d.id}>
                  {settings.displayDate && <Td>{!hasTheDate ? d.date : ""}</Td>}
                  <Td>{d.description}</Td>
                  <Td>
                    {settings.displayCurrency &&
                      wallet?.currency &&
                      `${wallet.currency} `}
                    {Math.round(d.amount * 100) / 100}
                  </Td>
                  <Td>
                    <Badge bgColor={d.category.color}>{d.category.name}</Badge>
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
                            Expenses.remove(d.id);
                            setExpenses(Expenses.readAll());
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
  displayData,
  wallet,
}: {
  isMonthly?: boolean;
  displayData: Expenses.Expense[];
  wallet: Wallets.Wallet | null;
}) {
  const [settings] = useState<Settings.Settings>(Settings.read());

  const data = useMemo<MonthlyYearlyData[]>(() => {
    // @ts-ignore
    const grouped = Object.groupBy(displayData, (expense) => {
      const time = unixToLocalTime(expense.timestamp);
      return isMonthly ? time.month : time.year;
    });
    return Array.from(Object.keys(grouped))
      .sort((a, b) => {
        return Number(a) < Number(b) ? -1 : 1;
      })
      .map((key: string) => {
        return {
          date: key,
          amount: grouped[key].reduce(
            (acc: number, cur: Pick<Expenses.Expense, "amount">) =>
              acc + cur.amount,
            0,
          ),
        } as MonthlyYearlyData;
      });
  }, [displayData, isMonthly]);

  return (
    <TableContainer paddingTop={"0.5rem"}>
      <Table>
        <Thead>
          <Tr>
            <Th>{isMonthly ? "Month" : "Year"}</Th>
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
                  {Math.round(d.amount * 100) / 100}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
