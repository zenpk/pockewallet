import { useMemo, useState } from "react";
import { ViewMode } from "../utils/consts";
import { getMonth, getTimeRange, getYear } from "../utils/time";

export function useViewMode(defaultViewMode = ViewMode.Monthly) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [year, setYear] = useState(getYear());
  const [month, setMonth] = useState(getMonth());
  const [customStartTime, setCustomStartTime] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [customEndTime, setCustomEndTime] = useState<Date>(new Date());

  const timeRange = useMemo(
    () => getTimeRange(viewMode, year, month, customStartTime, customEndTime),
    [viewMode, year, month, customStartTime, customEndTime],
  );

  return {
    viewMode,
    setViewMode,
    year,
    setYear,
    month,
    setMonth,
    customStartTime,
    setCustomStartTime,
    customEndTime,
    setCustomEndTime,
    timeRange,
  };
}
