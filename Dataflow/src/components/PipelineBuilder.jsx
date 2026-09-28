import { useCallback } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";

import { useData } from "../DataContext";

import "@xyflow/react/dist/style.css";
import "./PipelineBuilder.css";


function PipelineNode({ data }) {
  return (
    <div className="pipeline-node">

      <Handle
        type="target"
        position={Position.Left}
      />

      <div className="pipeline-node-icon">
        {data.icon}
      </div>

      <div className="pipeline-node-content">

        <strong>
          {data.label}
        </strong>

        <small>
          {data.description}
        </small>

      </div>

      <Handle
        type="source"
        position={Position.Right}
      />

    </div>
  );
}


const nodeTypes = {
  pipelineNode: PipelineNode,
};


function PipelineBuilder() {

  // Get uploaded data from DataContext
  const {
    uploadedFile,
    previewData,
  } = useData();


  // Initial Load Data node
  const initialNodes = [
    {
      id: "1",

      type: "pipelineNode",

      position: {
        x: 100,
        y: 150,
      },

      data: {
        icon: "📁",

        label: "Load Data",

        description: uploadedFile
          ? uploadedFile.name
          : "CSV / Excel",
      },
    },
  ];


  const initialEdges = [];


  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);


  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);


  // Connect nodes
  const onConnect = useCallback(
    (connection) => {

      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            animated: true,
          },

          currentEdges
        )
      );

    },
    [setEdges]
  );


  // Drag module from sidebar
  const onDragStart = (
    event,
    moduleType
  ) => {

    event.dataTransfer.setData(
      "application/reactflow",
      moduleType
    );

    event.dataTransfer.effectAllowed =
      "move";
  };


  // Allow dropping
  const onDragOver = useCallback(
    (event) => {

      event.preventDefault();

      event.dataTransfer.dropEffect =
        "move";

    },
    []
  );


  // Drop module on canvas
  const onDrop = useCallback(
    (event) => {

      event.preventDefault();


      const moduleType =
        event.dataTransfer.getData(
          "application/reactflow"
        );


      if (!moduleType) {
        return;
      }


      const bounds =
        event.currentTarget.getBoundingClientRect();


      const position = {
        x:
          event.clientX -
          bounds.left,

        y:
          event.clientY -
          bounds.top,
      };


      const modules = {

        "load-data": {
          icon: "📁",

          label: "Load Data",

          description: uploadedFile
            ? uploadedFile.name
            : "CSV / Excel",
        },


        "remove-duplicates": {
          icon: "🧹",

          label: "Remove Duplicates",

          description:
            "Clean duplicate rows",
        },


        "missing-values": {
          icon: "🔧",

          label: "Missing Values",

          description:
            "Handle missing data",
        },


        "statistics": {
          icon: "📊",

          label: "Statistics",

          description:
            "Analyze your data",
        },


        "visualization": {
          icon: "📈",

          label: "Visualization",

          description:
            "Create charts",
        },


        "result": {
          icon: "📋",

          label: "Result",

          description:
            "View final output",
        },

      };


      if (!modules[moduleType]) {
        return;
      }


      const newNode = {

        id:
          `${moduleType}-${Date.now()}`,

        type: "pipelineNode",

        position,

        data:
          modules[moduleType],

      };


      setNodes((currentNodes) => [

        ...currentNodes,

        newNode,

      ]);

    },

    [setNodes, uploadedFile]
  );


  // Run pipeline
  const runPipeline = () => {

    console.log(
      "Pipeline Nodes:",
      nodes
    );


    console.log(
      "Pipeline Connections:",
      edges
    );


    console.log(
      "Uploaded File:",
      uploadedFile
    );


    console.log(
      "Preview Data:",
      previewData
    );


    if (!uploadedFile) {

      alert(
        "Please upload a dataset first."
      );

      return;
    }


    if (nodes.length < 2) {

      alert(
        "Please add at least one more module."
      );

      return;
    }


    if (edges.length === 0) {

      alert(
        "Please connect your modules first."
      );

      return;
    }


    alert(
      "Pipeline is ready to run!"
    );

  };


  return (

    <div className="pipeline-page">


      {/* HEADER */}

      <div className="pipeline-header">

        <div>

          <p className="pipeline-eyebrow">
            FLOWBI WORKSPACE
          </p>


          <h1>
            Build Your Pipeline
          </h1>


          <p>
            Connect data operations and run
            your analysis in one click.
          </p>

        </div>


        <button
          className="run-button"
          onClick={runPipeline}
        >
          ▶ Run Pipeline
        </button>

      </div>



      {/* WORKSPACE */}

      <div className="pipeline-workspace">


        {/* SIDEBAR */}

        <aside className="module-sidebar">

          <h3>
            Modules
          </h3>


          <p className="module-description">
            Drag modules into the canvas.
          </p>


          <div className="module-list">


            {/* LOAD DATA */}

            <div
              className="module-item"
              draggable
              onDragStart={(event) =>
                onDragStart(
                  event,
                  "load-data"
                )
              }
            >

              <span>
                📁
              </span>


              <div>

                <strong>
                  Load Data
                </strong>

                <small>
                  CSV / Excel
                </small>

              </div>

            </div>



            {/* REMOVE DUPLICATES */}

            <div
              className="module-item"
              draggable
              onDragStart={(event) =>
                onDragStart(
                  event,
                  "remove-duplicates"
                )
              }
            >

              <span>
                🧹
              </span>


              <div>

                <strong>
                  Remove Duplicates
                </strong>

                <small>
                  Clean duplicate rows
                </small>

              </div>

            </div>



            {/* MISSING VALUES */}

            <div
              className="module-item"
              draggable
              onDragStart={(event) =>
                onDragStart(
                  event,
                  "missing-values"
                )
              }
            >

              <span>
                🔧
              </span>


              <div>

                <strong>
                  Missing Values
                </strong>

                <small>
                  Handle missing data
                </small>

              </div>

            </div>



            {/* STATISTICS */}

            <div
              className="module-item"
              draggable
              onDragStart={(event) =>
                onDragStart(
                  event,
                  "statistics"
                )
              }
            >

              <span>
                📊
              </span>


              <div>

                <strong>
                  Statistics
                </strong>

                <small>
                  Analyze your data
                </small>

              </div>

            </div>



            {/* VISUALIZATION */}

            <div
              className="module-item"
              draggable
              onDragStart={(event) =>
                onDragStart(
                  event,
                  "visualization"
                )
              }
            >

              <span>
                📈
              </span>


              <div>

                <strong>
                  Visualization
                </strong>

                <small>
                  Create charts
                </small>

              </div>

            </div>



            {/* RESULT */}

            <div
              className="module-item"
              draggable
              onDragStart={(event) =>
                onDragStart(
                  event,
                  "result"
                )
              }
            >

              <span>
                📋
              </span>


              <div>

                <strong>
                  Result
                </strong>

                <small>
                  View final output
                </small>

              </div>

            </div>


          </div>

        </aside>



        {/* CANVAS */}

        <div
          className="pipeline-canvas"

          onDragOver={onDragOver}

          onDrop={onDrop}
        >

          <ReactFlow

            nodes={nodes}

            edges={edges}

            onNodesChange={
              onNodesChange
            }

            onEdgesChange={
              onEdgesChange
            }

            onConnect={
              onConnect
            }

            nodeTypes={
              nodeTypes
            }

            fitView
          >

            <Background />

            <Controls />

            <MiniMap />

          </ReactFlow>

        </div>


      </div>

    </div>

  );
}


export default PipelineBuilder;