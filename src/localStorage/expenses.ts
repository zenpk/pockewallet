import { STORE_EXPENSES } from "../utils/consts";

export namespace Expenses {
  export type Expense = {
    id: string; // uuid
    amount: number;
    description?: string;
    categoryId: string; // uuid
    walletId: string; // uuid
    timestamp: number;
  };

  export function readAll() {
    const storage = localStorage.getItem(STORE_EXPENSES);
    if (!storage) {
      return [];
    }
    return JSON.parse(storage) as Expense[];
  }

  export function readRange(
    expenses: Expense[],
    startTime: number,
    endTime: number,
    walletId: string,
  ) {
    return expenses.filter(
      (expense) =>
        expense.timestamp >= startTime &&
        expense.timestamp < endTime &&
        expense.walletId === walletId,
    );
  }

  export function search(
    expenses: Expense[],
    walletId: string,
    categoryId?: string,
    searchString?: string,
  ) {
    return expenses.filter((expense) => {
      if (expense.walletId !== walletId) {
        return false;
      }
      if (categoryId && expense.categoryId !== categoryId) {
        return false;
      }
      if (searchString && !expense.description?.includes(searchString)) {
        return false;
      }
      return true;
    });
  }

  export function readById(id: string) {
    const expenses = readAll();
    return expenses.find((expense) => expense.id === id);
  }

  export async function write(data: Expense) {
    const expenses = readAll();
    const findIndex = expenses.findIndex((expense) => expense.id === data.id);
    if (findIndex !== -1) {
      expenses[findIndex] = data;
    } else {
      expenses.push(data);
    }
    localStorage.setItem(STORE_EXPENSES, JSON.stringify(expenses));
  }

  export function remove(id: string) {
    const expenses = readAll();
    const filtered = expenses.filter((wallet) => wallet.id !== id);
    localStorage.setItem(STORE_EXPENSES, JSON.stringify(filtered));
  }

  export async function writeAll(expenses: Expense[]) {
    localStorage.setItem(STORE_EXPENSES, JSON.stringify(expenses));
  }
}
