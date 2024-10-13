import { ViewMode } from "./consts";

export function getUnix() {
  return new Date().getTime();
}

export function getDate() {
  return new Date().getDate();
}

export function getMonth() {
  return new Date().getMonth() + 1;
}

export function getMonthName() {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[new Date().getMonth()];
}

export function getYear() {
  return new Date().getFullYear();
}

export type LocalTime = {
  year: number;
  month: number;
  day: number;

  hour: number;
  minute: number;
  second: number;
  milli: number;
};

export function genLocalTime(
  year?: number,
  month?: number,
  day?: number,
): LocalTime {
  const now = unixToLocalTime(getUnix());
  return {
    year: year || now.year,
    month: month || now.month,
    day: day || now.day,
    hour: now.hour,
    minute: now.minute,
    second: now.second,
    milli: now.milli,
  };
}

export function unixToLocalTime(timestamp: number): LocalTime {
  const date = new Date(timestamp);
  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    milli: date.getMilliseconds(),
  };
}

export function localTimeToUnix(t: LocalTime) {
  return new Date(
    t.year,
    t.month - 1,
    t.day,
    t.hour,
    t.minute,
    t.second,
  ).getTime();
}

export function localTimeToString(
  t: LocalTime,
  viewMode?: ViewMode,
  displayFullDate?: boolean,
) {
  if (!displayFullDate && viewMode === ViewMode.Daily) {
    return `${t.day.toString().padStart(2, "0")}`;
  }
  if (displayFullDate) {
    return `${t.year}-${t.month.toString().padStart(2, "0")}-${t.day
      .toString()
      .padStart(2, "0")} ${t.hour.toString().padStart(2, "0")}:${t.minute
      .toString()
      .padStart(2, "0")}:${t.second.toString().padStart(2, "0")}`;
  }
  return `${t.month.toString().padStart(2, "0")}-${t.day
    .toString()
    .padStart(2, "0")}`;
}

export function localTimeToInputString(t: LocalTime) {
  return `${t.year}-${t.month.toString().padStart(2, "0")}-${t.day
    .toString()
    .padStart(2, "0")}T${t.hour.toString().padStart(2, "0")}:${t.minute
    .toString()
    .padStart(2, "0")}`;
}

export function localTimeToLocalDate(t: LocalTime) {
  return new Date(t.year, t.month - 1, t.day, t.hour, t.minute, t.second);
}

export function localDateToUtcDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

export function newLocalDate(timeStr: string) {
  const date = new Date(timeStr);
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

export function getMaxDate(year: number, month: number) {
  const maxDate = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    maxDate[1] = 29;
  }
  return maxDate[month - 1];
}
