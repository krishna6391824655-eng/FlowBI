import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useData } from "../useData";
import "../components/Dashboard.css";
import "./Insights.css";
import "./WorkspacePages.css";
import { applyTheme, getThemePreference } from "../theme";
import { API_URL } from "../api";
import PasswordField from "../components/PasswordField";

const dateText = (value) => value ? new Date(value).toLocaleString() : "—";

function WorkspaceLayout({ title, subtitle, children }) {
  return <div className="dashboard-layout workspace-shell"><Sidebar /><main className="dashboard workspace-dashboard"><div className="workspace-topline"><div><p className="hero-eyebrow">FLOWBI WORKSPACE</p><h1>{title}</h1><p className="workspace-subtitle">{subtitle}</p></div></div><div className="workspace-content">{children}</div></main></div>;
}

const normalizeRun = (run) => ({
  ...run,
  datasetName: run.dataset_name ?? run.datasetName ?? "Dataset",
  timestamp: run.created_at ?? run.timestamp,
  originalRows: Number(run.original_rows ?? run.originalRows ?? 0),
  finalRows: Number(run.final_rows ?? run.finalRows ?? 0),
  duplicatesRemoved: Number(run.duplicates_removed ?? run.duplicatesRemoved ?? 0),
  missingHandled: Number(run.missing_values_handled ?? run.missingHandled ?? run.missing_values ?? 0),
  operations: Array.isArray(run.operations) ? run.operations : [],
});

function usePipelineHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch(`${API_URL}/pipelines/history`, { headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` } });
        if (response.status === 401) {
          localStorage.removeItem("access_token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail");
          window.dispatchEvent(new Event("flowbi-user-changed")); window.location.replace("/login"); return;
        }
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || "Could not load pipeline history.");
        if (active) { setHistory(Array.isArray(result) ? result.map(normalizeRun) : []); setError(""); }
      } catch (err) { if (active) setError(err.message || "Could not load pipeline history."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  return { history, setHistory, loading, error, setError };
}

function HistoryPage() {
  const { clearHistory, removeRun } = useData();
  const { history, setHistory, loading, error, setError } = usePipelineHistory();
  const [search, setSearch] = useState("");
  const [selectedRun, setSelectedRun] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const visibleHistory = history.filter((run) => `${run.datasetName} ${run.operations.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const viewRun = async (runId) => {
    setDetailLoading(true);
    setDetailError("");
    setSelectedRun(null);
    try {
      const response = await fetch(`${API_URL}/pipelines/${runId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { localStorage.removeItem("access_token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail"); window.dispatchEvent(new Event("flowbi-user-changed")); window.location.replace("/login"); return; }
      if (!response.ok) throw new Error(result.detail || "Could not load run details.");
      setSelectedRun(result);
    } catch (err) { setDetailError(err.message || "Could not load run details."); }
    finally { setDetailLoading(false); }
  };
  const deleteRun = async (runId) => {
    if (!window.confirm("Delete this pipeline run from your history?")) return;
    const response = await fetch(`${API_URL}/pipelines/${runId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
    });
    if (response.status === 401) { localStorage.removeItem("access_token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail"); window.dispatchEvent(new Event("flowbi-user-changed")); window.location.replace("/login"); return; }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.detail || "Could not delete this run."); return; }
    setHistory((items) => items.filter((item) => item.id !== runId));
    removeRun(runId);
  };
  const clearAll = async () => {
    if (!window.confirm("Clear all pipeline run history?")) return;
    const response = await fetch(`${API_URL}/pipelines/history`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401) { localStorage.removeItem("access_token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail"); window.dispatchEvent(new Event("flowbi-user-changed")); window.location.replace("/login"); return; }
    if (!response.ok) { setError(result.detail || "Could not clear history."); return; }
    setHistory([]);
    clearHistory();
  };
  return <WorkspaceLayout title="Run history" subtitle="Your pipeline activity, saved runs, and data processing results in one place.">
    {error && <p className="workspace-alert" role="alert">{error}</p>}
    {!loading && history.length > 0 && <>
      <section className="history-toolbar"><div><span className="workspace-kicker">ACTIVITY LOG</span><h2>{history.length} saved {history.length === 1 ? "run" : "runs"}</h2></div><div className="history-tools"><label className="history-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dataset or step" aria-label="Search run history" /></label><button className="workspace-button danger-button" onClick={clearAll}>Clear history</button></div></section>
      <section className="history-summary"><article><span>Total runs</span><strong>{history.length}</strong><small>All saved pipeline executions</small></article><article><span>Rows processed</span><strong>{history.reduce((sum, run) => sum + run.finalRows, 0).toLocaleString()}</strong><small>Across your recent runs</small></article><article><span>Duplicates removed</span><strong>{history.reduce((sum, run) => sum + run.duplicatesRemoved, 0).toLocaleString()}</strong><small>Data quality improvements</small></article></section>
      {visibleHistory.length ? <div className="history-list">{visibleHistory.map((run) => <article className="history-run" key={run.id}><div className="run-icon">▦</div><div className="run-main"><div className="run-title-row"><div><h3>{run.datasetName}</h3><p>{dateText(run.timestamp)}</p></div><span className="run-status"><i />{run.status || "Completed"}</span></div><div className="run-metrics"><span><strong>{run.originalRows.toLocaleString()}</strong> input rows</span><b>→</b><span><strong>{run.finalRows.toLocaleString()}</strong> output rows</span><span><strong>{run.duplicatesRemoved.toLocaleString()}</strong> duplicates removed</span><span><strong>{run.missingHandled.toLocaleString()}</strong> missing handled</span></div><div className="run-steps"><span>PIPELINE STEPS</span>{run.operations.length ? run.operations.map((step, index) => <Fragment key={`${step}-${index}`}>{index > 0 && <b>›</b>}<em>{step.replaceAll("-", " ")}</em></Fragment>) : <em>No processing steps</em>}</div></div><div className="run-actions"><button className="workspace-button" onClick={() => viewRun(run.id)}>View details</button><button className="icon-action" onClick={() => deleteRun(run.id)} aria-label={`Delete run for ${run.datasetName}`} title="Delete run">⌫</button></div></article>)}</div> : <div className="workspace-empty"><span>⌕</span><h2>No matching runs</h2><p>Try another dataset name or pipeline step.</p></div>}
    </>}
    {loading && <div className="workspace-empty"><span className="loading-mark">◌</span><h2>Loading your history</h2><p>Fetching your latest pipeline runs…</p></div>}
    {!loading && !history.length && <div className="workspace-empty"><span>◷</span><h2>No runs yet</h2><p>Run a pipeline to see its results and processing steps here.</p><Link className="workspace-button primary-button" to="/pipeline">Open pipeline <b>→</b></Link></div>}
    {(detailLoading || detailError || selectedRun) && <div className="run-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelectedRun(null); setDetailError(""); } }}><section className="run-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="run-detail-title"><header><div><span className="workspace-kicker">SAVED PIPELINE RUN</span><h2 id="run-detail-title">{selectedRun?.dataset_name || (detailLoading ? "Loading run details…" : "Run details")}</h2></div><button className="icon-action" onClick={() => { setSelectedRun(null); setDetailError(""); }} aria-label="Close run details">×</button></header>{detailLoading ? <p>Loading saved output…</p> : detailError ? <p className="workspace-alert">{detailError}</p> : selectedRun && <><p className="run-detail-date">{dateText(selectedRun.created_at)} · {selectedRun.status}</p><div className="run-detail-metrics"><span><small>Input rows</small><strong>{selectedRun.original_rows}</strong></span><span><small>Output rows</small><strong>{selectedRun.final_rows}</strong></span><span><small>Duplicates removed</small><strong>{selectedRun.duplicates_removed}</strong></span><span><small>Missing handled</small><strong>{selectedRun.missing_values_handled}</strong></span></div><div className="run-detail-steps"><strong>Steps</strong>{(selectedRun.operations || []).map((step, index) => <em key={`${step}-${index}`}>{step.replaceAll("-", " ")}</em>)}</div>{selectedRun.result?.statistics?.columnStats?.length > 0 && <section className="run-detail-section"><h3>Statistics</h3><div className="run-detail-table-wrap"><table className="run-detail-table"><thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Unique</th><th>Mean</th></tr></thead><tbody>{selectedRun.result.statistics.columnStats.map((item) => <tr key={item.column}><td>{item.column}</td><td>{item.type}</td><td>{item.missing}</td><td>{item.unique}</td><td>{item.mean ?? "—"}</td></tr>)}</tbody></table></div></section>}{selectedRun.result?.visualization?.data?.length > 0 && <section className="run-detail-section"><h3>Visualization data · {selectedRun.result.visualization.chart_type}</h3><div className="run-detail-table-wrap"><table className="run-detail-table"><thead><tr><th>{selectedRun.result.visualization.x_column || "X"}</th><th>{selectedRun.result.visualization.y_column || "Y"}</th></tr></thead><tbody>{selectedRun.result.visualization.data.slice(0, 20).map((item, index) => <tr key={`${item.category ?? item.x}-${index}`}><td>{item.category ?? item.x}</td><td>{item.value ?? item.y}</td></tr>)}</tbody></table></div></section>}{selectedRun.result?.preview?.length > 0 ? <section className="run-detail-section"><h3>Processed data preview</h3><div className="run-detail-table-wrap"><table className="run-detail-table"><thead><tr>{Object.keys(selectedRun.result.preview[0]).map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{selectedRun.result.preview.slice(0, 25).map((row, index) => <tr key={index}>{Object.values(row).map((value, cellIndex) => <td key={cellIndex}>{String(value ?? "")}</td>)}</tr>)}</tbody></table></div><small>Showing up to 25 of {Math.min(selectedRun.final_rows, 100)} saved preview rows.</small></section> : <p className="run-detail-legacy">This run was saved before detailed outputs were enabled, so only its summary is available.</p>}</>}</section></div>}
  </WorkspaceLayout>;
}

function AnalyticsPage() {
  const { datasets } = useData();
  const { history, loading, error } = usePipelineHistory();
  const rowsProcessed = history.reduce((sum, item) => sum + item.finalRows, 0);
  const duplicatesRemoved = history.reduce((sum, item) => sum + item.duplicatesRemoved, 0);
  const missingHandled = history.reduce((sum, item) => sum + item.missingHandled, 0);
  const bars = history.slice(0, 7).reverse();
  const maxRows = Math.max(1, ...bars.map((run) => run.finalRows));
  return <WorkspaceLayout title="Analytics" subtitle="A clear snapshot of your datasets and pipeline performance.">
    {error && <p className="workspace-alert" role="alert">{error}</p>}
    <section className="analytics-welcome"><div><span className="workspace-kicker">WORKSPACE OVERVIEW</span><h2>Your data at a glance</h2><p>Track processed rows, quality improvements, and recent pipeline activity.</p></div><Link className="workspace-button primary-button" to="/pipeline">New pipeline run <b>→</b></Link></section>
    <section className="analytics-metrics"><article className="analytics-metric"><span className="metric-icon violet">▦</span><div><small>DATASETS</small><strong>{datasets.length.toLocaleString()}</strong><p>Available in your workspace</p></div></article><article className="analytics-metric"><span className="metric-icon blue">↗</span><div><small>PIPELINE RUNS</small><strong>{loading ? "—" : history.length.toLocaleString()}</strong><p>Saved completed runs</p></div></article><article className="analytics-metric"><span className="metric-icon green">▤</span><div><small>ROWS PROCESSED</small><strong>{loading ? "—" : rowsProcessed.toLocaleString()}</strong><p>Total output rows</p></div></article><article className="analytics-metric"><span className="metric-icon amber">✦</span><div><small>DUPLICATES REMOVED</small><strong>{loading ? "—" : duplicatesRemoved.toLocaleString()}</strong><p>{missingHandled.toLocaleString()} missing values handled</p></div></article></section>
    <section className="analytics-grid"><article className="analytics-panel activity-chart"><div className="panel-heading"><div><span className="workspace-kicker">PIPELINE PERFORMANCE</span><h2>Rows processed</h2></div><span className="panel-period">Last {bars.length} runs</span></div>{loading ? <div className="chart-empty">Loading activity…</div> : bars.length ? <div className="bar-chart" aria-label="Rows processed in recent pipeline runs">{bars.map((run) => <div className="bar-column" key={run.id}><span className="bar-value">{run.finalRows.toLocaleString()}</span><div className="bar-track"><i style={{ height: `${Math.max(8, (run.finalRows / maxRows) * 100)}%` }} /></div><small>{new Date(run.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></div>)}</div> : <div className="chart-empty"><span>▥</span><p>Your pipeline activity will appear here.</p><Link to="/pipeline">Run a pipeline →</Link></div>}</article>
      <article className="analytics-panel quality-panel"><div className="panel-heading"><div><span className="workspace-kicker">DATA QUALITY</span><h2>Improvements made</h2></div><span className="quality-icon">✓</span></div><div className="quality-row"><span><i className="quality-dot purple-dot" />Duplicates removed</span><strong>{loading ? "—" : duplicatesRemoved.toLocaleString()}</strong></div><div className="quality-row"><span><i className="quality-dot blue-dot" />Missing values handled</span><strong>{loading ? "—" : missingHandled.toLocaleString()}</strong></div><div className="quality-note">Totals are calculated from your saved pipeline runs.</div></article></section>
    <section className="analytics-panel recent-panel"><div className="panel-heading"><div><span className="workspace-kicker">LATEST WORK</span><h2>Recent activity</h2></div><Link to="/history">View all history <b>→</b></Link></div>{loading ? <p className="recent-empty">Loading recent runs…</p> : history.length ? <div className="recent-list">{history.slice(0, 5).map((run) => <article className="recent-run" key={run.id}><span className="recent-run-icon">▦</span><div><strong>{run.datasetName}</strong><small>{dateText(run.timestamp)} · {run.operations.length ? run.operations.map((step) => step.replaceAll("-", " ")).join(" · ") : "No processing steps"}</small></div><span className="recent-rows">{run.finalRows.toLocaleString()} <small>rows</small></span></article>)}</div> : <div className="recent-empty"><p>No pipeline activity yet.</p><Link to="/pipeline">Run your first pipeline →</Link></div>}</section>
  </WorkspaceLayout>;
}

function SettingsPage() {
  const { datasets, clearHistory } = useData();
  const userId = localStorage.getItem("userId");
  const [profile, setProfile] = useState({ name: "", email: localStorage.getItem("userEmail") || "" });
  const [savedDatasetCount, setSavedDatasetCount] = useState(datasets.length);
  const [savedRuns, setSavedRuns] = useState([]);
  const [theme, setTheme] = useState(getThemePreference);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [clearing, setClearing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const authHeaders = { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` };
    Promise.all([
      fetch(`${API_URL}/users/me`, { headers: authHeaders, signal: controller.signal }),
      fetch(`${API_URL}/datasets`, { headers: authHeaders, signal: controller.signal }),
      fetch(`${API_URL}/pipelines/history`, { headers: authHeaders, signal: controller.signal }),
    ]).then(async ([profileResponse, datasetsResponse, runsResponse]) => {
      if ([profileResponse, datasetsResponse, runsResponse].some((response) => response.status === 401)) {
        localStorage.removeItem("access_token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail");
        window.dispatchEvent(new Event("flowbi-user-changed")); window.location.replace("/login"); return;
      }
      const [profileResult, datasetsResult, runsResult] = await Promise.all([
        profileResponse.json(), datasetsResponse.json(), runsResponse.json(),
      ]);
      if (!profileResponse.ok) throw new Error(profileResult.detail || "Could not load your profile.");
      if (!datasetsResponse.ok) throw new Error(datasetsResult.detail || "Could not load your workspace datasets.");
      if (!runsResponse.ok) throw new Error(runsResult.detail || "Could not load your run history.");
      if (controller.signal.aborted) return;
      setProfile({ name: profileResult.name || "", email: profileResult.email || "" });
      localStorage.setItem("userEmail", profileResult.email || "");
      setSavedDatasetCount(Array.isArray(datasetsResult) ? datasetsResult.length : 0);
      setSavedRuns(Array.isArray(runsResult) ? runsResult.map(normalizeRun) : []);
    }).catch((error) => {
      if (error.name !== "AbortError" && !controller.signal.aborted) setSettingsMessage(error.message || "Could not load account settings.");
    }).finally(() => { if (!controller.signal.aborted) setSettingsLoading(false); });
    return () => controller.abort();
  }, []);
  let sessionText = "Active";
  try {
    const token = localStorage.getItem("access_token");
    const payload = JSON.parse(window.atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp) sessionText = `Expires ${new Date(payload.exp * 1000).toLocaleString()}`;
  } catch { sessionText = "Active in this browser"; }
  const updateTheme = (value) => { setTheme(value); applyTheme(value); setSettingsMessage("Appearance preference saved."); };
  const saveProfile = async (event) => {
    event.preventDefault(); setSavingProfile(true); setSettingsMessage("");
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
        body: JSON.stringify({ name: profile.name, email: profile.email }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { localStorage.removeItem("access_token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail"); window.dispatchEvent(new Event("flowbi-user-changed")); window.location.replace("/login"); return; }
      if (!response.ok) throw new Error(result.detail || "Could not update your profile.");
      setProfile({ name: result.name, email: result.email }); localStorage.setItem("userEmail", result.email); setSettingsMessage("Profile changes saved.");
    } catch (error) { setSettingsMessage(error.message || "Could not update your profile."); }
    finally { setSavingProfile(false); }
  };
  const changePassword = async (event) => {
    event.preventDefault(); setPasswordMessage("");
    if (passwordForm.new_password !== passwordForm.confirm_password) { setPasswordMessage("New passwords do not match."); return; }
    setChangingPassword(true);
    try {
      const response = await fetch(`${API_URL}/users/me/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
        body: JSON.stringify({ current_password: passwordForm.current_password, new_password: passwordForm.new_password }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { localStorage.removeItem("access_token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail"); window.dispatchEvent(new Event("flowbi-user-changed")); window.location.replace("/login"); return; }
      if (!response.ok) throw new Error(result.detail || "Could not change password.");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordMessage("Password changed successfully.");
    } catch (error) { setPasswordMessage(error.message || "Could not change password."); }
    finally { setChangingPassword(false); }
  };
  const clearRunHistory = async () => {
    if (!window.confirm("Delete all saved pipeline runs? This action cannot be undone.")) return;
    setClearing(true); setSettingsMessage("");
    try {
      const response = await fetch(`${API_URL}/pipelines/history`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` } });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { localStorage.removeItem("access_token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail"); window.dispatchEvent(new Event("flowbi-user-changed")); window.location.replace("/login"); return; }
      if (!response.ok) throw new Error(result.detail || "Could not clear run history.");
      clearHistory(); setSavedRuns([]); setSettingsMessage("Pipeline run history cleared.");
    } catch (error) { setSettingsMessage(error.message || "Could not clear run history."); }
    finally { setClearing(false); }
  };
  const signOut = () => {
    localStorage.removeItem("access_token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail");
    window.dispatchEvent(new Event("flowbi-user-changed")); window.location.replace("/login");
  };
  return <WorkspaceLayout title="Settings" subtitle="Manage your account, appearance, security, and workspace data.">
    <div className="settings-layout">
      <section className="settings-main">
        <article className="settings-card"><div className="settings-card-heading"><span className="settings-icon">◉</span><div><h2>Account profile</h2><p>Update the name and email linked to your account</p></div></div><form className="settings-profile-form" onSubmit={saveProfile}><label>Full name<input required minLength={3} maxLength={120} value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} /></label><label>Email address<input required type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} /></label><div className="settings-form-footer"><small>Account ID · {userId || "—"}</small><button className="workspace-button primary-button" disabled={savingProfile || settingsLoading}>{savingProfile ? "Saving…" : "Save profile"}</button></div></form></article>
        <article className="settings-card"><div className="settings-card-heading"><span className="settings-icon appearance-icon">◐</span><div><h2>Appearance</h2><p>Choose how FlowBI looks on this device</p></div></div><div className="appearance-options" role="radiogroup" aria-label="Color theme"><button className={theme === "light" ? "selected" : ""} onClick={() => updateTheme("light")} role="radio" aria-checked={theme === "light"}><span className="theme-preview preview-light"><i /><i /><i /></span><strong>Light</strong><small>Bright workspace</small></button><button className={theme === "dark" ? "selected" : ""} onClick={() => updateTheme("dark")} role="radio" aria-checked={theme === "dark"}><span className="theme-preview preview-dark"><i /><i /><i /></span><strong>Dark</strong><small>Easy on the eyes</small></button><button className={theme === "system" ? "selected" : ""} onClick={() => updateTheme("system")} role="radio" aria-checked={theme === "system"}><span className="theme-preview preview-system"><i /><i /><i /></span><strong>System</strong><small>Match your device</small></button></div></article>
        <article className="settings-card"><div className="settings-card-heading"><span className="settings-icon security-icon">✓</span><div><h2>Security & session</h2><p>Current account session on this device</p></div></div><div className="settings-detail-row"><span>Session status</span><strong className="secure-label"><i />Signed in</strong></div><div className="settings-detail-row"><span>Session expiry</span><strong>{sessionText}</strong></div><div className="settings-detail-row"><span>Password storage</span><strong>Protected with a one-way hash</strong></div><button className="workspace-button settings-signout" onClick={signOut}>Sign out of this device</button></article>
        <article className="settings-card"><div className="settings-card-heading"><span className="settings-icon security-icon">⌑</span><div><h2>Change password</h2><p>Verify your current password before choosing a new one</p></div></div><form className="settings-password-form" onSubmit={changePassword}><PasswordField className="settings-password-field" id="current-password" label="Current password" name="current_password" placeholder="Enter current password" value={passwordForm.current_password} autoComplete="current-password" onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} /><PasswordField className="settings-password-field" id="settings-new-password" label="New password" name="new_password" placeholder="At least 6 characters" value={passwordForm.new_password} autoComplete="new-password" onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))} /><PasswordField className="settings-password-field" id="settings-confirm-password" label="Confirm new password" name="confirm_password" placeholder="Enter new password again" value={passwordForm.confirm_password} autoComplete="new-password" onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))} />{passwordMessage && <p className="settings-feedback" role="status">{passwordMessage}</p>}<div className="settings-form-footer"><small>Minimum 6 characters</small><button className="workspace-button primary-button" disabled={changingPassword}>{changingPassword ? "Updating…" : "Update password"}</button></div></form></article>
        <article className="settings-card"><div className="settings-card-heading"><span className="settings-icon storage-icon">▤</span><div><h2>Workspace data</h2><p>Review and manage saved workspace content</p></div></div><div className="storage-stats"><div><strong>{settingsLoading ? "—" : savedDatasetCount.toLocaleString()}</strong><span>Datasets saved to your account</span></div><div><strong>{settingsLoading ? "—" : savedRuns.length.toLocaleString()}</strong><span>Saved pipeline runs</span></div></div><div className="settings-data-actions"><Link className="workspace-button" to="/datasets">Manage datasets <b>→</b></Link><button className="workspace-button danger-button" onClick={clearRunHistory} disabled={clearing || settingsLoading || savedRuns.length === 0}>{clearing ? "Clearing…" : "Clear run history"}</button></div><p className="settings-note">Deleting a dataset is available from Datasets, where you can review each file before removing it.</p></article>
      </section>
      <aside className="settings-aside"><div className="settings-aside-icon">⚙</div><h3>FlowBI preferences</h3><p>Your appearance choice is saved on this device and applies across the workspace.</p><div className="settings-aside-row"><span>Theme</span><strong>{theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}</strong></div><div className="settings-aside-row"><span>Datasets</span><strong>{settingsLoading ? "—" : savedDatasetCount}</strong></div><div className="settings-aside-row"><span>Run history</span><strong>{settingsLoading ? "—" : savedRuns.length}</strong></div></aside>
    </div>
    {settingsMessage && <p className="settings-feedback" role="status">{settingsMessage}</p>}
  </WorkspaceLayout>;
}

function inlineAnswer(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function AssistantAnswer({ text }) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  const cells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
  const isSeparator = (line) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line.trim());

  for (let index = 0; index < lines.length;) {
    if (!lines[index].trim()) { index += 1; continue; }
    if (lines[index].includes("|") && lines[index + 1]?.includes("|") && isSeparator(lines[index + 1])) {
      const headers = cells(lines[index]);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes("|")) { rows.push(cells(lines[index])); index += 1; }
      blocks.push(<div className="answer-table-wrap" key={`table-${index}`}><table className="answer-table"><thead><tr>{headers.map((cell, cellIndex) => <th key={cellIndex}>{inlineAnswer(cell)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, cellIndex) => <td key={cellIndex}>{inlineAnswer(row[cellIndex] || "")}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const heading = lines[index].match(/^#{1,3}\s+(.+)/);
    if (heading) { blocks.push(<h4 key={`heading-${index}`}>{inlineAnswer(heading[1])}</h4>); index += 1; continue; }
    if (/^\s*(?:[-*]|\d+\.)\s+/.test(lines[index])) {
      const items = [];
      while (index < lines.length && /^\s*(?:[-*]|\d+\.)\s+/.test(lines[index])) { items.push(lines[index].replace(/^\s*(?:[-*]|\d+\.)\s+/, "")); index += 1; }
      blocks.push(<ul key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inlineAnswer(item)}</li>)}</ul>);
      continue;
    }
    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !/^#{1,3}\s+/.test(lines[index]) && !/^\s*(?:[-*]|\d+\.)\s+/.test(lines[index]) && !(lines[index].includes("|") && lines[index + 1]?.includes("|") && isSeparator(lines[index + 1]))) { paragraph.push(lines[index].trim()); index += 1; }
    blocks.push(<p key={`paragraph-${index}`}>{inlineAnswer(paragraph.join(" "))}</p>);
  }
  return <div className="assistant-answer">{blocks}</div>;
}

function InsightsPage() {
  const { datasets, selectedDatasetId, selectDataset } = useData();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState("en-US");
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [sending, setSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const voiceDraftBaseRef = useRef("");
  const dataset = datasets.find((item) => String(item.id) === String(selectedDatasetId)) || datasets[0];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);
  useEffect(() => () => {
    speechRecognitionRef.current?.abort?.();
    window.speechSynthesis?.cancel();
  }, []);
  const facts = useMemo(() => {
    if (!dataset?.previewData?.length) return [];
    const rows = dataset.previewData;
    return Object.keys(rows[0]).map((column) => {
      const values = rows.map((row) => row[column]);
      const numbers = values.map(Number).filter((value, index) => values[index] !== "" && Number.isFinite(value));
      const unique = new Set(values.filter((value) => value !== "" && value != null)).size;
      return { column, numbers, unique, missing: values.filter((value) => value === "" || value == null).length };
    });
  }, [dataset]);
  const submitQuestion = async (value = question) => {
    const text = value.trim();
    if (!text || !dataset || sending) return;
    setMessages((current) => [...current, { role: "user", text }]);
    setQuestion("");
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/insights/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({
          dataset_id: Number(dataset.id),
          question: text,
          history: messages.slice(-10).map(({ role, text: content }) => ({ role, content })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        window.dispatchEvent(new Event("flowbi-user-changed"));
        window.location.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(result.detail || "Could not get an answer from the data assistant.");
      setMessages((current) => [...current, { role: "assistant", text: result.answer || "The assistant returned an empty answer." }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error.message || "Could not reach the data assistant. Check that the backend is running." }]);
    } finally {
      setSending(false);
    }
  };
  const startVoiceInput = async () => {
    if (recording) {
      speechRecognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { window.alert("Browser speech input is not supported here. Please try the latest Chrome or Edge."); return; }
    const recognition = new SpeechRecognition();
    speechRecognitionRef.current = recognition;
    voiceDraftBaseRef.current = question.trim();
    recognition.lang = voiceLanguage;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results).map((result) => result[0].transcript).join("").trim();
      if (spoken) setQuestion(voiceDraftBaseRef.current ? `${voiceDraftBaseRef.current} ${spoken}` : spoken);
    };
    recognition.onerror = (event) => { setRecording(false); if (event.error === "not-allowed") window.alert("Allow microphone access in your browser to ask by voice."); };
    recognition.onend = () => { setRecording(false); speechRecognitionRef.current = null; };
    setRecording(true);
    try { recognition.start(); }
    catch (error) { setRecording(false); speechRecognitionRef.current = null; window.alert(error.message || "Could not start browser speech input."); }
  };
  const speakAnswer = (text, index) => {
    if (!window.speechSynthesis) { window.alert("Spoken answers are not supported by this browser."); return; }
    if (speakingIndex === index) { window.speechSynthesis.cancel(); setSpeakingIndex(null); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`|]/g, " "));
    utterance.lang = voiceLanguage;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };
  const primaryMetric = facts.find((item) => item.numbers.length)?.column;
  const labelColumn = facts.find((item) => !item.numbers.length)?.column;
  const suggestions = [
    primaryMetric && labelColumn ? `Which ${labelColumn} has the highest ${primaryMetric}?` : "Summarize this dataset",
    "Compare the top performers by each metric",
    "Which columns need data cleaning?",
  ];
  const startNewChat = () => { setMessages([]); setQuestion(""); setCopiedIndex(null); };
  const copyAnswer = async (text, index) => {
    try { await navigator.clipboard.writeText(text); setCopiedIndex(index); window.setTimeout(() => setCopiedIndex(null), 1500); }
    catch { setMessages((current) => [...current, { role: "assistant", text: "Clipboard access is unavailable in this browser." }]); }
  };
  return <WorkspaceLayout title="Data insights" subtitle="Ask questions about your data, explore patterns, and build an AI analyst workspace.">
    <section className="insights-toolbar">
      <label className="insights-dataset-select"><span>DATASET</span><select value={dataset?.id || ""} onChange={(event) => { selectDataset(event.target.value); startNewChat(); }} disabled={!datasets.length}>{datasets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div className="insights-model-badge"><span className="status-dot connected" /> Groq · GPT OSS 20B <small>Chat model connected</small></div>
    </section>
    {datasets.length ? <div className="insights-workspace">
      <aside className="insights-context">
        <div className="insights-context-title"><span className="context-icon">▦</span><div><strong>Dataset context</strong><small>What the assistant can use</small></div></div>
        <h3>{dataset.name}</h3>
        <div className="context-stats"><div><strong>{dataset.previewData.length}</strong><small>Rows</small></div><div><strong>{facts.length}</strong><small>Columns</small></div></div>
        <div className="context-section"><span>DETECTED COLUMNS</span><div className="column-chips">{facts.slice(0, 12).map((item) => <span key={item.column}>{item.column}</span>)}{facts.length > 12 && <small>+{facts.length - 12} more</small>}</div></div>
        <div className="context-section"><span>DATA QUALITY</span><p>{facts.reduce((sum, item) => sum + item.missing, 0)} missing values found</p><p>{facts.filter((item) => item.numbers.length).length} numeric columns detected</p></div>
        <div className="model-roadmap"><strong>Voice assistant</strong><p>Ask with your microphone and hear answers read aloud using your browser’s built-in voice.</p><span>Voice input · browser</span><span>Spoken answers · browser</span><small>Voice features use your browser and device; no voice API key or usage charge is needed.</small></div>
      </aside>
      <section className="insights-chat" aria-label="Data assistant chat">
        <header className="chat-header"><div className="assistant-avatar">✦</div><div className="assistant-heading"><strong>FlowBI Data Assistant</strong><small><span className="assistant-online" /> Online · grounded in {dataset.name}</small></div><button type="button" className="new-chat-button" onClick={startNewChat} disabled={!messages.length || sending}>＋ New chat</button></header>
        <div className="chat-messages" aria-live="polite">
          {!messages.length && <div className="chat-welcome"><div className="welcome-sparkle">✦</div><h2>What would you like to learn?</h2><p>I can explain patterns, compare metric leaders, and help you understand data quality in {dataset.name}.</p><div className="suggestion-list">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => submitQuestion(suggestion)}>{suggestion}<span>→</span></button>)}</div></div>}
          {messages.map((message, index) => <article className={`chat-message ${message.role}`} key={`${index}-${message.role}`}><span className="message-avatar">{message.role === "user" ? "You" : "✦"}</span><div className="message-content">{message.role === "assistant" ? <><AssistantAnswer text={message.text} /><button type="button" className="copy-answer" onClick={() => copyAnswer(message.text, index)}>{copiedIndex === index ? "Copied" : "Copy answer"}</button><button type="button" className="copy-answer" onClick={() => speakAnswer(message.text, index)}>{speakingIndex === index ? "■ Stop voice" : "🔊 Listen"}</button></> : <p>{message.text}</p>}</div></article>)}
          {sending && <article className="chat-message assistant"><span className="message-avatar">✦</span><div className="typing-bubble"><span>Reviewing the dataset</span><span className="typing-dots"><i /><i /><i /></span></div></article>}
          {messages.length > 0 && !sending && <div className="chat-followups"><span>CONTINUE EXPLORING</span>{suggestions.map((suggestion) => <button key={suggestion} onClick={() => submitQuestion(suggestion)}>{suggestion}</button>)}</div>}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); submitQuestion(); }}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitQuestion(); } }} placeholder="Ask about trends, compare columns, or follow up…" rows={2} disabled={sending} /><div className="composer-footer"><span>{recording ? "Listening… speak your question" : "Enter to send · Shift + Enter for a new line"}</span><div className="composer-actions"><select className="voice-language" aria-label="Voice language" value={voiceLanguage} onChange={(event) => setVoiceLanguage(event.target.value)} disabled={recording}><option value="en-US">EN</option><option value="hi-IN">हिंदी</option></select><button type="button" className={`voice-button ${recording ? "listening" : ""}`} onClick={startVoiceInput} disabled={sending} aria-label={recording ? "Stop voice input" : "Ask by voice"}>{recording ? "■ Stop" : "🎙 Ask by voice"}</button><button className="send-button" type="submit" disabled={!question.trim() || sending || recording}>Send <span>↑</span></button></div></div></form>
      </section>
    </div> : <article className="insights-empty"><div>▦</div><h2>Upload a dataset to get started</h2><p>Your assistant will use the selected dataset and its statistics to answer questions.</p><Link to="/datasets">Go to datasets →</Link></article>}
  </WorkspaceLayout>;
}

export { AnalyticsPage, HistoryPage, InsightsPage, SettingsPage };
