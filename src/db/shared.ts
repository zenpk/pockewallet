import {
  DB_NAME,
  DB_VERSION,
  STORE_CATEGORIES,
  STORE_EXPENSES,
  STORE_WALLETS,
} from "../utils/consts";
import { Categories } from "./categories";
import { Wallets } from "./wallets";

export function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = function (event) {
      console.log(event);
      resolve(request.result);
    };

    request.onerror = function (event) {
      reject("Database error: " + JSON.stringify(event));
    };

    request.onupgradeneeded = function (event) {
      console.log(`on db upgrade`);
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

      // @ts-ignore
      const transaction = event.target.transaction;
      transaction.oncomplete = function () {
        Categories.writeDefault(db);
        Wallets.writeDefault(db);
        resolve(db);
      };
    };
  });
}
