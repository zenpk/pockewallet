import type { Categories } from "../localStorage/categories";
import type { Expenses } from "../localStorage/expenses";
import type { Settings } from "../localStorage/settings";
import type { Wallets } from "../localStorage/wallets";

export const DB_VERSION = 1;
export const DB_NAME = "MyDatabase";

export const STORE_EXPENSES = "Expenses";
export const STORE_CATEGORIES = "Categories";
export const STORE_WALLETS = "Wallets";
export const STORE_VERIFIER = "Verifier";

export const KEY_SETTINGS = "Settings";

export enum ViewMode {
  Daily = "Daily",
  Monthly = "Monthly",
  Yearly = "Yearly",
  All = "All",
  Custom = "Custom",
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
  settings: Settings.Settings;
  lastSync: string;
  userId: string;
};

export type SendBody = {
  collection: string;
  data: SyncData;
};

export enum ChartType {
  Pie = "Pie",
}
