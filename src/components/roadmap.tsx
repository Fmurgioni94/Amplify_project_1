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
  
  dagreGraph.setGraph({ 
    rankdir: direction,
    align: 'UL',
    nodesep: 50,
    ranksep: 80,
    edgesep: 50,
  });

  // Ensure node IDs are strings
  nodes.forEach((node) => {
    const nodeId = String(node.id); // Convert to string explicitly
    dagreGraph.setNode(nodeId, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    const sourceId = String(edge.source);
    const targetId = String(edge.target);
    dagreGraph.setEdge(sourceId, targetId);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeId = String(node.id);
    const nodeWithPosition = dagreGraph.node(nodeId);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    node.style = nodeStyle;
  });

  edges.forEach((edge) => {
    edge.type = 'smoothstep';
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
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    Object.entries(tasksData).forEach(([key, task]) => {
      const taskId = String(task.id); // Convert ID to string
      const isCompleted = completedTasks.has(taskId);
      
      generatedNodes.push({
        id: taskId,
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
                Duration: {task.estimated_duration} hour(s)
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskComplete(taskId);
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

      // Convert dependency IDs to strings
      task.dependencies.forEach((dep: number) => {
        generatedEdges.push({
          id: `e${dep}-${taskId}`,
          source: String(dep),
          target: taskId,
          animated: true,
          style: {
            stroke: '#888',
            strokeWidth: 2,
          },
        });
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      generatedNodes, 
      generatedEdges,
      layout
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [tasksData, layout, completedTasks]);

  const toggleLayout = () => {
    setLayout(current => current === "TB" ? "LR" : "TB");
  };

  return (
    <div style={{ width: "100%", height: "600px", border: '1px solid #ddd', borderRadius: '8px' }}>
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