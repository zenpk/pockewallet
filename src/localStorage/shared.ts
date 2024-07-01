import { Wallets } from "./wallets";
import { Categories } from "./categories";

export function openDb() {
  Categories.writeDefault();
  Wallets.writeDefault();
}
