import type { Categories } from "../localStorage/categories";
import type { Exchanges } from "../localStorage/exchanges";
import type { Expenses } from "../localStorage/expenses";
import type { RecentDescriptions } from "../localStorage/recentDescriptions";
import type { Recurrences } from "../localStorage/recurrences";
import type { Synonyms } from "../localStorage/synonyms";
import type { Wallets } from "../localStorage/wallets";

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

export type SyncData = {
  expenses: Expenses.Expense[];
  categories: Categories.Category[];
  wallets: Wallets.Wallet[];
  recurrences: Recurrences.Recurrence[];
  synonyms: Synonyms.SynonymGroup[];
  exchanges: Exchanges.Exchange[];
  recentDescriptions: RecentDescriptions.Entry;
  settings: string;
  timestamp: number;
  userId: string;
};

export enum ChartType {
  Pie = "Pie",
  Bar = "Bar",
}
