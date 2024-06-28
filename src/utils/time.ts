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

export function unixToDateMonthYear(timestamp: number) {
  const date = new Date(timestamp);
  return {
    date: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export function getMaxDate(month: number) {
  const maxDate = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const year = getYear();
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    maxDate[1] = 29;
  }
  return maxDate[month - 1];
}
