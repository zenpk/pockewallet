import { Dispatch, SetStateAction } from "react";
import {
  DB_NAME,
  STORE_CATEGORIES,
  STORE_EXPENSES,
  STORE_WALLETS,
} from "./consts";

export function openDb(setDb: Dispatch<SetStateAction<IDBDatabase | null>>) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onsuccess = function (event) {
      console.log(event);
      setDb(request.result);
    };

    request.onupgradeneeded = function () {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_EXPENSES)) {
        const store = db.createObjectStore(STORE_EXPENSES, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_WALLETS)) {
        db.createObjectStore(STORE_WALLETS, { keyPath: "id" });
      }
      setDb(db);
    };

    request.onerror = function (event) {
      reject("Database error");
      console.log(event);
    };

    request.onsuccess = function (event) {
      console.log(event);
      resolve(request.result);
    };
  });
}
