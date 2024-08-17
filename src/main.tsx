import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./global.css";
import { CategoriesView } from "./pages/CategoriesView";
import { DataView } from "./pages/DataView";
import { SettingsView } from "./pages/SettingsView";
import { WalletsView } from "./pages/WalletsView";
import { oAuthSdk } from "./endpoints/oauth";
import { STORE_VERIFIER } from "./utils/consts";
import { ChartsView } from "./pages/ChartsView";

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
    path: "/charts",
    element: <ChartsView />,
  },
  {
    path: "/settings",
    element: <SettingsView />,
  },
]);

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("authorizationCode")) {
  oAuthSdk
    .authorize(localStorage.getItem(STORE_VERIFIER) as string)
    .then((resp) => {
      console.log(resp);
      window.location.replace("/");
    })
    .catch((err) => {
      console.log(err);
    });
} else {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ChakraProvider>
        <RouterProvider router={router} />
      </ChakraProvider>
    </React.StrictMode>
  );
}
