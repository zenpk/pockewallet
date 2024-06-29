import { Dispatch, SetStateAction } from "react";
import { getUuid } from "../utils/utils";
import { STORE_WALLETS } from "../utils/consts";

export namespace Wallets {
  export type Wallet = {
    id: string; // uuid
    name: string;
    currency: string; // $ ￥ €
    deletable: boolean;
  };

  export function writeDefault(db: IDBDatabase) {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_WALLETS], "readwrite");
      const store = transaction.objectStore(STORE_WALLETS);
      const defaultWallet: Wallet = {
        id: getUuid(),
        name: "Default",
        currency: "￥",
        deletable: false,
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

  export function read(
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
}
