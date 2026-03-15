import { STORE_SETTINGS, ViewMode } from "../utils/consts";

export namespace Settings {
  export type Settings = {
    displayCurrency: boolean;
    displayDate: boolean;
    displayConciseDate: boolean;
    combineDate: boolean;
    defaultWallet: string;
    defaultViewMode: ViewMode;
  };

  const defaultSettings: Settings = {
    displayCurrency: true,
    displayDate: true,
    displayConciseDate: true,
    combineDate: true,
    defaultWallet: "",
    defaultViewMode: ViewMode.Daily,
  };

  export function read(): Settings {
    const raw = localStorage.getItem(STORE_SETTINGS);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  }

  export function write(data: Settings) {
    localStorage.setItem(STORE_SETTINGS, JSON.stringify(data));
  }
}
