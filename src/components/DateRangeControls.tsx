import type { Dispatch, SetStateAction } from "react";
import { ViewMode } from "../utils/consts";
import { getYear, localDateToUtcDate, newLocalDate } from "../utils/time";

export function DateRangeControls({
  viewMode,
  year,
  setYear,
  month,
  setMonth,
  customStartTime,
  setCustomStartTime,
  customEndTime,
  setCustomEndTime,
  minYear,
  children,
}: {
  viewMode: ViewMode;
  year: number;
  setYear: Dispatch<SetStateAction<number>>;
  month: number;
  setMonth: Dispatch<SetStateAction<number>>;
  customStartTime: Date;
  setCustomStartTime: Dispatch<SetStateAction<Date>>;
  customEndTime: Date;
  setCustomEndTime: Dispatch<SetStateAction<Date>>;
  minYear?: number;
  children?: React.ReactNode;
}) {
  const currentYear = getYear();
  const oldest = Math.min(currentYear - 9, minYear ?? currentYear - 9);
  const yearCount = currentYear - oldest + 1;

  return (
    <div id="second-lane" className="flex-row-space no-space gap-sm flex-wrap">
      {(viewMode === ViewMode.Monthly || viewMode === ViewMode.Daily) && (
        <select
          className="input"
          onChange={(e) => setYear(Number.parseInt(e.target.value))}
          value={year}
        >
          {Array.from({ length: yearCount }, (_, i) => (
            <option key={i.toString()} value={currentYear - i}>
              {currentYear - i}
            </option>
          ))}
        </select>
      )}
      {viewMode === ViewMode.Daily && (
        <select
          className="input"
          onChange={(e) => setMonth(Number.parseInt(e.target.value))}
          value={month}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i.toString()} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      )}
      {viewMode === ViewMode.Custom && (
        <>
          <input
            type="date"
            className="input"
            value={localDateToUtcDate(customStartTime)
              .toISOString()
              .slice(0, 10)}
            onChange={(e) => setCustomStartTime(newLocalDate(e.target.value))}
          />
          <input
            type="date"
            className="input"
            value={localDateToUtcDate(customEndTime).toISOString().slice(0, 10)}
            onChange={(e) => setCustomEndTime(newLocalDate(e.target.value))}
          />
        </>
      )}
      {children}
    </div>
  );
}
