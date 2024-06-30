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
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        if (persistent) {
          console.log(
            "Storage will not be cleared except by explicit user action"
          );
        } else {
          console.warn(
            "Storage may be cleared by the UA under storage pressure."
          );
        }
      });
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = function () {
      console.log("on open db success");
      resolve(request.result);
    };

    request.onerror = function (event) {
      reject("Database error: " + JSON.stringify(event));
    };

    request.onupgradeneeded = function (event) {
      console.log("on db upgrade");
      const db = request.result;
      let shouldWriteCategory = false;
      let shouldWriteWallet = false;
      if (!db.objectStoreNames.contains(STORE_EXPENSES)) {
        const store = db.createObjectStore(STORE_EXPENSES, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: "id" });
        shouldWriteCategory = true;
      }
      if (!db.objectStoreNames.contains(STORE_WALLETS)) {
        db.createObjectStore(STORE_WALLETS, { keyPath: "id" });
        shouldWriteWallet = true;
      }

      // @ts-ignore
      const transaction = event.target.transaction;
      transaction.oncomplete = function () {
        if (shouldWriteCategory) Categories.writeDefault(db);
        if (shouldWriteWallet) Wallets.writeDefault(db);
        resolve(db);
      };
    };
  });
}
