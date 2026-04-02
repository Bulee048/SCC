import React, { useMemo, useEffect } from 'react';
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLocation } from 'react-router-dom';

// 1. Mind Map එකේ Nodes සඳහා Custom Style එකක්
const MindMapNode = ({ data }) => {
  return (
    <div style={{ padding: '10px', borderRadius: '5px', background: '#fff', border: '1px solid #777', minWidth: '100px', textAlign: 'center' }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

// 2. Custom Node type එක Register කිරීම
const nodeTypes = {
  main: MindMapNode,
  subject: MindMapNode,
  topic: MindMapNode,
};

const MindMapDashboard = () => {
  const location = useLocation();
  // Form එකෙන් pass කළ Mind Map data ලබා ගැනීම
  const mindMapData = location.state?.mindMapData;

  // 3. Backend එකෙන් ලැබෙන Hierarchical JSON දත්ත React Flow nodes සහ edges බවට පත් කිරීමේ function එක
  const convertToFlowData = (jsonData) => {
    if (!jsonData) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];

    const traverse = (node, parentId = null) => {
      // Node එක එකතු කිරීම
      nodes.push({
        id: node.id,
        type: node.type || 'default',
        data: node.data,
        position: node.position, // Backend එකෙන් ලැබෙන position
      });

      // Edge (සම්බන්ධකය) එකතු කිරීම
      if (parentId) {
        edges.push({
          id: `e${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          animated: true,
          style: { stroke: '#777' },
        });
      }

      // Children traverse කිරීම
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => traverse(child, node.id));
      }
    };

    traverse(jsonData);
    return { nodes, edges };
  };

  // 4. Data convert කිරීම
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertToFlowData(mindMapData),
    [mindMapData]
  );

  return (
    <div style={{ width: '100%', height: '80vh', padding: '20px' }}>
      <h2>ඔබේ විභාග සැලැස්ම (Your Exam Plan Dashboard)</h2>
      {mindMapData ? (
        <div style={{ width: '100%', height: '100%', border: '1px solid #ccc', borderRadius: '8px' }}>
          {/* React Flow හරහා Mind Map එක පෙන්වීම */}
          <ReactFlow
            nodes={initialNodes}
            edges={initialEdges}
            nodeTypes={nodeTypes}
            fitView // සියලු nodes පෙනෙන පරිදි view එක adjust කිරීම
          >
            <Background color="#f8f8f8" gap={20} />
            <Controls />
          </ReactFlow>
        </div>
      ) : (
        <p>කරුණාකර පළමුව විභාගය සඳහා සිටප් කරන්න (Setup your exam).</p>
      )}
    </div>
  );
};

export default MindMapDashboard;