import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useData } from "../DataContext";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const userId = localStorage.getItem("userId");

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // =========================
  // GET USER
  // =========================

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/users/${userId}`
        );

        console.log(response);

        if (!response.ok) {
          localStorage.removeItem("userId");
          navigate("/login");
          return;
        }

        const data = await response.json();

        console.log("User data:", data);

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
  }, [userId, navigate]);

  console.log("Logged in user:", userId);

  // =========================
  // DATA CONTEXT
  // =========================

  const {
    uploadedFile,
    setUploadedFile,
    previewData,
    setPreviewData,
  } = useData();

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

    setUploadedFile(selectedFile);
    setPreviewData([]);
    setShowPreview(false);
  };

  // =========================
  // PREVIEW
  // =========================

  const handlePreview = () => {
    if (!uploadedFile) {
      alert("Please upload a file first.");
      return;
    }

    setLoading(true);

    const extension = uploadedFile.name
      .substring(
        uploadedFile.name.lastIndexOf(".")
      )
      .toLowerCase();

    // =========================
    // CSV
    // =========================

    if (extension === ".csv") {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,

        complete: (results) => {
          console.log("CSV Preview:", results.data);

          if (results.data.length === 0) {
            alert("The CSV file is empty.");
            setLoading(false);
            return;
          }

          setPreviewData(results.data);
          setShowPreview(true);
          setLoading(false);
        },

        error: (error) => {
          console.error("CSV Error:", error);
          alert("Unable to read CSV file.");
          setLoading(false);
        },
      });

      return;
    }

    // =========================
    // EXCEL
    // =========================

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(
          event.target.result
        );

        const workbook = XLSX.read(data, {
          type: "array",
        });

        const firstSheetName =
          workbook.SheetNames[0];

        const firstSheet =
          workbook.Sheets[firstSheetName];

        const jsonData =
          XLSX.utils.sheet_to_json(
            firstSheet,
            {
              defval: "",
            }
          );

        console.log(
          "Excel Preview:",
          jsonData
        );

        if (jsonData.length === 0) {
          alert("The Excel file is empty.");
          setLoading(false);
          return;
        }

        setPreviewData(jsonData);
        setShowPreview(true);

      } catch (error) {
        console.error(
          "Excel Error:",
          error
        );

        alert("Unable to read the file.");

      }

      setLoading(false);
    };

    reader.onerror = () => {
      alert("Unable to read the file.");
      setLoading(false);
    };

    reader.readAsArrayBuffer(uploadedFile);
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
              >
                View History →
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
                  loading
                }
              >

                {loading
                  ? "Loading..."
                  : "Preview"}

              </button>

              <button
                type="button"
                disabled={!uploadedFile}
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