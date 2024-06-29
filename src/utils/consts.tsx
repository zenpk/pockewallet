import {
  BiCart,
  BiDollar,
  BiDonateHeart,
  BiDrink,
  BiFork,
  BiInfoCircle,
  BiSolidPhoneCall,
  BiSolidPlaneTakeOff,
  BiStore,
  BiTrain,
} from "react-icons/bi";

export const DB_VERSION = 1;
export const DB_NAME = "MyDatabase";

export const STORE_EXPENSES = "Expenses";
export const STORE_CATEGORIES = "Categories";
export const STORE_WALLETS = "Wallets";

export const iconMap = {
  shopping: <BiCart />,
  currency: <BiDollar />,
  donation: <BiDonateHeart />,
  drink: <BiDrink />,
  food: <BiFork />,
  others: <BiInfoCircle />,
  phone: <BiSolidPhoneCall />,
  travel: <BiSolidPlaneTakeOff />,
  store: <BiStore />,
  transport: <BiTrain />,
};

export enum ViewMode {
  Daily = "Daily",
  Monthly = "Monthly",
  Yearly = "Yearly",
  AllTime = "All Time",
}
