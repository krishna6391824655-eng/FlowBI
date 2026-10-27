import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { toPng } from "html-to-image";

import "@xyflow/react/dist/style.css";
import "./PipelineBuilder.css";
import "./Dashboard.css";

import { useData } from "../useData";
import { API_URL } from "../api";
import ThemeToggle from "./ThemeToggle";
import Sidebar from "./Sidebar";
import { Link } from "react-router-dom";


/* =========================================================
   API CONFIGURATION AND AUTHENTICATION
========================================================= */

const getAuthHeaders = (includeJson = false) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  return {
    ...(includeJson && {
      "Content-Type": "application/json",
    }),
    Authorization: `Bearer ${token}`,
  };
};

const handleUnauthorized = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  window.dispatchEvent(new Event("flowbi-user-changed"));

  window.location.href = "/login";
};


/* =========================================================
   CUSTOM PIPELINE NODE
========================================================= */

function PipelineNode({ data }) {
  return (
    <div className="pipeline-node">
      <Handle
        type="target"
        position={Position.Left}
        className="pipeline-handle"
      />

      <div className="pipeline-node-icon">
        {data.icon}
      </div>

      <div className="pipeline-node-content">
        <strong>{data.label}</strong>
        <span>{data.description}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="pipeline-handle"
      />
    </div>
  );
}

const nodeTypes = {
  pipelineNode: PipelineNode,
};


/* =========================================================
   PIPELINE MODULES
========================================================= */

const PIPELINE_MODULES = [
  {
    type: "remove-duplicates",
    icon: "🧹",
    label: "Remove Duplicates",
    description: "Remove duplicate rows",
  },
  {
    type: "missing-values",
    icon: "🔧",
    label: "Missing Values",
    description: "Handle missing values",
  },
  {
    type: "statistics",
    icon: "📊",
    label: "Statistics",
    description: "Calculate statistics",
  },
  {
    type: "visualization",
    icon: "📈",
    label: "Visualization",
    description: "Generate chart",
  },
  {
    type: "result",
    icon: "📋",
    label: "Result",
    description: "Show processed data",
  },
];


/* =========================================================
   INITIAL NODE
========================================================= */

const INITIAL_NODES = [
  {
    id: "load-data",
    type: "pipelineNode",
    position: {
      x: 100,
      y: 250,
    },
    data: {
      icon: "📁",
      label: "Load Data",
      description: "Select dataset",
    },
  },
];


/* =========================================================
   COMPONENT
========================================================= */

