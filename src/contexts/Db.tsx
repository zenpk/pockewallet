import React, { SetStateAction } from "react";

export const dbContext = React.createContext<
  | [IDBDatabase | null, React.Dispatch<SetStateAction<IDBDatabase | null>>]
  | null
>(null);

export function DbProvider({ children }: { children: React.ReactNode }) {
  const defaultValue = React.useState<IDBDatabase | null>(null);
  return (
    <dbContext.Provider value={defaultValue}>{children}</dbContext.Provider>
  );
}
