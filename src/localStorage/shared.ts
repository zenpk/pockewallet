import { Categories } from "./categories";
import { Wallets } from "./wallets";

export function openDb() {
  Categories.writeDefault();
  Wallets.writeDefault();
}
