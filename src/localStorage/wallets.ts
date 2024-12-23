import { STORE_WALLETS } from "../utils/consts";
import { getUuid } from "../utils/utils";

export namespace Wallets {
  export type Wallet = {
    id: string; // uuid
    name: string;
    currency?: string; // $ € £ ￥
    deletable: boolean;
  };

  export function writeDefault() {
    if (!localStorage.getItem(STORE_WALLETS)) {
      localStorage.setItem(
        STORE_WALLETS,
        JSON.stringify([
          {
            id: getUuid(),
            name: "Default",
            deletable: false,
          },
        ]),
      );
    }
    // check corrupted data
    const wallets = readAll();
    const idSet = new Set<string>();
    for (const wallet of wallets) {
      if (idSet.has(wallet.id)) {
        console.log("wallets have corrupted data");
        localStorage.removeItem(STORE_WALLETS);
        writeDefault();
        break;
      }
      idSet.add(wallet.id);
    }
  }

  export function readAll() {
    const storage = localStorage.getItem(STORE_WALLETS);
    if (!storage) {
      return [];
    }
    return JSON.parse(storage) as Wallet[];
  }

  export function readById(id: string) {
    const wallets = readAll();
    return wallets.find((wallet) => wallet.id === id);
  }

  export async function write(data: Wallet) {
    const wallets = readAll();
    const findIndex = wallets.findIndex((wallet) => wallet.id === data.id);
    if (findIndex !== -1) {
      wallets[findIndex] = data;
    } else {
      wallets.push(data);
    }
    localStorage.setItem(STORE_WALLETS, JSON.stringify(wallets));
  }

  export function remove(id: string) {
    const wallets = readAll();
    const filtered = wallets.filter((wallet) => wallet.id !== id);
    localStorage.setItem(STORE_WALLETS, JSON.stringify(filtered));
  }

  export async function writeAll(wallets: Wallet[]) {
    localStorage.setItem(STORE_WALLETS, JSON.stringify(wallets));
  }
}
