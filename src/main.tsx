import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { DbProvider } from "./contexts/Db";
import "./global.css";
import { DataView } from "./pages/DataView";
import { WalletsView } from "./pages/WalletsView";
import { SettingsView } from "./pages/SettingsView";
import { CategoriesView } from "./pages/CategoriesView";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DataView />,
  },
  {
    path: "/categories",
    element: <CategoriesView />,
  },
  {
    path: "/wallets",
    element: <WalletsView />,
  },
  {
    path: "/settings",
    element: <SettingsView />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <DbProvider>
        <RouterProvider router={router} />
      </DbProvider>
    </ChakraProvider>
  </React.StrictMode>
);
