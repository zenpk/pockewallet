import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { DbProvider } from "./contexts/Db";
import "./global.css";
import { DataView } from "./pages/DataView";
import { Settings } from "./pages/Settings";
import { Wallets } from "./pages/Wallets";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DataView />,
  },
  {
    path: "/wallets",
    element: <Wallets />,
  },
  {
    path: "/settings",
    element: <Settings />,
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
