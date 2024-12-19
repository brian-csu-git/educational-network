import React, { useState, useEffect } from 'react';

const NetworkVisualization = () => {
  // Layer configuration
  const LAYER_SPACING = 200;
  const NODE_SPACING = 80;
  const NODE_RADIUS = 15;
  
  // Generate sample data (simplified for initial visualization)
  const generateData = () => {
    const data = {
      topics: Array.from({ length: 5 }, (_, i) => ({
        id: `topic-${i + 1}`,
        name: `Topic ${i + 1}`,
        x: 0,
        y: 0,
      })),
      classes: Array.from({ length: 5 }, (_, i) => ({
        id: `class-${i + 1}`,
        name: `Class ${i + 1}`,
        x: 0,
        y: 0,
        connectedTopics: getRandomSubset(5, 1, 2) // Connect to 1-2 topics
      })),
      courseObjectives: Array.from({ length: 15 }, (_, i) => ({
        id: `objective-${i + 1}`,
        name: `CO ${i + 1}`,
        x: 0,
        y: 0,
        connectedClasses: [Math.floor(i / 3) + 1], // Each objective connects to one class
        connections: getRandomSubset(15, 1, 2) // Connect to 1-2 other objectives
      })),
      lectureObjectives: Array.from({ length: 30 }, (_, i) => ({
        id: `lecture-${i + 1}`,
        name: `LO ${i + 1}`,
        x: 0,
        y: 0,
        connectedObjectives: [Math.floor(i / 2) + 1] // Each lecture connects to one course objective
      })),
      assessments: Array.from({ length: 45 }, (_, i) => ({
        id: `assessment-${i + 1}`,
        name: `A ${i + 1}`,
        x: 0,
        y: 0,
        connectedLectures: [Math.floor(i / 1.5) + 1] // Each assessment connects to one lecture objective
      }))
    };
    
    return data;
  };

  // Helper function to get random connections
  function getRandomSubset(total, min, max) {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    const result = [];
    while (result.length < count) {
      const num = Math.floor(Math.random() * total) + 1;
      if (!result.includes(num)) result.push(num);
    }
    return result;
  }

  const [data, setData] = useState(generateData());
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('network-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(600, window.innerHeight - 100)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate node positions
  const calculatePositions = () => {
    const newData = { ...data };
    const layers = [
      newData.topics,
      newData.classes,
      newData.courseObjectives,
      newData.lectureObjectives,
      newData.assessments
    ];

    layers.forEach((layer, layerIndex) => {
      const layerWidth = dimensions.width - 100;
      const startX = 50;
      const startY = 50;

      layer.forEach((node, nodeIndex) => {
        node.x = startX + (layerWidth / (layer.length + 1)) * (nodeIndex + 1);
        node.y = startY + (layerIndex * LAYER_SPACING);
      });
    });

    setData(newData);
  };

  // Get all connections for a node
  const getConnections = (nodeId) => {
    const connections = [];
    const nodeType = nodeId.split('-')[0];
    const nodeNum = parseInt(nodeId.split('-')[1]);

    // Helper function to add connection
    const addConnection = (from, to, x1, y1, x2, y2) => {
      connections.push({
        id: `${from}-${to}`,
        from,
        to,
        x1,
        y1,
        x2,
        y2
      });
    };

    // Helper function to trace upward connections
    const traceUpward = (currentNodeId) => {
      const type = currentNodeId.split('-')[0];
      const num = parseInt(currentNodeId.split('-')[1]);
      
      if (type === 'objective') {
        // Trace from CO to Class
        data.classes.forEach(class_ => {
          const classNum = parseInt(class_.id.split('-')[1]);
          if (data.courseObjectives.find(co => co.id === currentNodeId)?.connectedClasses.includes(classNum)) {
            addConnection(
              currentNodeId,
              class_.id,
              data.courseObjectives.find(co => co.id === currentNodeId).x,
              data.courseObjectives.find(co => co.id === currentNodeId).y,
              class_.x,
              class_.y
            );
            // Continue tracing up from the class
            traceUpward(class_.id);
          }
        });
      } else if (type === 'class') {
        // Trace from Class to Topic
        data.topics.forEach(topic => {
          const topicNum = parseInt(topic.id.split('-')[1]);
          if (data.classes.find(c => c.id === currentNodeId)?.connectedTopics.includes(topicNum)) {
            addConnection(
              currentNodeId,
              topic.id,
              data.classes.find(c => c.id === currentNodeId).x,
              data.classes.find(c => c.id === currentNodeId).y,
              topic.x,
              topic.y
            );
          }
        });
      }
    };

    // If selecting a lecture or course objective, trace upward connections
    if (nodeType === 'lecture' || nodeType === 'objective') {
      if (nodeType === 'lecture') {
        // First get connections to course objectives
        data.courseObjectives.forEach(objective => {
          const objNum = parseInt(objective.id.split('-')[1]);
          if (data.lectureObjectives.find(lo => lo.id === nodeId)?.connectedObjectives.includes(objNum)) {
            addConnection(
              nodeId,
              objective.id,
              data.lectureObjectives.find(lo => lo.id === nodeId).x,
              data.lectureObjectives.find(lo => lo.id === nodeId).y,
              objective.x,
              objective.y
            );
            // Then trace upward from each connected course objective
            traceUpward(objective.id);
          }
        });
      } else {
        // Start tracing upward from course objective
        traceUpward(nodeId);
      }
    }

    switch (nodeType) {
      case 'topic':
        // Topic to Class connections
        data.classes.forEach(class_ => {
          if (class_.connectedTopics.includes(nodeNum)) {
            addConnection(
              nodeId,
              class_.id,
              data.topics.find(t => t.id === nodeId).x,
              data.topics.find(t => t.id === nodeId).y,
              class_.x,
              class_.y
            );
          }
        });
        break;

      case 'class':
        // Class to Course Objective connections
        data.courseObjectives.forEach(objective => {
          if (objective.connectedClasses.includes(nodeNum)) {
            addConnection(
              nodeId,
              objective.id,
              data.classes.find(c => c.id === nodeId).x,
              data.classes.find(c => c.id === nodeId).y,
              objective.x,
              objective.y
            );
          }
        });
        break;

      case 'objective':
        // Course Objective to Lecture Objective connections
        data.lectureObjectives.forEach(lecture => {
          if (lecture.connectedObjectives.includes(nodeNum)) {
            addConnection(
              nodeId,
              lecture.id,
              data.courseObjectives.find(co => co.id === nodeId).x,
              data.courseObjectives.find(co => co.id === nodeId).y,
              lecture.x,
              lecture.y
            );
          }
        });
        // Course Objective to other Course Objectives (cross connections)
        data.courseObjectives.forEach(otherObjective => {
          if (otherObjective.id !== nodeId && 
              otherObjective.connections.includes(nodeNum)) {
            addConnection(
              nodeId,
              otherObjective.id,
              data.courseObjectives.find(co => co.id === nodeId).x,
              data.courseObjectives.find(co => co.id === nodeId).y,
              otherObjective.x,
              otherObjective.y
            );
          }
        });
        break;

      case 'lecture':
        // Lecture Objective to Assessment connections
        data.assessments.forEach(assessment => {
          if (assessment.connectedLectures.includes(nodeNum)) {
            addConnection(
              nodeId,
              assessment.id,
              data.lectureObjectives.find(lo => lo.id === nodeId).x,
              data.lectureObjectives.find(lo => lo.id === nodeId).y,
              assessment.x,
              assessment.y
            );
          }
        });
        break;
    }

    return connections;
  };

  React.useEffect(() => {
    calculatePositions();
  }, []);

  const handleNodeClick = (nodeId) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const isConnected = (nodeId) => {
    if (!selectedNode) return true; // Show all nodes when nothing is selected
    if (nodeId === selectedNode) return true; // Always show selected node
    const connections = getConnections(selectedNode);
    return connections.some(conn => conn.from === nodeId || conn.to === nodeId);
  };

  const Node = ({ id, x, y, name, selected }) => (
    <g
      transform={`translate(${x},${y})`}
      onClick={(e) => {
        e.stopPropagation();
        handleNodeClick(id);
      }}
      className="cursor-pointer"
      style={{ pointerEvents: 'all' }}
    >
      <g className={`transition-all duration-200 ${isConnected(id) ? 'opacity-100' : 'opacity-30'}`}>
        <circle
          r={NODE_RADIUS}
          className={`
            transition-colors duration-200
            ${selected ? 'fill-blue-500' : 'fill-gray-200'}
            ${isConnected(id) ? 'stroke-blue-500 stroke-2' : 'stroke-gray-400'}
          `}
        />
        <text
          dy="30"
          textAnchor="middle"
          className="text-sm fill-gray-700"
        >
          {name}
        </text>
      </g>
    </g>
  );

  const Connections = () => {
    if (!selectedNode) return null;

    const connections = getConnections(selectedNode);
    
    return connections.map((conn, i) => {
      // Determine if this is a same-layer connection
      const fromType = conn.from.split('-')[0];
      const toType = conn.to.split('-')[0];
      const isSameLayer = fromType === toType;
      
      // Calculate control points for the curve
      const dx = conn.x2 - conn.x1;
      const dy = conn.y2 - conn.y1;
      
      // For same layer connections, make a more pronounced curve
      let controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y;
      
      if (isSameLayer) {
        // Create a more circular curve for same-layer connections
        const midX = (conn.x1 + conn.x2) / 2;
        const midY = (conn.y1 + conn.y2) / 2;
        const curveOffset = Math.min(Math.abs(dx), 100) * (dy < 0 ? -1 : 1);
        
        controlPoint1X = midX - curveOffset;
        controlPoint1Y = midY - curveOffset;
        controlPoint2X = midX + curveOffset;
        controlPoint2Y = midY - curveOffset;
      } else {
        // Create a gentle curve for cross-layer connections
        controlPoint1X = conn.x1 + dx * 0.25;
        controlPoint1Y = conn.y1 + dy * 0.1;
        controlPoint2X = conn.x1 + dx * 0.75;
        controlPoint2Y = conn.y2 - dy * 0.1;
      }

      return (
        <g key={i}>
          <path
            d={`M ${conn.x1} ${conn.y1} 
                C ${controlPoint1X} ${controlPoint1Y},
                  ${controlPoint2X} ${controlPoint2Y},
                  ${conn.x2} ${conn.y2}`}
            fill="none"
            className={`
              ${isSameLayer ? 'stroke-purple-400' : 'stroke-blue-400'}
              ${hoveredConnection === conn.id ? 'stroke-opacity-100 stroke-width-3' : 'stroke-opacity-60'}
              transition-all duration-200
            `}
            strokeWidth={hoveredConnection === conn.id ? "3" : "2"}
            strokeDasharray="4"
            onMouseEnter={() => setHoveredConnection(conn.id)}
            onMouseLeave={() => setHoveredConnection(null)}
          />
          {/* Invisible wider path for easier hovering */}
          <path
            d={`M ${conn.x1} ${conn.y1} 
                C ${controlPoint1X} ${controlPoint1Y},
                  ${controlPoint2X} ${controlPoint2Y},
                  ${conn.x2} ${conn.y2}`}
            fill="none"
            stroke="transparent"
            strokeWidth="10"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredConnection(conn.id)}
            onMouseLeave={() => setHoveredConnection(null)}
          />
        </g>
      );
    });
  };

  return (
    <div id="network-container" className="w-full h-screen p-4">
      <svg 
        width="100%" 
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="bg-white border rounded-lg shadow-lg"
      >
        <Connections />
        
        {Object.keys(data).map(layerKey => 
          data[layerKey].map(node => (
            <Node
              key={node.id}
              id={node.id}
              x={node.x}
              y={node.y}
              name={node.name}
              selected={selectedNode === node.id}
            />
          ))
        )}
      </svg>
    </div>
  );
};

export default NetworkVisualization;