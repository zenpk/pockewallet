import { Dispatch, SetStateAction } from "react";
import { getUuid } from "../utils/utils";
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

  export function write(db: IDBDatabase, data: Expense) {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_EXPENSES], "readwrite");
      const store = transaction.objectStore(STORE_EXPENSES);
      data.id = data.id || getUuid();
      data.description = data.description || "";
      const request = store.put(data);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (event) {
        reject("Error writing data: " + JSON.stringify(event));
      };
    });
  }

  export function read(
    db: IDBDatabase,
    startTime: number,
    endTime: number,
    walletId: string,
    setData: Dispatch<SetStateAction<Expense[]>>
  ) {
    const transaction = db.transaction([STORE_EXPENSES], "readonly");
    const store = transaction.objectStore(STORE_EXPENSES);
    const index = store.index("timestamp");
    const keyRange = IDBKeyRange.bound(startTime, endTime);
    const cursorRequest = index.openCursor(keyRange);

    cursorRequest.onerror = function (event) {
      throw new Error("Cursor error: " + JSON.stringify(event));
    };

    const result: Expense[] = [];
    cursorRequest.onsuccess = function (event) {
      // @ts-ignore
      const cursor = event?.target?.result;
      if (cursor) {
        const record = cursor.value;
        // check wallet id
        if (
          record.walletId === walletId &&
          record.timestamp >= startTime &&
          record.timestamp < endTime
        ) {
          result.push(record);
        }
        cursor.continue();
      } else {
        // console.log("read expenses result");
        // console.log(result);
        setData(result);
      }
    };
  }

  export function remove(db: IDBDatabase, id: string) {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_EXPENSES], "readwrite");
      const store = transaction.objectStore(STORE_EXPENSES);
      const request = store.delete(id);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (event) {
        reject("Error removing expense: " + JSON.stringify(event));
      };
    });
  }

  export function readById(db: IDBDatabase, id: string) {
    return new Promise<Expense>((resolve, reject) => {
      const transaction = db.transaction([STORE_EXPENSES], "readonly");
      const store = transaction.objectStore(STORE_EXPENSES);
      const request = store.get(id);

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function (event) {
        reject("Error reading expense by id: " + JSON.stringify(event));
      };
    });
  }
}
