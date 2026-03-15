import { KEY_SETTINGS, ViewMode } from "../utils/consts";

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
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  }

  export function write(data: Settings) {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(data));
  }
}
