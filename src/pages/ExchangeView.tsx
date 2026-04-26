import { useEffect, useMemo, useState } from "react";

import { BiCalendar, BiChevronDown, BiPlus } from "react-icons/bi";
import { AddExchangeForm } from "../components/AddExchangeForm";
import { DateRangeControls } from "../components/DateRangeControls";
import { Dropdown, DropdownItem } from "../components/Dropdown";
import { ExchangeTable } from "../components/ExchangeTable";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { useDisclosure } from "../hooks/useDisclosure";
import { useViewMode } from "../hooks/useViewMode";
import { Exchanges } from "../localStorage/exchanges";
import { openDb } from "../localStorage/shared";
import { Wallets } from "../localStorage/wallets";
import { ViewMode } from "../utils/consts";

const viewModes = [
  ViewMode.Today,
  ViewMode.Daily,
  ViewMode.Monthly,
  ViewMode.Yearly,
  ViewMode.Custom,
] as const;

export function ExchangeView() {
  const vm = useViewMode();
  const [wallets, setWallets] = useState<Wallets.Wallet[]>([]);
  const [exchanges, setExchanges] = useState<Exchanges.Exchange[]>(
    Exchanges.readAll(),
  );

  const minYear = useMemo(() => {
    if (!exchanges.length) return undefined;
    return Math.min(
      ...exchanges.map((e) => new Date(e.timestamp).getFullYear()),
    );
  }, [exchanges]);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    openDb();
    setWallets(Wallets.readAll());
  }, []);

  const displayData = useMemo(() => {
    if (!exchanges || !vm.timeRange) return;
    return Exchanges.readRange(
      exchanges,
      vm.timeRange.startTime,
      vm.timeRange.endTime,
    );
  }, [exchanges, vm.timeRange]);

  return (
    <PageLayout>
      {isOpen && wallets.length >= 2 && (
        <AddExchangeForm
          wallets={wallets}
          setExchanges={setExchanges}
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
          {wallets.length >= 2 && (
            <button type="button" className="btn btn-green" onClick={onOpen}>
              <BiPlus />
              Add
            </button>
          )}
        </div>
        <h2 className="page-title">Exchange</h2>
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
            {viewModes.map((mode) => (
              <DropdownItem key={mode} onClick={() => vm.setViewMode(mode)}>
                {mode}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>
      <DateRangeControls {...vm} minYear={minYear} />
      {wallets.length < 2 && (
        <p style={{ margin: "1rem", opacity: 0.6 }}>
          You need at least 2 wallets to record currency exchanges.
        </p>
      )}
      {displayData && displayData.length > 0 && (
        <ExchangeTable
          exchanges={displayData}
          wallets={wallets}
          setExchanges={setExchanges}
        />
      )}
      {displayData && displayData.length === 0 && (
        <p style={{ margin: "1rem", opacity: 0.5, textAlign: "center" }}>
          No exchanges in this period.
        </p>
      )}
    </PageLayout>
  );
}
