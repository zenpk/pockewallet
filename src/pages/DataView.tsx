import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
} from "@chakra-ui/react";
import { useContext, useEffect, useRef, useState } from "react";
import { AddRecord } from "../components/AddRecord";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { dbContext } from "../contexts/Db";
import { openDb } from "../db/shared";
import { ViewMode } from "../utils/consts";
import { getDate, getMaxDate, getMonth, getYear } from "../utils/time";
import { BiWallet } from "react-icons/bi";
import { BiCalendar } from "react-icons/bi";
import { Categories } from "../db/categories";
import { Wallets } from "../db/wallets";

export function DataView() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Monthly);
  const [title, setTitle] = useState<string>(`${getYear()}-${getMonth()}`);
  const [year, setYear] = useState<number>(getYear());
  const [month, setMonth] = useState<number>(getMonth());
  const [date, setDate] = useState<number>(getDate);
  const [db, setDb] = useContext(dbContext)!;
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [categories, setCategories] = useState<Categories.Category[]>([]);

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

  return (
    <PageLayout>
      <div
        id="first-lane"
        className="flex-row-space no-space mb-sm flex-wrap flex-wrap-third"
      >
        <div className={"flex-row-space gap-sm no-space"}>
          <LeftDrawer />
          {(viewMode === ViewMode.Daily || viewMode === ViewMode.Monthly) && (
            <AddRecord
              submit={() => {
                console.log("aaa");
              }}
              title={"Add Record"}
            >
              <AddRecordForm />
            </AddRecord>
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
              {wallets.length ? wallets[0].name : "Wallet"}
            </MenuButton>
            <MenuList>
              {wallets.map((wallet) => {
                return (
                  <MenuItem
                    key={wallet.id}
                    onClick={() => {
                      setViewMode(ViewMode.Daily);
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
            {Array.from({ length: getMaxDate(month) }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Select>
        )}
      </div>
    </PageLayout>
  );
}

function AddRecordForm() {
  const [category, setCategory] = useState<string>("");
  const amountRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  return (
    <FormControl>
      <FormLabel>Category</FormLabel>
      <Select
        value={category}
        onChange={(event) => {
          setCategory(event.target.value);
        }}
      ></Select>
      <FormLabel>Amount</FormLabel>
      <Input type="number" ref={amountRef} />
      <FormLabel>Description (Optional)</FormLabel>
      <Input type="text" ref={descriptionRef} />
    </FormControl>
  );
}
