import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./global.css";
import { CategoriesView } from "./pages/CategoriesView";
import { ExchangeView } from "./pages/ExchangeView";
import { ExpensesView } from "./pages/ExpensesView";
import { RecurrenceView } from "./pages/RecurrenceView";
import { SettingsView } from "./pages/SettingsView";
import { SynonymsView } from "./pages/SynonymsView";
import { WalletsView } from "./pages/WalletsView";
import { STORE_VERIFIER } from "./utils/consts";

const ChartsView = lazy(() =>
  import("./pages/ChartsView").then((module) => ({
    default: module.ChartsView,
  })),
);
const SyncView = lazy(() =>
  import("./pages/SyncView").then((module) => ({
    default: module.SyncView,
  })),
);

function withRouteFallback(element: React.ReactElement) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="spinner" />
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <ExpensesView />,
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
    path: "/recurrence",
    element: <RecurrenceView />,
  },
  {
    path: "/charts",
    element: withRouteFallback(<ChartsView />),
  },
  {
    path: "/exchange",
    element: <ExchangeView />,
  },
  {
    path: "/synonyms",
    element: <SynonymsView />,
  },
  {
    path: "/settings",
    element: <SettingsView />,
  },
  {
    path: "/sync",
    element: withRouteFallback(<SyncView />),
  },
]);

function renderApp() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("authorizationCode")) {
  import("./endpoints/oauth")
    .then(({ oAuthSdk }) =>
      oAuthSdk.authorize(localStorage.getItem(STORE_VERIFIER) as string),
    )
    .then((resp) => {
      console.log(resp);
      window.location.replace("/");
    })
    .catch((err) => {
      console.log(err);
    });
} else {
  renderApp();
}
