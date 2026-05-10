export const DB_VERSION = 1;
export const DB_NAME = "MyDatabase";

export const STORE_EXPENSES = "Expenses";
export const STORE_CATEGORIES = "Categories";
export const STORE_WALLETS = "Wallets";
export const STORE_VERIFIER = "Verifier";

export const STORE_SETTINGS = "Settings";
export const STORE_RECURRENCES = "Recurrences";
export const STORE_SYNONYMS = "Synonyms";
export const STORE_EXCHANGES = "Exchanges";
export const STORE_DESCRIPTIONS = "RecentDescriptions";
export const STORE_MEMO = "Memo";

export enum RecurrenceFrequency {
  Daily = "Daily",
  Weekly = "Weekly",
  Monthly = "Monthly",
  Yearly = "Yearly",
}

export enum ViewMode {
  Today = "Today",
  Daily = "Daily",
  Monthly = "Monthly",
  Yearly = "Yearly",
  Custom = "Custom",
  Search = "Search",
}

export enum SortMode {
  DateDesc = "Date Desc",
  DateAsc = "Date Asc",
  AmountDesc = "Amount Desc",
  AmountAsc = "Amount Asc",
}

export const COOKIE_ID = "id";

export enum ChartType {
  Pie = "Pie",
  Bar = "Bar",
}
