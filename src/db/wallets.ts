import { getUuid } from "../utils/utils";
import { STORE_WALLETS } from "./consts";

namespace Wallets {
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
}
