import { useMemo, useState } from "react";
import type { Expenses } from "../localStorage/expenses";
import { Settings } from "../localStorage/settings";
import type { Wallets } from "../localStorage/wallets";
import { unixToLocalTime } from "../utils/time";

type MonthlyYearlyData = {
  date: string;
  amount: number;
};

export function MonthlyYearlyTable({
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
    <div className="scroll-area" style={{ paddingTop: "0.5rem" }}>
      <table>
        <thead>
          <tr>
            <th>{isMonthly ? "Month" : "Year"}</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => {
            return (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>
                  {settings.displayCurrency &&
                    wallet?.currency &&
                    `${wallet.currency} `}
                  {Math.round(d.amount * 100) / 100}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
