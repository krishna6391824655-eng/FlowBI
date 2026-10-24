import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

import { DataProvider } from "./DataContext";

const Datasets = lazy(() => import("./components/Datasets"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PipelineBuilder = lazy(() => import("./components/PipelineBuilder"));
const Landing = lazy(() => import("./pages/Landing"));
const AnalyticsPage = lazy(() => import("./pages/WorkspacePages").then((module) => ({ default: module.AnalyticsPage })));
const HistoryPage = lazy(() => import("./pages/WorkspacePages").then((module) => ({ default: module.HistoryPage })));
const InsightsPage = lazy(() => import("./pages/WorkspacePages").then((module) => ({ default: module.InsightsPage })));
const SettingsPage = lazy(() => import("./pages/WorkspacePages").then((module) => ({ default: module.SettingsPage })));

// Protect application routes
function ProtectedRoute() {
  const hasSession = Boolean(
    localStorage.getItem("userId") && localStorage.getItem("access_token")
  );

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function SessionExpiry() {
  useEffect(() => {
    let timer;
    const verifyExpiry = () => {
      window.clearTimeout(timer);
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const payloadPart = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(window.atob(payloadPart));
        const remaining = Number(payload.exp) * 1000 - Date.now();
        if (!Number.isFinite(remaining) || remaining <= 0) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          window.dispatchEvent(new Event("flowbi-user-changed"));
          if (window.location.pathname !== "/login") window.location.replace("/login");
          return;
        }
        timer = window.setTimeout(verifyExpiry, remaining);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        window.dispatchEvent(new Event("flowbi-user-changed"));
        if (window.location.pathname !== "/login") window.location.replace("/login");
      }
    };
    verifyExpiry();
    window.addEventListener("flowbi-user-changed", verifyExpiry);
    window.addEventListener("storage", verifyExpiry);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("flowbi-user-changed", verifyExpiry);
      window.removeEventListener("storage", verifyExpiry);
    };
  }, []);
  return null;
}

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <SessionExpiry />
        <Suspense fallback={<main className="page-loading" role="status">Loading FlowBI…</main>}>
          <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Application Pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/pipeline" element={<PipelineBuilder />} />
          </Route>

          {/* Unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
