import {
  useCallback,
  useEffect,
  useState,
} from "react";
import DataContext from "./data-context-value";
import { API_URL } from "./api";


const getStorageKey = (userId = localStorage.getItem("userId")) => {
  return userId
    ? `flowbi-workspace-user-${userId}`
    : "flowbi-workspace";
};

function readWorkspace(userId = localStorage.getItem("userId")) {
  try {
    const value = JSON.parse(
      localStorage.getItem(getStorageKey(userId)) || "{}"
    );

    return {
      // Dataset rows live in PostgreSQL; do not duplicate large files in localStorage.
      datasets: [],
      history: Array.isArray(value.history) ? value.history : [],
      selectedDatasetId: value.selectedDatasetId || "",
    };
  } catch {
    return {
      datasets: [],
      history: [],
      selectedDatasetId: "",
    };
  }
}

function normalizeDataset(dataset) {
  return {
    id: dataset.id,
    name: dataset.name,
    previewData: Array.isArray(dataset.previewData)
      ? dataset.previewData
      : Array.isArray(dataset.data)
        ? dataset.data
        : [],
  };
}

export function DataProvider({ children }) {
  const [currentUserId, setCurrentUserId] = useState(
    () => localStorage.getItem("userId")
  );

  const [workspace, setWorkspace] = useState(() =>
    readWorkspace(localStorage.getItem("userId"))
  );

  // Switch workspace when the user logs in or out
  useEffect(() => {
    const handleUserChange = () => {
      const nextUserId = localStorage.getItem("userId");

      setCurrentUserId(nextUserId);
      setWorkspace(readWorkspace(nextUserId));
    };

    window.addEventListener(
      "flowbi-user-changed",
      handleUserChange
    );

    window.addEventListener("storage", handleUserChange);

    return () => {
      window.removeEventListener(
        "flowbi-user-changed",
        handleUserChange
      );

      window.removeEventListener("storage", handleUserChange);
    };
  }, []);

  // Hydrate the active user's datasets once at the app level so every page has
  // the same server-backed data without keeping large previews in browser storage.
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!currentUserId || !token) {
      return undefined;
    }
    const controller = new AbortController();
    fetch(`${API_URL}/datasets`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        localStorage.removeItem("access_token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail");
        window.dispatchEvent(new Event("flowbi-user-changed")); window.location.replace("/login");
        return;
      }
      if (!response.ok || !Array.isArray(result)) throw new Error(result.detail || "Could not load saved datasets.");
      if (controller.signal.aborted) return;
      const loadedDatasets = result.map(normalizeDataset);
      setWorkspace((current) => {
        const selectedExists = loadedDatasets.some((item) => String(item.id) === String(current.selectedDatasetId));
        return { ...current, datasets: loadedDatasets, selectedDatasetId: selectedExists ? current.selectedDatasetId : "" };
      });
    }).catch((error) => {
      if (error.name !== "AbortError") console.error("Could not hydrate saved datasets:", error);
    });
    return () => controller.abort();
  }, [currentUserId]);

  // Save workspace separately for each user
  useEffect(() => {
    const actualUserId = localStorage.getItem("userId");

    // Prevent saving one user's workspace under another user's account
    if (actualUserId !== currentUserId) return;

    try {
      localStorage.setItem(
        getStorageKey(currentUserId),
        JSON.stringify({ ...workspace, datasets: [] })
      );
    } catch (error) {
      console.error("Failed to save workspace:", error);
    }
  }, [workspace, currentUserId]);

  // Add or update one dataset
  const addDataset = useCallback((dataset) => {
    const normalized = normalizeDataset(dataset);

    setWorkspace((current) => ({
      ...current,
      datasets: [
        ...current.datasets.filter(
          (item) => String(item.id) !== String(normalized.id)
        ),
        normalized,
      ],
      selectedDatasetId: String(normalized.id),
    }));
  }, []);

  // Replace local datasets with the current user's database datasets
  const replaceDatasets = useCallback((datasets) => {
    const normalizedDatasets = Array.isArray(datasets)
      ? datasets.map(normalizeDataset)
      : [];

    setWorkspace((current) => {
      const selectedStillExists = normalizedDatasets.some(
        (dataset) =>
          String(dataset.id) === String(current.selectedDatasetId)
      );

      return {
        ...current,
        datasets: normalizedDatasets,
        selectedDatasetId: selectedStillExists
          ? current.selectedDatasetId
          : "",
      };
    });
  }, []);

  // Remove a dataset from local workspace
  const deleteDataset = useCallback((id) => {
    setWorkspace((current) => ({
      ...current,
      datasets: current.datasets.filter(
        (dataset) => String(dataset.id) !== String(id)
      ),
      selectedDatasetId:
        String(current.selectedDatasetId) === String(id)
          ? ""
          : current.selectedDatasetId,
    }));
  }, []);

  const selectDataset = useCallback((id) => {
    setWorkspace((current) => ({
      ...current,
      selectedDatasetId: String(id || ""),
    }));
  }, []);

  // Add a pipeline execution to history
  const addRun = useCallback((run) => {
    setWorkspace((current) => ({
      ...current,
      history: [
        {
          ...run,
          id: `${Date.now()}-${Math.random()}`,
        },
        ...current.history,
      ].slice(0, 100),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setWorkspace((current) => ({
      ...current,
      history: [],
    }));
  }, []);

  const removeRun = useCallback((id) => {
    setWorkspace((current) => ({
      ...current,
      history: current.history.filter((run) => String(run.id) !== String(id)),
    }));
  }, []);

  return (
    <DataContext.Provider
      value={{
        ...workspace,
        addDataset,
        replaceDatasets,
        deleteDataset,
        selectDataset,
        addRun,
        removeRun,
        clearHistory,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
