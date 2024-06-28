import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { AddRecord } from "../components/AddRecord";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { ViewMode } from "../utils/consts";
import {
  getDate,
  getMaxDate,
  getMonth,
  getYear
} from "../utils/time";

export function DataView() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Monthly);
  const [title, setTitle] = useState<string>(`${getYear()}-${getMonth()}`);
  const [openModal, setOpenModal] = useState(false);
  const [year, setYear] = useState<number>(getYear());
  const [month, setMonth] = useState<number>(getMonth());
  const [date, setDate] = useState<number>(getDate);

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
      <div id="first-lane" className="flex-row-space no-space">
        {openModal && <AddRecord />}
        <LeftDrawer />
        <Heading padding={4} margin={0} fontSize={24}>
          {title}
        </Heading>
        <div className="flex gap-1">
          {(viewMode === ViewMode.Daily || viewMode === ViewMode.Monthly) && (
            <Button bgColor={"green.100"}>Add</Button>
          )}
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
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
        </div>
      </div>
      <div id="second-lane" className="flex-row-space no-space gap-1">
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
  const descriptionRef = React.useRef<HTMLInputElement>(null);
  return (
    <FormControl>
      <FormLabel>Email</FormLabel>
      <Input type="text" ref={descriptionRef} />
      <FormHelperText>
        Enter the email you'd like to receive the newsletter on.
      </FormHelperText>
    </FormControl>
  );
}
