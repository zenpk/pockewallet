import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./global.css";
import "./markdown.css";
import { DataView } from "./pages/DataView";
import { Wallets } from "./pages/Wallets";
import { Settings } from "./pages/Settings";
import { DbProvider } from "./contexts/Db";

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
