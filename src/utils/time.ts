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
  date: number;
  month: number;
  year: number;

  hour: number;
  minute: number;
  second: number;
};

export function unixToLocalTime(timestamp: number): LocalTime {
  const date = new Date(timestamp);
  return {
    date: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  };
}

export function localTimeToUnix(t: LocalTime) {
  return new Date(
    t.year,
    t.month - 1,
    t.date,
    t.hour,
    t.minute,
    t.second
  ).getTime();
}

export function localTimeToString(t: LocalTime) {
  return `${t.year}-${t.month.toString().padStart(2, "0")}-${t.date
    .toString()
    .padStart(2, "0")} ${t.hour.toString().padStart(2, "0")}:${t.minute
    .toString()
    .padStart(2, "0")}:${t.second.toString().padStart(2, "0")}`;
}

export function getMaxDate(year: number, month: number) {
  const maxDate = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    maxDate[1] = 29;
  }
  return maxDate[month - 1];
}
