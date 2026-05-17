import { Categories } from "./categories";
import { Wallets } from "./wallets";

export function openDb() {
  const categories = Categories.writeDefault();
  const wallets = Wallets.writeDefault();
  return { categories, wallets };
}
