import { Dispatch, SetStateAction } from "react";
import { getUuid } from "../utils/utils";
import { STORE_EXPENSES } from "./consts";

namespace Expenses {
  export type Expense = {
    id?: string; // uuid
    amount: number;
    description?: string;
    categoryId: string; // uuid
    walletId: string; // uuid
    timestamp: number;
  };

  export async function write(db: IDBDatabase, data: Expense) {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_EXPENSES], "readwrite");
      const store = transaction.objectStore(STORE_EXPENSES);
      data.id = getUuid();
      data.description = data.description || "";
      const request = store.add(data);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (event) {
        reject("Error writing data: " + JSON.stringify(event));
      };
    });
  }

  export async function read(
    db: IDBDatabase,
    startTime: number,
    endTime: number,
    walletId: string,
    setData: Dispatch<SetStateAction<Expense[]>>
  ) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EXPENSES], "readonly");
      const store = transaction.objectStore(STORE_EXPENSES);
      const index = store.index("timestamp");
      const keyRange = IDBKeyRange.bound(startTime, endTime);
      const cursorRequest = index.openCursor(keyRange);

      cursorRequest.onerror = function (event) {
        console.log("Cursor error:", JSON.stringify(event));
      };

      const result: Expense[] = [];
      cursorRequest.onsuccess = function (event) {
        // @ts-ignore
        const cursor = event?.target?.result;
        if (cursor) {
          const record = cursor.value;
          // check wallet id
          if (record.walletId === walletId) {
            result.push(record);
          }
          cursor.continue();
        } else {
          console.log("No more records found");
          setData(result);
        }
      };
    });
  }
}
