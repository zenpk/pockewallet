import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { BiChevronDown, BiChevronUp, BiMenu } from "react-icons/bi";
import { useDisclosure } from "../hooks/useDisclosure";
import { Exchanges } from "../localStorage/exchanges";
import type { Wallets } from "../localStorage/wallets";
import { localTimeToString, unixToLocalTime } from "../utils/time";
import { AddExchangeForm } from "./AddExchangeForm";
import { Dropdown, DropdownItem } from "./Dropdown";

type DisplayRow = {
  id: string;
  date: string;
  fromWallet: string;
  fromCurrency: string;
  fromAmount: number;
  toWallet: string;
  toCurrency: string;
  toAmount: number;
  rate: string;
  description: string;
};

enum SortMode {
  DateDesc = "Date Desc",
  DateAsc = "Date Asc",
}

export function ExchangeTable({
  exchanges,
  wallets,
  setExchanges,
}: {
  exchanges: Exchanges.Exchange[];
  wallets: Wallets.Wallet[];
  setExchanges: Dispatch<SetStateAction<Exchanges.Exchange[]>>;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentId, setCurrentId] = useState(exchanges[0]?.id ?? "");
  const [sortMode, setSortMode] = useState<SortMode>(SortMode.DateDesc);

  const data = useMemo(() => {
    function transform(list: Exchanges.Exchange[]): DisplayRow[] {
      return list.map((e) => {
        const from = wallets.find((w) => w.id === e.fromWalletId);
        const to = wallets.find((w) => w.id === e.toWalletId);
        return {
          id: e.id,
          date: localTimeToString(unixToLocalTime(e.timestamp)),
          fromWallet: from?.name ?? "?",
          fromCurrency: from?.currency ?? "",
          fromAmount: e.fromAmount,
          toWallet: to?.name ?? "?",
          toCurrency: to?.currency ?? "",
          toAmount: e.toAmount,
          rate:
            e.fromAmount > 0
              ? `${(Math.round((e.toAmount / e.fromAmount) * 10000) / 10000).toString()}`
              : "-",
          description: e.description ?? "",
        };
      });
    }

    const desc = [...exchanges].sort((a, b) => b.timestamp - a.timestamp);
    const asc = [...exchanges].sort((a, b) => a.timestamp - b.timestamp);
    return {
      [SortMode.DateDesc]: transform(desc),
      [SortMode.DateAsc]: transform(asc),
    };
  }, [exchanges, wallets]);

  const rows = data[sortMode];

  return (
    <>
      {isOpen && (
        <AddExchangeForm
          wallets={wallets}
          setExchanges={setExchanges}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          idValue={currentId}
        />
      )}
      <div className="scroll-area">
        <table>
          <thead>
            <tr>
              <th
                onClick={() =>
                  setSortMode(
                    sortMode === SortMode.DateDesc
                      ? SortMode.DateAsc
                      : SortMode.DateDesc,
                  )
                }
                style={{ cursor: "pointer" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  Date
                  {sortMode === SortMode.DateDesc && <BiChevronDown />}
                  {sortMode === SortMode.DateAsc && <BiChevronUp />}
                </span>
              </th>
              <th>From</th>
              <th>To</th>
              <th>Rate</th>
              <th>Description</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td>{d.date}</td>
                <td>
                  {d.fromCurrency} {Math.round(d.fromAmount * 100) / 100}
                  <br />
                  <small style={{ opacity: 0.6 }}>{d.fromWallet}</small>
                </td>
                <td>
                  {d.toCurrency} {Math.round(d.toAmount * 100) / 100}
                  <br />
                  <small style={{ opacity: 0.6 }}>{d.toWallet}</small>
                </td>
                <td>{d.rate}</td>
                <td style={{ whiteSpace: "normal" }}>{d.description}</td>
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
                        setCurrentId(d.id);
                        onOpen();
                      }}
                    >
                      Edit
                    </DropdownItem>
                    <DropdownItem
                      style={{ color: "#ee0000" }}
                      onClick={() => {
                        Exchanges.remove(d.id);
                        setExchanges(Exchanges.readAll());
                      }}
                    >
                      Delete
                    </DropdownItem>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
