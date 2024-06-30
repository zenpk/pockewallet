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
    return (
      JSON.parse(localStorage.getItem(KEY_SETTINGS) || "{}") || defaultSettings
    );
  }

  export function write(data: Settings) {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(data));
  }
}
