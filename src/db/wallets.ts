import { Dispatch, SetStateAction } from "react";
import { STORE_WALLETS } from "../utils/consts";
import { getUuid } from "../utils/utils";

export namespace Wallets {
  export type Wallet = {
    id: string; // uuid
    name: string;
    currency?: string; // $ € £ ￥
    deletable: boolean;
  };

  export function writeDefault(db: IDBDatabase) {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_WALLETS], "readwrite");
      const store = transaction.objectStore(STORE_WALLETS);
      const defaultWallet: Wallet = {
        id: getUuid(),
        name: "Default",
        deletable: false,
        currency: "",
      };
      const request = store.add(defaultWallet);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (event) {
        reject("Error writing default wallet data: " + JSON.stringify(event));
      };
    });
  }

  export function readAll(
    db: IDBDatabase,
    setData: Dispatch<SetStateAction<Wallet[]>>
  ) {
    const transaction = db.transaction([STORE_WALLETS], "readonly");
    const store = transaction.objectStore(STORE_WALLETS);
    const cursorRequest = store.openCursor();

    cursorRequest.onerror = function (event) {
      throw new Error("Error reading wallets: " + JSON.stringify(event));
    };

    const result: Wallet[] = [];
    cursorRequest.onsuccess = function (event) {
      // @ts-ignore
      const cursor = event?.target?.result;
      if (cursor) {
        result.push(cursor.value);
        cursor.continue();
      } else {
        setData(result);
      }
    };
  }

  export function readById(db: IDBDatabase, id: string) {
    return new Promise<Wallet>((resolve, reject) => {
      const transaction = db.transaction([STORE_WALLETS], "readonly");
      const store = transaction.objectStore(STORE_WALLETS);
      const request = store.get(id);

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function (event) {
        reject("Error reading wallet by id: " + JSON.stringify(event));
      };
    });
  }

  export function write(db: IDBDatabase, data: Wallet) {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_WALLETS], "readwrite");
      const store = transaction.objectStore(STORE_WALLETS);
      const request = store.put(data);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (event) {
        reject("Error writing wallet data: " + JSON.stringify(event));
      };
    });
  }

  export function remove(db: IDBDatabase, id: string) {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_WALLETS], "readwrite");
      const store = transaction.objectStore(STORE_WALLETS);
      const request = store.delete(id);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (event) {
        reject("Error deleting wallet: " + JSON.stringify(event));
      };
    });
  }
}
