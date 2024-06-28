import { Dispatch, SetStateAction } from "react";

export const DB_NAME = "MyDatabase";

export const STORE_EXPENSES = "Expenses";
export const STORE_CATEGORIES = "Categories";

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
        db.createObjectStore(STORE_EXPENSES, { keyPath: "timestamp" });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { autoIncrement: true });
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
