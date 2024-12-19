import React, { useState, useEffect } from 'react';

const NetworkVisualization = () => {
  const LAYER_SPACING = 200;
  const NODE_RADIUS = 15;
  
  // Generate sample data
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
        connectedTopics: getRandomSubset(5, 1, 2)
      })),
      courseObjectives: Array.from({ length: 15 }, (_, i) => ({
        id: `objective-${i + 1}`,
        name: `CO ${i + 1}`,
        x: 0,
        y: 0,
        connectedClasses: [Math.floor(i / 3) + 1],
        connections: getRandomSubset(15, 1, 2)
      })),
      lectureObjectives: Array.from({ length: 30 }, (_, i) => ({
        id: `lecture-${i + 1}`,
        name: `LO ${i + 1}`,
        x: 0,
        y: 0,
        connectedObjectives: [Math.floor(i / 2) + 1]
      })),
      assessments: Array.from({ length: 45 }, (_, i) => ({
        id: `assessment-${i + 1}`,
        name: `A ${i + 1}`,
        x: 0,
        y: 0,
        connectedLectures: [Math.floor(i / 1.5) + 1]
      }))
    };
    return data;
  };

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

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: Math.max(800, window.innerWidth - 100),
        height: Math.max(600, window.innerHeight - 100)
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    calculatePositions();
  }, [dimensions]);

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

  const getConnections = (nodeId) => {
    const connections = [];
    const nodeType = nodeId.split('-')[0];
    const nodeNum = parseInt(nodeId.split('-')[1]);

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

    const traceUpward = (currentNodeId) => {
      const type = currentNodeId.split('-')[0];
      const num = parseInt(currentNodeId.split('-')[1]);
      
      if (type === 'objective') {
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
            traceUpward(class_.id);
          }
        });
      } else if (type === 'class') {
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

    if (nodeType === 'lecture' || nodeType === 'objective') {
      if (nodeType === 'lecture') {
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
            traceUpward(objective.id);
          }
        });
      } else {
        traceUpward(nodeId);
      }
    }

    switch (nodeType) {
      case 'topic':
        data.classes.forEach(class_ => {
          if (class_.connectedTopics.includes(nodeNum)) {
            addConnection(nodeId, class_.id,
              data.topics.find(t => t.id === nodeId).x,
              data.topics.find(t => t.id === nodeId).y,
              class_.x, class_.y);
          }
        });
        break;

      case 'class':
        data.courseObjectives.forEach(objective => {
          if (objective.connectedClasses.includes(nodeNum)) {
            addConnection(nodeId, objective.id,
              data.classes.find(c => c.id === nodeId).x,
              data.classes.find(c => c.id === nodeId).y,
              objective.x, objective.y);
          }
        });
        break;

      case 'objective':
        data.lectureObjectives.forEach(lecture => {
          if (lecture.connectedObjectives.includes(nodeNum)) {
            addConnection(nodeId, lecture.id,
              data.courseObjectives.find(co => co.id === nodeId).x,
              data.courseObjectives.find(co => co.id === nodeId).y,
              lecture.x, lecture.y);
          }
        });
        data.courseObjectives.forEach(otherObjective => {
          if (otherObjective.id !== nodeId && 
              otherObjective.connections.includes(nodeNum)) {
            addConnection(nodeId, otherObjective.id,
              data.courseObjectives.find(co => co.id === nodeId).x,
              data.courseObjectives.find(co => co.id === nodeId).y,
              otherObjective.x, otherObjective.y);
          }
        });
        break;

      case 'lecture':
        data.assessments.forEach(assessment => {
          if (assessment.connectedLectures.includes(nodeNum)) {
            addConnection(nodeId, assessment.id,
              data.lectureObjectives.find(lo => lo.id === nodeId).x,
              data.lectureObjectives.find(lo => lo.id === nodeId).y,
              assessment.x, assessment.y);
          }
        });
        break;
    }

    return connections;
  };

  const handleNodeClick = (nodeId) => {
    console.log('Node clicked:', nodeId);
    console.log('Previous selected node:', selectedNode);
    setSelectedNode(prev => {
      const newValue = prev === nodeId ? null : nodeId;
      console.log('Setting selected node to:', newValue);
      return newValue;
    });
  };

  const isConnected = (nodeId) => {
    if (!selectedNode) return true;
    if (nodeId === selectedNode) return true;
    const connections = getConnections(selectedNode);
    return connections.some(conn => conn.from === nodeId || conn.to === nodeId);
  };

  const Node = ({ id, x, y, name, selected }) => {
    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Click event triggered for node:', id);
      handleNodeClick(id);
    };

    return (
      <g 
        transform={`translate(${x},${y})`}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
        className={`transition-all duration-200 ${isConnected(id) ? 'opacity-100' : 'opacity-30'}`}
      >
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
    );
  };

  const Connections = () => {
    if (!selectedNode) return null;

    const connections = getConnections(selectedNode);
    
    return connections.map((conn, i) => {
      const fromType = conn.from.split('-')[0];
      const toType = conn.to.split('-')[0];
      const isSameLayer = fromType === toType;
      
      const dx = conn.x2 - conn.x1;
      const dy = conn.y2 - conn.y1;
      
      let controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y;
      
      if (isSameLayer) {
        const midX = (conn.x1 + conn.x2) / 2;
        const midY = (conn.y1 + conn.y2) / 2;
        const curveOffset = Math.min(Math.abs(dx), 100) * (dy < 0 ? -1 : 1);
        
        controlPoint1X = midX - curveOffset;
        controlPoint1Y = midY - curveOffset;
        controlPoint2X = midX + curveOffset;
        controlPoint2Y = midY - curveOffset;
      } else {
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

  useEffect(() => {
    console.log('Selected node changed to:', selectedNode);
  }, [selectedNode]);

  return (
    <><div
      id="network-container"
      className="w-full h-screen p-4 bg-gray-50"
      onClick={() => {
        console.log('Container clicked, clearing selection');
        setSelectedNode(null);
      } } /><svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="bg-white border rounded-lg shadow-lg"
      >
        <Connections />
        {Object.keys(data).map(layerKey => data[layerKey].map(node => (
          <Node
            key={node.id}
            id={node.id}
            x={node.x}
            y={node.y}
            name={node.name}
            selected={selectedNode === node.id} />
        ))
        )}
      </svg></>
    </div>
  );
};

export default NetworkVisualization;