function PipelineBuilder() {
  const {
    datasets,
    selectedDatasetId: savedDatasetId,
    selectDataset,
    addRun,
  } = useData();


  /* =======================================================
     DATASET
  ======================================================= */

  const [
    selectedDatasetId,
    setSelectedDatasetId,
  ] = useState(() => String(savedDatasetId || ""));

  const selectedDataset =
    datasets.find(
      (dataset) =>
        String(dataset.id) === String(selectedDatasetId)
    ) || null;

  const selectedData =
    selectedDataset?.previewData || [];


  /* =======================================================
     PIPELINE HISTORY STATE
  ======================================================= */

  const [
    pipelineHistory,
    setPipelineHistory,
  ] = useState([]);


  /* =======================================================
     PIPELINE HISTORY — AUTHENTICATED
  ======================================================= */

  const fetchPipelineHistory = async () => {
    try {
      const response = await fetch(
        `${API_URL}/pipelines/history`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(
          error.detail || "Failed to fetch pipeline history."
        );
      }

      const data = await response.json();

      setPipelineHistory(
        Array.isArray(data) ? data : []
      );

      console.log("PIPELINE HISTORY:", data);
    } catch (error) {
      console.error("Pipeline history error:", error);
    }
  };

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      if (!localStorage.getItem("access_token")) {
        handleUnauthorized();
        return;
      }
      try {
        const response = await fetch(`${API_URL}/pipelines/history`, {
          headers: getAuthHeaders(),
        });
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!response.ok) throw new Error("Failed to fetch pipeline history.");
        const data = await response.json();
        if (active) setPipelineHistory(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Pipeline history error:", error);
      }
    };
    loadHistory();
    return () => { active = false; };
  }, []);


  /* =======================================================
     DELETE PIPELINE HISTORY — AUTHENTICATED
  ======================================================= */

  const deletePipelineHistory = async (runId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this pipeline run?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/pipelines/${runId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(
          error.detail || "Failed to delete pipeline history."
        );
      }

      await fetchPipelineHistory();

    } catch (error) {
      console.error("Delete pipeline history error:", error);

      alert(
        error.message || "Unable to delete pipeline history."
      );
    }
  };


  /* =======================================================
     VIEW PIPELINE HISTORY — AUTHENTICATED
  ======================================================= */

  const viewPipelineHistory = async (runId) => {
    try {
      const response = await fetch(
        `${API_URL}/pipelines/${runId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(
          error.detail || "Failed to fetch pipeline run."
        );
      }

      const run = await response.json();

      const operations = Array.isArray(run.operations)
        ? run.operations
        : [];

      const createdAt = run.created_at
        ? new Date(run.created_at).toLocaleString()
        : "Unknown";

      alert(
        `Dataset: ${run.dataset_name}

Status: ${run.status}

Original Rows: ${run.original_rows}

Final Rows: ${run.final_rows}

Duplicates Removed: ${run.duplicates_removed}

Missing Values Handled: ${run.missing_values_handled}

Operations: ${operations.join(" → ")}

Created: ${createdAt}`
      );

    } catch (error) {
      console.error("View pipeline history error:", error);

      alert(
        error.message || "Unable to load pipeline run."
      );
    }
  };


  /* =======================================================
     DATASET COLUMNS
  ======================================================= */

  const datasetColumns =
    selectedData.length > 0
      ? Object.keys(selectedData[0])
      : [];

  const numericColumns = datasetColumns.filter(
    (column) =>
      selectedData.some(
        (row) =>
          row[column] !== "" &&
          row[column] !== null &&
          row[column] !== undefined &&
          !isNaN(Number(row[column]))
      )
  );

  const categoricalColumns = datasetColumns.filter(
    (column) => !numericColumns.includes(column)
  );


  /* =======================================================
     NODES AND EDGES
  ======================================================= */

  const [
    nodes,
    setNodes,
    onNodesChange,
  ] = useNodesState(INITIAL_NODES.map((node) => node.id === "load-data"
    ? { ...node, data: { ...node.data, description: selectedDataset?.name || "Select dataset" } }
    : node));

  const [
    edges,
    setEdges,
    onEdgesChange,
  ] = useEdgesState([]);


  /* =======================================================
     SELECTED NODE
  ======================================================= */

  const [
    selectedNodeId,
    setSelectedNodeId,
  ] = useState(null);

  const selectedNode =
    nodes.find((node) => node.id === selectedNodeId) || null;


  /* =======================================================
     RESULTS
  ======================================================= */

  const [
    resultData,
    setResultData,
  ] = useState([]);

  const [
    statistics,
    setStatistics,
  ] = useState(null);

  const [
    visualization,
    setVisualization,
  ] = useState(null);

  const [
    pipelineStats,
    setPipelineStats,
  ] = useState({
    originalRows: 0,
    finalRows: 0,
    duplicatesRemoved: 0,
    missingHandled: 0,
  });

  const [
    pipelineStatus,
    setPipelineStatus,
  ] = useState("Ready");

  const [
    activeResultTab,
    setActiveResultTab,
  ] = useState("overview");


  /* =======================================================
     UPDATE LOAD NODE
  ======================================================= */

  /* =======================================================
     CONNECT NODES
  ======================================================= */

  const onConnect = useCallback(
    (connection) => {
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          currentEdges
        )
      );
    },
    [setEdges]
  );

  const isValidConnection = useCallback((connection) => {
    if (connection.source === connection.target || connection.target === "load-data") return false;
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);
    if (!sourceNode || !targetNode || sourceNode.id.startsWith("result")) return false;
    if (edges.some((edge) => edge.source === connection.source || edge.target === connection.target)) return false;
    const pending = [connection.target];
    const seen = new Set();
    while (pending.length) {
      const nodeId = pending.pop();
      if (nodeId === connection.source) return false;
      if (seen.has(nodeId)) continue;
      seen.add(nodeId);
      edges.filter((edge) => edge.source === nodeId).forEach((edge) => pending.push(edge.target));
    }
    return true;
  }, [edges, nodes]);


  /* =======================================================
     NODE CLICK
  ======================================================= */

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);


  /* =======================================================
     CANVAS CLICK
  ======================================================= */

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);


  /* =======================================================
     UPDATE VISUALIZATION CONFIG
  ======================================================= */

  const updateVisualizationConfig = (field, value) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== selectedNodeId) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              [field]: value,
            },
          },
        };
      })
    );
  };


  /* =======================================================
     DOWNLOAD CHART
  ======================================================= */

  const downloadChart = async () => {
    const chartElement = document.getElementById("flowbi-chart");

    if (!chartElement) {
      alert("Chart is not available.");
      return;
    }

    try {
      const dataUrl = await toPng(chartElement, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");

      link.download =
        `flowbi-${visualization?.chart_type || "chart"}.png`;

      link.href = dataUrl;
      link.click();

    } catch (error) {
      console.error("Chart download failed:", error);
      alert("Unable to download chart.");
    }
  };


  /* =======================================================
     DRAG MODULE
  ======================================================= */

  const onDragStart = (event, module) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(module)
    );

    event.dataTransfer.effectAllowed = "move";
  };


  /* =======================================================
     DROP MODULE
  ======================================================= */

  const onDrop = (event) => {
    event.preventDefault();

    const rawData = event.dataTransfer.getData(
      "application/reactflow"
    );

    if (!rawData) {
      return;
    }

    let module;

    try {
      module = JSON.parse(rawData);
    } catch {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    const position = {
      x: event.clientX - bounds.left - 90,
      y: event.clientY - bounds.top - 40,
    };

    const newNode = {
      id: `${module.type}-${Date.now()}`,
      type: "pipelineNode",
      position,
      data: {
        icon: module.icon,
        label: module.label,
        description: module.description,

        ...(module.type === "visualization" && {
          config: {
            chart_type: "bar",
            x_column:
              categoricalColumns[0] ||
              datasetColumns[0] ||
              "",
            y_column: numericColumns[0] || "",
            aggregation: "sum",
          },
        }),
      },
    };

    setNodes((currentNodes) => [
      ...currentNodes,
      newNode,
    ]);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };


  /* =======================================================
     RUN PIPELINE — JWT AUTHENTICATED
  ======================================================= */

  const runPipeline = async () => {
    if (!selectedDataset) {
      alert("Please select a dataset first.");
      return;
    }

    if (selectedData.length === 0) {
      alert("Selected dataset is empty.");
      return;
    }

    setPipelineStatus("Running...");

    try {
      const orderedNodes = [];

      let currentNodeId = "load-data";

      const visited = new Set();

      while (
        currentNodeId &&
        !visited.has(currentNodeId)
      ) {
        visited.add(currentNodeId);

        const currentNode = nodes.find(
          (node) => node.id === currentNodeId
        );

        if (currentNode) {
          orderedNodes.push(currentNode);
        }

        const outgoingEdges = edges.filter(
          (edge) => edge.source === currentNodeId
        );

        if (outgoingEdges.length > 1) {
          throw new Error(
            "The pipeline has a branch. Connect steps in one sequence before running it."
          );
        }

        currentNodeId = outgoingEdges[0]?.target || null;
      }

      if (currentNodeId) {
        throw new Error("Circular connections are not allowed in a pipeline.");
      }

      if (
        nodes.some(
          (node) =>
            node.id !== "load-data" &&
            !visited.has(node.id)
        )
      ) {
        throw new Error(
          "Connect every pipeline module to Load Data before running the pipeline."
        );
      }

      const operations = orderedNodes
        .filter((node) => node.id !== "load-data")
        .map((node) => {
          if (node.id.startsWith("remove-duplicates")) {
            return "remove-duplicates";
          }

          if (node.id.startsWith("missing-values")) {
            return "missing-values";
          }

          if (node.id.startsWith("statistics")) {
            return "statistics";
          }

          if (node.id.startsWith("visualization")) {
            return "visualization";
          }

          return null;
        })
        .filter(Boolean);

      const visualizationNode = orderedNodes.find(
        (node) => node.id.startsWith("visualization")
      );

      const visualizationConfig =
        visualizationNode?.data?.config || null;

      console.log("PIPELINE OPERATIONS:", operations);
      console.log("VISUALIZATION CONFIG:", visualizationConfig);

      const response = await fetch(
        `${API_URL}/pipelines/run`,
        {
          method: "POST",
          headers: getAuthHeaders(true),

          body: JSON.stringify({
            dataset_id: selectedDataset.id,
            operations,
            visualization_config: visualizationConfig,
          }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(
          error.detail || "Pipeline API request failed."
        );
      }

      const result = await response.json();

      /* Refresh authenticated pipeline history */
      await fetchPipelineHistory();

      console.log("PIPELINE RESULT:", result);

      setResultData(result.data || []);
      setStatistics(result.statistics || null);
      setVisualization(result.visualization || null);

      setPipelineStats({
        originalRows: result.original_rows || 0,
        finalRows: result.final_rows || 0,
        duplicatesRemoved: result.duplicates_removed || 0,
        missingHandled: result.missing_values_handled || 0,
      });

      setPipelineStatus("Completed");

      addRun({
        datasetName: selectedDataset.name,
        timestamp: new Date().toISOString(),
        operations,
        originalRows: result.original_rows || 0,
        finalRows: result.final_rows || 0,
        duplicatesRemoved: result.duplicates_removed || 0,
        missingHandled: result.missing_values_handled || 0,
        statistics: result.statistics || null,
        visualization: result.visualization || null,
      });

      setActiveResultTab("overview");

    } catch (error) {
      console.error("Pipeline error:", error);

      setPipelineStatus("Failed");

      alert(
        error.message ||
        "Pipeline failed. Please check the backend server."
      );
    }
  };


  /* =======================================================
     RESET
  ======================================================= */

  const resetPipeline = () => {
    setNodes(INITIAL_NODES);
    setEdges([]);
    setSelectedNodeId(null);

    setResultData([]);
    setStatistics(null);
    setVisualization(null);

    setPipelineStats({
      originalRows: 0,
      finalRows: 0,
      duplicatesRemoved: 0,
      missingHandled: 0,
    });

    setPipelineStatus("Ready");
    setActiveResultTab("overview");
  };


  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="pipeline-page">
      <Sidebar />

      {/* SIDEBAR */}

      <aside className="pipeline-sidebar">
        <Link className="pipeline-back-link" to="/dashboard">← Back to Dashboard</Link>
        <div className="pipeline-theme-toggle"><ThemeToggle /></div>
        <h2>Pipeline Builder</h2>

        <div className="selected-dataset-section">
          <p className="section-title">
            SELECTED DATASET
          </p>

          <select
            className="dataset-select"
            value={selectedDatasetId}
            onChange={(event) => {
              const value = event.target.value;
              const dataset = datasets.find((item) => String(item.id) === value);

              setSelectedDatasetId(value);
              selectDataset(value);
              setNodes((currentNodes) => currentNodes.map((node) => node.id === "load-data"
                ? { ...node, data: { ...node.data, description: dataset?.name || "Select dataset" } }
                : node));
              setResultData([]);
              setStatistics(null);
              setVisualization(null);
              setPipelineStats({ originalRows: 0, finalRows: 0, duplicatesRemoved: 0, missingHandled: 0 });
              setPipelineStatus("Ready");
              setActiveResultTab("overview");
            }}
          >
            <option value="">Select dataset</option>

            {datasets.map((dataset) => (
              <option
                key={dataset.id}
                value={dataset.id}
              >
                {dataset.name}
              </option>
            ))}
          </select>

          {selectedDataset ? (
            <div className="selected-dataset-card">
              <div className="selected-file-icon">
                FILE
              </div>

              <div className="selected-dataset-details">
                <strong>{selectedDataset.name}</strong>

                <span>{selectedData.length} rows</span>

                <span>
                  {selectedData.length > 0
                    ? Object.keys(selectedData[0]).length
                    : 0}{" "}
                  columns
                </span>
              </div>
            </div>
          ) : (
            <div className="no-dataset-selected">
              Select a dataset to start.
            </div>
          )}
        </div>

        <div className="modules-section">
          <p className="section-title">
            PIPELINE MODULES
          </p>

          {PIPELINE_MODULES.map((module) => (
            <div
              key={module.type}
              className="pipeline-module"
              draggable
              onDragStart={(event) =>
                onDragStart(event, module)
              }
            >
              <div className="module-icon">
                {module.icon}
              </div>

              <div className="module-content">
                <strong>{module.label}</strong>
                <span>{module.description}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pipeline-actions">
          <button
            className="run-pipeline-button"
            onClick={runPipeline}
          >
            ▶ Run Pipeline
          </button>

          <button
            className="reset-pipeline-button"
            onClick={resetPipeline}
          >
            Reset
          </button>
        </div>

        <div className="pipeline-status">
          <span className="status-dot"></span>
          {pipelineStatus}
        </div>

        <div className="pipeline-help">
          Drag modules onto the canvas and connect them
          to build your pipeline.
        </div>
      </aside>


      {/* MAIN */}

      <main className="pipeline-main">
        <div
          className="pipeline-canvas"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            deleteKeyCode={["Backspace", "Delete"]}
            nodesDraggable
            nodesConnectable
            elementsSelectable
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>


        {/* VISUALIZATION CONFIGURATION */}

        {selectedNode?.id?.startsWith("visualization") &&
          selectedNode.data?.config && (
            <section className="visualization-config-panel">
              <div className="visualization-config-header">
                <div>
                  <span className="result-eyebrow">
                    VISUALIZATION CONFIGURATION
                  </span>

                  <h3>Configure Chart</h3>
                </div>
              </div>

              <div className="visualization-config-grid">
                <div className="visualization-config-field">
                  <label>Chart Type</label>

                  <select
                    value={selectedNode.data.config.chart_type}
                    onChange={(event) =>
                      updateVisualizationConfig(
                        "chart_type",
                        event.target.value
                      )
                    }
                  >
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Pie</option>
                    <option value="scatter">Scatter</option>
                  </select>
                </div>

                <div className="visualization-config-field">
                  <label>X-Axis</label>

                  <select
                    value={selectedNode.data.config.x_column}
                    onChange={(event) =>
                      updateVisualizationConfig(
                        "x_column",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Select X-Axis</option>

                    {datasetColumns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="visualization-config-field">
                  <label>Y-Axis</label>

                  <select
                    value={selectedNode.data.config.y_column}
                    onChange={(event) =>
                      updateVisualizationConfig(
                        "y_column",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Select Y-Axis</option>

                    {numericColumns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="visualization-config-field">
                  <label>Aggregation</label>

                  <select
                    value={selectedNode.data.config.aggregation}
                    onChange={(event) =>
                      updateVisualizationConfig(
                        "aggregation",
                        event.target.value
                      )
                    }
                  >
                    <option value="sum">Sum</option>
                    <option value="average">Average</option>
                    <option value="count">Count</option>
                    <option value="min">Min</option>
                    <option value="max">Max</option>
                  </select>
                </div>
              </div>
            </section>
          )}


        {/* RESULTS */}

        {resultData.length > 0 && (
          <section className="pipeline-result">
            <div className="result-header">
              <div>
                <span className="result-eyebrow">
                  PIPELINE RESULTS
                </span>

                <h2>{selectedDataset?.name}</h2>
              </div>

              <div className="result-status">
                ✓ Completed
              </div>
            </div>

            <div className="result-tabs">
              {[
                ["overview", "Overview"],
                ["statistics", "Statistics"],
                ["preview", "Data Preview"],
                ["visualization", "Visualization"],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  className={activeResultTab === tab ? "active" : ""}
                  onClick={() => setActiveResultTab(tab)}
                >
                  {label}
                </button>
              ))}
            </div>


            {/* OVERVIEW */}

            {activeResultTab === "overview" && (
              <div className="result-overview">
                <div className="overview-grid">
                  {[
                    ["Original Rows", pipelineStats.originalRows],
                    ["Final Rows", pipelineStats.finalRows],
                    ["Duplicates Removed", pipelineStats.duplicatesRemoved],
                    ["Missing Values Handled", pipelineStats.missingHandled],
                  ].map(([label, value]) => (
                    <div className="overview-card" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="result-message">
                  Pipeline processing completed successfully.
                </div>
              </div>
            )}


            {/* STATISTICS */}

            {activeResultTab === "statistics" && statistics && (
              <div className="result-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Missing</th>
                      <th>Unique</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Mean</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(statistics.columnStats || []).map((item) => (
                      <tr key={item.column}>
                        <td>{item.column}</td>
                        <td>{item.type}</td>
                        <td>{item.missing}</td>
                        <td>{item.unique}</td>
                        <td>{item.min}</td>
                        <td>{item.max}</td>
                        <td>{item.mean}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}


            {/* DATA PREVIEW */}

            {activeResultTab === "preview" && (
              <div className="result-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      {resultData.length > 0 &&
                        Object.keys(resultData[0]).map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                    </tr>
                  </thead>

                  <tbody>
                    {resultData.slice(0, 10).map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{String(value ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="result-footer">
                  Showing {Math.min(10, resultData.length)} of{" "}
                  {resultData.length} rows
                </div>
              </div>
            )}


            {/* VISUALIZATION */}

            {activeResultTab === "visualization" && (
              <div
                className="result-visualization"
                id="flowbi-chart"
              >
                {visualization ? (
                  <>
                    <div className="visualization-header">
                      <div>
                        <h3>{visualization.y_column}</h3>
                        <span>{visualization.x_column}</span>
                      </div>

                      <div className="visualization-header-actions">
                        <button
                          className="download-chart-button"
                          onClick={downloadChart}
                        >
                          ↓ Download PNG
                        </button>

                        <div className="chart-type-badge">
                          {{
                            bar: "Bar Chart",
                            line: "Line Chart",
                            pie: "Pie Chart",
                            scatter: "Scatter Plot",
                          }[visualization.chart_type] || "Chart"}
                        </div>
                      </div>
                    </div>


                    {/* BAR CHART */}

                    {visualization.chart_type === "bar" && (
                      <div className="rechart-wrapper">
                        <ResponsiveContainer width="100%" height={420}>
                          <BarChart
                            data={visualization.data || []}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 70,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis
                              dataKey="category"
                              angle={-35}
                              textAnchor="end"
                              interval={0}
                              height={80}
                            />

                            <YAxis />
                            <Tooltip />
                            <Legend />

                            <Bar
                              dataKey="value"
                              name={visualization.y_column}
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}


                    {/* LINE CHART */}

                    {visualization.chart_type === "line" && (
                      <div className="rechart-wrapper">
                        <ResponsiveContainer width="100%" height={420}>
                          <LineChart
                            data={visualization.data || []}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 50,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip />
                            <Legend />

                            <Line
                              type="monotone"
                              dataKey="value"
                              name={visualization.y_column}
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              activeDot={{ r: 7 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}


                    {/* PIE CHART */}

                    {visualization.chart_type === "pie" && (
                      <div className="rechart-wrapper pie-chart-wrapper">
                        <ResponsiveContainer width="100%" height={440}>
                          <PieChart>
                            <Tooltip />
                            <Legend />

                            <Pie
                              data={visualization.data || []}
                              dataKey="value"
                              nameKey="category"
                              cx="50%"
                              cy="50%"
                              outerRadius={150}
                              innerRadius={50}
                              paddingAngle={2}
                              label
                            >
                              {(visualization.data || []).map(
                                (_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={[
                                      "#6366f1",
                                      "#22c55e",
                                      "#f59e0b",
                                      "#ef4444",
                                      "#06b6d4",
                                      "#8b5cf6",
                                      "#ec4899",
                                      "#14b8a6",
                                    ][index % 8]}
                                  />
                                )
                              )}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}


                    {/* SCATTER CHART */}

                    {visualization.chart_type === "scatter" && (
                      <div className="rechart-wrapper">
                        <ResponsiveContainer width="100%" height={420}>
                          <ScatterChart
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 30,
                            }}
                          >
                            <CartesianGrid />

                            <XAxis
                              type="number"
                              dataKey="x"
                              name={visualization.x_column}
                            />

                            <YAxis
                              type="number"
                              dataKey="y"
                              name={visualization.y_column}
                            />

                            <Tooltip
                              cursor={{ strokeDasharray: "3 3" }}
                            />

                            <Legend />

                            <Scatter
                              name={`${visualization.x_column} vs ${visualization.y_column}`}
                              data={visualization.data || []}
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-visualization">
                    No visualization data is available. Connect a
                    Visualization node to the pipeline and run it again.
                  </div>
                )}
              </div>
            )}
          </section>
        )}


        {/* PIPELINE HISTORY */}

        <section className="pipeline-history">
          <div className="pipeline-history-header">
            <div>
              <span className="result-eyebrow">
                EXECUTION LOG
              </span>

              <h2>Pipeline History</h2>

              <p>
                View previous pipeline executions and their processing details.
              </p>
            </div>

            <button
              className="history-refresh-button"
              onClick={fetchPipelineHistory}
            >
              ↻ Refresh
            </button>
          </div>

          {pipelineHistory.length === 0 ? (
            <div className="pipeline-history-empty">
              <div className="history-empty-icon">🕘</div>

              <h3>No pipeline runs yet</h3>

              <p>
                Run a pipeline to see its execution history here.
              </p>
            </div>
          ) : (
            <div className="pipeline-history-list">
              {pipelineHistory.map((run) => (
                <div
                  className="pipeline-history-card"
                  key={run.id}
                >
                  <div className="history-card-main">
                    <div className="history-card-title">
                      <div className="history-dataset-icon">
                        FILE
                      </div>

                      <div>
                        <h3>{run.dataset_name}</h3>
                        <span>Run #{run.id}</span>
                      </div>
                    </div>

                    <span
                      className={
                        run.status === "completed"
                          ? "history-status completed"
                          : "history-status"
                      }
                    >
                      ✓ {run.status}
                    </span>
                  </div>

                  <div className="history-card-stats">
                    <div className="history-stat">
                      <span>Rows</span>

                      <strong>
                        {run.original_rows} → {run.final_rows}
                      </strong>
                    </div>

                    <div className="history-stat">
                      <span>Duplicates Removed</span>
                      <strong>{run.duplicates_removed}</strong>
                    </div>

                    <div className="history-stat">
                      <span>Missing Handled</span>
                      <strong>{run.missing_values_handled}</strong>
                    </div>

                    <div className="history-stat">
                      <span>Operations</span>

                      <strong>
                        {Array.isArray(run.operations)
                          ? run.operations.length
                          : 0}
                      </strong>
                    </div>
                  </div>

                  <div className="history-card-bottom">
                    <div className="history-operations">
                      <span>Operations:</span>

                      {Array.isArray(run.operations) &&
                      run.operations.length > 0 ? (
                        <div className="history-operation-tags">
                          {run.operations.map(
                            (operation, index) => (
                              <span
                                key={`${run.id}-${operation}-${index}`}
                                className="history-operation-tag"
                              >
                                {operation}
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <span>None</span>
                      )}
                    </div>

                    <div className="history-card-actions">
                      <span className="history-date">
                        {run.created_at
                          ? new Date(run.created_at).toLocaleString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Unknown date"}
                      </span>

                      <button
                        className="history-view-button"
                        onClick={() => viewPipelineHistory(run.id)}
                      >
                        View
                      </button>

                      <button
                        className="history-delete-button"
                        onClick={() => deletePipelineHistory(run.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default PipelineBuilder;
