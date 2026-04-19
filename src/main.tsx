import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./global.css";
import { ExpensesView } from "./pages/ExpensesView";
import { STORE_VERIFIER } from "./utils/consts";

const CategoriesView = lazy(() =>
  import("./pages/CategoriesView").then((m) => ({
    default: m.CategoriesView,
  })),
);
const ExchangeView = lazy(() =>
  import("./pages/ExchangeView").then((m) => ({
    default: m.ExchangeView,
  })),
);
const RecurrenceView = lazy(() =>
  import("./pages/RecurrenceView").then((m) => ({
    default: m.RecurrenceView,
  })),
);
const SettingsView = lazy(() =>
  import("./pages/SettingsView").then((m) => ({
    default: m.SettingsView,
  })),
);
const SynonymsView = lazy(() =>
  import("./pages/SynonymsView").then((m) => ({
    default: m.SynonymsView,
  })),
);
const WalletsView = lazy(() =>
  import("./pages/WalletsView").then((m) => ({
    default: m.WalletsView,
  })),
);
const ChartsView = lazy(() =>
  import("./pages/ChartsView").then((m) => ({
    default: m.ChartsView,
  })),
);
const SyncView = lazy(() =>
  import("./pages/SyncView").then((m) => ({
    default: m.SyncView,
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
    element: withRouteFallback(<CategoriesView />),
  },
  {
    path: "/wallets",
    element: withRouteFallback(<WalletsView />),
  },
  {
    path: "/recurrence",
    element: withRouteFallback(<RecurrenceView />),
  },
  {
    path: "/charts",
    element: withRouteFallback(<ChartsView />),
  },
  {
    path: "/exchange",
    element: withRouteFallback(<ExchangeView />),
  },
  {
    path: "/synonyms",
    element: withRouteFallback(<SynonymsView />),
  },
  {
    path: "/settings",
    element: withRouteFallback(<SettingsView />),
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
