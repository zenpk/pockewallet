import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./global.css";
import { CategoriesView } from "./pages/CategoriesView";
import { DataView } from "./pages/DataView";
import { SettingsView } from "./pages/SettingsView";
import { WalletsView } from "./pages/WalletsView";

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
      <RouterProvider router={router} />
    </ChakraProvider>
  </React.StrictMode>
);
