import React, { useState, useEffect } from "react";
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge,
  ConnectionMode,
  Panel,
  ReactFlowProvider
} from "reactflow";
import * as dagre from "dagre";
import LoadingBar from "./LoadingBar";
import 'reactflow/dist/style.css';

interface Task {
  name_of_the_task: string;
  id: number;
  dependencies: number[];
  estimated_duration: number;
}

interface TasksData {
  [key: string]: Task;
}

interface DynamicRoadmapProps {
  tasksData: TasksData;
}

// Increased node dimensions for better readability
const nodeWidth = 250;
const nodeHeight = 100; // Increased height to accommodate the button

// Custom node styles
const nodeStyle = {
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '10px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  fontSize: '12px',
  width: nodeWidth,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Configure the graph for tree layout
  dagreGraph.setGraph({ 
    rankdir: direction,
    align: 'UL',
    nodesep: 50,
    ranksep: 80,
    edgesep: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // Position nodes
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    // Add custom styling
    node.style = nodeStyle;
  });

  // Style edges
  edges.forEach((edge) => {
    edge.type = 'smoothstep'; // smoother edge style
    edge.style = {
      stroke: '#888',
      strokeWidth: 2,
    };
  });

  return { nodes, edges };
};

const DynamicRoadmap: React.FC<DynamicRoadmapProps> = ({ tasksData }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [layout, setLayout] = useState<"TB" | "LR">("TB");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleTaskComplete = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const generateGraph = async () => {
      setIsLoading(true);
      setLoadingProgress(0);

      const generatedNodes: Node[] = [];
      const generatedEdges: Edge[] = [];
      const totalTasks = Object.keys(tasksData).length;
      let processedTasks = 0;

      for (const key of Object.keys(tasksData)) {
        const task = tasksData[key];
        const isCompleted = completedTasks.has(task.id.toString());
        
        // Simulate some processing time for visual feedback
        await new Promise(resolve => setTimeout(resolve, 50));
        
        generatedNodes.push({
          id: task.id.toString(),
          data: {
            label: (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: '#333',
                  textDecoration: isCompleted ? 'line-through' : 'none'
                }}>
                  {task.name_of_the_task}
                </div>
                <div style={{
                  color: '#666',
                  fontSize: '12px',
                  marginBottom: '8px'
                }}>
                  Duration: {task.estimated_duration} day(s)
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskComplete(task.id.toString());
                  }}
                  style={{
                    backgroundColor: isCompleted ? '#4CAF50' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    width: '80%',
                    margin: '0 auto'
                  }}
                >
                  {isCompleted ? 'Completed' : 'Complete Task'}
                </button>
              </div>
            ),
          },
          position: { x: 0, y: 0 },
          style: {
            ...nodeStyle,
            background: isCompleted ? '#f0fff0' : '#fff',
          }
        });

        task.dependencies.forEach((dep: number) => {
          generatedEdges.push({
            id: `e${dep}-${task.id}`,
            source: dep.toString(),
            target: task.id.toString(),
            animated: true,
            style: {
              stroke: '#888',
              strokeWidth: 2,
            },
          });
        });

        processedTasks++;
        setLoadingProgress((processedTasks / totalTasks) * 100);
      }

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        generatedNodes, 
        generatedEdges,
        layout
      );
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLoading(false);
    };

    generateGraph();
  }, [tasksData, layout, completedTasks]);

  const toggleLayout = () => {
    setLayout(current => current === "TB" ? "LR" : "TB");
  };

  return (
    <div style={{ width: "100%", height: "600px", border: '1px solid #ddd', borderRadius: '8px' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '300px'
        }}>
          <div style={{ marginBottom: '10px', textAlign: 'center' }}>
            Generating Graph...
          </div>
          <LoadingBar progress={loadingProgress} />
        </div>
      )}
      <ReactFlowProvider>
        <ReactFlow 
          nodes={nodes} 
          edges={edges}
          connectionMode={ConnectionMode.Strict}
          fitView
          defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
          minZoom={0.2}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#f8f8f8" gap={16} />
          <Controls />
          <Panel position="top-right">
            <button 
              onClick={toggleLayout}
              style={{
                padding: '8px 12px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Toggle Layout ({layout})
            </button>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default DynamicRoadmap;