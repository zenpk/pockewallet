import {
  Button,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { ViewMode } from "../utils/consts";
import React, { useEffect } from "react";
import { getMonth, getYear } from "../utils/time";
import { ChevronDownIcon } from "@chakra-ui/icons";

export function DataView() {
  const [viewMode, setViewMode] = React.useState<ViewMode>(ViewMode.ThisMonth);
  const [title, setTitle] = React.useState<string>(getMonth());

  useEffect(() => {
    switch (viewMode) {
      case ViewMode.Today:
        setTitle("Today");
        break;
      case ViewMode.ThisMonth:
        setTitle(getMonth());
        break;
      case ViewMode.ThisYear:
        setTitle(getYear());
        break;
      case ViewMode.AllTime:
        setTitle("All Time");
        break;
    }
  }, [viewMode]);

  return (
    <PageLayout>
      <div className="flex-row-space">
        <LeftDrawer />
        <Heading>{title}</Heading>
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
            {viewMode}
          </MenuButton>
          <MenuList>
            <MenuItem
              onClick={() => {
                setViewMode(ViewMode.Today);
              }}
            >
              {ViewMode.Today}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setViewMode(ViewMode.ThisMonth);
              }}
            >
              {ViewMode.ThisMonth}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setViewMode(ViewMode.ThisYear);
              }}
            >
              {ViewMode.ThisYear}
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
    </PageLayout>
  );
}
