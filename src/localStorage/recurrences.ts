import { RecurrenceFrequency, STORE_RECURRENCES } from "../utils/consts";
import {
  type LocalTime,
  localTimeToUnix,
  unixToLocalTime,
} from "../utils/time";
import { getUuid } from "../utils/utils";
import { Expenses } from "./expenses";

export namespace Recurrences {
  export type Recurrence = {
    id: string;
    amount: number;
    description: string;
    categoryId: string;
    walletId: string;
    frequency: RecurrenceFrequency;
    /** Unix timestamp of the first occurrence */
    startDate: number;
    /** Unix timestamp of the last generated expense (tracks progress) */
    lastGeneratedDate: number;
  };

  export type PendingExpense = {
    recurrenceId: string;
    description: string;
    amount: number;
    categoryId: string;
    walletId: string;
    timestamp: number;
  };

  export function readAll(): Recurrence[] {
    const storage = localStorage.getItem(STORE_RECURRENCES);
    if (!storage) return [];
    return JSON.parse(storage) as Recurrence[];
  }

  export function readById(id: string): Recurrence | undefined {
    return readAll().find((r) => r.id === id);
  }

  export function write(data: Recurrence) {
    const all = readAll();
    const idx = all.findIndex((r) => r.id === data.id);
    if (idx !== -1) {
      all[idx] = data;
    } else {
      all.push(data);
    }
    localStorage.setItem(STORE_RECURRENCES, JSON.stringify(all));
  }

  export function remove(id: string) {
    const filtered = readAll().filter((r) => r.id !== id);
    localStorage.setItem(STORE_RECURRENCES, JSON.stringify(filtered));
  }

  export function writeAll(recurrences: Recurrence[]) {
    localStorage.setItem(STORE_RECURRENCES, JSON.stringify(recurrences));
  }

  function advanceDate(t: LocalTime, freq: RecurrenceFrequency): LocalTime {
    const copy = { ...t };
    switch (freq) {
      case RecurrenceFrequency.Daily:
        copy.day += 1;
        break;
      case RecurrenceFrequency.Weekly:
        copy.day += 7;
        break;
      case RecurrenceFrequency.Monthly:
        copy.month += 1;
        if (copy.month > 12) {
          copy.month = 1;
          copy.year += 1;
        }
        break;
      case RecurrenceFrequency.Yearly:
        copy.year += 1;
        break;
    }
    // Normalize via Date to handle overflow (e.g. Jan 31 + 1 month)
    const d = new Date(
      copy.year,
      copy.month - 1,
      copy.day,
      copy.hour,
      copy.minute,
      copy.second,
    );
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes(),
      second: d.getSeconds(),
      milli: 0,
    };
  }

  const MAX_PENDING_PER_RECURRENCE = 500;

  /** Returns expenses that should have been generated but haven't yet. */
  export function getPendingExpenses(): PendingExpense[] {
    const now = Date.now();
    const pending: PendingExpense[] = [];

    for (const rec of readAll()) {
      let cursor: LocalTime;
      if (rec.lastGeneratedDate >= rec.startDate) {
        cursor = advanceDate(
          unixToLocalTime(rec.lastGeneratedDate),
          rec.frequency,
        );
      } else {
        cursor = unixToLocalTime(rec.startDate);
      }

      let count = 0;
      let ts = localTimeToUnix(cursor);
      while (ts <= now && count < MAX_PENDING_PER_RECURRENCE) {
        pending.push({
          recurrenceId: rec.id,
          description: rec.description,
          amount: rec.amount,
          categoryId: rec.categoryId,
          walletId: rec.walletId,
          timestamp: ts,
        });
        cursor = advanceDate(cursor, rec.frequency);
        ts = localTimeToUnix(cursor);
        count++;
      }
    }
    return pending;
  }

  /** Write pending expenses into the Expenses store and update lastGeneratedDate. */
  export function commitPendingExpenses(pending: PendingExpense[]) {
    const byRecurrence = new Map<string, number>();
    for (const p of pending) {
      Expenses.write({
        id: getUuid(),
        amount: p.amount,
        description: p.description,
        categoryId: p.categoryId,
        walletId: p.walletId,
        timestamp: p.timestamp,
        recurrenceId: p.recurrenceId,
      });
      const prev = byRecurrence.get(p.recurrenceId) ?? 0;
      if (p.timestamp > prev) {
        byRecurrence.set(p.recurrenceId, p.timestamp);
      }
    }
    const all = readAll();
    for (const rec of all) {
      const latest = byRecurrence.get(rec.id);
      if (latest !== undefined) {
        rec.lastGeneratedDate = latest;
      }
    }
    writeAll(all);
  }

  /** Skip all pending: just advance lastGeneratedDate to now without creating expenses. */
  export function skipPendingExpenses() {
    const now = Date.now();
    const all = readAll();
    for (const rec of all) {
      let cursor: LocalTime;
      if (rec.lastGeneratedDate >= rec.startDate) {
        cursor = advanceDate(
          unixToLocalTime(rec.lastGeneratedDate),
          rec.frequency,
        );
      } else {
        cursor = unixToLocalTime(rec.startDate);
      }
      let lastValid = rec.lastGeneratedDate;
      let ts = localTimeToUnix(cursor);
      while (ts <= now) {
        lastValid = ts;
        cursor = advanceDate(cursor, rec.frequency);
        ts = localTimeToUnix(cursor);
      }
      if (lastValid > rec.lastGeneratedDate) {
        rec.lastGeneratedDate = lastValid;
      }
    }
    writeAll(all);
  }

  /** Skip a single pending expense: advance lastGeneratedDate for its recurrence. */
  export function skipSinglePendingExpense(item: PendingExpense) {
    const all = readAll();
    const rec = all.find((r) => r.id === item.recurrenceId);
    if (rec && item.timestamp > rec.lastGeneratedDate) {
      rec.lastGeneratedDate = item.timestamp;
    }
    writeAll(all);
  }
}
