import { STORE_DESCRIPTIONS } from "../utils/consts";

const MAX = 100;

export namespace RecentDescriptions {
  export type Entry = {
    description: string;
    categoryId: string;
  };

  type Store = Record<string, Entry[]>;

  function readStore(): Store {
    const data = localStorage.getItem(STORE_DESCRIPTIONS);
    if (!data) return {};
    try {
      const parsed = JSON.parse(data);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return {};
      }
      return parsed as Store;
    } catch {
      return {};
    }
  }

  function writeStore(store: Store) {
    localStorage.setItem(STORE_DESCRIPTIONS, JSON.stringify(store));
  }

  export function read(walletId?: string): Entry[] {
    const store = readStore();
    if (!walletId) {
      const all: Entry[] = [];
      const seen = new Set<string>();
      for (const entries of Object.values(store)) {
        for (const e of entries) {
          if (!seen.has(e.description)) {
            seen.add(e.description);
            all.push(e);
          }
        }
      }
      return all;
    }
    return store[walletId] ?? [];
  }

  export function add(
    walletId: string,
    description: string,
    categoryId: string,
  ) {
    const trimmed = description.trim();
    if (!trimmed) return;
    const store = readStore();
    const list = (store[walletId] ?? []).filter(
      (e) => e.description !== trimmed,
    );
    list.unshift({ description: trimmed, categoryId });
    if (list.length > MAX) list.length = MAX;
    store[walletId] = list;
    writeStore(store);
  }

  export function readAll(): Store {
    return readStore();
  }

  export function writeAll(store: Store) {
    writeStore(store);
  }

  export function removeEntry(walletId: string, description: string) {
    const store = readStore();
    const list = store[walletId];
    if (!list) return;
    store[walletId] = list.filter((e) => e.description !== description);
    if (store[walletId].length === 0) delete store[walletId];
    writeStore(store);
  }

  export function updateEntry(
    walletId: string,
    oldDescription: string,
    newDescription: string,
    newCategoryId?: string,
  ) {
    const trimmed = newDescription.trim();
    if (!trimmed) return;
    const store = readStore();
    const list = store[walletId];
    if (!list) return;
    const entry = list.find((e) => e.description === oldDescription);
    if (entry) {
      entry.description = trimmed;
      if (newCategoryId !== undefined) entry.categoryId = newCategoryId;
    }
    writeStore(store);
  }

  export function clear() {
    localStorage.removeItem(STORE_DESCRIPTIONS);
  }
}
