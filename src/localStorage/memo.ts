import { STORE_MEMO } from "../utils/consts";

export namespace Memo {
  export function read(): string {
    return localStorage.getItem(STORE_MEMO) ?? "";
  }

  export function write(text: string) {
    localStorage.setItem(STORE_MEMO, text);
  }

  export function clear() {
    localStorage.removeItem(STORE_MEMO);
  }
}
