import { STORE_CATEGORIES } from "../utils/consts";
import { getUuid } from "../utils/utils";

export namespace Categories {
  export type Category = {
    id: string; // uuid
    name: string;
    color: string; // #rrggbb
    deletable: boolean;
  };

  export function writeDefault() {
    if (!localStorage.getItem(STORE_CATEGORIES)) {
      localStorage.setItem(
        STORE_CATEGORIES,
        JSON.stringify([
          {
            id: getUuid(),
            name: "Others",
            color: "#cccccc",
            deletable: false,
          },
        ])
      );
    }
  }

  export function readAll() {
    const storage = localStorage.getItem(STORE_CATEGORIES);
    if (!storage) {
      return [];
    }
    return JSON.parse(storage) as Category[];
  }

  export function readById(id: string) {
    const categories = readAll();
    return categories.find((category) => category.id === id);
  }

  export async function write(data: Category) {
    const categories = readAll();
    const findIndex = categories.findIndex((category) => category.id === data.id);
    if (findIndex !== -1) {
      categories[findIndex] = data;
    } else {
      categories.push(data);
    }
    localStorage.setItem(STORE_CATEGORIES, JSON.stringify(categories));
  }

  export function remove(id: string) {
    const categories = readAll();
    const filtered = categories.filter((category) => category.id !== id);
    localStorage.setItem(STORE_CATEGORIES, JSON.stringify(filtered));
  }
}
