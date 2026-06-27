import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./global.css";
import { ExpensesView } from "./pages/ExpensesView";
import { STORE_OAUTH_STATE, STORE_VERIFIER } from "./utils/consts";
performance.mark("entry-modules-loaded");

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
const MemoView = lazy(() =>
  import("./pages/MemoView").then((m) => ({
    default: m.MemoView,
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
    path: "/memo",
    element: withRouteFallback(<MemoView />),
  },
  {
    path: "/sync",
    element: withRouteFallback(<SyncView />),
  },
  {
    path: "/settings",
    element: withRouteFallback(<SettingsView />),
  },
]);

function renderApp() {
  performance.mark("render-called");
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}

const urlParams = new URLSearchParams(window.location.search);
const callbackCode = urlParams.get("code");
if (callbackCode) {
  const verifier = localStorage.getItem(STORE_VERIFIER) ?? "";
  const expectedState = localStorage.getItem(STORE_OAUTH_STATE) ?? "";
  const state = urlParams.get("state") ?? "";
  const redirectUri = (import.meta.env.VITE_REDIRECT as string) || window.location.origin;

  if (!verifier || !state || state !== expectedState) {
    localStorage.removeItem(STORE_VERIFIER);
    localStorage.removeItem(STORE_OAUTH_STATE);
    window.history.replaceState({}, "", "/");
    renderApp();
  } else {
    import("./endpoints/oauth")
      .then(({ oAuthSdk }) =>
        oAuthSdk.authorize({
          codeVerifier: verifier,
          code: callbackCode,
          state: state,
          redirectUri: redirectUri,
        }),
      )
      .then(() => {
        localStorage.removeItem(STORE_VERIFIER);
        localStorage.removeItem(STORE_OAUTH_STATE);
        window.location.replace("/");
      })
      .catch(() => {
        localStorage.removeItem(STORE_VERIFIER);
        localStorage.removeItem(STORE_OAUTH_STATE);
        window.history.replaceState({}, "", "/");
        renderApp();
      });
  }
} else {
  renderApp();
}
