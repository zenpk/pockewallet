import { Dispatch, SetStateAction } from "react";
import { STORE_CATEGORIES } from "../utils/consts";
import { getUuid } from "../utils/utils";

export namespace Categories {
  export type Category = {
    id: string; // uuid
    name: string;
    color: string; // #rrggbb
    icon: string;
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
        icon: "others",
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

  export function read(
    db: IDBDatabase,
    setData: Dispatch<SetStateAction<Category[]>>
  ) {
    const transaction = db.transaction([STORE_CATEGORIES], "readonly");
    const store = transaction.objectStore(STORE_CATEGORIES);
    const cursorRequest = store.openCursor();

    cursorRequest.onerror = function (event) {
      throw new Error("Error reading categories: " + JSON.stringify(event));
    };

    const result: Category[] = [];
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

  export function readById(
    db: IDBDatabase,
    id: string,
    setData: Dispatch<SetStateAction<Category | null>>
  ) {
    const transaction = db.transaction([STORE_CATEGORIES], "readonly");
    const store = transaction.objectStore(STORE_CATEGORIES);
    const request = store.get(id);
    request.onsuccess = function (event) {
      setData(request.result);
    };
    request.onerror = function (event) {
      throw new Error("Error reading category by id: " + JSON.stringify(event));
    };
  }
}
