import React, { useCallback } from 'react';
import ReactFlow, { 
    MiniMap, 
    Controls, 
    Background, 
    useNodesState, 
    useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css'; // අනිවාර්යයි!
import { convertToReactFlowNodesAndEdges } from '../../utils/mindmapHelper'; // කලින් හදපු file එක

const StudyPlanMindMap = ({ aiPlanData }) => {
    // Helper function එක හරහා Nodes සහ Edges ලබා ගැනීම
    const initialElements = convertToReactFlowNodesAndEdges(aiPlanData);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);

    return (
        <div style={{ width: '100%', height: '80vh', border: '1px solid #333', borderRadius: '10px' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView // ඉබේම හරි මැදට zoom වෙන්න
                attributionPosition="bottom-left"
            >
                <MiniMap />
                <Controls />
                <Background color="#aaa" gap={16} />
            </ReactFlow>
        </div>
    );
};

export default StudyPlanMindMap;