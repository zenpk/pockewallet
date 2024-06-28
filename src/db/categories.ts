import { getUuid } from "../utils/utils";
import { STORE_CATEGORIES } from "./consts";

namespace Categories {
  export type Category = {
    id: string; // uuid
    name: string;
    color: string; // #rrggbb
    deletable: boolean;
  };

  export function writeDefault(db: IDBDatabase) {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_CATEGORIES], "readwrite");
      const store = transaction.objectStore(STORE_CATEGORIES);
      const defaultCategory: Category = {
        id: getUuid(),
        name: "Others",
        color: "#cccccc",
        deletable: false,
      };
      const request = store.add(defaultCategory);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (event) {
        reject("Error writing default category data: " + JSON.stringify(event));
      };
    });
  }
}
