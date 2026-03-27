// src/utils/mindmapHelper.js

export const convertToReactFlowNodesAndEdges = (aiData) => {
    const nodes = [];
    const edges = [];
    
    // Recursive function එකක් හරහා දත්ත කියවීම
    const traverse = (nodeData, parentId = null) => {
        // අලුත් Node එකක් හැදීම
        const newNode = {
            id: nodeData.id,
            // Main node, Subject node, හෝ සාමාන්‍ය node ද යන්න තීරණය කිරීම
            type: nodeData.type === 'main' ? 'input' : (nodeData.children ? 'default' : 'output'),
            data: { label: nodeData.data.label },
            position: nodeData.position || { x: Math.random() * 200, y: Math.random() * 200 }, // Position එක නැත්නම් ඉබේ හැදේ
            style: getStyle(nodeData.type) // පාට කිරීම
        };
        
        nodes.push(newNode);

        // Parent කෙනෙක් ඉන්නවා නම්, ඒ දෙන්නා අතර ඉරක් (Edge) ඇඳීම
        if (parentId) {
            edges.push({
                id: `e-${parentId}-${nodeData.id}`,
                source: parentId,
                target: nodeData.id,
                animated: true, // ඉර දිගේ ඇනිමේෂන් එකක් යන්න
                style: { stroke: '#4F46E5', strokeWidth: 2 }
            });
        }

        // දරුවන් (children) ඉන්නවා නම්, උන්වත් මේ විදියටම කියවීම
        if (nodeData.children && nodeData.children.length > 0) {
            nodeData.children.forEach(child => traverse(child, nodeData.id));
        }
    };

    // AI එකෙන් ආපු root දත්තය යවා ක්‍රියාවලිය පටන් ගැනීම
    if(aiData.id) {
       traverse(aiData);
    }
    
    return { nodes, edges };
};

// Node එකේ වර්ගය අනුව පාට සහ හැඩය වෙනස් කිරීම
const getStyle = (type) => {
    if (type === 'main') return { background: '#2563EB', color: '#fff', border: 'none', fontWeight: 'bold' };
    if (type === 'subject') return { background: '#10B981', color: '#fff', border: 'none' };
    if (type === 'topic') return { background: '#F59E0B', color: '#fff', border: 'none' };
    return { background: '#F3F4F6', color: '#1F2937', border: '1px solid #D1D5DB' }; // Subtopic
};