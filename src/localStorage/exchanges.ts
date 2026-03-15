import { STORE_EXCHANGES } from "../utils/consts";

export namespace Exchanges {
  export type Exchange = {
    id: string;
    fromWalletId: string;
    toWalletId: string;
    fromAmount: number;
    toAmount: number;
    timestamp: number;
    description?: string;
  };

  export function readAll(): Exchange[] {
    const storage = localStorage.getItem(STORE_EXCHANGES);
    if (!storage) {
      return [];
    }
    return JSON.parse(storage) as Exchange[];
  }

  export function readById(id: string): Exchange | undefined {
    return readAll().find((e) => e.id === id);
  }

  export function readRange(
    exchanges: Exchange[],
    startTime: number,
    endTime: number,
    walletId?: string,
  ): Exchange[] {
    return exchanges.filter(
      (e) =>
        e.timestamp >= startTime &&
        e.timestamp < endTime &&
        (!walletId || e.fromWalletId === walletId || e.toWalletId === walletId),
    );
  }

  export async function write(data: Exchange) {
    const exchanges = readAll();
    const idx = exchanges.findIndex((e) => e.id === data.id);
    if (idx !== -1) {
      exchanges[idx] = data;
    } else {
      exchanges.push(data);
    }
    localStorage.setItem(STORE_EXCHANGES, JSON.stringify(exchanges));
  }

  export function remove(id: string) {
    const exchanges = readAll();
    const filtered = exchanges.filter((e) => e.id !== id);
    localStorage.setItem(STORE_EXCHANGES, JSON.stringify(filtered));
  }

  export async function writeAll(exchanges: Exchange[]) {
    localStorage.setItem(STORE_EXCHANGES, JSON.stringify(exchanges));
  }
}
