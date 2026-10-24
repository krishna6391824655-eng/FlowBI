import { useNavigate } from "react-router-dom";
import { useData } from "../useData";
import { API_URL } from "../api";
import { useCallback, useState, useEffect } from "react";
import Sidebar from "./Sidebar";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const userId = localStorage.getItem("userId");

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    window.dispatchEvent(new Event("flowbi-user-changed"));
    navigate("/login");
  }, [navigate]);

  // =========================
  // GET USER
  // =========================

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
        });

        if (!response.ok) {
          if (response.status === 401) handleLogout();
          return;
        }

        const data = await response.json();

        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    if (userId) {
      getUser();
    } else {
      navigate("/login");
    }

    console.log("User ID:", userId);
  }, [userId, navigate, handleLogout]);

  // =========================
  // DATA CONTEXT
  // =========================

const { addDataset, history } = useData();

const [uploadedFile, setUploadedFile] = useState(null);
const [previewData, setPreviewData] = useState([]);
const [showPreview, setShowPreview] = useState(false);
const [loading, setLoading] = useState(false);
  // =========================
  // FILE UPLOAD
  // =========================

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      return;
    }

    const allowedExtensions = [
      ".csv",
      ".xlsx",
      ".xls",
    ];

    const extension = selectedFile.name
      .substring(
        selectedFile.name.lastIndexOf(".")
      )
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      alert("Please upload a CSV or Excel file.");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      alert("Files must be 20 MB or smaller. Split this file into smaller parts and upload again.");
      return;
    }

    setUploadedFile(selectedFile);
    setPreviewData([]);
    setShowPreview(false);
  };

  // =========================
  // PREVIEW
  // =========================

  const handlePreview = async () => {
    if (!uploadedFile) {
      alert("Please upload a file first.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/datasets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`, "X-Filename": encodeURIComponent(uploadedFile.name), "Content-Type": uploadedFile.type || "application/octet-stream" },
        body: uploadedFile,
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { handleLogout(); return; }
      if (!response.ok) throw new Error(result.detail || "Dataset upload failed.");
      const rows = result.data || [];
      addDataset({ id: result.id, name: result.name, previewData: rows });
      setPreviewData(rows);
      setShowPreview(true);
    } catch (error) {
      alert(error.message || "Could not upload this dataset.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // COLUMNS
  // =========================

  const getColumns = () => {
    if (previewData.length === 0) {
      return [];
    }

    return Object.keys(previewData[0]);
  };

  // =========================
  // OPEN PIPELINE
  // =========================

  const openPipeline = () => {
    if (!uploadedFile) {
      alert("Please upload a dataset first.");
      return;
    }

    navigate("/pipeline");
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="dashboard-layout">

      {/* =========================
          SIDEBAR
      ========================= */}

      <Sidebar />

      {/* =========================
          MAIN DASHBOARD
      ========================= */}

      <main className="dashboard">

        {/* =========================
            HERO
        ========================= */}

        <section className="dashboard-hero">

          <div className="hero-content">

            <p className="hero-eyebrow">
              DATA ANALYTICS PLATFORM
            </p>

            <h2>
              Welcome, {user?.name}
            </h2>

            <p>
              {user?.email}
            </p>

            <h1>
              Turn your data into
              <br />
              <span>
                meaningful insights.
              </span>
            </h1>

            <p className="hero-description">
              Upload your CSV or Excel files,
              clean your data, analyze it and
              discover insights with FlowBI.
            </p>

            <div className="hero-actions">

              <label className="upload-btn">

                <span>
                  ＋
                </span>

                Upload Dataset

                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  hidden
                />

              </label>

              <button
                className="history-btn"
                type="button"
                onClick={() => navigate("/history")}
              >
                View History ({history.length}) →
              </button>

            </div>

          </div>

        </section>

        {/* =========================
            DATASET
        ========================= */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <p className="section-eyebrow">
                RECENT DATASET
              </p>

              <h2>
                Your latest upload
              </h2>

            </div>

            <span className="dataset-status">

              {uploadedFile
                ? "Uploaded"
                : "Demo Data"}

            </span>

          </div>

          <div className="dataset-card">

            <div className="dataset-info">

              <div className="file-icon">

                {uploadedFile
                  ? uploadedFile.name
                      .split(".")
                      .pop()
                      .toUpperCase()
                  : "CSV"}

              </div>

              <div>

                <h3>

                  {uploadedFile
                    ? uploadedFile.name
                    : "sales_data.csv"}

                </h3>

                <p>

                  {uploadedFile
                    ? `${(
                        uploadedFile.size /
                        1024
                      ).toFixed(
                        1
                      )} KB · Ready for preview`
                    : "1,250 rows · 8 columns"}

                </p>

              </div>

            </div>

            <div className="dataset-actions">

              <button
                type="button"
                onClick={handlePreview}
                disabled={
                  !uploadedFile ||
                  loading ||
                  previewData.length > 0
                }
              >

                {loading ? "Loading..." : previewData.length > 0 ? "Preview ready" : "Preview"}

              </button>

              <button
                type="button"
                disabled={!previewData.length}
                onClick={openPipeline}
              >
                Open Pipeline →
              </button>

            </div>

          </div>

        </section>

        {/* =========================
            PREVIEW
        ========================= */}

        {showPreview &&
          previewData.length > 0 && (

            <section className="preview-section">

              <div className="section-header">

                <div>

                  <p className="section-eyebrow">
                    DATA PREVIEW
                  </p>

                  <h2>
                    {uploadedFile.name}
                  </h2>

                </div>

                <span className="preview-count">

                  Showing first{" "}

                  {Math.min(
                    previewData.length,
                    10
                  )}

                  {" "}rows

                </span>

              </div>

              <div className="table-container">

                <table className="preview-table">

                  <thead>

                    <tr>

                      {getColumns().map(
                        (column) => (

                          <th key={column}>
                            {column}
                          </th>

                        )
                      )}

                    </tr>

                  </thead>

                  <tbody>

                    {previewData
                      .slice(0, 10)
                      .map(
                        (row, index) => (

                          <tr key={index}>

                            {getColumns().map(
                              (column) => (

                                <td key={column}>

                                  {String(
                                    row[column]
                                  )}

                                </td>

                              )
                            )}

                          </tr>

                        )
                      )}

                  </tbody>

                </table>

              </div>

            </section>

          )}

        {/* =========================
            FEATURES
        ========================= */}

        <section className="features-section">

          <div className="section-header">

            <div>

              <p className="section-eyebrow">
                WORKFLOW
              </p>

              <h2>
                Everything you need to work
                with data
              </h2>

            </div>

          </div>

          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">
                ↑
              </div>

              <h3>
                Upload Data
              </h3>

              <p>
                Upload CSV or Excel files and
                preview your dataset before
                processing.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                ✓
              </div>

              <h3>
                Clean Data
              </h3>

              <p>
                Handle missing values,
                duplicates and inconsistent
                data automatically.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                #
              </div>

              <h3>
                Analyze
              </h3>

              <p>
                Generate statistics and
                understand important patterns
                in your data.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                ◫
              </div>

              <h3>
                Visualize
              </h3>

              <p>
                Explore your processed data
                through clear and useful
                visualizations.
              </p>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
