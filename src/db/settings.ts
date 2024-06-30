import { KEY_SETTINGS, ViewMode } from "../utils/consts";

export namespace Settings {
  export type Settings = {
    displayCurrency: boolean;
    displayDate: boolean;
    defaultWallet: string;
    defaultViewMode: ViewMode;
  };

  const defaultSettings: Settings = {
    displayCurrency: true,
    displayDate: false,
    defaultWallet: "",
    defaultViewMode: ViewMode.Monthly,
  };

  export function read(): Settings {
    const data = localStorage.getItem(KEY_SETTINGS);
    return data ? JSON.parse(data) : defaultSettings;
  }

  export function write(data: Settings) {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(data));
  }
}
