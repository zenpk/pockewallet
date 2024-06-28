import { STORE_EXPENSES } from "./shared";

namespace Expenses {
  export type Expense = {
    timestamp?: number;
    amount: number;
    category: string; // uuid
    description: string;
  };

  export function getByDay() {}

  export function getByMonth() {}

  export async function write(db: IDBDatabase, data: Expense) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EXPENSES], "readwrite");
      const store = transaction.objectStore(STORE_EXPENSES);

      const request = store.add(data);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (event) {
        reject("Error writing data: " + event.target.errorCode);
      };
    });
  }

  async function readData(db, id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["MyStore"], "readonly");
      const store = transaction.objectStore("MyStore");

      const request = store.get(id);

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function (event) {
        reject("Error reading data: " + event.target.errorCode);
      };
    });
  }
}
