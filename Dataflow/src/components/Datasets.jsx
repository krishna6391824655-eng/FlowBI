import { useCallback, useEffect, useState } from "react";
import { useData } from "../useData";
import { API_URL } from "../api";
import Sidebar from "./Sidebar";
import "./Dashboard.css";
import "./Datasets.css";

// Add JWT authentication to API requests
const getAuthHeaders = (includeJsonContentType = false) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  return {
    ...(includeJsonContentType && {
      "Content-Type": "application/json",
    }),
    Authorization: `Bearer ${token}`,
  };
};

function Datasets() {
  const userId = localStorage.getItem("userId");

  const {
    datasets,
    addDataset,
    replaceDatasets,
    deleteDataset,
  } = useData();

  const [selectedDataset, setSelectedDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);

  // Load datasets for the authenticated user
  const fetchDatasets = useCallback(
    async (signal) => {
      if (!userId || !localStorage.getItem("access_token")) {
        replaceDatasets([]);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/datasets`, {
          method: "GET",
          headers: getAuthHeaders(),
          signal,
        });

        const result = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          window.dispatchEvent(new Event("flowbi-user-changed"));
          window.location.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(result.detail || "Failed to load datasets.");
        }

        if (!Array.isArray(result)) {
          throw new Error("Invalid dataset response from server.");
        }

        replaceDatasets(
          result.map((dataset) => ({
            id: dataset.id,
            name: dataset.name,
            previewData: dataset.previewData || dataset.data || [],
          }))
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Fetch datasets error:", error);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [userId, replaceDatasets]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchDatasets(controller.signal);

    return () => controller.abort();
  }, [fetchDatasets]);

  // Upload parsed dataset using JWT authentication
  const createDataset = async (file) => {
    if (!userId || !localStorage.getItem("access_token")) {
      alert("Please log in before uploading a dataset.");
      return;
    }

    setUploading(true);

    try {
      const response = await fetch(`${API_URL}/datasets`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "X-Filename": encodeURIComponent(file.name), "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        window.dispatchEvent(new Event("flowbi-user-changed"));
        window.location.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.detail || "Failed to upload dataset.");
      }

      addDataset({
        id: result.id,
        name: result.name,
        previewData: result.data || [],
      });

      alert("Dataset uploaded successfully!");
    } catch (error) {
      console.error("Dataset upload error:", error);
      alert(error.message || "Could not upload dataset.");
    } finally {
      setUploading(false);
    }
  };

  // Handle CSV and Excel uploads
  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("Files must be 20 MB or smaller. Split this file into smaller parts and upload again.");
      event.target.value = "";
      return;
    }
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      alert("Please upload a CSV or Excel file.");
      event.target.value = "";
      return;
    }
    createDataset(file);
    event.target.value = "";
  };

  // Open dataset preview
  const handleView = (dataset) => {
    setSelectedDataset(dataset);
  };

  // Delete dataset
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this dataset?"
    );

    if (!confirmed) return;

    if (!userId || !localStorage.getItem("access_token")) {
      alert("Please log in first.");
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`${API_URL}/datasets/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
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

      if (!response.ok) {
        throw new Error(
          result.detail ||
            "Failed to delete dataset. Check whether the backend DELETE endpoint supports JWT authentication."
        );
      }

      deleteDataset(id);

      if (String(selectedDataset?.id) === String(id)) {
        setSelectedDataset(null);
      }

      alert("Dataset deleted successfully!");
    } catch (error) {
      console.error("Delete dataset error:", error);
      alert(error.message || "Could not delete dataset.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async (dataset) => {
    const name = window.prompt("Enter a new dataset name:", dataset.name)?.trim();
    if (!name || name === dataset.name) return;
    setRenamingId(dataset.id);
    try {
      const response = await fetch(`${API_URL}/datasets/${dataset.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(true) },
        body: JSON.stringify({ name }),
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
      if (!response.ok) throw new Error(result.detail || "Could not rename dataset.");
      replaceDatasets(datasets.map((item) => String(item.id) === String(dataset.id) ? { ...item, name: result.name } : item));
      if (String(selectedDataset?.id) === String(dataset.id)) setSelectedDataset({ ...selectedDataset, name: result.name });
    } catch (error) {
      alert(error.message || "Could not rename dataset.");
    } finally {
      setRenamingId(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard datasets-container">
      <div className="datasets-header">
        <div>
          <p className="datasets-eyebrow">DATA MANAGEMENT</p>
          <h2>Datasets</h2>
          <p>Manage and explore your uploaded datasets.</p>
        </div>

        <label className="upload-dataset-btn">
          {uploading ? "Uploading..." : "+ Upload Dataset"}

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleUpload}
            disabled={uploading}
            hidden
          />
        </label>
      </div>

      {loading && <p>Loading datasets...</p>}

      {!loading && datasets.length === 0 && (
        <div className="empty-datasets">
          <h3>No datasets yet</h3>
          <p>Upload a CSV or Excel file to get started.</p>
        </div>
      )}

      {datasets.length > 0 && (
        <div className="datasets-grid">
          {datasets.map((dataset) => {
            const rows = Array.isArray(dataset.previewData)
              ? dataset.previewData
              : [];

            const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

            return (
              <div className="dataset-item" key={dataset.id}>
                <div className="dataset-top">
                  <div className="dataset-file-icon">FILE</div>

                  <div>
                    <h3>{dataset.name}</h3>
                    <p>Uploaded dataset</p>
                  </div>
                </div>

                <div className="dataset-stats">
                  <div>
                    <strong>{rows.length}</strong>
                    <span>Rows</span>
                  </div>

                  <div>
                    <strong>{columns.length}</strong>
                    <span>Columns</span>
                  </div>
                </div>

                <div className="dataset-buttons">
                  <button onClick={() => handleRename(dataset)} disabled={renamingId !== null || deletingId !== null}>
                    {renamingId === dataset.id ? "Renaming..." : "Rename"}
                  </button>
                  <button
                    onClick={() => handleView(dataset)}
                    disabled={deletingId !== null}
                  >
                    View
                  </button>

                  <button
                    onClick={() => handleDelete(dataset.id)}
                    disabled={deletingId !== null || uploading}
                  >
                    {String(deletingId) === String(dataset.id)
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDataset && (
        <div className="dataset-preview">
          <div className="preview-header">
            <div>
              <p className="datasets-eyebrow">DATA PREVIEW</p>
              <h2>{selectedDataset.name}</h2>
            </div>

            <button onClick={() => setSelectedDataset(null)}>Close</button>
          </div>

          {Array.isArray(selectedDataset.previewData) &&
          selectedDataset.previewData.length > 0 ? (
            <div className="preview-table">
              <table>
                <thead>
                  <tr>
                    {Object.keys(selectedDataset.previewData[0]).map(
                      (column) => (
                        <th key={column}>{column}</th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {selectedDataset.previewData.slice(0, 10).map(
                    (row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.keys(selectedDataset.previewData[0]).map(
                          (column, columnIndex) => (
                            <td key={columnIndex}>
                              {String(row[column] ?? "")}
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p>This dataset does not contain any rows.</p>
          )}

          <p className="preview-info">
            Showing first{" "}
            {Math.min(
              10,
              Array.isArray(selectedDataset.previewData)
                ? selectedDataset.previewData.length
                : 0
            )}{" "}
            rows of{" "}
            {Array.isArray(selectedDataset.previewData)
              ? selectedDataset.previewData.length
              : 0}
            .
          </p>
        </div>
      )}
      </main>
    </div>
  );
}

export default Datasets;
